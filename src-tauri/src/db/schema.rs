use rusqlite::{params, Connection, Result};

pub fn create_tables(conn: &Connection) -> Result<()> {
    // Contacts table (merged — sebelumnya terpisah antara contacts + penulis)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            wa_number TEXT,
            email TEXT,
            address TEXT,
            province TEXT,
            city TEXT,
            job TEXT,
            institution TEXT,
            data_source TEXT,
            email_valid INTEGER NOT NULL DEFAULT 0,
            wa_valid INTEGER NOT NULL DEFAULT 0,
            followup_status TEXT,
            notes TEXT,
            type TEXT NOT NULL DEFAULT 'penulis',
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    // Migrasi ad-hoc untuk kolom lama
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN email TEXT", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN updated_at TEXT", []);
    // Migrasi kolom penulis ke contacts
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN province TEXT", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN city TEXT", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN job TEXT", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN institution TEXT", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN data_source TEXT", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN email_valid INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN wa_valid INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN followup_status TEXT", []);
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN notes TEXT", []);

    // Books table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            isbn TEXT,
            regular_price REAL NOT NULL,
            po_price REAL NOT NULL,
            weight_grams INTEGER NOT NULL DEFAULT 0,
            author_id INTEGER REFERENCES contacts(id),
            cover_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    // Migrasi ad-hoc untuk menambahkan kolom cover_path jika database sudah terlanjur dibuat sebelumnya
    let _ = conn.execute("ALTER TABLE books ADD COLUMN cover_path TEXT", []);
    let _ = conn.execute("ALTER TABLE books ADD COLUMN created_at TEXT", []);
    let _ = conn.execute("ALTER TABLE books ADD COLUMN updated_at TEXT", []);

    // Projects table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            book_id INTEGER REFERENCES books(id),
            status TEXT NOT NULL DEFAULT 'draft',
            deadline TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE projects ADD COLUMN created_at TEXT", []);
    let _ = conn.execute("ALTER TABLE projects ADD COLUMN updated_at TEXT", []);

    // Files table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            filename TEXT NOT NULL,
            type TEXT NOT NULL,
            project_id INTEGER REFERENCES projects(id),
            status TEXT NOT NULL DEFAULT 'draft',
            version_label TEXT,
            last_modified TEXT NOT NULL,
            modified_by TEXT,
            is_readonly BOOLEAN NOT NULL DEFAULT 0,
            description TEXT,
            responsible_parties TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE files ADD COLUMN created_at TEXT", []);
    let _ = conn.execute("ALTER TABLE files ADD COLUMN updated_at TEXT", []);

    // Tags table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE tags ADD COLUMN created_at TEXT", []);
    let _ = conn.execute("ALTER TABLE tags ADD COLUMN updated_at TEXT", []);

    // File tags junction table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS file_tags (
            file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
            tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (file_id, tag_id)
        )",
        [],
    )?;

    // Invoices table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            customer_id INTEGER REFERENCES contacts(id),
            items_json TEXT NOT NULL,
            shipping_cost REAL NOT NULL DEFAULT 0,
            admin_fee REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL,
            export_format TEXT,
            file_path TEXT,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN updated_at TEXT", []);

    // Migrasi ad-hoc untuk kolom sinkronisasi invoice
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN sync_status TEXT DEFAULT 'pending'", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN cloud_file_url TEXT", []);

    // Services table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            category TEXT NOT NULL DEFAULT 'other',
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE services ADD COLUMN created_at TEXT", []);
    let _ = conn.execute("ALTER TABLE services ADD COLUMN updated_at TEXT", []);

    // Watch folders table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS watch_folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE watch_folders ADD COLUMN updated_at TEXT", []);

    // Migrasi ad-hoc untuk menambahkan kolom version_similarity jika database sudah terlanjur dibuat
    let _ = conn.execute("ALTER TABLE files ADD COLUMN version_similarity REAL", []);
    let _ = conn.execute("ALTER TABLE files ADD COLUMN description TEXT", []);
    let _ = conn.execute("ALTER TABLE files ADD COLUMN responsible_parties TEXT", []);

    // file_entities table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS file_entities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
            entity_type TEXT NOT NULL,
            entity_value TEXT NOT NULL
        )",
        [],
    )?;

    // file_embeddings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS file_embeddings (
            file_id INTEGER PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
            vector BLOB NOT NULL
        )",
        [],
    )?;

    // file_relations table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS file_relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
            target_file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
            relation_type TEXT NOT NULL,
            confidence REAL NOT NULL
        )",
        [],
    )?;

    // file_stats table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS file_stats (
            file_id INTEGER PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
            access_count INTEGER NOT NULL DEFAULT 0,
            last_accessed TEXT,
            active_project_boost INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Penulis table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS penulis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            wa_number TEXT,
            province TEXT,
            city TEXT,
            job TEXT,
            institution TEXT,
            data_source TEXT,
            email_valid INTEGER NOT NULL DEFAULT 0,
            wa_valid INTEGER NOT NULL DEFAULT 0,
            followup_status TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE penulis ADD COLUMN updated_at TEXT", []);

    // Migrasi ad-hoc untuk menambahkan kolom address ke penulis
    let _ = conn.execute("ALTER TABLE penulis ADD COLUMN address TEXT", []);

    // Penerbit table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS penerbit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city TEXT,
            instagram TEXT,
            facebook TEXT,
            email TEXT,
            wa_number TEXT,
            linkedin TEXT,
            twitter TEXT,
            tiktok TEXT,
            wa_valid INTEGER NOT NULL DEFAULT 0,
            email_valid INTEGER NOT NULL DEFAULT 0,
            cooperation_status TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE penerbit ADD COLUMN updated_at TEXT", []);

    // Migrasi ad-hoc untuk menambahkan kolom baru ke penerbit
    let _ = conn.execute("ALTER TABLE penerbit ADD COLUMN address TEXT", []);
    let _ = conn.execute("ALTER TABLE penerbit ADD COLUMN notes TEXT", []);
    let _ = conn.execute("ALTER TABLE penerbit ADD COLUMN province TEXT", []);

    // Naskah Orders table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS naskah (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_id_code TEXT UNIQUE,
            title TEXT NOT NULL,
            penulis_id INTEGER REFERENCES contacts(id),
            penerbit_id INTEGER REFERENCES penerbit(id),
            package_type TEXT,
            order_type TEXT,
            copies INTEGER,
            book_size TEXT,
            initial_request TEXT,
            revised_request TEXT,
            legal_type TEXT,
            shipping_address TEXT,
            store_links TEXT,
            status TEXT NOT NULL DEFAULT 'Belum Dimulai',
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE naskah ADD COLUMN updated_at TEXT", []);

    // Tim table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tim (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Layouter',
            is_active INTEGER NOT NULL DEFAULT 1,
            weekly_target INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE tim ADD COLUMN updated_at TEXT", []);

    // Workflow Events table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS workflow_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_id INTEGER REFERENCES naskah(id) ON DELETE CASCADE,
            event_name TEXT NOT NULL,
            completed_date TEXT,
            pic_name TEXT,
            notes TEXT,
            proof_path_or_link TEXT,
            status TEXT NOT NULL DEFAULT 'Belum Dimulai',
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE workflow_events ADD COLUMN created_at TEXT", []);
    let _ = conn.execute("ALTER TABLE workflow_events ADD COLUMN updated_at TEXT", []);

    // Migrasi ad-hoc untuk tabel Tim — tambah kolom departemen
    let _ = conn.execute("ALTER TABLE tim ADD COLUMN department TEXT", []);

    // Migrasi ad-hoc untuk Database Naskah — tambah kolom informasi naskah lengkap
    let _ = conn.execute("ALTER TABLE naskah ADD COLUMN genre TEXT", []);
    let _ = conn.execute("ALTER TABLE naskah ADD COLUMN total_pages INTEGER", []);
    let _ = conn.execute("ALTER TABLE naskah ADD COLUMN synopsis TEXT", []);
    let _ = conn.execute("ALTER TABLE naskah ADD COLUMN assigned_team_ids TEXT", []);
    let _ = conn.execute("ALTER TABLE naskah ADD COLUMN store_links TEXT", []);

    // Legalitas table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS legalitas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_id INTEGER REFERENCES naskah(id) ON DELETE SET NULL,
            judul_buku TEXT NOT NULL,
            nama_penulis TEXT NOT NULL,
            tipe TEXT NOT NULL,
            tanggal_pengajuan TEXT,
            keterangan TEXT,
            status TEXT NOT NULL DEFAULT 'Diajukan',
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN updated_at TEXT", []);

    // Migrasi data: penulis → contacts (one-time)
    let sudah_dimigrasi = conn
        .query_row(
            "SELECT COUNT(*) FROM contacts WHERE province IS NOT NULL",
            [],
            |r| r.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if !sudah_dimigrasi {
        if let Ok(penulis_count) = conn.query_row("SELECT COUNT(*) FROM penulis", [], |r| r.get::<_, i64>(0)) {
            if penulis_count > 0 {
                let mut stmt = conn
                    .prepare(
                        "SELECT id, name, email, wa_number, province, city, address, job, institution, data_source, email_valid, wa_valid, followup_status, notes, created_at, updated_at FROM penulis",
                    )
                    .expect("prepare penulis select");
                let rows: Vec<(i64, String, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, i32, i32, Option<String>, Option<String>, String, Option<String>)> = stmt
                    .query_map([], |row| {
                        Ok((
                            row.get(0)?,
                            row.get(1)?,
                            row.get(2)?,
                            row.get(3)?,
                            row.get(4)?,
                            row.get(5)?,
                            row.get(6)?,
                            row.get(7)?,
                            row.get(8)?,
                            row.get(9)?,
                            row.get(10)?,
                            row.get(11)?,
                            row.get(12)?,
                            row.get(13)?,
                            row.get(14)?,
                            row.get(15)?,
                        ))
                    })
                    .expect("query_map penulis")
                    .filter_map(|r| r.ok())
                    .collect();

                for (pid, name, email, wa, prov, city, addr, job, inst, ds, ev, wv, fs, notes, ca, _ua) in rows {
                    let existing = conn
                        .query_row(
                            "SELECT id FROM contacts WHERE name = ?1 OR (wa_number IS NOT NULL AND wa_number = ?2 AND ?2 IS NOT NULL)",
                            params![name, wa],
                            |row| row.get::<_, i64>(0),
                        )
                        .ok();

                    let new_id = if let Some(cid) = existing {
                        conn.execute(
                            "UPDATE contacts SET province = ?1, city = ?2, job = ?3, institution = ?4, data_source = ?5, email_valid = ?6, wa_valid = ?7, followup_status = ?8, notes = ?9, address = ?10, type = 'both' WHERE id = ?11",
                            params![prov, city, job, inst, ds, ev, wv, fs, notes, addr, cid],
                        )
                        .ok();
                        cid
                    } else {
                        conn.execute(
                            "INSERT INTO contacts (name, email, wa_number, address, province, city, job, institution, data_source, email_valid, wa_valid, followup_status, notes, type, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,'penulis',?14,?15)",
                            params![name, email, wa, addr, prov, city, job, inst, ds, ev, wv, fs, notes, ca, ca],
                        )
                        .expect("insert new contact from penulis");
                        conn.last_insert_rowid()
                    };
                    // Update naskah FK references to new contact id
                    let _ = conn.execute("UPDATE naskah SET penulis_id = ?1 WHERE penulis_id = ?2", params![new_id, pid]);
                }
            }
        }
    }

    // Activity Log table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            action TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    Ok(())
}

