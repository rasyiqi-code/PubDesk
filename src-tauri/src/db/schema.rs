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
            is_readonly BOOLEAN NOT NULL DEFAULT 0
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

    Ok(())
}
