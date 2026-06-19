pub mod schema;
pub mod models;
pub mod error;

use rusqlite::{Connection, params};
use std::path::PathBuf;
use tauri::Manager;
pub use error::DbError;
pub use models::*;

pub fn get_db_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, DbError> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| DbError::PathError)?;
    
    std::fs::create_dir_all(&app_data_dir)?;
    Ok(app_data_dir.join("pubhub.db"))
}

pub fn init_db(db_path: &PathBuf) -> Result<(), DbError> {
    let conn = Connection::open(db_path)?;
    schema::create_tables(&conn)?;
    Ok(())
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &PathBuf) -> Result<Self, DbError> {
        let conn = Connection::open(db_path)?;
        Ok(Self { conn })
    }

    // Contacts
    pub fn add_contact(&self, contact: &Contact) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO contacts (name, wa_number, address, type, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                contact.name,
                contact.wa_number,
                contact.address,
                contact.r#type,
                contact.created_at
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_contacts(&self) -> Result<Vec<Contact>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, wa_number, address, type, created_at FROM contacts")?;
        let contacts = stmt.query_map([], |row| {
            Ok(Contact {
                id: row.get(0)?,
                name: row.get(1)?,
                wa_number: row.get(2)?,
                address: row.get(3)?,
                r#type: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;
        
        let mut result = Vec::new();
        for contact in contacts {
            result.push(contact?);
        }
        Ok(result)
    }

    // Books
    pub fn add_book(&self, book: &Book) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO books (title, isbn, regular_price, po_price, weight_grams, author_id, cover_path) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                book.title,
                book.isbn,
                book.regular_price,
                book.po_price,
                book.weight_grams,
                book.author_id,
                book.cover_path
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_books(&self) -> Result<Vec<Book>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, title, isbn, regular_price, po_price, weight_grams, author_id, cover_path FROM books")?;
        let books = stmt.query_map([], |row| {
            Ok(Book {
                id: row.get(0)?,
                title: row.get(1)?,
                isbn: row.get(2)?,
                regular_price: row.get(3)?,
                po_price: row.get(4)?,
                weight_grams: row.get(5)?,
                author_id: row.get(6)?,
                cover_path: row.get(7)?,
            })
        })?;
        
        let mut result = Vec::new();
        for book in books {
            result.push(book?);
        }
        Ok(result)
    }

    pub fn delete_book(&self, id: i64) -> Result<(), DbError> {
        self.conn.execute("DELETE FROM books WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_book(&self, book: &Book) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE books SET title = ?1, isbn = ?2, regular_price = ?3, po_price = ?4, weight_grams = ?5, author_id = ?6, cover_path = ?7 WHERE id = ?8",
            params![
                book.title,
                book.isbn,
                book.regular_price,
                book.po_price,
                book.weight_grams,
                book.author_id,
                book.cover_path,
                book.id
            ]
        )?;
        Ok(())
    }

    // Invoices
    pub fn add_invoice(&self, invoice: &Invoice) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO invoices (created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                invoice.created_at,
                invoice.customer_id,
                invoice.items_json,
                invoice.shipping_cost,
                invoice.admin_fee,
                invoice.total,
                invoice.export_format,
                invoice.file_path
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_invoices(&self) -> Result<Vec<Invoice>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path FROM invoices ORDER BY created_at DESC")?;
        let invoices = stmt.query_map([], |row| {
            Ok(Invoice {
                id: row.get(0)?,
                created_at: row.get(1)?,
                customer_id: row.get(2)?,
                items_json: row.get(3)?,
                shipping_cost: row.get(4)?,
                admin_fee: row.get(5)?,
                total: row.get(6)?,
                export_format: row.get(7)?,
                file_path: row.get(8)?,
            })
        })?;
        
        let mut result = Vec::new();
        for invoice in invoices {
            result.push(invoice?);
        }
        Ok(result)
    }

    // Files
    pub fn add_file(&self, file: &File) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO files (path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                file.path,
                file.filename,
                file.r#type,
                file.project_id,
                file.status,
                file.version_label,
                file.last_modified,
                file.modified_by,
                file.is_readonly
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_files(&self) -> Result<Vec<File>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly FROM files")?;
        let files = stmt.query_map([], |row| {
            Ok(File {
                id: row.get(0)?,
                path: row.get(1)?,
                filename: row.get(2)?,
                r#type: row.get(3)?,
                project_id: row.get(4)?,
                status: row.get(5)?,
                version_label: row.get(6)?,
                last_modified: row.get(7)?,
                modified_by: row.get(8)?,
                is_readonly: row.get(9)?,
            })
        })?;
        
        let mut result = Vec::new();
        for file in files {
            result.push(file?);
        }
        Ok(result)
    }

    pub fn delete_file(&self, id: i64) -> Result<(), DbError> {
        self.conn.execute("DELETE FROM files WHERE id = ?1", params![id])?;
        Ok(())
    }
}
