mod db;
mod watcher;
pub mod indexing;
pub mod commands;

use db::*;
use watcher::WatcherManager;
use std::sync::Mutex;
use tauri::{State, Emitter};
use std::net::TcpListener;
use std::io::{Read, Write};

pub struct AppState {
    pub db: Mutex<Option<Database>>,
    pub active_session: Mutex<Option<AppSession>>,
}

pub struct WatcherState {
    pub manager: Mutex<Option<WatcherManager>>,
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
    
    let db = Database::new(&db_path).map_err(|e| e.to_string())?;
    
    // Pemuatan watch folders dari SQLite
    let watch_folders = db.get_watch_folders().map_err(|e| e.to_string())?;
    let paths: Vec<std::path::PathBuf> = watch_folders
        .iter()
        .map(|f| std::path::PathBuf::from(&f.path))
        .collect();

    *state.db.lock().unwrap() = Some(db);

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
        })
        .manage(WatcherState {
            manager: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            init_database,
            start_oauth_server,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
