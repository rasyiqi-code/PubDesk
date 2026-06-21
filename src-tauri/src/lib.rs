mod db;
mod watcher;
pub mod indexing;

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
    let (path_abs, paths) = {
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

        let watch_folders = db.get_watch_folders().map_err(|e| e.to_string())?;
        let paths: Vec<std::path::PathBuf> = watch_folders.iter().map(|f| std::path::PathBuf::from(&f.path)).collect();
        
        (path_abs, paths)
    }; // db_lock dilepas secara otomatis di sini!

    let app_handle_clone = app_handle.clone();
    let path_abs_clone = path_abs.clone();
    
    std::thread::spawn(move || {
        let _ = watcher::scan_directory_recursive(&app_handle_clone, std::path::Path::new(&path_abs_clone));
        let _ = app_handle_clone.emit("local-files-changed", ());
    });

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
    let paths = {
        let db_lock = state.db.lock().unwrap();
        let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
        
        let folders = db.get_watch_folders().map_err(|e| e.to_string())?;
        if let Some(target) = folders.iter().find(|f| f.id == Some(id)) {
            let _ = db.delete_files_by_prefix(&target.path);
        }

        db.delete_watch_folder(id).map_err(|e| e.to_string())?;

        let watch_folders = db.get_watch_folders().map_err(|e| e.to_string())?;
        let paths: Vec<std::path::PathBuf> = watch_folders.iter().map(|f| std::path::PathBuf::from(&f.path)).collect();
        paths
    }; // db_lock dilepas secara otomatis di sini!

    let mut manager_lock = watcher_state.manager.lock().unwrap();
    if let Some(manager) = manager_lock.as_mut() {
        manager.start(paths)?;
    }

    Ok(())
}

#[tauri::command]
async fn add_file_tag(
    state: State<'_, AppState>,
    file_id: i64,
    tag: String
) -> Result<(), String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_file_tag(file_id, &tag).map_err(|e| e.to_string())
}

#[tauri::command]
async fn remove_file_tag(
    state: State<'_, AppState>,
    file_id: i64,
    tag: String
) -> Result<(), String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.remove_file_tag(file_id, &tag).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_file_tags(
    state: State<'_, AppState>,
    file_id: i64
) -> Result<Vec<String>, String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_file_tags(file_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_all_tags(
    state: State<'_, AppState>
) -> Result<Vec<String>, String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_all_tags().map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_all_file_tags(
    state: State<'_, AppState>
) -> Result<std::collections::HashMap<i64, Vec<String>>, String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_all_file_tags().map_err(|e| e.to_string())
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

#[tauri::command]
fn update_contact(state: State<'_, AppState>, contact: Contact) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_contact(&contact).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_contact(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_contact(id).map_err(|e| e.to_string())
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

#[tauri::command]
fn update_invoice(state: State<'_, AppState>, invoice: Invoice) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_invoice(&invoice).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_invoice(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_invoice(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_invoice_sync_status(
    state: State<'_, AppState>,
    id: i64,
    sync_status: String,
    cloud_file_url: String,
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_invoice_sync_status(id, &sync_status, &cloud_file_url)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_sync_status(
    state: State<'_, AppState>,
    table_name: String,
    id: i64,
    sync_status: String,
    cloud_file_url: Option<String>,
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_sync_status(&table_name, id, &sync_status, cloud_file_url.as_deref())
        .map_err(|e| e.to_string())
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
fn write_binary_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    use std::fs::File as StdFile;
    use std::io::Write;

    let mut file = StdFile::create(path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;
    Ok(())
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

#[tauri::command]
async fn get_file_metadata(
    state: State<'_, AppState>,
    file_id: i64,
) -> Result<crate::indexing::pipeline::FileMetadataPayload, String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    crate::indexing::pipeline::get_file_metadata(db, file_id)
}

#[tauri::command]
async fn get_related_files(
    state: State<'_, AppState>,
    file_id: i64,
) -> Result<Vec<crate::indexing::pipeline::RelatedFileInfo>, String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    crate::indexing::pipeline::get_related_files(db, file_id)
}

#[tauri::command]
async fn record_file_access(
    state: State<'_, AppState>,
    file_id: i64,
) -> Result<(), String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    crate::indexing::pipeline::record_file_access(db, file_id)
}

#[tauri::command]
async fn call_gas_api(
    url: String,
    method: String,
    payload_json: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = if method.to_uppercase() == "POST" {
        let body = payload_json.unwrap_or_default();
        client.post(&url)
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .map_err(|e| format!("Request POST gagal: {}", e))?
    } else {
        client.get(&url)
            .send()
            .await
            .map_err(|e| format!("Request GET gagal: {}", e))?
    };

    let status = response.status();
    let text = response.text().await
        .map_err(|e| format!("Gagal membaca response text: {}", e))?;

    if !status.is_success() {
        return Err(format!("Server merespons dengan status {}: {}", status, text));
    }

    Ok(text)
}

#[tauri::command]
async fn global_semantic_search(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<crate::indexing::pipeline::SearchResultInfo>, String> {
    let db_lock = state.db.lock().unwrap();
    let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
    crate::indexing::pipeline::global_semantic_search(db, &query)
}

#[tauri::command]
async fn get_penulis(state: State<'_, AppState>) -> Result<Vec<Penulis>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_penulis().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_penulis(state: State<'_, AppState>, penulis: Penulis) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_penulis(&penulis).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_penulis(state: State<'_, AppState>, penulis: Penulis) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_penulis(&penulis).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_penulis(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_penulis(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_penerbit(state: State<'_, AppState>) -> Result<Vec<Penerbit>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_penerbit().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_penerbit(state: State<'_, AppState>, penerbit: Penerbit) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_penerbit(&penerbit).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_penerbit(state: State<'_, AppState>, penerbit: Penerbit) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_penerbit(&penerbit).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_penerbit(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_penerbit(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_naskah(state: State<'_, AppState>) -> Result<Vec<Naskah>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_naskah().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_naskah(state: State<'_, AppState>, order: Naskah) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_naskah(&order).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_naskah(state: State<'_, AppState>, order: Naskah) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_naskah(&order).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_naskah(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_naskah(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_tim(state: State<'_, AppState>) -> Result<Vec<Tim>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_all_tim().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_tim(state: State<'_, AppState>, tim: Tim) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_tim(&tim).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_tim(state: State<'_, AppState>, tim: Tim) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_tim(&tim).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_tim(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_tim(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_legalitas(state: State<'_, AppState>) -> Result<Vec<Legalitas>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_legalitas().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_legalitas(state: State<'_, AppState>, legalitas: Legalitas) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_legalitas(&legalitas).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_legalitas(state: State<'_, AppState>, legalitas: Legalitas) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_legalitas(&legalitas).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_legalitas(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_legalitas(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_activity_log(state: State<'_, AppState>, limit: i64) -> Result<Vec<ActivityLog>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_activity_log(limit).map_err(|e| e.to_string())
}

// Workflow Commands
#[tauri::command]
async fn get_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_task(state: State<'_, AppState>, task: Task) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_task(state: State<'_, AppState>, task: Task) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_task(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_task(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_workflow_templates(state: State<'_, AppState>) -> Result<Vec<WorkflowTemplate>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_workflow_templates().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_workflow_template(state: State<'_, AppState>, template: WorkflowTemplate) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_workflow_template(&template).map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_task_history(state: State<'_, AppState>, history: TaskHistory) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_task_history(&history).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_task_history(state: State<'_, AppState>, task_id: i64) -> Result<Vec<TaskHistory>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_task_history(task_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_all_task_history(state: State<'_, AppState>) -> Result<Vec<TaskHistory>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_all_task_history().map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_task_status(state: State<'_, AppState>, task_id: i64, new_status: String, notes: Option<String>, proof_path_or_link: Option<String>) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_task_status(task_id, &new_status, notes.as_deref(), proof_path_or_link.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_task_blockers(state: State<'_, AppState>, task_id: Option<i64>) -> Result<Vec<TaskBlocker>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_task_blockers(task_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_task_blocker(state: State<'_, AppState>, blocker: TaskBlocker) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_task_blocker(&blocker).map_err(|e| e.to_string())
}

#[tauri::command]
async fn resolve_task_blocker(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.resolve_task_blocker(id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_task_approvals(state: State<'_, AppState>, task_id: Option<i64>) -> Result<Vec<TaskApproval>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_task_approvals(task_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn request_approval(state: State<'_, AppState>, approval: TaskApproval) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.request_approval(&approval).map_err(|e| e.to_string())
}

#[tauri::command]
async fn decide_approval(state: State<'_, AppState>, id: i64, status: String, notes: Option<String>, decided_by: Option<String>) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.decide_approval(id, &status, notes.as_deref(), decided_by.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn import_alur_naskah_batch(state: State<'_, AppState>, payloads: Vec<ImportTaskPayload>) -> Result<usize, String> {
    let mut db = state.db.lock().unwrap();
    let db = db.as_mut().ok_or("Database tidak diinisialisasi")?;
    db.import_alur_naskah_batch(payloads).map_err(|e| e.to_string())
}

#[tauri::command]
async fn seed_sample_data(state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db::sample_data::seed_sample_data(&db.conn).map_err(|e| e.to_string())
}

#[tauri::command]
async fn reset_workflow_data(state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db::sample_data::reset_workflow_data(&db.conn).map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_work_session(state: State<'_, AppState>, start_time: String) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.start_work_session(&start_time).map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_work_session(state: State<'_, AppState>, id: i64, end_time: String, duration_seconds: i64, notes: Option<String>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.stop_work_session(id, &end_time, duration_seconds, notes.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_active_work_session(state: State<'_, AppState>) -> Result<Option<WorkSession>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_active_work_session().map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_work_sessions(state: State<'_, AppState>, limit: i64) -> Result<Vec<WorkSession>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_work_sessions(limit).map_err(|e| e.to_string())
}

#[tauri::command]
async fn login_user(state: State<'_, AppState>, tim_id: i64) -> Result<AppSession, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    let tim_list = db.get_all_tim().map_err(|e| e.to_string())?;
    let member = tim_list.into_iter().find(|t| t.id == Some(tim_id))
        .ok_or_else(|| "Anggota tim tidak ditemukan".to_string())?;
    let session = db.login_session(tim_id, &member.name, &member.role).map_err(|e| e.to_string())?;
    let _ = db.log_activity_audit("session", None, "LOGIN", &format!("Karyawan '{}' login ke sistem", member.name), Some(tim_id), Some(&member.name), None, None, Some("auth"));
    drop(db);
    let mut active = state.active_session.lock().unwrap();
    *active = Some(session.clone());
    Ok(session)
}

#[tauri::command]
async fn logout_user(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    {
        let active = state.active_session.lock().unwrap();
        if let Some(ref session) = *active {
            let _ = db.log_activity_audit("session", None, "LOGOUT", &format!("Karyawan '{}' logout dari sistem", session.tim_name), Some(session.tim_id), Some(&session.tim_name), None, None, Some("auth"));
        }
    }
    db.logout_session().map_err(|e| e.to_string())?;
    drop(db);
    let mut active = state.active_session.lock().unwrap();
    *active = None;
    Ok(())
}

#[tauri::command]
async fn get_current_user(state: State<'_, AppState>) -> Result<Option<AppSession>, String> {
    {
        let active = state.active_session.lock().unwrap();
        if active.is_some() {
            return Ok(active.clone());
        }
    }
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    let session = db.get_active_session().map_err(|e| e.to_string())?;
    if let Some(ref s) = session {
        let mut active = state.active_session.lock().unwrap();
        *active = Some(s.clone());
    }
    Ok(session)
}

#[tauri::command]
async fn get_activity_log_filtered(
    state: State<'_, AppState>,
    limit: i64,
    performed_by: Option<i64>,
    entity_type: Option<String>,
    action: Option<String>,
) -> Result<Vec<ActivityLog>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_activity_log_filtered(
        limit,
        performed_by,
        entity_type.as_deref(),
        action.as_deref(),
    ).map_err(|e| e.to_string())
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
            update_contact,
            delete_contact,
            get_invoices,
            add_invoice,
            update_invoice,
            delete_invoice,
            update_invoice_sync_status,
            get_files,
            add_file,
            delete_file,
            update_file,
            create_physical_file,
            write_binary_file,
            open_file_physically,
            open_file_location_physically,
            start_oauth_server,
            get_watch_folders,
            add_watch_folder,
            remove_watch_folder,
            get_file_metadata,
            get_related_files,
            record_file_access,
            global_semantic_search,
            call_gas_api,
            add_file_tag,
            remove_file_tag,
            get_file_tags,
            get_all_tags,
            get_all_file_tags,
            get_penulis,
            add_penulis,
            update_penulis,
            delete_penulis,
            get_penerbit,
            add_penerbit,
            update_penerbit,
            delete_penerbit,
            get_naskah,
            add_naskah,
            update_naskah,
            delete_naskah,
            get_tim,
            add_tim,
            update_tim,
            delete_tim,
            get_legalitas,
            add_legalitas,
            update_legalitas,
            delete_legalitas,
            get_activity_log,
            get_tasks,
            add_task,
            update_task,
            delete_task,
            get_workflow_templates,
            add_workflow_template,
            add_task_history,
            get_task_history,
            get_all_task_history,
            update_task_status,
            get_task_blockers,
            add_task_blocker,
            resolve_task_blocker,
            get_task_approvals,
            request_approval,
            decide_approval,
            read_file_bytes,
            import_alur_naskah_batch,
            seed_sample_data,
            reset_workflow_data,
            update_sync_status,
            start_work_session,
            stop_work_session,
            get_active_work_session,
            get_work_sessions,
            login_user,
            logout_user,
            get_current_user,
            get_activity_log_filtered
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
