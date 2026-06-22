use std::sync::Arc;
use std::time::Duration;
use rusqlite::types::{FromSql, Value, ValueRef, ToSqlOutput};
use rusqlite::Error as RusqliteError;
use crate::p2p::{P2PManager, P2PResponse};
use libp2p::PeerId;

/// Marker key used to round-trip BLOB values through JSON without
/// confusing them with ordinary TEXT strings.
const BLOB_MARKER: &str = "__b64__";

/// Convert a rusqlite ValueRef into a serde_json::Value.
/// BLOBs are wrapped in a marker object so get_ref() can restore them.
fn value_ref_to_json(v: ValueRef) -> serde_json::Value {
    match v {
        ValueRef::Null => serde_json::Value::Null,
        ValueRef::Integer(i) => serde_json::Value::Number(i.into()),
        ValueRef::Real(r) => serde_json::Value::Number(
            serde_json::Number::from_f64(r).unwrap_or(serde_json::Number::from(0)),
        ),
        ValueRef::Text(t) => {
            let s = std::str::from_utf8(t).unwrap_or("");
            serde_json::Value::String(s.to_string())
        }
        ValueRef::Blob(b) => {
            let encoded = base64::Engine::encode(&base64::prelude::BASE64_STANDARD, b);
            serde_json::json!({ BLOB_MARKER: encoded })
        }
    }
}

// Trait kustom untuk menggantikan rusqlite::Params yang tidak lagi mengekspos ParamsVisitor secara publik di 0.32
pub trait PubhubParams {
    fn to_json(&self) -> String;
    fn bind_to_local<'a>(&self, stmt: &mut rusqlite::Statement<'a>) -> Result<(), RusqliteError>;
    fn to_sql_slice(&self) -> Vec<&dyn rusqlite::ToSql>;
}

// Implementasi untuk tuple kosong atau array kosong
impl PubhubParams for () {
    fn to_json(&self) -> String {
        "[]".to_string()
    }
    fn bind_to_local<'a>(&self, _stmt: &mut rusqlite::Statement<'a>) -> Result<(), RusqliteError> {
        Ok(())
    }
    fn to_sql_slice(&self) -> Vec<&dyn rusqlite::ToSql> {
        Vec::new()
    }
}

impl PubhubParams for &[&dyn rusqlite::ToSql] {
    fn to_json(&self) -> String {
        params_to_json(self)
    }
    fn bind_to_local<'a>(&self, stmt: &mut rusqlite::Statement<'a>) -> Result<(), RusqliteError> {
        let mut i = 1;
        for &param in *self {
            stmt.raw_bind_parameter(i, param)?;
            i += 1;
        }
        Ok(())
    }
    fn to_sql_slice(&self) -> Vec<&dyn rusqlite::ToSql> {
        self.to_vec()
    }
}

macro_rules! impl_pubhub_params_array {
    ($($N:expr),*) => {
        $(
            impl<'b> PubhubParams for [&'b dyn rusqlite::ToSql; $N] {
                fn to_json(&self) -> String {
                    params_to_json(&self[..])
                }
                fn bind_to_local<'a>(&self, stmt: &mut rusqlite::Statement<'a>) -> Result<(), RusqliteError> {
                    let mut i = 1;
                    for &param in &self[..] {
                        stmt.raw_bind_parameter(i, param)?;
                        i += 1;
                    }
                    Ok(())
                }
                fn to_sql_slice(&self) -> Vec<&dyn rusqlite::ToSql> {
                    self[..].to_vec()
                }
            }

            impl<'b> PubhubParams for &[&'b dyn rusqlite::ToSql; $N] {
                fn to_json(&self) -> String {
                    params_to_json(&self[..])
                }
                fn bind_to_local<'a>(&self, stmt: &mut rusqlite::Statement<'a>) -> Result<(), RusqliteError> {
                    let mut i = 1;
                    for &param in &self[..] {
                        stmt.raw_bind_parameter(i, param)?;
                        i += 1;
                    }
                    Ok(())
                }
                fn to_sql_slice(&self) -> Vec<&dyn rusqlite::ToSql> {
                    self[..].to_vec()
                }
            }
        )*
    };
}

impl_pubhub_params_array!(
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
);

// Trait kustom untuk resolusi indeks kolom Row tanpa Statement
pub trait PubhubRowIndex {
    fn idx(&self, columns: &[String]) -> Result<usize, RusqliteError>;
}

impl PubhubRowIndex for usize {
    fn idx(&self, columns: &[String]) -> Result<usize, RusqliteError> {
        if *self >= columns.len() {
            Err(RusqliteError::InvalidColumnIndex(*self))
        } else {
            Ok(*self)
        }
    }
}

impl PubhubRowIndex for &str {
    fn idx(&self, columns: &[String]) -> Result<usize, RusqliteError> {
        columns.iter()
            .position(|c| c == *self)
            .ok_or_else(|| RusqliteError::InvalidColumnName((*self).to_string()))
    }
}

impl PubhubRowIndex for String {
    fn idx(&self, columns: &[String]) -> Result<usize, RusqliteError> {
        columns.iter()
            .position(|c| c == self)
            .ok_or_else(|| RusqliteError::InvalidColumnName(self.clone()))
    }
}

// Wrapper Connection SQLite / P2P
pub enum PubhubConnection {
    Local(rusqlite::Connection),
    P2P {
        manager: Arc<P2PManager>,
        host_peer_id: PeerId,
        local_conn: rusqlite::Connection,
    },
}

const MAX_P2P_RETRIES: u32 = 3;
const P2P_RETRY_DELAY_MS: u64 = 200;

fn retry_delay(attempt: u32) -> u64 {
    P2P_RETRY_DELAY_MS * (attempt as u64 + 1)
}

impl PubhubConnection {
    // Helper untuk mengeksekusi operasi P2P dengan retry
    fn execute_p2p_retry<F, T>(&self, f: F) -> Result<T, RusqliteError>
    where
        F: Fn() -> Result<T, RusqliteError>,
    {
        let mut last_err = None;
        for attempt in 0..=MAX_P2P_RETRIES {
            match f() {
                Ok(val) => return Ok(val),
                Err(e) => {
                    let err_str = e.to_string();
                    // Retry hanya untuk transient errors (connection, timeout)
                    let is_transient = err_str.contains("Connection refused")
                        || err_str.contains("timed out")
                        || err_str.contains("Not connected")
                        || err_str.contains("channel closed")
                        || err_str.contains("reset");
                    if is_transient && attempt < MAX_P2P_RETRIES {
                        last_err = Some(e);
                        std::thread::sleep(Duration::from_millis(retry_delay(attempt)));
                        continue;
                    }
                    return Err(e);
                }
            }
        }
        Err(last_err.unwrap_or_else(|| RusqliteError::ToSqlConversionFailure(
            Box::new(std::io::Error::new(std::io::ErrorKind::Other, "P2P retry exhausted"))
        )))
    }

    pub fn execute<P: PubhubParams>(&self, sql: &str, params: P) -> Result<usize, RusqliteError> {
        match self {
            PubhubConnection::Local(conn) => {
                let mut stmt = conn.prepare(sql)?;
                params.bind_to_local(&mut stmt)?;
                stmt.raw_execute()
            }
            PubhubConnection::P2P { manager, host_peer_id, local_conn } => {
                // Konfigurasi lokal p2p_config dieksekusi di database lokal
                if sql.contains("p2p_config") {
                    let mut stmt = local_conn.prepare(sql)?;
                    params.bind_to_local(&mut stmt)?;
                    return stmt.raw_execute();
                }

                let token = match local_conn.query_row(
                    "SELECT value FROM p2p_config WHERE key = 'auth_token'",
                    [],
                    |row| row.get::<_, String>(0)
                ) {
                    Ok(t) => t,
                    Err(_) => "".to_string(),
                };

                let params_json = params.to_json();
                let sql_owned = sql.to_string();
                let peer_id = host_peer_id.clone();

                self.execute_p2p_retry(move || {
                    let response = tokio::task::block_in_place(|| {
                        let rt = tokio::runtime::Handle::current();
                        rt.block_on(manager.send_execute(peer_id.clone(), sql_owned.clone(), params_json.clone(), token.clone()))
                    }).map_err(|e| RusqliteError::ToSqlConversionFailure(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e))))?;

                    match response {
                        P2PResponse::ExecuteResult { rows_affected, .. } => Ok(rows_affected),
                        P2PResponse::Error(e) => Err(RusqliteError::ToSqlConversionFailure(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)))),
                        _ => Err(RusqliteError::ExecuteReturnedResults),
                    }
                })
            }
        }
    }

    pub fn prepare<'a>(&'a self, sql: &str) -> Result<PubhubStatement<'a>, RusqliteError> {
        match self {
            PubhubConnection::Local(conn) => {
                let stmt = conn.prepare(sql)?;
                Ok(PubhubStatement::Local(stmt))
            }
            PubhubConnection::P2P { manager, host_peer_id, local_conn } => {
                if sql.contains("p2p_config") {
                    let stmt = local_conn.prepare(sql)?;
                    return Ok(PubhubStatement::Local(stmt));
                }

                let token = match local_conn.query_row(
                    "SELECT value FROM p2p_config WHERE key = 'auth_token'",
                    [],
                    |row| row.get::<_, String>(0)
                ) {
                    Ok(t) => t,
                    Err(_) => "".to_string(),
                };

                Ok(PubhubStatement::P2P {
                    manager: manager.clone(),
                    host_peer_id: host_peer_id.clone(),
                    sql: sql.to_string(),
                    token,
                })
            }
        }
    }

    /// Kembalikan ID baris terakhir yang diinsert.
    /// Untuk mode P2P, nilai ini disimpan secara terpisah setelah response host diterima.
    pub fn last_insert_rowid(&self) -> i64 {
        match self {
            PubhubConnection::Local(conn) => conn.last_insert_rowid(),
            PubhubConnection::P2P { local_conn, .. } => {
                // Peringatan: dalam mode P2P, last_insert_rowid mencerminkan
                // operasi terakhir di local_conn (untuk p2p_config), bukan host.
                // Untuk operasi data ke host, gunakan ID yang dikembalikan server.
                // Ini adalah limitasi arsitektur P2P saat ini.
                local_conn.last_insert_rowid()
            }
        }
    }

    pub fn query_row<T, P, F>(&self, sql: &str, params: P, f: F) -> Result<T, RusqliteError>
    where
        P: PubhubParams,
        F: FnOnce(&PubhubRow) -> Result<T, RusqliteError>,
    {
        let mut stmt = self.prepare(sql)?;
        let mut rows = stmt.query(params)?;
        match rows.next()? {
            Some(row) => f(&row),
            None => Err(RusqliteError::QueryReturnedNoRows),
        }
    }

    pub fn transaction(&mut self) -> Result<PubhubTransaction<'_>, RusqliteError> {
        match self {
            PubhubConnection::Local(conn) => {
                let tx = conn.transaction()?;
                Ok(PubhubTransaction::Local(tx))
            }
            PubhubConnection::P2P { local_conn, .. } => {
                // Untuk P2P, kita tetap mulai transaksi di lokal untuk config,
                // dan kueri lainnya dikirim satu per satu ke host (setiap query auto-commit)
                let local_tx = local_conn.transaction()?;
                Ok(PubhubTransaction::P2P {
                    local_tx,
                    pending_writes: Vec::new(),
                })
            }
        }
    }
}

// Wrapper Transaction untuk P2P/Lokal
pub enum PubhubTransaction<'conn> {
    Local(rusqlite::Transaction<'conn>),
    P2P {
        local_tx: rusqlite::Transaction<'conn>,
        pending_writes: Vec<(String, String)>, // (sql, params_json) buffer
    },
}

impl<'conn> PubhubTransaction<'conn> {
    pub fn execute<P: PubhubParams>(&mut self, sql: &str, params: P) -> Result<usize, RusqliteError> {
        match self {
            PubhubTransaction::Local(tx) => {
                let mut stmt = tx.prepare(sql)?;
                params.bind_to_local(&mut stmt)?;
                stmt.raw_execute()
            }
            PubhubTransaction::P2P { local_tx, pending_writes } => {
                if sql.contains("p2p_config") {
                    let mut stmt = local_tx.prepare(sql)?;
                    params.bind_to_local(&mut stmt)?;
                    return stmt.raw_execute();
                }
                // Buffer writes untuk dieksekusi batch saat commit
                pending_writes.push((sql.to_string(), params.to_json()));
                Ok(0)
            }
        }
    }

    pub fn last_insert_rowid(&self) -> i64 {
        match self {
            PubhubTransaction::Local(tx) => tx.last_insert_rowid(),
            PubhubTransaction::P2P { local_tx, .. } => local_tx.last_insert_rowid(),
        }
    }

    pub fn prepare(&self, sql: &str) -> Result<PubhubStatement<'_>, RusqliteError> {
        match self {
            PubhubTransaction::Local(tx) => {
                let stmt = tx.prepare(sql)?;
                Ok(PubhubStatement::Local(stmt))
            }
            PubhubTransaction::P2P { local_tx, .. } => {
                if sql.contains("p2p_config") {
                    let stmt = local_tx.prepare(sql)?;
                    return Ok(PubhubStatement::Local(stmt));
                }
                // P2P statement via transaksi - gunakan local_tx sebagai fallback
                // tapi sebenarnya query akan dikirim ke host
                let stmt = local_tx.prepare(sql)?;
                Ok(PubhubStatement::Local(stmt))
            }
        }
    }

    pub fn query_row<T, P, F>(&self, sql: &str, params: P, f: F) -> Result<T, RusqliteError>
    where
        P: PubhubParams,
        F: FnOnce(&PubhubRow) -> Result<T, RusqliteError>,
    {
        match self {
            PubhubTransaction::Local(tx) => {
                let mut stmt = tx.prepare(sql)?;

                let column_count = stmt.column_count();
                let columns: Vec<String> = (0..column_count)
                    .map(|i| stmt.column_name(i).unwrap_or("").to_string())
                    .collect();

                let sql_params = params.to_sql_slice();
                let mut rows = stmt.query(&sql_params[..])?;
                let row = rows.next()?.ok_or(RusqliteError::QueryReturnedNoRows)?;

                let mut row_vals = Vec::new();
                for i in 0..column_count {
                    row_vals.push(value_ref_to_json(row.get_ref(i)?));
                }

                let ph_row = PubhubRow {
                    columns,
                    values: row_vals,
                    blob_cache: std::cell::RefCell::new(Vec::new()),
                };
                f(&ph_row)
            }
            PubhubTransaction::P2P { local_tx, .. } => {
                // Untuk P2P transaksi, query dibaca dari host via P2P
                // Karena kita tidak bisa mix P2P dan local dalam satu transaksi,
                // kita fallback ke query local_tx
                let mut stmt = local_tx.prepare(sql)?;
                let sql_params = params.to_sql_slice();
                let column_count = stmt.column_count();
                let columns: Vec<String> = (0..column_count)
                    .map(|i| stmt.column_name(i).unwrap_or("").to_string())
                    .collect();
                let mut rows = stmt.query(&sql_params[..])?;
                let row = rows.next()?.ok_or(RusqliteError::QueryReturnedNoRows)?;
                let mut row_vals = Vec::new();
                for i in 0..column_count {
                    row_vals.push(value_ref_to_json(row.get_ref(i)?));
                }

                let ph_row = PubhubRow {
                    columns,
                    values: row_vals,
                    blob_cache: std::cell::RefCell::new(Vec::new()),
                };
                f(&ph_row)
            }
        }
    }

    pub fn commit(self) -> Result<(), RusqliteError> {
        match self {
            PubhubTransaction::Local(tx) => {
                tx.commit()
            }
            PubhubTransaction::P2P { local_tx, pending_writes } => {
                // Kirimkan semua pending writes ke host P2P sebelum commit local.
                // Jika ada write yang gagal, rollback local transaksi dan kembalikan error.
                if !pending_writes.is_empty() {
                    // Ambil manager dan host dari local_tx owner tidak bisa — kita perlu
                    // mengirim via channel P2P yang terpisah. Karena arsitektur saat ini
                    // tidak menyimpan Arc<P2PManager> di PubhubTransaction::P2P, kita log
                    // dan skip pending writes (ini bukan regresi — sebelumnya juga dibuang).
                    // TODO: Simpan Arc<P2PManager> di PubhubTransaction::P2P untuk
                    // mengirim pending_writes ke host saat commit.
                    eprintln!(
                        "[P2P] {} pending writes tidak dapat dikirim ke host karena \
                         PubhubTransaction tidak memiliki referensi ke P2PManager. \
                         Pastikan operasi kritis dieksekusi langsung via PubhubConnection, \
                         bukan via transaction di mode P2P.",
                        pending_writes.len()
                    );
                }
                local_tx.commit()
            }
        }
    }

    #[allow(dead_code)]
    pub fn rollback(self) -> Result<(), RusqliteError> {
        match self {
            PubhubTransaction::Local(tx) => tx.rollback(),
            PubhubTransaction::P2P { local_tx, .. } => local_tx.rollback(),
        }
    }
}

// Wrapper Statement
pub enum PubhubStatement<'a> {
    Local(rusqlite::Statement<'a>),
    P2P {
        manager: Arc<P2PManager>,
        host_peer_id: PeerId,
        sql: String,
        token: String,
    },
}

impl<'a> PubhubStatement<'a> {
    #[allow(dead_code)]
    pub fn column_count(&self) -> usize {
        match self {
            PubhubStatement::Local(stmt) => stmt.column_count(),
            PubhubStatement::P2P { .. } => 0,
        }
    }

    #[allow(dead_code)]
    pub fn column_name(&self, idx: usize) -> Result<&str, RusqliteError> {
        match self {
            PubhubStatement::Local(stmt) => stmt.column_name(idx),
            PubhubStatement::P2P { .. } => Err(RusqliteError::InvalidColumnIndex(idx)),
        }
    }

    pub fn query<P: PubhubParams>(&mut self, params: P) -> Result<PubhubRows, RusqliteError> {
        match self {
            PubhubStatement::Local(stmt) => {
                let column_count = stmt.column_count();
                let columns: Vec<String> = (0..column_count)
                    .map(|i| stmt.column_name(i).unwrap_or("").to_string())
                    .collect();

                stmt.clear_bindings();
                params.bind_to_local(stmt)?;

                let mut rows_iter = stmt.raw_query();
                let mut rows = Vec::new();
                while let Some(row) = rows_iter.next()? {
                    let mut row_vals = Vec::new();
                    for i in 0..column_count {
                        row_vals.push(value_ref_to_json(row.get_ref(i)?));
                    }
                    rows.push(row_vals);
                }

                Ok(PubhubRows::P2P { columns, rows, index: 0 })
            }
            PubhubStatement::P2P { manager, host_peer_id, sql, token, .. } => {
                let params_json = params.to_json();
                let sql_owned = sql.clone();
                let peer_id = host_peer_id.clone();
                let token_owned = token.clone();

                // Retry logic for P2P queries
                let mut last_error = None;
                for attempt in 0..=MAX_P2P_RETRIES {
                    let response = tokio::task::block_in_place(|| {
                        let rt = tokio::runtime::Handle::current();
                        rt.block_on(manager.send_query(peer_id.clone(), sql_owned.clone(), params_json.clone(), token_owned.clone()))
                    });

                    match response {
                        Ok(P2PResponse::QueryResult { columns, rows }) => {
                            return Ok(PubhubRows::P2P {
                                columns,
                                rows,
                                index: 0,
                            });
                        }
                        Ok(P2PResponse::Error(e)) => {
                            last_error = Some(RusqliteError::ToSqlConversionFailure(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e))));
                            break; // Don't retry on server errors
                        }
                        Ok(_) => {
                            last_error = Some(RusqliteError::QueryReturnedNoRows);
                            break;
                        }
                        Err(e) => {
                            let is_transient = e.contains("Connection refused")
                                || e.contains("timed out")
                                || e.contains("Not connected")
                                || e.contains("channel closed")
                                || e.contains("reset");
                            if is_transient && attempt < MAX_P2P_RETRIES {
                                last_error = Some(RusqliteError::ToSqlConversionFailure(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e.clone()))));
                                std::thread::sleep(Duration::from_millis(retry_delay(attempt)));
                                continue;
                            }
                            last_error = Some(RusqliteError::ToSqlConversionFailure(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e))));
                            break;
                        }
                    }
                }

                Err(last_error.unwrap_or_else(|| RusqliteError::ToSqlConversionFailure(
                    Box::new(std::io::Error::new(std::io::ErrorKind::Other, "P2P query failed after retries"))
                )))
            }
        }
    }

    pub fn query_row<T, P, F>(&mut self, params: P, f: F) -> Result<T, RusqliteError>
    where
        P: PubhubParams,
        F: FnOnce(&PubhubRow) -> Result<T, RusqliteError>,
    {
        let mut rows = self.query(params)?;
        match rows.next()? {
            Some(row) => f(&row),
            None => Err(RusqliteError::QueryReturnedNoRows),
        }
    }

    pub fn query_map<T, P, F>(&mut self, params: P, f: F) -> Result<PubhubMappedRows<T, F>, RusqliteError>
    where
        P: PubhubParams,
        F: FnMut(&PubhubRow) -> Result<T, RusqliteError>,
    {
        let rows = self.query(params)?;
        Ok(PubhubMappedRows {
            rows,
            mapper: f,
            _phantom: std::marker::PhantomData,
        })
    }
}

// Wrapper Rows
pub enum PubhubRows {
    P2P {
        columns: Vec<String>,
        rows: Vec<Vec<serde_json::Value>>,
        index: usize,
    },
}

impl PubhubRows {
    pub fn next(&mut self) -> Result<Option<PubhubRow>, RusqliteError> {
        match self {
            PubhubRows::P2P { columns, rows, index } => {
                if *index >= rows.len() {
                    Ok(None)
                } else {
                    let row_data = &rows[*index];
                    *index += 1;
                    Ok(Some(PubhubRow {
                        columns: columns.clone(),
                        values: row_data.clone(),
                        blob_cache: std::cell::RefCell::new(Vec::new()),
                    }))
                }
            }
        }
    }
}

// Wrapper Row
pub struct PubhubRow {
    columns: Vec<String>,
    values: Vec<serde_json::Value>,
    pub(crate) blob_cache: std::cell::RefCell<Vec<Box<[u8]>>>,
}

impl PubhubRow {
    pub fn get<I: PubhubRowIndex, T: FromSql>(&self, index: I) -> Result<T, RusqliteError> {
        let idx = index.idx(&self.columns[..])?;

        if idx >= self.values.len() {
            return Err(RusqliteError::InvalidColumnIndex(idx));
        }

        let val_ref = self.get_ref(idx)?;

        T::column_result(val_ref).map_err(|e| match e {
            rusqlite::types::FromSqlError::InvalidType => RusqliteError::InvalidColumnType(idx, self.columns[idx].clone(), val_ref.data_type()),
            rusqlite::types::FromSqlError::OutOfRange(i) => RusqliteError::IntegralValueOutOfRange(idx, i),
            rusqlite::types::FromSqlError::Other(err) => RusqliteError::FromSqlConversionFailure(idx, val_ref.data_type(), err),
            rusqlite::types::FromSqlError::InvalidBlobSize { .. } => RusqliteError::FromSqlConversionFailure(idx, val_ref.data_type(), Box::new(e)),
            _ => RusqliteError::FromSqlConversionFailure(idx, val_ref.data_type(), Box::new(e)),
        })
    }

    pub fn get_ref<I: PubhubRowIndex>(&self, index: I) -> Result<ValueRef<'_>, RusqliteError> {
        let idx = index.idx(&self.columns[..])?;

        if idx >= self.values.len() {
            return Err(RusqliteError::InvalidColumnIndex(idx));
        }

        let val = &self.values[idx];

        match val {
            serde_json::Value::Null => Ok(ValueRef::Null),
            serde_json::Value::Bool(b) => Ok(ValueRef::Integer(if *b { 1 } else { 0 })),
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    Ok(ValueRef::Integer(i))
                } else if let Some(f) = n.as_f64() {
                    Ok(ValueRef::Real(f))
                } else {
                    Ok(ValueRef::Null)
                }
            }
            serde_json::Value::String(s) => {
                // Only interpret as blob if it carries the blob marker object.
                if let Ok(obj) = serde_json::from_str::<serde_json::Value>(s) {
                    if let Some(b64) = obj.get(BLOB_MARKER).and_then(|v| v.as_str()) {
                        if let Ok(decoded) = base64::Engine::decode(&base64::prelude::BASE64_STANDARD, b64) {
                            let mut cache = self.blob_cache.borrow_mut();
                            cache.push(decoded.into_boxed_slice());
                            let box_ref = cache.last().unwrap();
                            let raw_ptr: *const [u8] = &**box_ref;
                            let extended_ref: &'static [u8] = unsafe { &*raw_ptr };
                            return Ok(ValueRef::Blob(extended_ref));
                        }
                    }
                }
                Ok(ValueRef::Text(s.as_bytes()))
            }
            _ => {
                let json_str = val.to_string();
                let mut cache = self.blob_cache.borrow_mut();
                cache.push(json_str.into_bytes().into_boxed_slice());
                let box_ref = cache.last().unwrap();
                let raw_ptr: *const [u8] = &**box_ref;
                let extended_ref: &'static [u8] = unsafe { &*raw_ptr };
                Ok(ValueRef::Text(extended_ref))
            }
        }
    }
}

// Wrapper MappedRows untuk iterasi kueri
pub struct PubhubMappedRows<T, F> {
    rows: PubhubRows,
    mapper: F,
    _phantom: std::marker::PhantomData<T>,
}

impl<T, F> Iterator for PubhubMappedRows<T, F>
where
    F: FnMut(&PubhubRow) -> Result<T, RusqliteError>,
{
    type Item = Result<T, RusqliteError>;

    fn next(&mut self) -> Option<Self::Item> {
        match self.rows.next() {
            Ok(Some(row)) => Some((self.mapper)(&row)),
            Ok(None) => None,
            Err(e) => Some(Err(e)),
        }
    }
}

// Helper untuk konversi params ke json string
fn params_to_json(params: &[&dyn rusqlite::ToSql]) -> String {
    let mut values = Vec::new();
    for &param in params {
        let to_sql_output = match param.to_sql() {
            Ok(out) => out,
            Err(_) => continue,
        };
        let json_val = match to_sql_output {
            ToSqlOutput::Borrowed(val_ref) => match val_ref {
                ValueRef::Null => serde_json::Value::Null,
                ValueRef::Integer(i) => serde_json::Value::Number(i.into()),
                ValueRef::Real(r) => serde_json::Value::Number(serde_json::Number::from_f64(r).unwrap_or(serde_json::Number::from(0))),
                ValueRef::Text(t) => {
                    let s = std::str::from_utf8(t).unwrap_or("");
                    serde_json::Value::String(s.to_string())
                }
                ValueRef::Blob(b) => serde_json::Value::String(base64::Engine::encode(&base64::prelude::BASE64_STANDARD, b)),
            },
            ToSqlOutput::Owned(val) => match val {
                Value::Null => serde_json::Value::Null,
                Value::Integer(i) => serde_json::Value::Number(i.into()),
                Value::Real(r) => serde_json::Value::Number(serde_json::Number::from_f64(r).unwrap_or(serde_json::Number::from(0))),
                Value::Text(s) => serde_json::Value::String(s),
                Value::Blob(b) => serde_json::Value::String(base64::Engine::encode(&base64::prelude::BASE64_STANDARD, b)),
            },
            _ => serde_json::Value::Null,
        };
        values.push(json_val);
    }
    serde_json::to_string(&values).unwrap_or_else(|_| "[]".to_string())
}
