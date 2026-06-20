use rusqlite::{Connection, Result};

pub fn create_tables(conn: &Connection) -> Result<()> {
    // Contacts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            wa_number TEXT,
            address TEXT,
            type TEXT NOT NULL DEFAULT 'customer',
            created_at TEXT NOT NULL
        )",
        [],
    )?;

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
            cover_path TEXT
        )",
        [],
    )?;

    // Migrasi ad-hoc untuk menambahkan kolom cover_path jika database sudah terlanjur dibuat sebelumnya
    let _ = conn.execute("ALTER TABLE books ADD COLUMN cover_path TEXT", []);

    // Projects table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            book_id INTEGER REFERENCES books(id),
            status TEXT NOT NULL DEFAULT 'draft',
            deadline TEXT
        )",
        [],
    )?;

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
            responsible_parties TEXT
        )",
        [],
    )?;

    // Tags table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

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
            file_path TEXT
        )",
        [],
    )?;

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
            category TEXT NOT NULL DEFAULT 'other'
        )",
        [],
    )?;

    // Watch folders table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS watch_folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

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
            created_at TEXT NOT NULL
        )",
        [],
    )?;

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
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Naskah Orders table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS naskah_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_id_code TEXT UNIQUE,
            title TEXT NOT NULL,
            penulis_id INTEGER REFERENCES penulis(id),
            penerbit_id INTEGER REFERENCES penerbit(id),
            package_type TEXT,
            order_type TEXT,
            copies INTEGER,
            book_size TEXT,
            initial_request TEXT,
            revised_request TEXT,
            legal_type TEXT,
            shipping_address TEXT,
            status TEXT NOT NULL DEFAULT 'Belum Dimulai',
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Layouters table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS layouters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'layouter',
            is_active INTEGER NOT NULL DEFAULT 1,
            weekly_target INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Workflow Events table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS workflow_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            naskah_order_id INTEGER REFERENCES naskah_orders(id) ON DELETE CASCADE,
            event_name TEXT NOT NULL,
            completed_date TEXT,
            pic_name TEXT,
            notes TEXT,
            proof_path_or_link TEXT,
            status TEXT NOT NULL DEFAULT 'Belum Dimulai'
        )",
        [],
    )?;

    Ok(())
}

