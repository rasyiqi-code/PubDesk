use tauri::State;
use crate::AppState;
use crate::db::{Contact, Penulis, Penerbit, Tim};

#[tauri::command]
pub async fn get_contacts(state: State<'_, AppState>) -> Result<Vec<Contact>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_contacts().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_contact(state: State<'_, AppState>, contact: Contact) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_contact(&contact).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_contact(state: State<'_, AppState>, contact: Contact) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_contact(&contact).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_contact(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_contact(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_penulis(state: State<'_, AppState>) -> Result<Vec<Penulis>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_penulis().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_penulis(state: State<'_, AppState>, penulis: Penulis) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_penulis(&penulis).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_penulis(state: State<'_, AppState>, penulis: Penulis) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_penulis(&penulis).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_penulis(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_penulis(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_penerbit(state: State<'_, AppState>) -> Result<Vec<Penerbit>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_penerbit().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_penerbit(state: State<'_, AppState>, penerbit: Penerbit) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_penerbit(&penerbit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_penerbit(state: State<'_, AppState>, penerbit: Penerbit) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_penerbit(&penerbit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_penerbit(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_penerbit(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tim(state: State<'_, AppState>) -> Result<Vec<Tim>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_all_tim().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_tim(state: State<'_, AppState>, tim: Tim) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_tim(&tim).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_tim(state: State<'_, AppState>, tim: Tim) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_tim(&tim).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_tim(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_tim(id).map_err(|e| e.to_string())
}
