pub mod error;
pub mod models;
pub mod sample_data;
pub mod schema;
pub mod workflow;

// Modul database SQLite untuk aplikasi PubDesk
pub use error::DbError;
pub use models::*;
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::Manager;

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
    
    // Sinkronisasi data pelanggan dari invoice lama ke tabel contacts jika contacts kosong
    let _ = sync_contacts_from_invoices(&conn);
    
    Ok(())
}

pub struct Database {
    pub(crate) conn: Connection,
}

impl Database {
    pub fn new(db_path: &PathBuf) -> Result<Self, DbError> {
        let conn = Connection::open(db_path)?;
        Ok(Self { conn })
    }

    // Contacts (unified — sebelumnya terpisah contacts + penulis)
    pub fn add_contact(&self, contact: &Contact) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO contacts (name, wa_number, email, address, province, city, job, institution, data_source, email_valid, wa_valid, followup_status, notes, type, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            params![
                contact.name,
                contact.wa_number,
                contact.email,
                contact.address,
                contact.province,
                contact.city,
                contact.job,
                contact.institution,
                contact.data_source,
                contact.email_valid,
                contact.wa_valid,
                contact.followup_status,
                contact.notes,
                contact.r#type,
                contact.created_at,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("contact", Some(id), "CREATE", &format!("Menambahkan kontak '{}'", contact.name))?;
        Ok(id)
    }

    pub fn get_contacts(&self) -> Result<Vec<Contact>, DbError> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, wa_number, email, address, province, city, job, institution, data_source, email_valid, wa_valid, followup_status, notes, type, created_at, updated_at FROM contacts")?;
        let contacts = stmt.query_map([], |row| {
            Ok(Contact {
                id: row.get(0)?,
                name: row.get(1)?,
                wa_number: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                province: row.get(5)?,
                city: row.get(6)?,
                job: row.get(7)?,
                institution: row.get(8)?,
                data_source: row.get(9)?,
                email_valid: row.get(10)?,
                wa_valid: row.get(11)?,
                followup_status: row.get(12)?,
                notes: row.get(13)?,
                r#type: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })?;

        let mut result = Vec::new();
        for contact in contacts {
            result.push(contact?);
        }
        Ok(result)
    }

    pub fn update_contact(&self, contact: &Contact) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE contacts SET name = ?1, wa_number = ?2, email = ?3, address = ?4, province = ?5, city = ?6, job = ?7, institution = ?8, data_source = ?9, email_valid = ?10, wa_valid = ?11, followup_status = ?12, notes = ?13, type = ?14, updated_at = ?15 WHERE id = ?16",
            params![
                contact.name,
                contact.wa_number,
                contact.email,
                contact.address,
                contact.province,
                contact.city,
                contact.job,
                contact.institution,
                contact.data_source,
                contact.email_valid,
                contact.wa_valid,
                contact.followup_status,
                contact.notes,
                contact.r#type,
                now,
                contact.id
            ],
        )?;
        self.log_activity("contact", contact.id, "UPDATE", &format!("Memperbarui kontak '{}'", contact.name))?;
        Ok(())
    }

    pub fn delete_contact(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM contacts WHERE id = ?1", params![id])?;
        self.log_activity("contact", Some(id), "DELETE", &format!("Menghapus kontak id={}", id))?;
        Ok(())
    }

    // Books
    pub fn add_book(&self, book: &Book) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO books (title, isbn, regular_price, po_price, weight_grams, author_id, cover_path, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                book.title,
                book.isbn,
                book.regular_price,
                book.po_price,
                book.weight_grams,
                book.author_id,
                book.cover_path,
                now,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("book", Some(id), "CREATE", &format!("Menambahkan buku '{}'", book.title))?;
        Ok(id)
    }

    pub fn get_books(&self) -> Result<Vec<Book>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, title, isbn, regular_price, po_price, weight_grams, author_id, cover_path, created_at, updated_at FROM books")?;
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
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut result = Vec::new();
        for book in books {
            result.push(book?);
        }
        Ok(result)
    }

    pub fn delete_book(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM books WHERE id = ?1", params![id])?;
        self.log_activity("book", Some(id), "DELETE", &format!("Menghapus buku id={}", id))?;
        Ok(())
    }

    pub fn update_book(&self, book: &Book) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE books SET title = ?1, isbn = ?2, regular_price = ?3, po_price = ?4, weight_grams = ?5, author_id = ?6, cover_path = ?7, updated_at = ?8 WHERE id = ?9",
            params![
                book.title,
                book.isbn,
                book.regular_price,
                book.po_price,
                book.weight_grams,
                book.author_id,
                book.cover_path,
                now,
                book.id
            ]
        )?;
        self.log_activity("book", book.id, "UPDATE", &format!("Memperbarui buku '{}'", book.title))?;
        Ok(())
    }

    // Invoices
    pub fn add_invoice(&self, invoice: &Invoice) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO invoices (created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, sync_status, cloud_file_url, naskah_id, payment_status, paid_amount, remaining_amount, payment_notes, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            params![
                invoice.created_at,
                invoice.customer_id,
                invoice.items_json,
                invoice.shipping_cost,
                invoice.admin_fee,
                invoice.total,
                invoice.export_format,
                invoice.file_path,
                invoice.sync_status.as_deref().unwrap_or("pending"),
                invoice.cloud_file_url,
                invoice.naskah_id,
                invoice.payment_status.as_deref().unwrap_or("Draft"),
                invoice.paid_amount,
                invoice.remaining_amount,
                invoice.payment_notes,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("invoice", Some(id), "CREATE", &format!("Membuat invoice total={}", invoice.total))?;
        Ok(id)
    }

    pub fn get_invoices(&self) -> Result<Vec<Invoice>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, sync_status, cloud_file_url, naskah_id, payment_status, paid_amount, remaining_amount, payment_notes, updated_at FROM invoices ORDER BY created_at DESC")?;
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
                sync_status: row.get(9)?,
                cloud_file_url: row.get(10)?,
                naskah_id: row.get(11)?,
                payment_status: row.get(12)?,
                paid_amount: row.get(13)?,
                remaining_amount: row.get(14)?,
                payment_notes: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })?;

        let mut result = Vec::new();
        for invoice in invoices {
            result.push(invoice?);
        }
        Ok(result)
    }

    pub fn update_invoice_sync_status(
        &self,
        id: i64,
        sync_status: &str,
        cloud_file_url: &str,
    ) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE invoices SET sync_status = ?1, cloud_file_url = ?2, updated_at = ?3 WHERE id = ?4",
            params![sync_status, cloud_file_url, now, id],
        )?;
        self.log_activity("invoice", Some(id), "UPDATE", "Memperbarui status sinkronisasi invoice")?;
        Ok(())
    }

    pub fn update_sync_status(
        &self,
        table_name: &str,
        id: i64,
        sync_status: &str,
        cloud_file_url: Option<&str>,
    ) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        
        let allowed_tables = [
            "contacts", "books", "projects", "files", "tags", 
            "services", "penerbit", "naskah", "tim", "tasks", "legalitas", "invoices"
        ];
        if !allowed_tables.contains(&table_name) {
            return Err(DbError::Other(format!("Table '{}' not allowed for sync", table_name)));
        }

        if table_name == "books" || table_name == "legalitas" || table_name == "tasks" || table_name == "invoices" {
            let file_url = cloud_file_url.unwrap_or("");
            let query = format!(
                "UPDATE {} SET sync_status = ?1, cloud_file_url = ?2, updated_at = ?3 WHERE id = ?4",
                table_name
            );
            self.conn.execute(&query, params![sync_status, file_url, now, id])?;
        } else {
            let query = format!(
                "UPDATE {} SET sync_status = ?1, updated_at = ?2 WHERE id = ?3",
                table_name
            );
            self.conn.execute(&query, params![sync_status, now, id])?;
        }

        self.log_activity(table_name, Some(id), "UPDATE", &format!("Memperbarui status sinkronisasi cloud ke '{}'", sync_status))?;
        Ok(())
    }

    pub fn update_invoice(&self, invoice: &Invoice) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE invoices SET customer_id = ?1, items_json = ?2, shipping_cost = ?3, admin_fee = ?4, total = ?5, export_format = ?6, file_path = ?7, sync_status = ?8, cloud_file_url = ?9, naskah_id = ?10, payment_status = ?11, paid_amount = ?12, remaining_amount = ?13, payment_notes = ?14, updated_at = ?15 WHERE id = ?16",
            params![
                invoice.customer_id,
                invoice.items_json,
                invoice.shipping_cost,
                invoice.admin_fee,
                invoice.total,
                invoice.export_format,
                invoice.file_path,
                invoice.sync_status.as_deref().unwrap_or("pending"),
                invoice.cloud_file_url,
                invoice.naskah_id,
                invoice.payment_status.as_deref().unwrap_or("Draft"),
                invoice.paid_amount,
                invoice.remaining_amount,
                invoice.payment_notes,
                now,
                invoice.id
            ]
        )?;
        self.log_activity("invoice", invoice.id, "UPDATE", &format!("Memperbarui invoice total={}", invoice.total))?;
        Ok(())
    }

    pub fn delete_invoice(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM invoices WHERE id = ?1", params![id])?;
        self.log_activity("invoice", Some(id), "DELETE", &format!("Menghapus invoice id={}", id))?;
        Ok(())
    }

    // Files
    pub fn add_file(&self, file: &File) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO files (path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly, description, responsible_parties, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                file.path,
                file.filename,
                file.r#type,
                file.project_id,
                file.status,
                file.version_label,
                file.last_modified,
                file.modified_by,
                file.is_readonly,
                file.description,
                file.responsible_parties,
                now,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("file", Some(id), "CREATE", &format!("Menambahkan file '{}'", file.filename))?;
        Ok(id)
    }

    pub fn get_files(&self) -> Result<Vec<File>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly, description, responsible_parties, created_at, updated_at FROM files")?;
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
                description: row.get(10)?,
                responsible_parties: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;

        let mut result = Vec::new();
        for file in files {
            result.push(file?);
        }
        Ok(result)
    }

    pub fn delete_file(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM files WHERE id = ?1", params![id])?;
        self.log_activity("file", Some(id), "DELETE", &format!("Menghapus file id={}", id))?;
        Ok(())
    }

    pub fn update_file(&self, file: &File) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE files SET filename = ?1, type = ?2, project_id = ?3, status = ?4, version_label = ?5, last_modified = ?6, modified_by = ?7, is_readonly = ?8, description = ?9, responsible_parties = ?10, updated_at = ?11 WHERE path = ?12",
            params![
                file.filename,
                file.r#type,
                file.project_id,
                file.status,
                file.version_label,
                file.last_modified,
                file.modified_by,
                file.is_readonly,
                file.description,
                file.responsible_parties,
                now,
                file.path
            ]
        )?;
        self.log_activity("file", file.id, "UPDATE", &format!("Memperbarui file '{}'", file.filename))?;
        Ok(())
    }

    // Services CRUD
    pub fn add_service(&self, service: &Service) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO services (name, price, description, category, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                service.name,
                service.price,
                service.description,
                service.category,
                now,
                now
            ],
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("service", Some(id), "CREATE", &format!("Menambahkan layanan '{}'", service.name))?;
        Ok(id)
    }

    pub fn get_services(&self) -> Result<Vec<Service>, DbError> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, price, description, category, created_at, updated_at FROM services")?;
        let services = stmt.query_map([], |row| {
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                price: row.get(2)?,
                description: row.get(3)?,
                category: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut result = Vec::new();
        for service in services {
            result.push(service?);
        }
        Ok(result)
    }

    pub fn update_service(&self, service: &Service) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE services SET name = ?1, price = ?2, description = ?3, category = ?4, updated_at = ?5 WHERE id = ?6",
            params![
                service.name,
                service.price,
                service.description,
                service.category,
                now,
                service.id
            ]
        )?;
        self.log_activity("service", service.id, "UPDATE", &format!("Memperbarui layanan '{}'", service.name))?;
        Ok(())
    }

    pub fn delete_service(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM services WHERE id = ?1", params![id])?;
        self.log_activity("service", Some(id), "DELETE", &format!("Menghapus layanan id={}", id))?;
        Ok(())
    }

    // Watch Folders
    #[allow(dead_code)]
    pub fn add_watch_folder(&self, path: &str) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO watch_folders (path, created_at, updated_at) VALUES (?1, ?2, ?3)",
            params![path, now, now],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    #[allow(dead_code)]
    pub fn get_watch_folders(&self) -> Result<Vec<WatchFolder>, DbError> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, path, created_at, updated_at FROM watch_folders")?;
        let folders = stmt.query_map([], |row| {
            Ok(WatchFolder {
                id: row.get(0)?,
                path: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })?;

        let mut result = Vec::new();
        for folder in folders {
            result.push(folder?);
        }
        Ok(result)
    }

    #[allow(dead_code)]
    pub fn delete_watch_folder(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM watch_folders WHERE id = ?1", params![id])?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn delete_files_by_prefix(&self, prefix: &str) -> Result<(), DbError> {
        self.conn.execute(
            "DELETE FROM files WHERE path LIKE ?1",
            params![format!("{}%", prefix)],
        )?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn get_file_by_path(&self, path: &str) -> Result<Option<File>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly, description, responsible_parties, created_at, updated_at FROM files WHERE path = ?1")?;
        let mut rows = stmt.query(params![path])?;
        if let Some(row) = rows.next()? {
            Ok(Some(File {
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
                description: row.get(10)?,
                responsible_parties: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            }))
        } else {
            Ok(None)
        }
    }

    #[allow(dead_code)]
    pub fn delete_file_by_path(&self, path: &str) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM files WHERE path = ?1", params![path])?;
        Ok(())
    }

    // Tags Management
    #[allow(dead_code)]
    pub fn add_file_tag(&self, file_id: i64, tag: &str) -> Result<(), DbError> {
        self.conn.execute(
            "INSERT OR IGNORE INTO tags (name) VALUES (?1)",
            params![tag],
        )?;

        let tag_id: i64 =
            self.conn
                .query_row("SELECT id FROM tags WHERE name = ?1", params![tag], |row| {
                    row.get(0)
                })?;

        self.conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_id, tag_id],
        )?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn remove_file_tag(&self, file_id: i64, tag: &str) -> Result<(), DbError> {
        let tag_id_res =
            self.conn
                .query_row("SELECT id FROM tags WHERE name = ?1", params![tag], |row| {
                    row.get::<_, i64>(0)
                });
        if let Ok(tag_id) = tag_id_res {
            self.conn.execute(
                "DELETE FROM file_tags WHERE file_id = ?1 AND tag_id = ?2",
                params![file_id, tag_id],
            )?;
        }
        Ok(())
    }

    #[allow(dead_code)]
    pub fn get_file_tags(&self, file_id: i64) -> Result<Vec<String>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT t.name FROM tags t 
             JOIN file_tags ft ON t.id = ft.tag_id 
             WHERE ft.file_id = ?1",
        )?;
        let rows = stmt.query_map(params![file_id], |row| row.get(0))?;
        let mut tags = Vec::new();
        for r in rows {
            tags.push(r?);
        }
        Ok(tags)
    }

    #[allow(dead_code)]
    pub fn get_all_tags(&self) -> Result<Vec<String>, DbError> {
        let mut stmt = self
            .conn
            .prepare("SELECT name FROM tags ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| row.get(0))?;
        let mut tags = Vec::new();
        for r in rows {
            tags.push(r?);
        }
        Ok(tags)
    }

    #[allow(dead_code)]
    pub fn get_all_file_tags(
        &self,
    ) -> Result<std::collections::HashMap<i64, Vec<String>>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT ft.file_id, t.name FROM file_tags ft 
             JOIN tags t ON ft.tag_id = t.id",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
        })?;

        let mut map = std::collections::HashMap::new();
        for r in rows {
            let (file_id, tag_name) = r?;
            map.entry(file_id).or_insert_with(Vec::new).push(tag_name);
        }
        Ok(map)
    }

    // Penulis CRUD
    pub fn add_penulis(&self, p: &Penulis) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO contacts (name, email, wa_number, province, city, address, job, institution, data_source, email_valid, wa_valid, followup_status, notes, type, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'penulis', ?14, ?15)",
            params![
                p.name, p.email, p.wa_number, p.province, p.city, p.address, p.job, p.institution,
                p.data_source, p.email_valid, p.wa_valid, p.followup_status, p.notes, p.created_at, now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("contact", Some(id), "CREATE", &format!("Menambahkan penulis '{}'", p.name))?;
        Ok(id)
    }

    pub fn get_penulis(&self) -> Result<Vec<Penulis>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, email, wa_number, province, city, address, job, institution, data_source, email_valid, wa_valid, followup_status, notes, created_at, updated_at FROM contacts WHERE type IN ('penulis','both') ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Penulis {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                wa_number: row.get(3)?,
                province: row.get(4)?,
                city: row.get(5)?,
                address: row.get(6)?,
                job: row.get(7)?,
                institution: row.get(8)?,
                data_source: row.get(9)?,
                email_valid: row.get(10)?,
                wa_valid: row.get(11)?,
                followup_status: row.get(12)?,
                notes: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_penulis(&self, p: &Penulis) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE contacts SET name = ?1, email = ?2, wa_number = ?3, province = ?4, city = ?5, address = ?6, job = ?7, institution = ?8, data_source = ?9, email_valid = ?10, wa_valid = ?11, followup_status = ?12, notes = ?13, updated_at = ?14 WHERE id = ?15",
            params![
                p.name, p.email, p.wa_number, p.province, p.city, p.address, p.job, p.institution,
                p.data_source, p.email_valid, p.wa_valid, p.followup_status, p.notes, now, p.id
            ]
        )?;
        self.log_activity("contact", p.id, "UPDATE", &format!("Memperbarui penulis '{}'", p.name))?;
        Ok(())
    }

    pub fn delete_penulis(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM contacts WHERE id = ?1", params![id])?;
        self.log_activity("contact", Some(id), "DELETE", &format!("Menghapus penulis id={}", id))?;
        Ok(())
    }

    // Penerbit CRUD
    pub fn add_penerbit(&self, p: &Penerbit) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO penerbit (name, city, instagram, facebook, email, wa_number, linkedin, twitter, tiktok, wa_valid, email_valid, cooperation_status, created_at, address, notes, province, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
            params![
                p.name,
                p.city,
                p.instagram,
                p.facebook,
                p.email,
                p.wa_number,
                p.linkedin,
                p.twitter,
                p.tiktok,
                p.wa_valid,
                p.email_valid,
                p.cooperation_status,
                p.created_at,
                p.address,
                p.notes,
                p.province,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("penerbit", Some(id), "CREATE", &format!("Menambahkan penerbit '{}'", p.name))?;
        Ok(id)
    }

    pub fn get_penerbit(&self) -> Result<Vec<Penerbit>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, city, instagram, facebook, email, wa_number, linkedin, twitter, tiktok, wa_valid, email_valid, cooperation_status, created_at, address, notes, province, updated_at FROM penerbit ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Penerbit {
                id: row.get(0)?,
                name: row.get(1)?,
                city: row.get(2)?,
                instagram: row.get(3)?,
                facebook: row.get(4)?,
                email: row.get(5)?,
                wa_number: row.get(6)?,
                linkedin: row.get(7)?,
                twitter: row.get(8)?,
                tiktok: row.get(9)?,
                wa_valid: row.get(10)?,
                email_valid: row.get(11)?,
                cooperation_status: row.get(12)?,
                created_at: row.get(13)?,
                address: row.get(14)?,
                notes: row.get(15)?,
                province: row.get(16)?,
                updated_at: row.get(17)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_penerbit(&self, p: &Penerbit) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE penerbit SET name = ?1, city = ?2, instagram = ?3, facebook = ?4, email = ?5, wa_number = ?6, linkedin = ?7, twitter = ?8, tiktok = ?9, wa_valid = ?10, email_valid = ?11, cooperation_status = ?12, address = ?13, notes = ?14, province = ?15, updated_at = ?16 WHERE id = ?17",
            params![
                p.name,
                p.city,
                p.instagram,
                p.facebook,
                p.email,
                p.wa_number,
                p.linkedin,
                p.twitter,
                p.tiktok,
                p.wa_valid,
                p.email_valid,
                p.cooperation_status,
                p.address,
                p.notes,
                p.province,
                now,
                p.id
            ]
        )?;
        self.log_activity("penerbit", p.id, "UPDATE", &format!("Memperbarui penerbit '{}'", p.name))?;
        Ok(())
    }

    pub fn delete_penerbit(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM penerbit WHERE id = ?1", params![id])?;
        self.log_activity("penerbit", Some(id), "DELETE", &format!("Menghapus penerbit id={}", id))?;
        Ok(())
    }

    // Naskah CRUD
    pub fn add_naskah(&self, n: &Naskah) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO naskah (naskah_id_code, title, penulis_id, penerbit_id, genre, total_pages, synopsis, order_type, copies, book_size, legal_type, assigned_team_ids, initial_request, revised_request, shipping_address, store_links, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                n.naskah_id_code,
                n.title,
                n.penulis_id,
                n.penerbit_id,
                n.genre,
                n.total_pages,
                n.synopsis,
                n.order_type,
                n.copies,
                n.book_size,
                n.legal_type,
                n.assigned_team_ids,
                n.initial_request,
                n.revised_request,
                n.shipping_address,
                n.store_links,
                n.status,
                n.created_at,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("naskah", Some(id), "CREATE", &format!("Menambahkan naskah '{}'", n.title))?;
        Ok(id)
    }

    pub fn get_naskah(&self) -> Result<Vec<Naskah>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, naskah_id_code, title, penulis_id, penerbit_id, genre, total_pages, synopsis, order_type, copies, book_size, legal_type, assigned_team_ids, initial_request, revised_request, shipping_address, store_links, status, created_at, updated_at FROM naskah ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Naskah {
                id: row.get(0)?,
                naskah_id_code: row.get(1)?,
                title: row.get(2)?,
                penulis_id: row.get(3)?,
                penerbit_id: row.get(4)?,
                genre: row.get(5)?,
                total_pages: row.get(6)?,
                synopsis: row.get(7)?,
                order_type: row.get(8)?,
                copies: row.get(9)?,
                book_size: row.get(10)?,
                legal_type: row.get(11)?,
                assigned_team_ids: row.get(12)?,
                initial_request: row.get(13)?,
                revised_request: row.get(14)?,
                shipping_address: row.get(15)?,
                store_links: row.get(16)?,
                status: row.get(17)?,
                created_at: row.get(18)?,
                updated_at: row.get(19)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_naskah(&self, n: &Naskah) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE naskah SET naskah_id_code = ?1, title = ?2, penulis_id = ?3, penerbit_id = ?4, genre = ?5, total_pages = ?6, synopsis = ?7, order_type = ?8, copies = ?9, book_size = ?10, legal_type = ?11, assigned_team_ids = ?12, initial_request = ?13, revised_request = ?14, shipping_address = ?15, store_links = ?16, status = ?17, updated_at = ?18 WHERE id = ?19",
            params![
                n.naskah_id_code,
                n.title,
                n.penulis_id,
                n.penerbit_id,
                n.genre,
                n.total_pages,
                n.synopsis,
                n.order_type,
                n.copies,
                n.book_size,
                n.legal_type,
                n.assigned_team_ids,
                n.initial_request,
                n.revised_request,
                n.shipping_address,
                n.store_links,
                n.status,
                now,
                n.id
            ]
        )?;
        self.log_activity("naskah", n.id, "UPDATE", &format!("Memperbarui naskah '{}'", n.title))?;
        Ok(())
    }

    pub fn delete_naskah(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM naskah WHERE id = ?1", params![id])?;
        self.log_activity("naskah", Some(id), "DELETE", &format!("Menghapus naskah id={}", id))?;
        Ok(())
    }

    // Tim CRUD
    pub fn add_tim(&self, l: &Tim) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                l.name,
                l.role,
                l.department,
                l.is_active,
                l.weekly_target,
                l.notes,
                l.created_at,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("tim", Some(id), "CREATE", &format!("Menambahkan anggota tim '{}'", l.name))?;
        Ok(id)
    }

    pub fn get_all_tim(&self) -> Result<Vec<Tim>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, role, department, is_active, weekly_target, notes, created_at, updated_at FROM tim ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Tim {
                id: row.get(0)?,
                name: row.get(1)?,
                role: row.get(2)?,
                department: row.get(3)?,
                is_active: row.get(4)?,
                weekly_target: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_tim(&self, l: &Tim) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE tim SET name = ?1, role = ?2, department = ?3, is_active = ?4, weekly_target = ?5, notes = ?6, updated_at = ?7 WHERE id = ?8",
            params![
                l.name,
                l.role,
                l.department,
                l.is_active,
                l.weekly_target,
                l.notes,
                now,
                l.id
            ]
        )?;
        self.log_activity("tim", l.id, "UPDATE", &format!("Memperbarui anggota tim '{}'", l.name))?;
        Ok(())
    }

    pub fn delete_tim(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM tim WHERE id = ?1", params![id])?;
        self.log_activity("tim", Some(id), "DELETE", &format!("Menghapus anggota tim id={}", id))?;
        Ok(())
    }

    // WorkflowEvents CRUD
    pub fn add_workflow_event(&self, e: &WorkflowEvent) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO workflow_events (naskah_id, event_name, completed_date, pic_name, notes, proof_path_or_link, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                e.naskah_id,
                e.event_name,
                e.completed_date,
                e.pic_name,
                e.notes,
                e.proof_path_or_link,
                e.status,
                now,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("workflow_event", Some(id), "CREATE", &format!("Menambahkan event '{}'", e.event_name))?;
        Ok(id)
    }

    pub fn get_workflow_events(&self, naskah_id: i64) -> Result<Vec<WorkflowEvent>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, naskah_id, event_name, completed_date, pic_name, notes, proof_path_or_link, status, created_at, updated_at FROM workflow_events WHERE naskah_id = ?1 ORDER BY id ASC")?;
        let rows = stmt.query_map(params![naskah_id], |row| {
            Ok(WorkflowEvent {
                id: row.get(0)?,
                naskah_id: row.get(1)?,
                event_name: row.get(2)?,
                completed_date: row.get(3)?,
                pic_name: row.get(4)?,
                notes: row.get(5)?,
                proof_path_or_link: row.get(6)?,
                status: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_workflow_event(&self, e: &WorkflowEvent) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE workflow_events SET completed_date = ?1, pic_name = ?2, notes = ?3, proof_path_or_link = ?4, status = ?5, updated_at = ?6 WHERE id = ?7",
            params![
                e.completed_date,
                e.pic_name,
                e.notes,
                e.proof_path_or_link,
                e.status,
                now,
                e.id
            ]
        )?;
        self.log_activity("workflow_event", e.id, "UPDATE", &format!("Memperbarui event '{}'", e.event_name))?;
        Ok(())
    }

    // Legalitas CRUD
    pub fn add_legalitas(&self, l: &Legalitas) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO legalitas (naskah_id, judul_buku, nama_penulis, tipe, tanggal_pengajuan, keterangan, status, nomor_dokumen, tanggal_keluar, tanggal_revisi, pic_id, rejection_reason, proof_path_or_link, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                l.naskah_id,
                l.judul_buku,
                l.nama_penulis,
                l.tipe,
                l.tanggal_pengajuan,
                l.keterangan,
                l.status,
                l.nomor_dokumen,
                l.tanggal_keluar,
                l.tanggal_revisi,
                l.pic_id,
                l.rejection_reason,
                l.proof_path_or_link,
                l.created_at,
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("legalitas", Some(id), "CREATE", &format!("Menambahkan legalitas '{}'", l.judul_buku))?;
        Ok(id)
    }

    pub fn get_legalitas(&self) -> Result<Vec<Legalitas>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, naskah_id, judul_buku, nama_penulis, tipe, tanggal_pengajuan, keterangan, status, nomor_dokumen, tanggal_keluar, tanggal_revisi, pic_id, rejection_reason, proof_path_or_link, created_at, updated_at FROM legalitas ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Legalitas {
                id: row.get(0)?,
                naskah_id: row.get(1)?,
                judul_buku: row.get(2)?,
                nama_penulis: row.get(3)?,
                tipe: row.get(4)?,
                tanggal_pengajuan: row.get(5)?,
                keterangan: row.get(6)?,
                status: row.get(7)?,
                nomor_dokumen: row.get(8)?,
                tanggal_keluar: row.get(9)?,
                tanggal_revisi: row.get(10)?,
                pic_id: row.get(11)?,
                rejection_reason: row.get(12)?,
                proof_path_or_link: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_legalitas(&self, l: &Legalitas) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE legalitas SET naskah_id = ?1, judul_buku = ?2, nama_penulis = ?3, tipe = ?4, tanggal_pengajuan = ?5, keterangan = ?6, status = ?7, nomor_dokumen = ?8, tanggal_keluar = ?9, tanggal_revisi = ?10, pic_id = ?11, rejection_reason = ?12, proof_path_or_link = ?13, updated_at = ?14 WHERE id = ?15",
            params![
                l.naskah_id,
                l.judul_buku,
                l.nama_penulis,
                l.tipe,
                l.tanggal_pengajuan,
                l.keterangan,
                l.status,
                l.nomor_dokumen,
                l.tanggal_keluar,
                l.tanggal_revisi,
                l.pic_id,
                l.rejection_reason,
                l.proof_path_or_link,
                now,
                l.id
            ]
        )?;
        self.log_activity("legalitas", l.id, "UPDATE", &format!("Memperbarui legalitas '{}'", l.judul_buku))?;
        Ok(())
    }

    pub fn delete_legalitas(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM legalitas WHERE id = ?1", params![id])?;
        self.log_activity("legalitas", Some(id), "DELETE", &format!("Menghapus legalitas id={}", id))?;
        Ok(())
    }

    // Activity Log helper — mendukung audit trail karyawan
    pub fn log_activity(
        &self,
        entity_type: &str,
        entity_id: Option<i64>,
        action: &str,
        description: &str,
    ) -> Result<(), DbError> {
        self.log_activity_audit(entity_type, entity_id, action, description, None, None, None, None, None)
    }

    pub fn log_activity_audit(
        &self,
        entity_type: &str,
        entity_id: Option<i64>,
        action: &str,
        description: &str,
        performed_by: Option<i64>,
        performed_by_name: Option<&str>,
        old_value: Option<&str>,
        new_value: Option<&str>,
        module: Option<&str>,
    ) -> Result<(), DbError> {
        let created_at = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO activity_log (entity_type, entity_id, action, description, performed_by, performed_by_name, old_value, new_value, module, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![entity_type, entity_id, action, description, performed_by, performed_by_name, old_value, new_value, module, created_at],
        )?;
        Ok(())
    }

    pub fn get_activity_log(&self, limit: i64) -> Result<Vec<ActivityLog>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, entity_type, entity_id, action, description, performed_by, performed_by_name, old_value, new_value, module, created_at FROM activity_log ORDER BY created_at DESC LIMIT ?1"
        )?;
        let rows = stmt.query_map(params![limit], |row| {
            Ok(ActivityLog {
                id: row.get(0)?,
                entity_type: row.get(1)?,
                entity_id: row.get(2)?,
                action: row.get(3)?,
                description: row.get(4)?,
                performed_by: row.get(5)?,
                performed_by_name: row.get(6)?,
                old_value: row.get(7)?,
                new_value: row.get(8)?,
                module: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;
        
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn get_activity_log_filtered(
        &self,
        limit: i64,
        performed_by: Option<i64>,
        entity_type: Option<&str>,
        action: Option<&str>,
    ) -> Result<Vec<ActivityLog>, DbError> {
        let mut conditions: Vec<String> = Vec::new();
        if performed_by.is_some() { conditions.push("performed_by = ?2".to_string()); }
        if entity_type.is_some() { conditions.push("entity_type = ?3".to_string()); }
        if action.is_some() { conditions.push("action = ?4".to_string()); }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        let sql = format!(
            "SELECT id, entity_type, entity_id, action, description, performed_by, performed_by_name, old_value, new_value, module, created_at FROM activity_log {} ORDER BY created_at DESC LIMIT ?1",
            where_clause
        );

        let mut stmt = self.conn.prepare(&sql)?;
        let rows = stmt.query_map(
            params![limit, performed_by, entity_type, action],
            |row| {
                Ok(ActivityLog {
                    id: row.get(0)?,
                    entity_type: row.get(1)?,
                    entity_id: row.get(2)?,
                    action: row.get(3)?,
                    description: row.get(4)?,
                    performed_by: row.get(5)?,
                    performed_by_name: row.get(6)?,
                    old_value: row.get(7)?,
                    new_value: row.get(8)?,
                    module: row.get(9)?,
                    created_at: row.get(10)?,
                })
            },
        )?;

        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    // Auth session management — login/logout karyawan lokal
    pub fn login_session(&self, tim_id: i64, tim_name: &str, tim_role: &str) -> Result<AppSession, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        // Nonaktifkan sesi sebelumnya
        self.conn.execute(
            "UPDATE app_sessions SET is_active = 0, logout_at = ?1 WHERE is_active = 1",
            params![now],
        )?;
        // Buat sesi baru
        self.conn.execute(
            "INSERT INTO app_sessions (tim_id, tim_name, tim_role, login_at, is_active) VALUES (?1, ?2, ?3, ?4, 1)",
            params![tim_id, tim_name, tim_role, now],
        )?;
        let id = self.conn.last_insert_rowid();
        Ok(AppSession {
            id: Some(id),
            tim_id,
            tim_name: tim_name.to_string(),
            tim_role: tim_role.to_string(),
            login_at: now,
            logout_at: None,
            is_active: 1,
        })
    }

    pub fn logout_session(&self) -> Result<(), DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "UPDATE app_sessions SET is_active = 0, logout_at = ?1 WHERE is_active = 1",
            params![now],
        )?;
        Ok(())
    }

    pub fn get_active_session(&self) -> Result<Option<AppSession>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, tim_id, tim_name, tim_role, login_at, logout_at, is_active FROM app_sessions WHERE is_active = 1 ORDER BY login_at DESC LIMIT 1"
        )?;
        let mut rows = stmt.query_map([], |row| {
            Ok(AppSession {
                id: row.get(0)?,
                tim_id: row.get(1)?,
                tim_name: row.get(2)?,
                tim_role: row.get(3)?,
                login_at: row.get(4)?,
                logout_at: row.get(5)?,
                is_active: row.get(6)?,
            })
        })?;
        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
    }


    // Work Session management
    pub fn start_work_session(&self, start_time: &str) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO work_hours (start_time, end_time, duration_seconds, notes, created_at) VALUES (?1, NULL, 0, NULL, ?2)",
            params![start_time, now]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn stop_work_session(&self, id: i64, end_time: &str, duration_seconds: i64, notes: Option<&str>) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE work_hours SET end_time = ?1, duration_seconds = ?2, notes = ?3 WHERE id = ?4",
            params![end_time, duration_seconds, notes, id]
        )?;
        Ok(())
    }

    pub fn get_active_work_session(&self) -> Result<Option<WorkSession>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, start_time, end_time, duration_seconds, notes, created_at FROM work_hours WHERE end_time IS NULL ORDER BY id DESC LIMIT 1"
        )?;
        
        let mut rows = stmt.query_map([], |row| {
            Ok(WorkSession {
                id: Some(row.get(0)?),
                start_time: row.get(1)?,
                end_time: row.get(2)?,
                duration_seconds: row.get(3)?,
                notes: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
    }

    pub fn get_work_sessions(&self, limit: i64) -> Result<Vec<WorkSession>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, start_time, end_time, duration_seconds, notes, created_at FROM work_hours ORDER BY id DESC LIMIT ?1"
        )?;
        
        let rows = stmt.query_map(params![limit], |row| {
            Ok(WorkSession {
                id: Some(row.get(0)?),
                start_time: row.get(1)?,
                end_time: row.get(2)?,
                duration_seconds: row.get(3)?,
                notes: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }
}

// Fungsi pembantu untuk menyinkronkan data pelanggan lama dari invoices ke tabel contacts
fn sync_contacts_from_invoices(conn: &Connection) -> Result<(), DbError> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contacts WHERE type = 'customer'",
        [],
        |row| row.get(0)
    )?;
    
    if count > 0 {
        return Ok(());
    }
    
    let mut stmt = conn.prepare("SELECT file_path FROM invoices")?;
    let rows = stmt.query_map([], |row| {
        let file_path: Option<String> = row.get(0)?;
        Ok(file_path)
    })?;
    
    let created_at = chrono::Local::now().to_rfc3339();
    
    for row in rows {
        if let Ok(Some(file_path_str)) = row {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&file_path_str) {
                if let Some(customer_name) = v.get("customerName").and_then(|n| n.as_str()) {
                    let customer_name_trimmed = customer_name.trim();
                    if !customer_name_trimmed.is_empty() {
                        let customer_wa = v.get("customerWa").and_then(|w| w.as_str()).unwrap_or("");
                        let customer_address = v.get("customerAddress").and_then(|a| a.as_str()).unwrap_or("");
                        
                        let exists: i64 = conn.query_row(
                            "SELECT COUNT(*) FROM contacts WHERE name = ?1 AND type = 'customer'",
                            params![customer_name_trimmed],
                            |r| r.get(0)
                        )?;
                        
                        if exists == 0 {
                conn.execute(
                    "INSERT INTO contacts (name, wa_number, email, address, type, created_at, updated_at) VALUES (?1, ?2, NULL, ?3, 'customer', ?4, ?4)",
                    params![customer_name_trimmed, customer_wa, customer_address, created_at]
                )?;
                        }
                    }
                }
            }
        }
    }
    
    Ok(())
}
