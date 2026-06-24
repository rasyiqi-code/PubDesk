// Modul sample data untuk pengujian dan demo — PubBilling (Keuangan & Invoicing)
#![allow(dead_code)]
use crate::db::error::DbError;
use rusqlite::params;
use super::Connection;
use serde::{Deserialize, Serialize};

struct SeedSavepoint<'a> {
    conn: &'a Connection,
    committed: bool,
}

impl<'a> SeedSavepoint<'a> {
    fn begin(conn: &'a Connection) -> Result<Self, DbError> {
        conn.execute("SAVEPOINT seed_data", [])?;
        Ok(Self { conn, committed: false })
    }

    fn commit(mut self) -> Result<(), DbError> {
        self.conn.execute("RELEASE seed_data", [])?;
        self.committed = true;
        Ok(())
    }
}

impl<'a> Drop for SeedSavepoint<'a> {
    fn drop(&mut self) {
        if !self.committed {
            let _ = self.conn.execute("ROLLBACK TO SAVEPOINT seed_data", []);
            let _ = self.conn.execute("RELEASE SAVEPOINT seed_data", []);
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedOptions {
    pub workflow: bool,
    pub tim: bool,
    pub contacts: bool,
    pub penerbit: bool,
    pub books_services: bool,
}

/// Menyisipkan data sample untuk PubBilling (fokus: invoice, layanan, pelanggan)
pub fn seed_sample_data(conn: &Connection, options: SeedOptions, app_name: &str) -> Result<String, DbError> {
    let now = chrono::Local::now().to_rfc3339();
    let mut message_parts = Vec::new();

    conn.execute("PRAGMA foreign_keys = OFF", [])?;
    let _sp = SeedSavepoint::begin(conn)?;

    // ─── 1. SEED TIM (1 anggota billing) ───
    let mut tim_ids = Vec::new();
    if options.tim {
        let tim_data = vec![
            ("Budi Keuangan - Demo", "Billing Specialist", "Keuangan", "123456", "081234567890", "budi.keuangan@pubdesk.com", "Jakarta"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data tim billing...");
        for (name, role, dept, pin, wa, email, address) in &tim_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM tim WHERE name = ?1 AND app = ?2",
                params![name, app_name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, wa_number, email, address, app, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 5, 'Demo user', ?4, ?5, ?6, ?7, ?8, ?9, ?9)",
                    params![name, role, dept, pin, wa, email, address, app_name, now]
                )?;
            }
            let id: i64 = conn.query_row(
                "SELECT id FROM tim WHERE name = ?1 AND app = ?2 LIMIT 1",
                params![name, app_name],
                |row| row.get(0),
            )?;
            tim_ids.push(id);
        }
        message_parts.push(format!("{} anggota tim", tim_ids.len()));
    }

    // ─── 2. SEED KONTAK PELANGGAN ───
    if options.contacts {
        let customer_data = vec![
            (
                "Penerbit Andi - Demo",
                "085612345678",
                "Yogyakarta",
                "DIY",
                "andi@penerbitandi.com",
            ),
            (
                "Toko Buku Utama - Demo",
                "081987654321",
                "Jakarta Pusat",
                "DKI Jakarta",
                "admin@tokobukuutama.com",
            ),
        ];
        println!("[SAMPLE SEED] Menyisipkan data pelanggan...");
        for (name, wa, city, province, email) in &customer_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM contacts WHERE name = ?1 AND type = 'customer'",
                params![name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO contacts (name, wa_number, city, province, email, type, created_at) VALUES (?1, ?2, ?3, ?4, ?5, 'customer', ?6)",
                    params![name, wa, city, province, email, now]
                )?;
            }
        }
        message_parts.push(format!("{} pelanggan", customer_data.len()));
    }

    // ─── 3. SEED PENERBIT ───
    let mut penerbit_ids = Vec::new();
    if options.penerbit {
        let penerbit_data = vec![
            (
                "Pustaka Ilmu Nusantara - Demo",
                "Yogyakarta",
                "DIY",
                "pustaka@nusantara.com",
                "Kerjasama Aktif",
            ),
            (
                "KBM Indonesia - Demo",
                "Surabaya",
                "Jawa Timur",
                "admin@kbm.co.id",
                "Kerjasama Aktif",
            ),
        ];
        println!("[SAMPLE SEED] Menyisipkan data penerbit...");
        for (name, city, province, email, status) in &penerbit_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM penerbit WHERE name = ?1",
                params![name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO penerbit (name, city, province, email, cooperation_status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![name, city, province, email, status, now]
                )?;
            }
            let id: i64 = conn.query_row(
                "SELECT id FROM penerbit WHERE name = ?1 LIMIT 1",
                params![name],
                |row| row.get(0),
            )?;
            penerbit_ids.push(id);
        }
        message_parts.push(format!("{} penerbit", penerbit_ids.len()));
    }

    // ─── 4. SEED LAYANAN, BUKU, & INVOICE ───
    if options.books_services {
        // Layanan jasa
        let services_data = vec![
            ("Layout Naskah Standar", 150000.0, "Tata letak interior buku novel/nonfiksi standar", "layout"),
            ("Desain Cover Premium", 350000.0, "Desain sampul depan, belakang, dan punggung buku", "cover"),
            ("Proofreading Naskah", 100000.0, "Pemeriksaan ejaan, tata bahasa, dan konsistensi naskah", "proofreading"),
            ("Cetak & Jilid Standar", 250000.0, "Cetak offset + jilid perfect binding", "cetak"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data layanan...");
        for (name, price, desc, cat) in &services_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM services WHERE name = ?1",
                params![name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO services (name, price, description, category, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![name, price, desc, cat, now]
                )?;
            }
        }

        // Buku sample
        let books_data = vec![
            ("Jejak Langkah di Tanah Borneo", "978-602-1234-56-7", 85000.0, 75000.0, 250),
            ("Misteri Rumah Tua", "978-602-7654-32-1", 75000.0, 65000.0, 200),
        ];
        println!("[SAMPLE SEED] Menyisipkan data buku...");
        for (title, isbn, reg_p, po_p, weight) in &books_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM books WHERE title = ?1",
                params![title],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO books (title, isbn, regular_price, po_price, weight_grams, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![title, isbn, reg_p, po_p, weight, now]
                )?;
            }
        }

        // Invoices
        let customer_id = conn.query_row(
            "SELECT id FROM contacts WHERE type = 'customer' LIMIT 1",
            [],
            |row| row.get::<_, i64>(0)
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO contacts (name, wa_number, type, created_at) VALUES ('Penerbit Andi - Demo', '085612345678', 'customer', ?1)",
                params![now]
            );
            conn.last_insert_rowid()
        });

        // Invoice 1 — LUNAS
        let invoice_no_1 = "INV/2026/06/0001";
        let exists_inv1: i64 = conn.query_row(
            "SELECT COUNT(*) FROM invoices WHERE file_path LIKE ?1",
            params![format!("%{}%", invoice_no_1)],
            |row| row.get(0),
        )?;
        if exists_inv1 == 0 {
            let items_1 = r#"[{"item_title":"Layout Naskah Standar","quantity":2,"price":150000.0,"discount":0.0},{"item_title":"Desain Cover Premium","quantity":1,"price":350000.0,"discount":0.0}]"#;
            let metadata_1 = r#"{"invoiceNo":"INV/2026/06/0001","invoiceDate":"2026-06-15","invoiceHal":"Tagihan Jasa Produksi Buku","invoiceLampiran":"-","paymentStatus":"LUNAS","spesifikasiFasilitas":"Paket Produksi Standar","invoiceType":"KBM","customerName":"Penerbit Andi - Demo","customerWa":"085612345678","customerEmail":"andi@penerbitandi.com","customerAddress":"Yogyakarta","isPenulis":false}"#;

            conn.execute(
                "INSERT INTO invoices (created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, payment_status, paid_amount, remaining_amount, sync_status) VALUES (?1, ?2, ?3, 0, 0, 650000.0, 'KBM', ?4, 'LUNAS', 650000.0, 0, 'pending')",
                params![now, customer_id, items_1, metadata_1]
            )?;
        }

        // Invoice 2 — BELUM LUNAS
        let invoice_no_2 = "INV/2026/06/0002";
        let exists_inv2: i64 = conn.query_row(
            "SELECT COUNT(*) FROM invoices WHERE file_path LIKE ?1",
            params![format!("%{}%", invoice_no_2)],
            |row| row.get(0),
        )?;
        if exists_inv2 == 0 {
            let items_2 = r#"[{"item_title":"Proofreading Naskah","quantity":1,"price":100000.0,"discount":0.0},{"item_title":"Cetak & Jilid Standar","quantity":3,"price":250000.0,"discount":50000.0}]"#;
            let metadata_2 = r#"{"invoiceNo":"INV/2026/06/0002","invoiceDate":"2026-06-20","invoiceHal":"Tagihan Cetak & Proofreading","invoiceLampiran":"-","paymentStatus":"BELUM LUNAS","spesifikasiFasilitas":"Paket Cetak Ekspres","invoiceType":"KBM","customerName":"Toko Buku Utama - Demo","customerWa":"081987654321","customerEmail":"admin@tokobukuutama.com","customerAddress":"Jakarta Pusat","isPenulis":false}"#;

            conn.execute(
                "INSERT INTO invoices (created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, payment_status, paid_amount, remaining_amount, sync_status) VALUES (?1, ?2, ?3, 15000, 5000, 820000.0, 'KBM', ?4, 'BELUM LUNAS', 300000.0, 520000.0, 'pending')",
                params![now, customer_id, items_2, metadata_2]
            )?;
        }

        message_parts.push("layanan, buku, & invoice".to_string());
    }

    _sp.commit()?;
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    if message_parts.is_empty() {
        Ok("Tidak ada data sample yang dipilih untuk dimuat.".to_string())
    } else {
        Ok(format!(
            "Data sample PubBilling berhasil dimuat: {}.",
            message_parts.join(", "))
        )
    }
}

/// Menghapus semua data workflow — tidak relevan untuk PubBilling
pub fn reset_workflow_data(conn: &Connection) -> Result<String, DbError> {
    conn.execute("DELETE FROM task_approvals", [])?;
    conn.execute("DELETE FROM task_blockers", [])?;
    conn.execute("DELETE FROM task_history", [])?;
    conn.execute("DELETE FROM tasks", [])?;
    conn.execute("DELETE FROM workflow_template_steps", [])?;
    conn.execute("DELETE FROM workflow_templates", [])?;
    conn.execute("DELETE FROM cetak_distribusi", [])?;
    conn.execute("DELETE FROM import_logs", [])?;
    Ok("Semua data workflow berhasil direset.".to_string())
}

/// Menghapus semua data dari seluruh tabel (Full Reset)
pub fn reset_total_data(conn: &Connection, app_name: &str) -> Result<String, DbError> {
    conn.execute("PRAGMA foreign_keys = OFF", [])?;

    conn.execute("DELETE FROM task_approvals", [])?;
    conn.execute("DELETE FROM task_blockers", [])?;
    conn.execute("DELETE FROM task_history", [])?;
    conn.execute("DELETE FROM tasks", [])?;
    conn.execute("DELETE FROM workflow_template_steps", [])?;
    conn.execute("DELETE FROM workflow_templates", [])?;
    conn.execute("DELETE FROM cetak_distribusi", [])?;
    conn.execute("DELETE FROM import_logs", [])?;
    conn.execute("DELETE FROM naskah_files", [])?;
    conn.execute("DELETE FROM workflow_events", [])?;
    conn.execute("DELETE FROM legalitas", [])?;
    conn.execute("DELETE FROM naskah", [])?;
    conn.execute("DELETE FROM penerbit", [])?;
    conn.execute("DELETE FROM penulis", [])?;
    conn.execute("DELETE FROM file_stats", [])?;
    conn.execute("DELETE FROM file_relations", [])?;
    conn.execute("DELETE FROM file_embeddings", [])?;
    conn.execute("DELETE FROM file_entities", [])?;
    conn.execute("DELETE FROM file_tags", [])?;
    conn.execute("DELETE FROM tags", [])?;
    conn.execute("DELETE FROM files", [])?;
    conn.execute("DELETE FROM projects", [])?;
    conn.execute("DELETE FROM books", [])?;
    conn.execute("DELETE FROM contacts", [])?;
    conn.execute("DELETE FROM invoices", [])?;
    conn.execute("DELETE FROM services", [])?;
    conn.execute("DELETE FROM watch_folders", [])?;
    conn.execute("DELETE FROM tim", [])?;
    conn.execute("DELETE FROM work_hours", [])?;
    conn.execute("DELETE FROM app_sessions", [])?;
    conn.execute("DELETE FROM activity_log", [])?;

    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, app, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 0, ?4, ?5, ?6, ?7, ?7)",
        params!["Budi Keuangan", "Billing Specialist", "Keuangan", "Default Admin after reset (PubBilling)", "123456", app_name, now]
    )?;

    conn.execute("PRAGMA foreign_keys = ON", [])?;
    Ok(format!("Semua data PubBilling berhasil dihapus total. User default 'Budi Keuangan' (PIN: 123456) telah dibuat."))
}
