pub mod error;
pub mod models;
pub mod sample_data;
pub mod schema;
pub mod workflow;

pub mod book;
pub mod contact;
pub mod invoice;
pub mod file;
pub mod naskah;
pub mod service;
pub mod session;

pub mod wrapper;

// Modul database SQLite untuk aplikasi PubDesk
pub use error::DbError;
pub use models::*;
pub use wrapper::PubhubConnection as Connection;
pub use wrapper::PubhubRow as Row;
use std::path::PathBuf;
use tauri::Manager;

pub fn get_db_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, DbError> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| DbError::PathError)?;

    std::fs::create_dir_all(&app_data_dir)?;
    Ok(app_data_dir.join("pubhub.db"))
}

pub fn init_db(db_path: &PathBuf) -> Result<(), DbError> {
    let conn = rusqlite::Connection::open(db_path)?;
    schema::create_tables(&conn)?;
    
    // Sinkronisasi data pelanggan dari invoice lama ke tabel contacts jika contacts kosong
    let _ = session::sync_contacts_from_invoices(&conn);
    
    Ok(())
}

pub struct Database {
    pub(crate) conn: Connection,
}

impl Database {
    pub fn new(db_path: &PathBuf) -> Result<Self, DbError> {
        let conn = rusqlite::Connection::open(db_path)?;
        Ok(Self {
            conn: Connection::Local(conn)
        })
    }

    pub fn new_p2p(
        local_db_path: &PathBuf,
        manager: std::sync::Arc<crate::p2p::P2PManager>,
        host_peer_id: libp2p::PeerId,
    ) -> Result<Self, DbError> {
        let local_conn = rusqlite::Connection::open(local_db_path)?;
        Ok(Self {
            conn: Connection::P2P {
                manager,
                host_peer_id,
                local_conn,
            }
        })
    }
}
