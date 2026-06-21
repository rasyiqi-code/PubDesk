use tauri::State;
use crate::AppState;
use crate::db::{Invoice, Service};

#[tauri::command]
pub async fn get_invoices(state: State<'_, AppState>) -> Result<Vec<Invoice>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_invoices().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_invoice(state: State<'_, AppState>, invoice: Invoice) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_invoice(&invoice).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_invoice(state: State<'_, AppState>, invoice: Invoice) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_invoice(&invoice).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_invoice(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_invoice(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_invoice_sync_status(
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
pub async fn update_sync_status(
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

#[tauri::command]
pub async fn get_services(state: State<'_, AppState>) -> Result<Vec<Service>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_services().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_service(state: State<'_, AppState>, service: Service) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.add_service(&service).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_service(state: State<'_, AppState>, service: Service) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.update_service(&service).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_service(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.delete_service(id).map_err(|e| e.to_string())
}
