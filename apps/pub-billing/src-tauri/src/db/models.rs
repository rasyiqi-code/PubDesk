#![allow(dead_code)]
use serde::{Deserialize, Serialize};
use chrono::Local;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: Option<i64>,
    pub name: String,
    pub wa_number: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub job: Option<String>,
    pub institution: Option<String>,
    pub data_source: Option<String>,
    #[serde(default)]
    pub email_valid: i32,
    #[serde(default)]
    pub wa_valid: i32,
    #[serde(default)]
    pub needs_review: i32,
    pub followup_status: Option<String>,
    pub notes: Option<String>,
    pub r#type: String,
    pub created_at: String,
    pub updated_at: Option<String>,
}

impl Default for Contact {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            wa_number: None,
            email: None,
            address: None,
            job: None,
            institution: None,
            data_source: None,
            email_valid: 0,
            wa_valid: 0,
            needs_review: 0,
            followup_status: None,
            notes: None,
            r#type: "penulis".to_string(),
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: Option<i64>,
    pub title: String,
    pub isbn: Option<String>,
    pub regular_price: f64,
    pub po_price: f64,
    pub weight_grams: i64,
    pub author_id: Option<i64>,
    pub cover_path: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

impl Default for Book {
    fn default() -> Self {
        Self {
            id: None,
            title: String::new(),
            isbn: None,
            regular_price: 0.0,
            po_price: 0.0,
            weight_grams: 0,
            author_id: None,
            cover_path: None,
            created_at: Some(Local::now().to_rfc3339()),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Project {
    pub id: Option<i64>,
    pub title: String,
    pub book_id: Option<i64>,
    pub status: String,
    pub deadline: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct File {
    pub id: Option<i64>,
    pub path: String,
    pub filename: String,
    pub r#type: String,
    pub project_id: Option<i64>,
    pub status: String,
    pub version_label: Option<String>,
    pub last_modified: String,
    pub modified_by: Option<String>,
    pub is_readonly: bool,
    pub description: Option<String>,
    pub responsible_parties: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: Option<i64>,
    pub created_at: String,
    pub customer_id: Option<i64>,
    pub items_json: String,
    pub shipping_cost: f64,
    pub admin_fee: f64,
    pub total: f64,
    pub export_format: Option<String>,
    pub file_path: Option<String>,
    pub sync_status: Option<String>,
    pub cloud_file_url: Option<String>,
    pub naskah_id: Option<i64>,
    pub payment_status: Option<String>,
    #[serde(default)]
    pub paid_amount: f64,
    #[serde(default)]
    pub remaining_amount: f64,
    pub payment_notes: Option<String>,
    pub updated_at: Option<String>,
    pub customer_snapshot: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct InvoiceItem {
    pub book_id: i64,
    pub book_title: String,
    pub quantity: i64,
    pub price: f64,
    pub discount: f64,
}

impl Default for Invoice {
    fn default() -> Self {
        Self {
            id: None,
            created_at: Local::now().to_rfc3339(),
            customer_id: None,
            items_json: "[]".to_string(),
            shipping_cost: 0.0,
            admin_fee: 0.0,
            total: 0.0,
            export_format: None,
            file_path: None,
            sync_status: Some("pending".to_string()),
            cloud_file_url: None,
            naskah_id: None,
            payment_status: Some("Draft".to_string()),
            paid_amount: 0.0,
            remaining_amount: 0.0,
            payment_notes: None,
            updated_at: None,
            customer_snapshot: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Service {
    pub id: Option<i64>,
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
    pub category: String,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

impl Default for Service {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            price: 0.0,
            description: None,
            category: "other".to_string(),
            created_at: Some(Local::now().to_rfc3339()),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct WatchFolder {
    pub id: Option<i64>,
    pub path: String,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

impl Default for WatchFolder {
    fn default() -> Self {
        Self {
            id: None,
            path: String::new(),
            created_at: Some(Local::now().to_rfc3339()),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Penulis {
    pub id: Option<i64>,
    pub name: String,
    pub email: Option<String>,
    pub wa_number: Option<String>,
    pub address: Option<String>,
    pub job: Option<String>,
    pub institution: Option<String>,
    pub data_source: Option<String>,
    pub email_valid: i32, // 0 = false, 1 = true
    pub wa_valid: i32,
    pub followup_status: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

impl Default for Penulis {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            email: None,
            wa_number: None,
            address: None,
            job: None,
            institution: None,
            data_source: None,
            email_valid: 0,
            wa_valid: 0,
            followup_status: None,
            notes: None,
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Penerbit {
    pub id: Option<i64>,
    pub name: String,
    pub instagram: Option<String>,
    pub facebook: Option<String>,
    pub email: Option<String>,
    pub wa_number: Option<String>,
    pub linkedin: Option<String>,
    pub twitter: Option<String>,
    pub tiktok: Option<String>,
    pub wa_valid: i32,
    pub email_valid: i32,
    pub cooperation_status: Option<String>,
    pub created_at: String,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub updated_at: Option<String>,
}

impl Default for Penerbit {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            instagram: None,
            facebook: None,
            email: None,
            wa_number: None,
            linkedin: None,
            twitter: None,
            tiktok: None,
            wa_valid: 0,
            email_valid: 0,
            cooperation_status: None,
            created_at: Local::now().to_rfc3339(),
            address: None,
            notes: None,
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Naskah {
    pub id: Option<i64>,
    pub naskah_id_code: Option<String>,
    pub title: String,
    pub penulis_id: Option<i64>,
    pub penerbit_id: Option<i64>,
    // Informasi naskah
    pub genre: Option<String>,
    pub total_pages: Option<i64>,
    pub synopsis: Option<String>,
    // Detail penerbitan
    pub order_type: Option<String>,
    pub copies: Option<i64>,
    pub book_size: Option<String>,
    pub legal_type: Option<String>,
    // Tim & pengiriman
    pub assigned_team_ids: Option<String>, // JSON array ID anggota tim
    pub initial_request: Option<String>,
    pub revised_request: Option<String>,
    pub shipping_address: Option<String>,
    pub store_links: Option<String>, // JSON array format: [{ platform, url }]
    pub status: String,
    pub created_at: String,
    pub updated_at: Option<String>,
}

impl Default for Naskah {
    fn default() -> Self {
        Self {
            id: None,
            naskah_id_code: None,
            title: String::new(),
            penulis_id: None,
            penerbit_id: None,
            genre: None,
            total_pages: None,
            synopsis: None,
            order_type: None,
            copies: None,
            book_size: None,
            legal_type: None,
            assigned_team_ids: None,
            initial_request: None,
            revised_request: None,
            shipping_address: None,
            store_links: None,
            status: "Belum Dimulai".to_string(),
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tim {
    pub id: Option<i64>,
    pub name: String,
    pub role: String,
    pub department: Option<String>, // Divisi/departemen tim
    pub is_active: i32,
    pub weekly_target: i64,
    pub notes: Option<String>,
    pub pin: Option<String>, // PIN login
    pub wa_number: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub app: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

impl Default for Tim {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            role: "Layouter".to_string(),
            department: None,
            is_active: 1,
            weekly_target: 0,
            notes: None,
            pin: None,
            wa_number: None,
            email: None,
            address: None,
            app: None,
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEvent {
    pub id: Option<i64>,
    pub naskah_id: i64,
    pub event_name: String,
    pub completed_date: Option<String>,
    pub pic_name: Option<String>,
    pub notes: Option<String>,
    pub proof_path_or_link: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: Option<String>,
}

impl Default for WorkflowEvent {
    fn default() -> Self {
        Self {
            id: None,
            naskah_id: 0,
            event_name: String::new(),
            completed_date: None,
            pic_name: None,
            notes: None,
            proof_path_or_link: None,
            status: "Belum Dimulai".to_string(),
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Legalitas {
    pub id: Option<i64>,
    pub naskah_id: Option<i64>,
    pub judul_buku: String,
    pub nama_penulis: String,
    pub tipe: String, // E-ISBN, ISBN, QRCBN, dll
    pub tanggal_pengajuan: Option<String>,
    pub keterangan: Option<String>,
    pub status: String,
    pub nomor_dokumen: Option<String>,
    pub tanggal_keluar: Option<String>,
    pub tanggal_revisi: Option<String>,
    pub pic_id: Option<i64>,
    pub rejection_reason: Option<String>,
    pub proof_path_or_link: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

impl Default for Legalitas {
    fn default() -> Self {
        Self {
            id: None,
            naskah_id: None,
            judul_buku: String::new(),
            nama_penulis: String::new(),
            tipe: "E-ISBN".to_string(),
            tanggal_pengajuan: None,
            keterangan: None,
            status: "Diajukan".to_string(),
            nomor_dokumen: None,
            tanggal_keluar: None,
            tanggal_revisi: None,
            pic_id: None,
            rejection_reason: None,
            proof_path_or_link: None,
            created_at: Local::now().to_rfc3339(),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    pub id: Option<i64>,
    pub entity_type: String,
    pub entity_id: Option<i64>,
    pub action: String,
    pub description: String,
    pub performed_by: Option<i64>,
    pub performed_by_name: Option<String>,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub module: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSession {
    pub id: Option<i64>,
    pub tim_id: i64,
    pub tim_name: String,
    pub tim_role: String,
    pub login_at: String,
    pub logout_at: Option<String>,
    pub is_active: i32,
    pub app: Option<String>,
}

// ==========================================
// WORKFLOW PRODUKSI NASKAH & MIGRASI EXCEL
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowTemplate {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub is_active: i32,
    pub created_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowTemplateStep {
    pub id: Option<i64>,
    pub template_id: i64,
    pub step_order: i64,
    pub step_name: String,
    pub default_role: Option<String>,
    pub default_duration_days: i64,
    pub is_required: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Option<i64>,
    pub naskah_id: i64,
    pub step_name: String,
    pub step_order: Option<i64>,
    pub assigned_team_id: Option<i64>,
    pub status: String,
    pub priority: String,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub completed_date: Option<String>,
    pub notes: Option<String>,
    pub proof_path_or_link: Option<String>,
    #[serde(default)]
    pub created_at: String,
    pub updated_at: Option<String>,
    #[serde(default)]
    pub naskah_title: Option<String>,
    #[serde(default)]
    pub pic_name: Option<String>,
    #[serde(default)]
    pub penulis_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskHistory {
    pub id: Option<i64>,
    pub task_id: i64,
    pub old_status: Option<String>,
    pub new_status: String,
    pub changed_by: Option<String>,
    pub changed_at: String,
    pub notes: Option<String>,
    pub naskah_title: Option<String>,
    pub step_name: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskBlocker {
    pub id: Option<i64>,
    pub task_id: Option<i64>,
    pub naskah_id: Option<i64>,
    pub blocker_type: String,
    pub description: Option<String>,
    pub status: String,
    pub created_at: String,
    pub resolved_at: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskApproval {
    pub id: Option<i64>,
    pub task_id: i64,
    pub approval_type: String,
    pub status: String,
    pub requested_at: String,
    pub decided_at: Option<String>,
    pub decided_by: Option<String>,
    pub notes: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NaskahFile {
    pub id: Option<i64>,
    pub naskah_id: i64,
    pub file_id: i64,
    pub file_role: String,
    pub notes: Option<String>,
    pub created_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CetakDistribusi {
    pub id: Option<i64>,
    pub naskah_id: i64,
    pub acc_cetak_date: Option<String>,
    pub naik_cetak_date: Option<String>,
    pub jumlah_cetak: Option<i64>,
    pub status_cetak: Option<String>,
    pub link_playbook: Option<String>,
    pub link_shopee: Option<String>,
    pub link_omp: Option<String>,
    pub ekspedisi: Option<String>,
    pub resi: Option<String>,
    pub tanggal_kirim: Option<String>,
    pub status_kirim: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportLog {
    pub id: Option<i64>,
    pub import_type: String,
    pub file_name: String,
    pub sheet_name: Option<String>,
    pub total_rows: i64,
    pub valid_rows: i64,
    pub invalid_rows: i64,
    pub duplicate_rows: i64,
    pub imported_rows: i64,
    pub created_at: String,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportTaskPayload {
    pub judul: String,
    pub pic: String,
    pub tanggal: String,
    pub status: String,
    pub step_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkSession {
    pub id: Option<i64>,
    pub tim_id: Option<i64>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_seconds: i64,
    pub notes: Option<String>,
    pub created_at: String,
}
