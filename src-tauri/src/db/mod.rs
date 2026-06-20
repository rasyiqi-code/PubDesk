pub mod error;
pub mod models;
pub mod schema;

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
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, wa_number, address, type, created_at FROM contacts")?;
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

    pub fn update_contact(&self, contact: &Contact) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE contacts SET name = ?1, wa_number = ?2, address = ?3, type = ?4 WHERE id = ?5",
            params![
                contact.name,
                contact.wa_number,
                contact.address,
                contact.r#type,
                contact.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_contact(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM contacts WHERE id = ?1", params![id])?;
        Ok(())
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
        self.conn
            .execute("DELETE FROM books WHERE id = ?1", params![id])?;
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
            "INSERT INTO invoices (created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, sync_status, cloud_file_url) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
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
                invoice.cloud_file_url
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_invoices(&self) -> Result<Vec<Invoice>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, sync_status, cloud_file_url FROM invoices ORDER BY created_at DESC")?;
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
        self.conn.execute(
            "UPDATE invoices SET sync_status = ?1, cloud_file_url = ?2 WHERE id = ?3",
            params![sync_status, cloud_file_url, id],
        )?;
        Ok(())
    }

    pub fn update_invoice(&self, invoice: &Invoice) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE invoices SET created_at = ?1, customer_id = ?2, items_json = ?3, shipping_cost = ?4, admin_fee = ?5, total = ?6, export_format = ?7, file_path = ?8, sync_status = ?9, cloud_file_url = ?10 WHERE id = ?11",
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
                invoice.id
            ]
        )?;
        Ok(())
    }

    pub fn delete_invoice(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM invoices WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Files
    pub fn add_file(&self, file: &File) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO files (path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly, description, responsible_parties) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
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
                file.responsible_parties
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_files(&self) -> Result<Vec<File>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly, description, responsible_parties FROM files")?;
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
        Ok(())
    }

    pub fn update_file(&self, file: &File) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE files SET filename = ?1, type = ?2, project_id = ?3, status = ?4, version_label = ?5, last_modified = ?6, modified_by = ?7, is_readonly = ?8, description = ?9, responsible_parties = ?10 WHERE path = ?11",
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
                file.path
            ]
        )?;
        Ok(())
    }

    // Services CRUD
    pub fn add_service(&self, service: &Service) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO services (name, price, description, category) VALUES (?1, ?2, ?3, ?4)",
            params![
                service.name,
                service.price,
                service.description,
                service.category
            ],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_services(&self) -> Result<Vec<Service>, DbError> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, price, description, category FROM services")?;
        let services = stmt.query_map([], |row| {
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                price: row.get(2)?,
                description: row.get(3)?,
                category: row.get(4)?,
            })
        })?;

        let mut result = Vec::new();
        for service in services {
            result.push(service?);
        }
        Ok(result)
    }

    pub fn update_service(&self, service: &Service) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE services SET name = ?1, price = ?2, description = ?3, category = ?4 WHERE id = ?5",
            params![
                service.name,
                service.price,
                service.description,
                service.category,
                service.id
            ]
        )?;
        Ok(())
    }

    pub fn delete_service(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM services WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Watch Folders
    #[allow(dead_code)]
    pub fn add_watch_folder(&self, path: &str) -> Result<i64, DbError> {
        let created_at = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO watch_folders (path, created_at) VALUES (?1, ?2)",
            params![path, created_at],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    #[allow(dead_code)]
    pub fn get_watch_folders(&self) -> Result<Vec<WatchFolder>, DbError> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, path, created_at FROM watch_folders")?;
        let folders = stmt.query_map([], |row| {
            Ok(WatchFolder {
                id: row.get(0)?,
                path: row.get(1)?,
                created_at: row.get(2)?,
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
        let mut stmt = self.conn.prepare("SELECT id, path, filename, type, project_id, status, version_label, last_modified, modified_by, is_readonly, description, responsible_parties FROM files WHERE path = ?1")?;
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
        self.conn.execute(
            "INSERT INTO penulis (name, email, wa_number, province, city, job, institution, data_source, email_valid, wa_valid, followup_status, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                p.name,
                p.email,
                p.wa_number,
                p.province,
                p.city,
                p.job,
                p.institution,
                p.data_source,
                p.email_valid,
                p.wa_valid,
                p.followup_status,
                p.notes,
                p.created_at
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_penulis(&self) -> Result<Vec<Penulis>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, email, wa_number, province, city, job, institution, data_source, email_valid, wa_valid, followup_status, notes, created_at FROM penulis ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Penulis {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                wa_number: row.get(3)?,
                province: row.get(4)?,
                city: row.get(5)?,
                job: row.get(6)?,
                institution: row.get(7)?,
                data_source: row.get(8)?,
                email_valid: row.get(9)?,
                wa_valid: row.get(10)?,
                followup_status: row.get(11)?,
                notes: row.get(12)?,
                created_at: row.get(13)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_penulis(&self, p: &Penulis) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE penulis SET name = ?1, email = ?2, wa_number = ?3, province = ?4, city = ?5, job = ?6, institution = ?7, data_source = ?8, email_valid = ?9, wa_valid = ?10, followup_status = ?11, notes = ?12 WHERE id = ?13",
            params![
                p.name,
                p.email,
                p.wa_number,
                p.province,
                p.city,
                p.job,
                p.institution,
                p.data_source,
                p.email_valid,
                p.wa_valid,
                p.followup_status,
                p.notes,
                p.id
            ]
        )?;
        Ok(())
    }

    pub fn delete_penulis(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM penulis WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Penerbit CRUD
    pub fn add_penerbit(&self, p: &Penerbit) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO penerbit (name, city, instagram, facebook, email, wa_number, linkedin, twitter, tiktok, wa_valid, email_valid, cooperation_status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
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
                p.created_at
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_penerbit(&self) -> Result<Vec<Penerbit>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, city, instagram, facebook, email, wa_number, linkedin, twitter, tiktok, wa_valid, email_valid, cooperation_status, created_at FROM penerbit ORDER BY name ASC")?;
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
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_penerbit(&self, p: &Penerbit) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE penerbit SET name = ?1, city = ?2, instagram = ?3, facebook = ?4, email = ?5, wa_number = ?6, linkedin = ?7, twitter = ?8, tiktok = ?9, wa_valid = ?10, email_valid = ?11, cooperation_status = ?12 WHERE id = ?13",
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
                p.id
            ]
        )?;
        Ok(())
    }

    pub fn delete_penerbit(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM penerbit WHERE id = ?1", params![id])?;
        Ok(())
    }

    // NaskahOrder CRUD
    pub fn add_naskah_order(&self, n: &NaskahOrder) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO naskah_orders (naskah_id_code, title, penulis_id, penerbit_id, package_type, order_type, copies, book_size, initial_request, revised_request, legal_type, shipping_address, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                n.naskah_id_code,
                n.title,
                n.penulis_id,
                n.penerbit_id,
                n.package_type,
                n.order_type,
                n.copies,
                n.book_size,
                n.initial_request,
                n.revised_request,
                n.legal_type,
                n.shipping_address,
                n.status,
                n.created_at
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_naskah_orders(&self) -> Result<Vec<NaskahOrder>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, naskah_id_code, title, penulis_id, penerbit_id, package_type, order_type, copies, book_size, initial_request, revised_request, legal_type, shipping_address, status, created_at FROM naskah_orders ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(NaskahOrder {
                id: row.get(0)?,
                naskah_id_code: row.get(1)?,
                title: row.get(2)?,
                penulis_id: row.get(3)?,
                penerbit_id: row.get(4)?,
                package_type: row.get(5)?,
                order_type: row.get(6)?,
                copies: row.get(7)?,
                book_size: row.get(8)?,
                initial_request: row.get(9)?,
                revised_request: row.get(10)?,
                legal_type: row.get(11)?,
                shipping_address: row.get(12)?,
                status: row.get(13)?,
                created_at: row.get(14)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_naskah_order(&self, n: &NaskahOrder) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE naskah_orders SET naskah_id_code = ?1, title = ?2, penulis_id = ?3, penerbit_id = ?4, package_type = ?5, order_type = ?6, copies = ?7, book_size = ?8, initial_request = ?9, revised_request = ?10, legal_type = ?11, shipping_address = ?12, status = ?13 WHERE id = ?14",
            params![
                n.naskah_id_code,
                n.title,
                n.penulis_id,
                n.penerbit_id,
                n.package_type,
                n.order_type,
                n.copies,
                n.book_size,
                n.initial_request,
                n.revised_request,
                n.legal_type,
                n.shipping_address,
                n.status,
                n.id
            ]
        )?;
        Ok(())
    }

    pub fn delete_naskah_order(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM naskah_orders WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Layouters CRUD
    pub fn add_layouter(&self, l: &Layouter) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO layouters (name, role, is_active, weekly_target, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                l.name,
                l.role,
                l.is_active,
                l.weekly_target,
                l.notes,
                l.created_at
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_layouters(&self) -> Result<Vec<Layouter>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, role, is_active, weekly_target, notes, created_at FROM layouters ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Layouter {
                id: row.get(0)?,
                name: row.get(1)?,
                role: row.get(2)?,
                is_active: row.get(3)?,
                weekly_target: row.get(4)?,
                notes: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_layouter(&self, l: &Layouter) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE layouters SET name = ?1, role = ?2, is_active = ?3, weekly_target = ?4, notes = ?5 WHERE id = ?6",
            params![
                l.name,
                l.role,
                l.is_active,
                l.weekly_target,
                l.notes,
                l.id
            ]
        )?;
        Ok(())
    }

    pub fn delete_layouter(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM layouters WHERE id = ?1", params![id])?;
        Ok(())
    }

    // WorkflowEvents CRUD
    pub fn add_workflow_event(&self, e: &WorkflowEvent) -> Result<i64, DbError> {
        self.conn.execute(
            "INSERT INTO workflow_events (naskah_order_id, event_name, completed_date, pic_name, notes, proof_path_or_link, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                e.naskah_order_id,
                e.event_name,
                e.completed_date,
                e.pic_name,
                e.notes,
                e.proof_path_or_link,
                e.status
            ]
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_workflow_events(&self, naskah_order_id: i64) -> Result<Vec<WorkflowEvent>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, naskah_order_id, event_name, completed_date, pic_name, notes, proof_path_or_link, status FROM workflow_events WHERE naskah_order_id = ?1 ORDER BY id ASC")?;
        let rows = stmt.query_map(params![naskah_order_id], |row| {
            Ok(WorkflowEvent {
                id: row.get(0)?,
                naskah_order_id: row.get(1)?,
                event_name: row.get(2)?,
                completed_date: row.get(3)?,
                pic_name: row.get(4)?,
                notes: row.get(5)?,
                proof_path_or_link: row.get(6)?,
                status: row.get(7)?,
            })
        })?;
        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn update_workflow_event(&self, e: &WorkflowEvent) -> Result<(), DbError> {
        self.conn.execute(
            "UPDATE workflow_events SET completed_date = ?1, pic_name = ?2, notes = ?3, proof_path_or_link = ?4, status = ?5 WHERE id = ?6",
            params![
                e.completed_date,
                e.pic_name,
                e.notes,
                e.proof_path_or_link,
                e.status,
                e.id
            ]
        )?;
        Ok(())
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
                                "INSERT INTO contacts (name, wa_number, address, type, created_at) VALUES (?1, ?2, ?3, 'customer', ?4)",
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
