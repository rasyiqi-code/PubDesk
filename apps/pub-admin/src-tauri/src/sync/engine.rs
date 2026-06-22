//! Local-first sync engine.
//!
//! Every mutation is captured (via triggers or manual outbox insertion) into
//! `sync_outbox`. The background loop picks pending rows, encrypts them, and
//! broadcasts to peers. Incoming operations are decrypted and applied idempotently
//! using `sync_log` for deduplication.

use rusqlite::{params, Connection};
use super::crypto;
use super::types::{PeerInfo, SyncAction, SyncConfig, SyncOperation, SyncStatus};

pub const VAULT_KEY_MASTER: &str = "master_key_sealed";

pub fn init_sync_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_outbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            op_id TEXT NOT NULL UNIQUE,
            table_name TEXT NOT NULL,
            row_id TEXT NOT NULL,
            action TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            device_id TEXT,
            sent_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE sync_outbox ADD COLUMN device_id TEXT", []);

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_sync_outbox_sent ON sync_outbox(sent_at)",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_log (
            op_id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            row_id TEXT NOT NULL,
            action TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            source_device_id TEXT NOT NULL,
            applied_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS crypto_vault (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_peers (
            peer_id TEXT PRIMARY KEY,
            addresses TEXT,
            last_seen TEXT NOT NULL
        )",
        [],
    )?;

    // Device identifier persists across restarts.
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    // Pause flag used to suppress recursive trigger capture while applying
    // incoming operations. A persistent table is used because SQLite triggers
    // cannot reference TEMP tables at parse time.
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sync_pause (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            paused INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO sync_pause (id, paused) VALUES (1, 0)",
        [],
    )?;

    Ok(())
}

/// Read sync configuration from the local DB.
pub fn get_sync_config(conn: &Connection) -> Result<SyncConfig, rusqlite::Error> {
    let enabled: String = conn
        .query_row(
            "SELECT value FROM p2p_config WHERE key = 'sync_enabled'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "false".to_string());

    let device_id: Option<String> = conn
        .query_row(
            "SELECT value FROM sync_meta WHERE key = 'device_id'",
            [],
            |row| row.get(0),
        )
        .ok();

    let workspace_id: Option<String> = conn
        .query_row(
            "SELECT value FROM p2p_config WHERE key = 'sync_workspace_id'",
            [],
            |row| row.get(0),
        )
        .ok();

    let admin_setup: String = conn
        .query_row(
            "SELECT value FROM p2p_config WHERE key = 'sync_admin_setup'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "false".to_string());

    Ok(SyncConfig {
        enabled: enabled == "true",
        device_id,
        workspace_id,
        admin_setup_complete: admin_setup == "true",
    })
}

/// Generate or load the device ID.
pub fn ensure_device_id(conn: &Connection) -> Result<String, rusqlite::Error> {
    if let Ok(id) = conn.query_row(
        "SELECT value FROM sync_meta WHERE key = 'device_id'",
        [],
        |row| row.get::<_, String>(0),
    ) {
        return Ok(id);
    }
    let id = format!("dev_{:x}_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0), rand::random::<u32>());
    conn.execute(
        "INSERT INTO sync_meta (key, value) VALUES ('device_id', ?1)",
        [&id],
    )?;
    Ok(id)
}

/// Generate a new workspace: create master key, seal with admin PIN, store workspace id.
pub fn create_workspace(conn: &Connection, admin_pin: &str) -> Result<String, String> {
    let master = crypto::generate_master_key();
    let sealed = crypto::seal_master_key_with_pin(&master, admin_pin);

    conn.execute(
        "INSERT OR REPLACE INTO crypto_vault (key, value) VALUES (?1, ?2)",
        params![VAULT_KEY_MASTER, sealed],
    )
    .map_err(|e| format!("Gagal menyimpan master key: {}", e))?;

    let workspace_id = crypto::workspace_id_from_master_key(&master);
    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('sync_workspace_id', ?1)",
        [&workspace_id],
    )
    .map_err(|e| format!("Gagal menyimpan workspace id: {}", e))?;

    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('sync_admin_setup', 'true')",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(workspace_id)
}

/// Unlock the master key using the provided PIN.
pub fn unlock_master_key(conn: &Connection, pin: &str) -> Result<[u8; crypto::KEY_SIZE], String> {
    let sealed: String = conn
        .query_row(
            "SELECT value FROM crypto_vault WHERE key = ?1",
            [VAULT_KEY_MASTER],
            |row| row.get(0),
        )
        .map_err(|_| "Master key belum di-setup.".to_string())?;
    crypto::unseal_master_key_with_pin(&sealed, pin)
}

/// Check whether a sealed master key exists.
pub fn has_master_key(conn: &Connection) -> Result<bool, rusqlite::Error> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM crypto_vault WHERE key = ?1",
        [VAULT_KEY_MASTER],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

/// Add an employee device: re-seal the master key with the employee's PIN.
/// Returns an "invite code" (base64 sealed master key) that the employee can use.
pub fn create_employee_invite(
    conn: &Connection,
    admin_pin: &str,
    employee_pin: &str,
) -> Result<String, String> {
    let master = unlock_master_key(conn, admin_pin)?;
    let invite = crypto::seal_master_key_with_pin(&master, employee_pin);
    Ok(invite)
}

/// Join a workspace using an invite code and employee PIN.
pub fn join_workspace(conn: &Connection, invite_code: &str, employee_pin: &str) -> Result<String, String> {
    let master = crypto::unseal_master_key_with_pin(invite_code, employee_pin)?;
    let sealed = crypto::seal_master_key_with_pin(&master, employee_pin);

    conn.execute(
        "INSERT OR REPLACE INTO crypto_vault (key, value) VALUES (?1, ?2)",
        params![VAULT_KEY_MASTER, sealed],
    )
    .map_err(|e| format!("Gagal menyimpan master key: {}", e))?;

    let workspace_id = crypto::workspace_id_from_master_key(&master);
    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('sync_workspace_id', ?1)",
        [&workspace_id],
    )
    .map_err(|e| format!("Gagal menyimpan workspace id: {}", e))?;

    Ok(workspace_id)
}

/// Build a SyncOperation from an outbox row.
fn row_to_operation(row: &rusqlite::Row) -> Result<SyncOperation, rusqlite::Error> {
    let action: String = row.get(3)?;
    let action = match action.as_str() {
        "INSERT" => SyncAction::Insert,
        "UPDATE" => SyncAction::Update,
        "DELETE" => SyncAction::Delete,
        _ => SyncAction::Update,
    };
    Ok(SyncOperation {
        op_id: row.get(0)?,
        table: row.get(1)?,
        row_id: row.get(2)?,
        action,
        timestamp: row.get(5)?,
        device_id: row.get(6)?,
        data: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or(serde_json::Value::Null),
    })
}

/// Fetch pending outbox rows (not yet sent).
pub fn collect_pending_outbox(conn: &Connection) -> Result<Vec<SyncOperation>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT op_id, table_name, row_id, action, payload_json, created_at, device_id
         FROM sync_outbox
         WHERE sent_at IS NULL
         ORDER BY id ASC
         LIMIT 100",
    )?;
    let rows = stmt.query_map([], row_to_operation)?;
    rows.collect::<Result<Vec<_>, _>>()
}

/// Mark a list of outbox rows as sent.
pub fn mark_outbox_sent(conn: &Connection, op_ids: &[String]) -> Result<(), rusqlite::Error> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut stmt = conn.prepare("UPDATE sync_outbox SET sent_at = ?1 WHERE op_id = ?2")?;
    for op_id in op_ids {
        stmt.execute(params![&now, op_id])?;
    }
    Ok(())
}

/// Check whether an operation has already been applied.
pub fn is_op_applied(conn: &Connection, op_id: &str) -> Result<bool, rusqlite::Error> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sync_log WHERE op_id = ?1",
        [op_id],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

/// Apply an incoming operation to the local database.
/// Uses a temp table flag to skip recursive triggers.
pub fn apply_operation(
    conn: &mut Connection,
    op: &SyncOperation,
    source_peer_id: &str,
) -> Result<(), String> {
    // Idempotency check.
    if is_op_applied(conn, &op.op_id).map_err(|e| e.to_string())? {
        return Ok(());
    }

    // Set pause flag to suppress recursive trigger capture.
    conn.execute(
        "INSERT OR REPLACE INTO sync_pause (id, paused) VALUES (1, 1)",
        [],
    )
    .map_err(|e| e.to_string())?;

    let result = (|| -> Result<(), String> {
        match op.action {
            SyncAction::Insert | SyncAction::Update => {
                if let Some(cols) = op.data.as_object() {
                    let column_names: Vec<&String> = cols.keys()
                        .filter(|k| *k != "id" && *k != "uuid")
                        .collect();
                    if column_names.is_empty() {
                        return Ok(());
                    }
                    let placeholders: Vec<String> =
                        (1..=column_names.len()).map(|i| format!("?{}", i)).collect();
                    let set_clause = column_names
                        .iter()
                        .zip(placeholders.iter())
                        .map(|(col, ph)| format!("{}={}", col, ph))
                        .collect::<Vec<_>>()
                        .join(", ");
                    let sql = format!(
                        "INSERT INTO {} (uuid, {}) VALUES (?{}, {})
                         ON CONFLICT(uuid) DO UPDATE SET {}",
                        op.table,
                        column_names.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(", "),
                        column_names.len() + 1,
                        placeholders.join(", "),
                        set_clause
                    );
                    let mut params: Vec<serde_json::Value> =
                        column_names.iter().map(|k| cols[*k].clone()).collect();
                    params.push(serde_json::Value::String(op.row_id.clone()));
                    execute_json_params(conn, &sql, &params)?;
                }
            }
            SyncAction::Delete => {
                let sql = format!("DELETE FROM {} WHERE uuid = ?1", op.table);
                conn.execute(&sql, [&op.row_id])
                    .map_err(|e| format!("Delete failed: {}", e))?;
            }
        }

        // Record in sync log.
        let payload = serde_json::to_string(&op.data).unwrap_or_else(|_| "{}".to_string());
        let action_str = match op.action {
            SyncAction::Insert => "INSERT",
            SyncAction::Update => "UPDATE",
            SyncAction::Delete => "DELETE",
        };
        conn.execute(
            "INSERT OR IGNORE INTO sync_log (op_id, table_name, row_id, action, payload_json, source_device_id, applied_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                &op.op_id,
                &op.table,
                &op.row_id,
                action_str,
                payload,
                source_peer_id,
                chrono::Utc::now().to_rfc3339()
            ],
        )
        .map_err(|e| format!("Gagal mencatat sync log: {}", e))?;

        Ok(())
    })();

    // Always clear pause flag.
    let _ = conn.execute("UPDATE sync_pause SET paused = 0 WHERE id = 1", []);

    result
}

/// Helper to bind JSON values to a statement and execute.
fn execute_json_params(
    conn: &Connection,
    sql: &str,
    params: &[serde_json::Value],
) -> Result<usize, String> {
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let to_sql: Vec<Box<dyn rusqlite::ToSql>> = params
        .iter()
        .map(|v| -> Box<dyn rusqlite::ToSql> {
            match v {
                serde_json::Value::Null => Box::new(rusqlite::types::Null),
                serde_json::Value::Bool(b) => Box::new(*b),
                serde_json::Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        Box::new(i)
                    } else if let Some(f) = n.as_f64() {
                        Box::new(f)
                    } else {
                        Box::new(rusqlite::types::Null)
                    }
                }
                serde_json::Value::String(s) => Box::new(s.clone()),
                other => Box::new(other.to_string()),
            }
        })
        .collect();
    let refs: Vec<&dyn rusqlite::ToSql> = to_sql.iter().map(|b| b.as_ref()).collect();
    stmt.execute(&refs[..]).map_err(|e| e.to_string())
}

/// Count pending outbox rows.
pub fn pending_outbox_count(conn: &Connection) -> Result<i64, rusqlite::Error> {
    conn.query_row(
        "SELECT COUNT(*) FROM sync_outbox WHERE sent_at IS NULL",
        [],
        |row| row.get(0),
    )
}

/// Build a SyncStatus snapshot.
pub fn build_sync_status(
    conn: &Connection,
    enabled: bool,
    workspace_id: Option<String>,
    local_peer_id: String,
    connected_peers: Vec<PeerInfo>,
    last_sync_at: Option<String>,
    error: Option<String>,
) -> Result<SyncStatus, rusqlite::Error> {
    Ok(SyncStatus {
        enabled,
        workspace_id,
        local_peer_id,
        connected_peers,
        pending_outbox_count: pending_outbox_count(conn)?,
        last_sync_at,
        error,
    })
}

/// Tables that should sync across devices.
const SYNC_TABLES: &[&str] = &[
    "contacts", "naskah", "tasks", "tim", "legalitas", "books",
    "invoices", "projects", "penerbit", "workflow_events",
    "cetak_distribusi", "naskah_files",
];

/// Dynamically create INSERT/UPDATE/DELETE triggers for SYNC_TABLES.
/// Uses PRAGMA table_info to discover columns so it stays in sync with schema.
pub fn create_sync_triggers(conn: &Connection) -> Result<(), rusqlite::Error> {
    for table in SYNC_TABLES {
        if !table_exists(conn, table) {
            continue;
        }
        let mut columns: Vec<String> = Vec::new();
        if let Ok(mut stmt) = conn.prepare(&format!("PRAGMA table_info({})", table)) {
            if let Ok(rows) = stmt.query_map([], |row| row.get::<_, String>(1)) {
                columns = rows.filter_map(|r| r.ok()).collect();
            }
        }

        if !columns.contains(&"id".to_string()) {
            continue;
        }

        if !columns.contains(&"uuid".to_string()) {
            conn.execute(
                &format!("ALTER TABLE {} ADD COLUMN uuid TEXT DEFAULT ''", table),
                [],
            )?;
            conn.execute(
                &format!("UPDATE {} SET uuid = lower(hex(randomblob(16))) WHERE uuid = ''", table),
                [],
            )?;
        }
        // Drop index lama (non-partial) jika ada, lalu buat partial index baru
        // Partial index (WHERE uuid != '') memungkinkan INSERT dengan uuid kosong tanpa conflict
        let _ = conn.execute(&format!("DROP INDEX IF EXISTS idx_{}_uuid", table), []);
        let _ = conn.execute(
            &format!("CREATE UNIQUE INDEX IF NOT EXISTS idx_{}_uuid ON {}(uuid) WHERE uuid != ''", table, table),
            [],
        );

        // Hapus trigger lama (insert/update/delete dan uuid_init)
        for action in &["insert", "update", "delete", "uuid_init"] {
            let trigger = format!("trg_{}_{}", table, action);
            conn.execute(&format!("DROP TRIGGER IF EXISTS {}", trigger), [])?;
        }

        // AFTER INSERT trigger: isi uuid otomatis setelah row dibuat jika masih kosong
        // Partial unique index (WHERE uuid != '') memastikan row baru dengan uuid '' tidak conflict
        let uuid_fill_sql = format!(
            "CREATE TRIGGER IF NOT EXISTS trg_{table}_uuid_init AFTER INSERT ON {table}
             WHEN NEW.uuid IS NULL OR NEW.uuid = ''
             BEGIN
               UPDATE {table} SET uuid = lower(hex(randomblob(16))) WHERE id = NEW.id;
             END",
            table = table
        );
        conn.execute(&uuid_fill_sql, [])?;

        let json_parts: Vec<String> = columns
            .iter()
            .filter(|c| *c != "uuid")
            .flat_map(|c| vec![format!("'{}'", c), format!("NEW.{}", c)])
            .collect();
        let json_expr = format!("json_object({})", json_parts.join(", "));

        for action in &["INSERT", "UPDATE"] {
            let sql = format!(
                "CREATE TRIGGER IF NOT EXISTS trg_{table}_{act} AFTER {action} ON {table}
                 BEGIN
                   INSERT INTO sync_outbox(op_id, table_name, row_id, action, payload_json, created_at, device_id)
                   SELECT lower(hex(randomblob(16))), '{table}',
                          CASE WHEN NEW.uuid = '' THEN lower(hex(randomblob(16))) ELSE NEW.uuid END,
                          '{action}',
                          {json_expr},
                          datetime('now'), (SELECT value FROM sync_meta WHERE key='device_id')
                   WHERE NOT EXISTS (SELECT 1 FROM sync_pause WHERE paused = 1);
                 END",
                table = table,
                act = action.to_lowercase(),
                action = action
            );
            conn.execute(&sql, [])?;
        }

        let sql = format!(
            "CREATE TRIGGER IF NOT EXISTS trg_{table}_delete AFTER DELETE ON {table}
             BEGIN
               INSERT INTO sync_outbox(op_id, table_name, row_id, action, payload_json, created_at, device_id)
               SELECT lower(hex(randomblob(16))), '{table}',
                      CASE WHEN OLD.uuid = '' THEN lower(hex(randomblob(16))) ELSE OLD.uuid END,
                      'DELETE', json_object(),
                      datetime('now'), (SELECT value FROM sync_meta WHERE key='device_id')
               WHERE NOT EXISTS (SELECT 1 FROM sync_pause WHERE paused = 1);
             END",
            table = table
        );
        conn.execute(&sql, [])?;
    }
    Ok(())
}

fn table_exists(conn: &Connection, name: &str) -> bool {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
            [name],
            |row| row.get(0),
        )
        .unwrap_or(0);
    count > 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_unlock_workspace() {
        let conn = Connection::open_in_memory().unwrap();
        init_sync_schema(&conn).unwrap();
        conn.execute(
            "CREATE TABLE p2p_config (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
            [],
        )
        .unwrap();
        conn.execute(
            "CREATE TABLE contacts (id TEXT PRIMARY KEY, name TEXT)",
            [],
        )
        .unwrap();
        let ws = create_workspace(&conn, "admin123").unwrap();
        assert!(!ws.is_empty());
        let key = unlock_master_key(&conn, "admin123").unwrap();
        assert_eq!(key.len(), 32);
    }
}
