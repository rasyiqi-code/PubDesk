use serde::{Deserialize, Serialize};
use chrono::Local;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: Option<i64>,
    pub name: String,
    pub wa_number: Option<String>,
    pub address: Option<String>,
    pub r#type: String,
    pub created_at: String,
}

impl Default for Contact {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            wa_number: None,
            address: None,
            r#type: "customer".to_string(),
            created_at: Local::now().to_rfc3339(),
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
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
}

impl Default for Service {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            price: 0.0,
            description: None,
            category: "other".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct WatchFolder {
    pub id: Option<i64>,
    pub path: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Penulis {
    pub id: Option<i64>,
    pub name: String,
    pub email: Option<String>,
    pub wa_number: Option<String>,
    pub province: Option<String>,
    pub city: Option<String>,
    pub job: Option<String>,
    pub institution: Option<String>,
    pub data_source: Option<String>,
    pub email_valid: i32, // 0 = false, 1 = true
    pub wa_valid: i32,
    pub followup_status: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

impl Default for Penulis {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            email: None,
            wa_number: None,
            province: None,
            city: None,
            job: None,
            institution: None,
            data_source: None,
            email_valid: 0,
            wa_valid: 0,
            followup_status: None,
            notes: None,
            created_at: Local::now().to_rfc3339(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Penerbit {
    pub id: Option<i64>,
    pub name: String,
    pub city: Option<String>,
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
}

impl Default for Penerbit {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            city: None,
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
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NaskahOrder {
    pub id: Option<i64>,
    pub naskah_id_code: Option<String>,
    pub title: String,
    pub penulis_id: Option<i64>,
    pub penerbit_id: Option<i64>,
    pub package_type: Option<String>,
    pub order_type: Option<String>,
    pub copies: Option<i64>,
    pub book_size: Option<String>,
    pub initial_request: Option<String>,
    pub revised_request: Option<String>,
    pub legal_type: Option<String>,
    pub shipping_address: Option<String>,
    pub status: String,
    pub created_at: String,
}

impl Default for NaskahOrder {
    fn default() -> Self {
        Self {
            id: None,
            naskah_id_code: None,
            title: String::new(),
            penulis_id: None,
            penerbit_id: None,
            package_type: None,
            order_type: None,
            copies: None,
            book_size: None,
            initial_request: None,
            revised_request: None,
            legal_type: None,
            shipping_address: None,
            status: "Belum Dimulai".to_string(),
            created_at: Local::now().to_rfc3339(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layouter {
    pub id: Option<i64>,
    pub name: String,
    pub role: String,
    pub is_active: i32,
    pub weekly_target: i64,
    pub notes: Option<String>,
    pub created_at: String,
}

impl Default for Layouter {
    fn default() -> Self {
        Self {
            id: None,
            name: String::new(),
            role: "layouter".to_string(),
            is_active: 1,
            weekly_target: 0,
            notes: None,
            created_at: Local::now().to_rfc3339(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEvent {
    pub id: Option<i64>,
    pub naskah_order_id: i64,
    pub event_name: String,
    pub completed_date: Option<String>,
    pub pic_name: Option<String>,
    pub notes: Option<String>,
    pub proof_path_or_link: Option<String>,
    pub status: String,
}

impl Default for WorkflowEvent {
    fn default() -> Self {
        Self {
            id: None,
            naskah_order_id: 0,
            event_name: String::new(),
            completed_date: None,
            pic_name: None,
            notes: None,
            proof_path_or_link: None,
            status: "Belum Dimulai".to_string(),
        }
    }
}


