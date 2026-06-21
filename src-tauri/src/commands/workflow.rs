use tauri::State;
use crate::AppState;
use crate::db::{Naskah, Legalitas, Task, WorkflowTemplate, TaskHistory, TaskBlocker, TaskApproval, ImportTaskPayload};


#[tauri::command]
pub async fn get_naskah(state: State<'_, AppState>) -> Result<Vec<Naskah>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_naskah().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_naskah(state: State<'_, AppState>, order: Naskah) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_naskah(&order).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_naskah(state: State<'_, AppState>, order: Naskah) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_naskah(&order).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_naskah(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_naskah(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_legalitas(state: State<'_, AppState>) -> Result<Vec<Legalitas>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_legalitas().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_legalitas(state: State<'_, AppState>, legalitas: Legalitas) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_legalitas(&legalitas).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_legalitas(state: State<'_, AppState>, legalitas: Legalitas) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_legalitas(&legalitas).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_legalitas(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_legalitas(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_task(state: State<'_, AppState>, task: Task) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(state: State<'_, AppState>, task: Task) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.delete_task(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_workflow_templates(state: State<'_, AppState>) -> Result<Vec<WorkflowTemplate>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_workflow_templates().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_workflow_template(state: State<'_, AppState>, template: WorkflowTemplate) -> Result<i64, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_workflow_template(&template).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_task_history(state: State<'_, AppState>, history: TaskHistory) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_task_history(&history).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_history(state: State<'_, AppState>, task_id: i64) -> Result<Vec<TaskHistory>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_task_history(task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_task_history(state: State<'_, AppState>) -> Result<Vec<TaskHistory>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_all_task_history().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_status(state: State<'_, AppState>, task_id: i64, new_status: String, notes: Option<String>, proof_path_or_link: Option<String>) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.update_task_status(task_id, &new_status, notes.as_deref(), proof_path_or_link.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_blockers(state: State<'_, AppState>, task_id: Option<i64>) -> Result<Vec<TaskBlocker>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_task_blockers(task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_task_blocker(state: State<'_, AppState>, blocker: TaskBlocker) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.add_task_blocker(&blocker).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resolve_task_blocker(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.resolve_task_blocker(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_approvals(state: State<'_, AppState>, task_id: Option<i64>) -> Result<Vec<TaskApproval>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.get_task_approvals(task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn request_approval(state: State<'_, AppState>, approval: TaskApproval) -> Result<i64, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.request_approval(&approval).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn decide_approval(state: State<'_, AppState>, id: i64, status: String, notes: Option<String>, decided_by: Option<String>) -> Result<(), String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database".to_string())?;
    let db = db.as_ref().ok_or("Database tidak diinisialisasi")?;
    db.decide_approval(id, &status, notes.as_deref(), decided_by.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_alur_naskah_batch(state: State<'_, AppState>, payloads: Vec<ImportTaskPayload>) -> Result<usize, String> {
    let mut db = state.db.lock().unwrap();
    let db = db.as_mut().ok_or("Database tidak diinisialisasi")?;
    db.import_alur_naskah_batch(payloads).map_err(|e| e.to_string())
}
