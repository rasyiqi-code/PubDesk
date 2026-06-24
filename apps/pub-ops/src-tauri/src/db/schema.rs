use rusqlite::{Connection, Result};

pub fn create_tables(conn: &Connection) -> Result<()> {
    pubhub_db_shared::schema::build_schema(conn)?;

    crate::sync::engine::init_sync_schema(conn)?;

    // WAL mode + busy timeout for concurrent access from multiple PubHub apps.
    let _ = conn.execute("PRAGMA journal_mode=WAL;", []);
    let _ = conn.execute("PRAGMA busy_timeout = 5000;", []);

    Ok(())
}
