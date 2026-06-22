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
            pin TEXT,
            department TEXT,
            sync_status TEXT DEFAULT 'synced',
            wa_number TEXT,
            email TEXT,
            address TEXT,
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

    // ==========================================
    // WORKFLOW PRODUKSI NASKAH & MIGRASI EXCEL
    // ==========================================

    // Tabel workflow_templates
    conn.execute(
        "CREATE TABLE IF NOT EXISTS workflow_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Tabel workflow_template_steps
    conn.execute(
        "CREATE TABLE IF NOT EXISTS workflow_template_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_id INTEGER NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
            step_order INTEGER NOT NULL,
            step_name TEXT NOT NULL,
            default_role TEXT,
            default_duration_days INTEGER DEFAULT 0,
            is_required INTEGER NOT NULL DEFAULT 1
        )",
        [],
    )?;

    // Tabel tasks
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_id INTEGER NOT NULL REFERENCES naskah(id) ON DELETE CASCADE,
            step_name TEXT NOT NULL,
            step_order INTEGER,
            assigned_team_id INTEGER REFERENCES tim(id),
            status TEXT NOT NULL DEFAULT 'Belum Mulai',
            priority TEXT NOT NULL DEFAULT 'Normal',
            start_date TEXT,
            due_date TEXT,
            completed_date TEXT,
            notes TEXT,
            proof_path_or_link TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    // Tabel task_history
    conn.execute(
        "CREATE TABLE IF NOT EXISTS task_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            old_status TEXT,
            new_status TEXT NOT NULL,
            changed_by TEXT,
            changed_at TEXT NOT NULL,
            notes TEXT
        )",
        [],
    )?;

    // Tabel task_blockers
    conn.execute(
        "CREATE TABLE IF NOT EXISTS task_blockers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
            naskah_id INTEGER REFERENCES naskah(id) ON DELETE CASCADE,
            blocker_type TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'Aktif',
            created_at TEXT NOT NULL,
            resolved_at TEXT
        )",
        [],
    )?;

    // Tabel task_approvals
    conn.execute(
        "CREATE TABLE IF NOT EXISTS task_approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            approval_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Menunggu Approval',
            requested_at TEXT NOT NULL,
            decided_at TEXT,
            decided_by TEXT,
            notes TEXT
        )",
        [],
    )?;

    // Tabel naskah_files
    conn.execute(
        "CREATE TABLE IF NOT EXISTS naskah_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_id INTEGER NOT NULL REFERENCES naskah(id) ON DELETE CASCADE,
            file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
            file_role TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Tabel cetak_distribusi
    conn.execute(
        "CREATE TABLE IF NOT EXISTS cetak_distribusi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_id INTEGER NOT NULL REFERENCES naskah(id) ON DELETE CASCADE,
            acc_cetak_date TEXT,
            naik_cetak_date TEXT,
            jumlah_cetak INTEGER,
            status_cetak TEXT DEFAULT 'Belum Mulai',
            link_playbook TEXT,
            link_shopee TEXT,
            link_omp TEXT,
            ekspedisi TEXT,
            resi TEXT,
            tanggal_kirim TEXT,
            status_kirim TEXT DEFAULT 'Belum Dikirim',
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
        [],
    )?;

    // Tabel import_logs
    conn.execute(
        "CREATE TABLE IF NOT EXISTS import_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            import_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            sheet_name TEXT,
            total_rows INTEGER DEFAULT 0,
            valid_rows INTEGER DEFAULT 0,
            invalid_rows INTEGER DEFAULT 0,
            duplicate_rows INTEGER DEFAULT 0,
            imported_rows INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            notes TEXT
        )",
        [],
    )?;

    // Tabel work_hours untuk melacak jam kerja
    conn.execute(
        "CREATE TABLE IF NOT EXISTS work_hours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tim_id INTEGER,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration_seconds INTEGER DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Migrasi ad-hoc untuk tabel legalitas & invoices & work_hours
    let _ = conn.execute("ALTER TABLE work_hours ADD COLUMN tim_id INTEGER", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN nomor_dokumen TEXT", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN tanggal_keluar TEXT", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN tanggal_revisi TEXT", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN pic_id INTEGER REFERENCES tim(id)", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN rejection_reason TEXT", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN proof_path_or_link TEXT", []);

    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN naskah_id INTEGER REFERENCES naskah(id)", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN payment_status TEXT DEFAULT 'Draft'", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN paid_amount REAL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN remaining_amount REAL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN payment_notes TEXT", []);

    // Migrasi sinkronisasi cloud Google Apps Script (GAS) v2
    let _ = conn.execute("ALTER TABLE contacts ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE books ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE projects ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE files ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE tags ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE services ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE penerbit ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE naskah ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE tim ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN sync_status TEXT DEFAULT 'synced'", []);

    let _ = conn.execute("ALTER TABLE books ADD COLUMN cloud_file_url TEXT", []);
    let _ = conn.execute("ALTER TABLE legalitas ADD COLUMN cloud_file_url TEXT", []);
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN cloud_file_url TEXT", []);

    // Tabel sesi login karyawan lokal
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tim_id INTEGER NOT NULL REFERENCES tim(id),
            tim_name TEXT NOT NULL,
            tim_role TEXT NOT NULL,
            login_at TEXT NOT NULL,
            logout_at TEXT,
            is_active INTEGER NOT NULL DEFAULT 1
        )",
        [],
    )?;

    // Migrasi kolom audit trail ke activity_log
    let _ = conn.execute("ALTER TABLE activity_log ADD COLUMN performed_by INTEGER REFERENCES tim(id)", []);
    let _ = conn.execute("ALTER TABLE activity_log ADD COLUMN performed_by_name TEXT", []);
    let _ = conn.execute("ALTER TABLE activity_log ADD COLUMN old_value TEXT", []);
    let _ = conn.execute("ALTER TABLE activity_log ADD COLUMN new_value TEXT", []);
    let _ = conn.execute("ALTER TABLE activity_log ADD COLUMN module TEXT", []);

    // Migrasi kolom pin ke tabel tim — untuk autentikasi login anggota tim
    let _ = conn.execute("ALTER TABLE tim ADD COLUMN pin TEXT", []);

    // Migrasi kolom baru untuk detail profil anggota tim
    let _ = conn.execute("ALTER TABLE tim ADD COLUMN wa_number TEXT", []);
    let _ = conn.execute("ALTER TABLE tim ADD COLUMN email TEXT", []);
    let _ = conn.execute("ALTER TABLE tim ADD COLUMN address TEXT", []);

    // Tabel konfigurasi P2P
    conn.execute(
        "CREATE TABLE IF NOT EXISTS p2p_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    // ==========================================
    // LOCAL-FIRST SYNC (P2P)
    // ==========================================
    crate::sync::engine::init_sync_schema(conn)?;
    let _ = crate::sync::engine::ensure_device_id(conn);

    // WAL mode for better concurrent access between sync and UI.
    let _ = conn.execute("PRAGMA journal_mode=WAL;", []);

    // Dynamically create sync triggers for all tracked tables.
    crate::sync::engine::create_sync_triggers(conn)?;

    Ok(())
}

