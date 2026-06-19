use std::path::{Path, PathBuf};
use notify::{Watcher, RecursiveMode, RecommendedWatcher, Event, EventKind};
use notify::event::{CreateKind, ModifyKind, RemoveKind, RenameMode};
use tauri::{AppHandle, Emitter, Manager};
use crate::db::{Database, File};
use crate::AppState;

pub struct WatcherManager {
    watcher: Option<RecommendedWatcher>,
    app_handle: AppHandle,
}

impl WatcherManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            watcher: None,
            app_handle,
        }
    }

    pub fn start(&mut self, paths: Vec<PathBuf>) -> Result<(), String> {
        // Hentikan watcher lama jika ada dengan mendrop RecommendedWatcher
        self.watcher = None;

        if paths.is_empty() {
            return Ok(());
        }

        let app_handle_clone = self.app_handle.clone();

        let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                handle_watcher_event(&app_handle_clone, event);
            }
        }).map_err(|e| format!("Gagal menginisialisasi watcher: {}", e))?;

        for path in paths {
            if path.exists() {
                let _ = watcher.watch(&path, RecursiveMode::Recursive);
            }
        }

        self.watcher = Some(watcher);
        Ok(())
    }
}

fn handle_watcher_event(app_handle: &AppHandle, event: Event) {
    let state = app_handle.state::<AppState>();
    let db_lock = state.db.lock().unwrap();
    let db = match db_lock.as_ref() {
        Some(d) => d,
        None => return,
    };

    let mut changed = false;

    match event.kind {
        EventKind::Create(CreateKind::File) | EventKind::Create(CreateKind::Any) => {
            for path in event.paths {
                if path.is_file() {
                    if let Ok(true) = process_created_file(db, &path) {
                        changed = true;
                    }
                }
            }
        }
        EventKind::Modify(ModifyKind::Data(_)) | EventKind::Modify(ModifyKind::Any) => {
            for path in event.paths {
                if path.is_file() {
                    if let Ok(true) = process_modified_file(db, &path) {
                        changed = true;
                    }
                }
            }
        }
        EventKind::Remove(RemoveKind::File) | EventKind::Remove(RemoveKind::Any) => {
            for path in event.paths {
                let path_str = path.to_string_lossy().to_string();
                if let Ok(Some(existing_file)) = db.get_file_by_path(&path_str) {
                    if !existing_file.path.starts_with("gdrive://") {
                        let _ = db.delete_file_by_path(&path_str);
                        changed = true;
                    }
                }
            }
        }
        EventKind::Modify(ModifyKind::Name(RenameMode::Both)) | EventKind::Modify(ModifyKind::Name(RenameMode::Any)) => {
            // Rename event
            if event.paths.len() == 2 {
                let old_path = &event.paths[0];
                let new_path = &event.paths[1];
                let old_path_str = old_path.to_string_lossy().to_string();
                let new_path_str = new_path.to_string_lossy().to_string();
                
                if let Ok(Some(mut existing_file)) = db.get_file_by_path(&old_path_str) {
                    if !existing_file.path.starts_with("gdrive://") {
                        let _ = db.delete_file_by_path(&old_path_str);
                        
                        existing_file.path = new_path_str;
                        existing_file.filename = new_path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        existing_file.last_modified = chrono::Local::now().to_rfc3339();
                        
                        let _ = db.add_file(&existing_file);
                        changed = true;
                    }
                } else if new_path.is_file() {
                    if let Ok(true) = process_created_file(db, new_path) {
                        changed = true;
                    }
                }
            }
        }
        _ => {}
    }

    if changed {
        let _ = app_handle.emit("local-files-changed", ());
    }
}

pub fn scan_directory_recursive(db: &Database, dir_path: &Path) -> Result<(), String> {
    if !dir_path.is_dir() {
        return Ok(());
    }

    if let Ok(entries) = std::fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let _ = scan_directory_recursive(db, &path);
            } else if path.is_file() {
                let _ = process_created_file(db, &path);
            }
        }
    }
    Ok(())
}

fn process_created_file(db: &Database, path: &Path) -> Result<bool, String> {
    let path_str = path.to_string_lossy().to_string();
    
    // Cek apakah file sudah terdaftar
    if let Ok(Some(_)) = db.get_file_by_path(&path_str) {
        return Ok(false);
    }

    let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
    let extension = path.extension().unwrap_or_default().to_string_lossy().to_string().to_lowercase();
    
    // Daftar ekstensi file yang diizinkan untuk diindeks
    let allowed_extensions = ["docx", "doc", "pdf", "xlsx", "xls", "png", "jpg", "jpeg", "txt", "md"];
    if !allowed_extensions.contains(&extension.as_str()) {
        return Ok(false);
    }

    let metadata = path.metadata().map_err(|e| e.to_string())?;
    let size = metadata.len();
    let last_modified = metadata.modified()
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Local> = t.into();
            datetime.to_rfc3339()
        })
        .unwrap_or_else(|_| chrono::Local::now().to_rfc3339());

    let file_type = "other";

    let new_file = File {
        id: None,
        path: path_str,
        filename,
        r#type: file_type.to_string(),
        project_id: None,
        status: "draft".to_string(),
        version_label: Some(extension),
        last_modified,
        modified_by: Some(format!("{}|local|0|system", size)),
        is_readonly: metadata.permissions().readonly(),
    };

    let file_id = db.add_file(&new_file).map_err(|e| e.to_string())?;
    
    // Jalankan pipeline indexing cerdas secara lokal
    if let Err(e) = crate::indexing::pipeline::run_indexing_pipeline(db, file_id) {
        println!("Gagal menjalankan pipeline indeks untuk berkas {}: {}", file_id, e);
    }
    
    Ok(true)
}

fn process_modified_file(db: &Database, path: &Path) -> Result<bool, String> {
    let path_str = path.to_string_lossy().to_string();
    
    if let Ok(Some(mut existing_file)) = db.get_file_by_path(&path_str) {
        if existing_file.path.starts_with("gdrive://") {
            return Ok(false);
        }

        let metadata = path.metadata().map_err(|e| e.to_string())?;
        let size = metadata.len();
        let last_modified = metadata.modified()
            .map(|t| {
                let datetime: chrono::DateTime<chrono::Local> = t.into();
                datetime.to_rfc3339()
            })
            .unwrap_or_else(|_| chrono::Local::now().to_rfc3339());

        existing_file.last_modified = last_modified;
        existing_file.modified_by = Some(format!("{}|local|0|system", size));
        existing_file.is_readonly = metadata.permissions().readonly();

        db.update_file(&existing_file).map_err(|e| e.to_string())?;
        
        if let Some(file_id) = existing_file.id {
            // Jalankan pipeline indexing cerdas secara lokal untuk file yang diubah
            if let Err(e) = crate::indexing::pipeline::run_indexing_pipeline(db, file_id) {
                println!("Gagal memperbarui indeks untuk berkas {}: {}", file_id, e);
            }
        }
        
        Ok(true)
    } else {
        process_created_file(db, path)
    }
}
