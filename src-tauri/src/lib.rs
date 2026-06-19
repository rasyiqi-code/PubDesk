mod db;
mod watcher;

use db::*;
use watcher::WatcherManager;
use std::sync::Mutex;
use tauri::{State, Emitter};
use std::net::TcpListener;
use std::io::{Read, Write};

pub struct AppState {
    pub db: Mutex<Option<Database>>,
}

struct WatcherState {
    manager: Mutex<Option<WatcherManager>>,
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

#[tauri::command]
async fn get_watch_folders(state: State<'_, AppState>) -> Result<Vec<WatchFolder>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_watch_folders().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_watch_folder(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    watcher_state: State<'_, WatcherState>,
    path: String
) -> Result<String, String> {
    use tauri::Manager;
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    
    let path_buf = std::path::PathBuf::from(&path);
    if !path_buf.exists() || !path_buf.is_dir() {
        return Err("Folder tidak ditemukan atau bukan merupakan direktori valid".to_string());
    }

    let path_abs = path_buf.canonicalize()
        .map_err(|e| format!("Gagal memetakan path absolut: {}", e))?
        .to_string_lossy().to_string();

    db.add_watch_folder(&path_abs).map_err(|e| e.to_string())?;

    let app_handle_clone = app_handle.clone();
    let path_abs_clone = path_abs.clone();
    
    std::thread::spawn(move || {
        let state = app_handle_clone.state::<AppState>();
        let db_lock = state.db.lock().unwrap();
        if let Some(db) = db_lock.as_ref() {
            let _ = watcher::scan_directory_recursive(db, std::path::Path::new(&path_abs_clone));
            let _ = app_handle_clone.emit("local-files-changed", ());
        }
    });

    let watch_folders = db.get_watch_folders().map_err(|e| e.to_string())?;
    let paths: Vec<std::path::PathBuf> = watch_folders.iter().map(|f| std::path::PathBuf::from(&f.path)).collect();
    
    let mut manager_lock = watcher_state.manager.lock().unwrap();
    if let Some(manager) = manager_lock.as_mut() {
        manager.start(paths)?;
    }

    Ok(format!("Folder {} berhasil didaftarkan dan dipantau", path_abs))
}

#[tauri::command]
async fn remove_watch_folder(
    state: State<'_, AppState>,
    watcher_state: State<'_, WatcherState>,
    id: i64
) -> Result<(), String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    
    let folders = db.get_watch_folders().map_err(|e| e.to_string())?;
    if let Some(target) = folders.iter().find(|f| f.id == Some(id)) {
        let _ = db.delete_files_by_prefix(&target.path);
    }

    db.delete_watch_folder(id).map_err(|e| e.to_string())?;

    let watch_folders = db.get_watch_folders().map_err(|e| e.to_string())?;
    let paths: Vec<std::path::PathBuf> = watch_folders.iter().map(|f| std::path::PathBuf::from(&f.path)).collect();
    
    let mut manager_lock = watcher_state.manager.lock().unwrap();
    if let Some(manager) = manager_lock.as_mut() {
        manager.start(paths)?;
    }

    Ok(())
}

// Books commands
#[tauri::command]
fn get_books(state: State<'_, AppState>) -> Result<Vec<Book>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_books().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_book(state: State<'_, AppState>, book: Book) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_book(&book).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_book(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_book(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_book(state: State<'_, AppState>, book: Book) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_book(&book).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_services(state: State<'_, AppState>) -> Result<Vec<Service>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_services().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_service(state: State<'_, AppState>, service: Service) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_service(&service).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_service(state: State<'_, AppState>, service: Service) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_service(&service).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_service(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_service(id).map_err(|e| e.to_string())
}



// Contacts commands
#[tauri::command]
fn get_contacts(state: State<'_, AppState>) -> Result<Vec<Contact>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_contacts().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_contact(state: State<'_, AppState>, contact: Contact) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_contact(&contact).map_err(|e| e.to_string())
}

// Invoices commands
#[tauri::command]
fn get_invoices(state: State<'_, AppState>) -> Result<Vec<Invoice>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_invoices().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_invoice(state: State<'_, AppState>, invoice: Invoice) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_invoice(&invoice).map_err(|e| e.to_string())
}

// Files commands
#[tauri::command]
fn get_files(state: State<'_, AppState>) -> Result<Vec<File>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_files().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_file(state: State<'_, AppState>, file: File) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_file(&file).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_file(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_file(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_file(state: State<'_, AppState>, file: File) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_file(&file).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_physical_file(app_handle: tauri::AppHandle, filename: String, bytes: Vec<u8>, folder: String) -> Result<String, String> {
    use tauri::Manager;
    use std::fs::File as StdFile;
    use std::io::Write;

    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let target_dir = app_data_dir.join(&folder);
    std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    
    let file_path = target_dir.join(&filename);
    
    let mut file = StdFile::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_file_physically(path: String) -> Result<(), String> {
    use std::process::Command;
    
    Command::new("xdg-open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
        
    Ok(())
}

#[tauri::command]
fn open_file_location_physically(path: String) -> Result<(), String> {
    use std::process::Command;
    use std::path::Path;
    
    let path_ref = Path::new(&path);
    let parent = path_ref.parent().ok_or("No parent directory")?;
    
    // Coba buka dengan nautilus --select agar menyorot file terpilih (khusus Linux GNOME)
    let nautilus_status = Command::new("nautilus")
        .arg("--select")
        .arg(&path)
        .spawn();
        
    if nautilus_status.is_err() {
        // Fallback membuka folder induk menggunakan xdg-open
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
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
        })
        .manage(WatcherState {
            manager: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            init_database,
            get_books,
            add_book,
            delete_book,
            update_book,
            get_services,
            add_service,
            update_service,
            delete_service,
            get_contacts,
            add_contact,
            get_invoices,
            add_invoice,
            get_files,
            add_file,
            delete_file,
            update_file,
            create_physical_file,
            open_file_physically,
            open_file_location_physically,
            start_oauth_server,
            get_watch_folders,
            add_watch_folder,
            remove_watch_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
