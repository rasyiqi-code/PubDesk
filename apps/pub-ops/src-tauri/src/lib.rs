mod db;
mod watcher;
pub mod indexing;
pub mod commands;
pub mod p2p;

use db::*;
use watcher::WatcherManager;
use std::sync::Mutex;
use tauri::{State, Emitter};
use std::net::TcpListener;
use std::io::{Read, Write};

pub struct AppState {
    pub db: Mutex<Option<Database>>,
    pub active_session: Mutex<Option<AppSession>>,
    pub p2p_manager: Mutex<Option<std::sync::Arc<crate::p2p::P2PManager>>>,
}

pub struct WatcherState {
    pub manager: Mutex<Option<WatcherManager>>,
}

// Inisialisasi P2P Instance & Database P2P/Local
pub fn setup_p2p_instance(
    local_db_path: &std::path::PathBuf,
    app_state: &AppState,
) -> Result<(), String> {
    // 1. Buka koneksi lokal sementara untuk membaca konfigurasi P2P
    let local_conn = rusqlite::Connection::open(local_db_path)
        .map_err(|e| format!("Gagal membuka DB lokal untuk P2P: {}", e))?;

    // Pastikan tabel p2p_config ada
    local_conn.execute(
        "CREATE TABLE IF NOT EXISTS p2p_config (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
        []
    ).map_err(|e| e.to_string())?;

    // 2. Baca/generate keypair
    let keypair_b64: String = match local_conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'keypair'",
        [],
        |row| row.get(0)
    ) {
        Ok(val) => val,
        Err(_) => {
            let keypair = libp2p::identity::Keypair::generate_ed25519();
            let encoded = keypair.to_protobuf_encoding().unwrap();
            let b64 = base64::Engine::encode(&base64::prelude::BASE64_STANDARD, &encoded);
            local_conn.execute(
                "INSERT INTO p2p_config (key, value) VALUES ('keypair', ?1)",
                [&b64]
            ).map_err(|e| e.to_string())?;
            b64
        }
    };
    let keypair_bytes = base64::Engine::decode(&base64::prelude::BASE64_STANDARD, &keypair_b64).map_err(|e| e.to_string())?;

    // 3. Baca/generate auth_token
    let _auth_token: String = match local_conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'auth_token'",
        [],
        |row| row.get(0)
    ) {
        Ok(val) => val,
        Err(_) => {
            // Generate token acak sederhana
            let token = format!("{:x}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
            local_conn.execute(
                "INSERT INTO p2p_config (key, value) VALUES ('auth_token', ?1)",
                [&token]
            ).map_err(|e| e.to_string())?;
            token
        }
    };

    // 4. Baca p2p_enabled, p2p_role, p2p_host_address
    let p2p_enabled: String = local_conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'p2p_enabled'",
        [],
        |row| row.get(0)
    ).unwrap_or_else(|_| "false".to_string());

    let p2p_role: String = local_conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'p2p_role'",
        [],
        |row| row.get(0)
    ).unwrap_or_else(|_| "host".to_string());

    let p2p_host_address: String = local_conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'p2p_host_address'",
        [],
        |row| row.get(0)
    ).unwrap_or_else(|_| "".to_string());

    // Tutup koneksi lokal sementara
    drop(local_conn);

    if p2p_enabled == "true" {
        let db_conn_provider = std::sync::Arc::new(std::sync::Mutex::new(None));
        
        let manager = std::sync::Arc::new(
            crate::p2p::P2PManager::new(keypair_bytes, db_conn_provider.clone())
                .map_err(|e| format!("Gagal membuat P2PManager: {}", e))?
        );

        *app_state.p2p_manager.lock().unwrap() = Some(manager.clone());

        if p2p_role == "host" {
            // Kita adalah Host. Database lokal terhubung langsung.
            let db_conn = rusqlite::Connection::open(local_db_path).map_err(|e| e.to_string())?;
            // Berikan koneksi database ke manager agar dia bisa merespons kueri masuk
            *db_conn_provider.lock().unwrap() = Some(rusqlite::Connection::open(local_db_path).map_err(|e| e.to_string())?);
            
            let db = Database {
                conn: crate::db::Connection::Local(db_conn)
            };
            *app_state.db.lock().unwrap() = Some(db);

            // Mulai mendengarkan
            let manager_clone = manager.clone();
            tokio::spawn(async move {
                if let Err(e) = manager_clone.start_listening().await {
                    println!("Gagal memulai listen P2P: {:?}", e);
                }
            });
        } else {
            // Kita adalah Client.
            if p2p_host_address.is_empty() {
                return Err("Alamat host P2P kosong".to_string());
            }
            let addr: libp2p::Multiaddr = p2p_host_address.parse()
                .map_err(|e| format!("Format alamat host salah: {}", e))?;

            // Dapatkan peer ID host dari multiaddress
            let host_peer_id = addr.iter().find_map(|p| match p {
                libp2p::multiaddr::Protocol::P2p(peer_id) => Some(peer_id),
                _ => None
            }).ok_or_else(|| "Alamat host tidak menyertakan Peer ID (/p2p/...)".to_string())?;

            // Hubungkan (dial) ke host secara asinkron
            let manager_clone = manager.clone();
            let addr_clone = addr.clone();
            tokio::spawn(async move {
                if let Err(e) = manager_clone.dial(addr_clone).await {
                    println!("Gagal mendial host P2P: {:?}", e);
                }
            });

            // Inisialisasi Database P2P
            let db = Database::new_p2p(local_db_path, manager, host_peer_id)
                .map_err(|e| format!("Gagal inisialisasi DB P2P: {}", e))?;
            *app_state.db.lock().unwrap() = Some(db);
        }
    } else {
        // P2P tidak diaktifkan, load SQLite lokal biasa
        let db = Database::new(local_db_path).map_err(|e| e.to_string())?;
        *app_state.db.lock().unwrap() = Some(db);
    }

    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct P2PConfigPayload {
    pub enabled: bool,
    pub role: String,
    pub host_address: String,
    pub auth_token: String,
    pub local_peer_id: String,
}

#[tauri::command]
async fn get_p2p_config(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<P2PConfigPayload, String> {
    let db_path = get_db_path(&app_handle).map_err(|e| e.to_string())?;
    let conn = rusqlite::Connection::open(db_path).map_err(|e| e.to_string())?;

    let enabled: String = conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'p2p_enabled'",
        [],
        |row| row.get(0)
    ).unwrap_or_else(|_| "false".to_string());

    let role: String = conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'p2p_role'",
        [],
        |row| row.get(0)
    ).unwrap_or_else(|_| "host".to_string());

    let host_address: String = conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'p2p_host_address'",
        [],
        |row| row.get(0)
    ).unwrap_or_else(|_| "".to_string());

    let auth_token: String = conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'auth_token'",
        [],
        |row| row.get(0)
    ).unwrap_or_else(|_| "".to_string());

    let local_peer_id = {
        let mgr = state.p2p_manager.lock().unwrap();
        if let Some(m) = mgr.as_ref() {
            m.peer_id.to_string()
        } else {
            // Ambil dari keypair jika manager belum start
            let keypair_b64: Result<String, _> = conn.query_row(
                "SELECT value FROM p2p_config WHERE key = 'keypair'",
                [],
                |row| row.get(0)
            );
            if let Ok(k_b64) = keypair_b64 {
                if let Ok(bytes) = base64::Engine::decode(&base64::prelude::BASE64_STANDARD, &k_b64) {
                    if let Ok(id_keys) = libp2p::identity::Keypair::from_protobuf_encoding(&bytes) {
                        id_keys.public().to_peer_id().to_string()
                    } else {
                        "".to_string()
                    }
                } else {
                    "".to_string()
                }
            } else {
                "".to_string()
            }
        }
    };

    Ok(P2PConfigPayload {
        enabled: enabled == "true",
        role,
        host_address,
        auth_token,
        local_peer_id,
    })
}

#[tauri::command]
async fn set_p2p_config(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    enabled: bool,
    role: String,
    host_address: String,
    auth_token: String,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle).map_err(|e| e.to_string())?;
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('p2p_enabled', ?1)",
        [if enabled { "true" } else { "false" }]
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('p2p_role', ?1)",
        [&role]
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('p2p_host_address', ?1)",
        [&host_address]
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('auth_token', ?1)",
        [&auth_token]
    ).map_err(|e| e.to_string())?;

    drop(conn);

    // Stop P2P manager lama jika ada
    {
        let mut mgr = state.p2p_manager.lock().unwrap();
        *mgr = None;
    }

    // Re-inisialisasi database dan P2P
    setup_p2p_instance(&db_path, &state)?;

    Ok(())
}

#[tauri::command]
async fn get_p2p_status_command(
    state: State<'_, AppState>,
) -> Result<crate::p2p::P2PStatus, String> {
    let mgr = {
        let guard = state.p2p_manager.lock().unwrap();
        guard.as_ref().cloned()
    };
    if let Some(m) = mgr {
        m.get_status().await
    } else {
        Err("P2P Manager tidak aktif".to_string())
    }
}

#[tauri::command]
async fn start_oauth_server(app_handle: tauri::AppHandle, port: u16) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .map_err(|e| format!("Gagal mendengarkan di port: {}", e))?;
    
    // Set non-blocking agar bisa timeout dan keluar jika user menutup browser
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;

    std::thread::spawn(move || {
        let start_time = std::time::Instant::now();
        loop {
            // Timeout server setelah 5 menit
            if start_time.elapsed().as_secs() > 300 {
                break;
            }

            match listener.accept() {
                Ok((mut stream, _addr)) => {
                    let mut buffer = [0; 2048];
                    if let Ok(size) = stream.read(&mut buffer) {
                        let request = String::from_utf8_lossy(&buffer[..size]);
                        
                        // Cari parameter "code" di request URI (e.g. GET /?code=... HTTP/1.1)
                        if let Some(code_pos) = request.find("code=") {
                            let after_code = &request[code_pos + 5..];
                            let end_pos = after_code.find(' ').or_else(|| after_code.find('&')).unwrap_or(after_code.len());
                            let auth_code = &after_code[..end_pos];
                            
                            // Kirim event ke frontend Tauri
                            let _ = app_handle.emit("gdrive-oauth-code", auth_code.to_string());
                            
                            // Tampilkan halaman sukses di browser
                            let response_body = "
                                <html>
                                <head><title>Login Sukses</title></head>
                                <body style='font-family: sans-serif; text-align: center; padding-top: 60px; background-color: #f3f4f6; color: #1f2937;'>
                                    <div style='display: inline-block; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #10b981;'>
                                        <h1 style='color: #10b981; margin-bottom: 12px;'>Login Google Drive Berhasil!</h1>
                                        <p style='font-size: 15px; margin-bottom: 24px;'>Akun Google Anda berhasil dihubungkan ke PubDesk.</p>
                                        <p style='color: #6b7280; font-size: 13px;'>Anda dapat menutup jendela browser ini sekarang dan kembali ke aplikasi.</p>
                                    </div>
                                </body>
                                </html>
                            ";
                            let response = format!(
                                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n{}",
                                response_body.len(),
                                response_body
                            );
                            let _ = stream.write_all(response.as_bytes());
                            let _ = stream.flush();
                            break;
                        }
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
                Err(_) => {
                    break;
                }
            }
        }
    });

    Ok("Server dimulai".to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn init_database(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    watcher_state: State<'_, WatcherState>,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle).map_err(|e| e.to_string())?;
    init_db(&db_path).map_err(|e| e.to_string())?;
    
    // Inisialisasi P2P Instance & Database
    setup_p2p_instance(&db_path, &state)?;
    
    // Ambil referensi database yang baru diinisialisasi
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak terinisialisasi")?;
    
    // Pemuatan watch folders dari SQLite
    let watch_folders = db.get_watch_folders().map_err(|e| e.to_string())?;
    let paths: Vec<std::path::PathBuf> = watch_folders
        .iter()
        .map(|f| std::path::PathBuf::from(&f.path))
        .collect();

    drop(db_lock); // lepas lock sebelum inisialisasi watcher

    // Inisialisasi watcher manager
    let manager = WatcherManager::new(app_handle.clone());
    let mut manager_lock = watcher_state.manager.lock().unwrap();
    *manager_lock = Some(manager);

    // Mulai watcher
    if let Some(manager) = manager_lock.as_mut() {
        let _ = manager.start(paths);
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            db: Mutex::new(None),
            active_session: Mutex::new(None),
            p2p_manager: Mutex::new(None),
        })
        .manage(WatcherState {
            manager: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            init_database,
            start_oauth_server,
            get_p2p_config,
            set_p2p_config,
            get_p2p_status_command,
            // Book commands
            commands::book::get_books,
            commands::book::add_book,
            commands::book::delete_book,
            commands::book::update_book,
            // Service commands
            commands::invoice::get_services,
            commands::invoice::add_service,
            commands::invoice::update_service,
            commands::invoice::delete_service,
            // Contact commands
            commands::contact::get_contacts,
            commands::contact::add_contact,
            commands::contact::update_contact,
            commands::contact::delete_contact,
            commands::contact::get_penulis,
            commands::contact::add_penulis,
            commands::contact::update_penulis,
            commands::contact::delete_penulis,
            commands::contact::get_penerbit,
            commands::contact::add_penerbit,
            commands::contact::update_penerbit,
            commands::contact::delete_penerbit,
            commands::contact::get_tim,
            commands::contact::add_tim,
            commands::contact::update_tim,
            commands::contact::delete_tim,
            // Invoice commands
            commands::invoice::get_invoices,
            commands::invoice::add_invoice,
            commands::invoice::update_invoice,
            commands::invoice::delete_invoice,
            commands::invoice::update_invoice_sync_status,
            commands::invoice::update_sync_status,
            // File commands
            commands::file::get_files,
            commands::file::add_file,
            commands::file::delete_file,
            commands::file::update_file,
            commands::file::create_physical_file,
            commands::file::write_binary_file,
            commands::file::open_file_physically,
            commands::file::open_file_location_physically,
            commands::file::get_custom_work_dir,
            commands::file::set_custom_work_dir,
            commands::file::get_watch_folders,
            commands::file::add_watch_folder,
            commands::file::remove_watch_folder,
            commands::file::get_file_metadata,
            commands::file::get_related_files,
            commands::file::record_file_access,
            commands::file::global_semantic_search,
            commands::file::add_file_tag,
            commands::file::remove_file_tag,
            commands::file::get_file_tags,
            commands::file::get_all_tags,
            commands::file::get_all_file_tags,
            commands::file::read_file_bytes,
            // Workflow commands
            commands::workflow::get_naskah,
            commands::workflow::add_naskah,
            commands::workflow::update_naskah,
            commands::workflow::delete_naskah,
            commands::workflow::get_legalitas,
            commands::workflow::add_legalitas,
            commands::workflow::update_legalitas,
            commands::workflow::delete_legalitas,
            commands::workflow::get_tasks,
            commands::workflow::add_task,
            commands::workflow::update_task,
            commands::workflow::delete_task,
            commands::workflow::get_workflow_templates,
            commands::workflow::add_workflow_template,
            commands::workflow::add_task_history,
            commands::workflow::get_task_history,
            commands::workflow::get_all_task_history,
            commands::workflow::update_task_status,
            commands::workflow::get_task_blockers,
            commands::workflow::add_task_blocker,
            commands::workflow::resolve_task_blocker,
            commands::workflow::get_task_approvals,
            commands::workflow::request_approval,
            commands::workflow::decide_approval,
            commands::workflow::import_alur_naskah_batch,
            // Session / Auth / Utility commands
            commands::session::login_user,
            commands::session::logout_user,
            commands::session::get_current_user,
            commands::session::start_work_session,
            commands::session::stop_work_session,
            commands::session::get_active_work_session,
            commands::session::get_work_sessions,
            commands::session::get_activity_log,
            commands::session::get_activity_log_filtered,
            commands::session::call_gas_api,
            commands::session::seed_sample_data,
            commands::session::reset_workflow_data,
            commands::session::reset_total_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
