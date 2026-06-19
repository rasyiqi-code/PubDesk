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
        }
    }
}
