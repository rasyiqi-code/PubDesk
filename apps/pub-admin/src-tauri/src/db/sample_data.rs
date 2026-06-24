// Modul sample data gabungan untuk pengujian dan demo — Diuji dan Dijalankan dari PubAdmin
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

/// Menyisipkan data sample gabungan (PubAdmin, PubOps, PubBilling, PubFiles)
pub fn seed_sample_data(conn: &Connection, options: SeedOptions, _app_name: &str) -> Result<String, DbError> {
    let now = chrono::Local::now().to_rfc3339();
    let mut message_parts = Vec::new();

    conn.execute("PRAGMA foreign_keys = OFF", [])?;
    let _sp = SeedSavepoint::begin(conn)?;

        // ─── 1. SEED TIM DEMO GABUNGAN ───
    let mut _admin_master_id = 0;
    let mut layouter_id = 0;
    let mut admin_produksi_id = 0;
    let mut _budi_keuangan_id = 0;
    let mut _dina_arsip_id = 0;

    if options.tim {
        let tim_data = vec![
            ("Admin Master - Demo", "Admin Master", "Tim Manajemen", "123456", "089876543210", "admin.master@pubdesk.com", "Jakarta Pusat", "admin"),
            ("Ika Rahmawati - Demo", "Layouter", "Tim Produksi", "123456", "081234567890", "ika.rahmawati@pubdesk.com", "Yogyakarta", "ops"),
            ("Admin Produksi - Demo", "Admin Produksi", "Tim Manajemen", "123456", "089876543211", "admin.produksi@pubdesk.com", "Jakarta", "ops"),
            ("Budi Keuangan - Demo", "Billing Specialist", "Keuangan", "123456", "081234567892", "budi.keuangan@pubdesk.com", "Jakarta", "billing"),
            ("Dina Arsip - Demo", "File Manager", "Arsip & Dokumentasi", "123456", "081234567893", "dina.arsip@pubdesk.com", "Yogyakarta", "files"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data tim gabungan...");
        for (name, role, dept, pin, wa, email, address, app) in &tim_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM tim WHERE name = ?1 AND app = ?2",
                params![name, app],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, wa_number, email, address, app, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 5, 'Demo user', ?4, ?5, ?6, ?7, ?8, ?9, ?9)",
                    params![name, role, dept, pin, wa, email, address, app, now]
                )?;
            }
            let id: i64 = conn.query_row(
                "SELECT id FROM tim WHERE name = ?1 AND app = ?2 LIMIT 1",
                params![name, app],
                |row| row.get(0),
            )?;
            
            match *app {
                "admin" => _admin_master_id = id,
                "ops" => {
                    if *role == "Layouter" {
                        layouter_id = id;
                    } else {
                        admin_produksi_id = id;
                    }
                }
                "billing" => _budi_keuangan_id = id,
                "files" => _dina_arsip_id = id,
                _ => {}
            }
        }
        message_parts.push("anggota tim gabungan".to_string());
    }

    // ─── 2. SEED KONTAK & PENULIS & PELANGGAN ───
    let mut penulis_ids = Vec::new();
    let mut customer_id = 0;

    if options.contacts {
        // Penulis
        let penulis_data = vec![
            ("Ahmad Fauzi - Demo", "081234567890", "Bandung", "Jawa Barat", "Penulis Buku Rust"),
            ("Siti Nurhaliza - Demo", "082345678901", "Surabaya", "Jawa Timur", "Penulis Naskah AI"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data penulis...");
        for (name, wa, city, province, notes) in &penulis_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM contacts WHERE name = ?1 AND type = 'penulis'",
                params![name],
                |row| row.get(0),
            )?;
            let id: i64;
            if exists == 0 {
                let address_val = format!("{}, {}", city, province);
                conn.execute(
                    "INSERT INTO contacts (name, wa_number, address, notes, type, created_at) VALUES (?1, ?2, ?3, ?4, 'penulis', ?5)",
                    params![name, wa, address_val, notes, now]
                )?;
                id = conn.last_insert_rowid();
                conn.execute(
                    "INSERT INTO penulis (id, name, wa_number, address, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![id, name, wa, address_val, notes, now]
                )?;
            } else {
                id = conn.query_row(
                    "SELECT id FROM contacts WHERE name = ?1 AND type = 'penulis' LIMIT 1",
                    params![name],
                    |row| row.get(0),
                )?;
            }
            penulis_ids.push(id);
        }

        // Pelanggan (Customer)
        let customer_data = vec![
            ("Penerbit Andi - Demo", "085612345678", "Yogyakarta", "DIY", "andi@penerbitandi.com"),
            ("Toko Buku Utama - Demo", "081987654321", "Jakarta Pusat", "DKI Jakarta", "admin@tokobukuutama.com"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data pelanggan...");
        for (name, wa, city, province, email) in &customer_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM contacts WHERE name = ?1 AND type = 'customer'",
                params![name],
                |row| row.get(0),
            )?;
            let id: i64;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO contacts (name, wa_number, address, email, type, created_at) VALUES (?1, ?2, ?3, ?4, 'customer', ?5)",
                    params![name, wa, format!("{}, {}", city, province), email, now]
                )?;
                id = conn.last_insert_rowid();
            } else {
                id = conn.query_row(
                    "SELECT id FROM contacts WHERE name = ?1 AND type = 'customer' LIMIT 1",
                    params![name],
                    |row| row.get(0),
                )?;
            }
            if customer_id == 0 {
                customer_id = id;
            }
        }
        message_parts.push("penulis & pelanggan".to_string());
    }

    // ─── 3. SEED PENERBIT ───
    let mut penerbit_ids = Vec::new();
    if options.penerbit {
        let penerbit_data = vec![
            ("Pustaka Ilmu Nusantara - Demo", "Yogyakarta", "DIY", "pustaka@nusantara.com", "Kerjasama Aktif"),
            ("KBM Indonesia - Demo", "Surabaya", "Jawa Timur", "admin@kbm.co.id", "Kerjasama Aktif"),
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
                    "INSERT INTO penerbit (name, address, email, cooperation_status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![name, format!("{}, {}", city, province), email, status, now]
                )?;
            }
            let id: i64 = conn.query_row(
                "SELECT id FROM penerbit WHERE name = ?1 LIMIT 1",
                params![name],
                |row| row.get(0),
            )?;
            penerbit_ids.push(id);
        }
        message_parts.push("penerbit".to_string());
    }

    // ─── 4. SEED LAYANAN & BUKU ───
    if options.books_services {
        // Layanan jasa dari billing & ops
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
        let author_id = penulis_ids.first().copied().unwrap_or(1);
        for (title, isbn, reg_p, po_p, weight) in &books_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM books WHERE title = ?1",
                params![title],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO books (title, isbn, regular_price, po_price, weight_grams, author_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![title, isbn, reg_p, po_p, weight, author_id, now]
                )?;
            }
        }
        message_parts.push("buku & layanan".to_string());
    }

    // ─── 5. SEED WORKFLOW PRODUKSI & INVOICES ───
    if options.workflow {
        println!("[SAMPLE SEED] Menyisipkan data import log & workflow...");
        // Import logs
        let log_data = vec![
            ("kontak", "import_penulis_juni_2026.xlsx", "Penulis", 120, 118, 2, 0, 118),
            ("kontak", "import_customer_juni_2026.xlsx", "Pelanggan", 45, 44, 1, 0, 44),
        ];
        for (import_type, file_name, sheet, total, valid, invalid, duplicate, imported) in &log_data {
            conn.execute(
                "INSERT INTO import_logs (import_type, file_name, sheet_name, total_rows, valid_rows, invalid_rows, duplicate_rows, imported_rows, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![import_type, file_name, sheet, total, valid, invalid, duplicate, imported, now]
            )?;
        }

        // Workflow Template
        let exists_tmpl: i64 = conn.query_row(
            "SELECT COUNT(*) FROM workflow_templates WHERE name = 'Alur Produksi Standar'",
            [],
            |row| row.get(0),
        )?;
        if exists_tmpl == 0 {
            conn.execute(
                "INSERT INTO workflow_templates (name, description, is_active, created_at) VALUES (?1, ?2, 1, ?3)",
                params!["Alur Produksi Standar", "Template alur kerja produksi naskah lengkap", now]
            )?;
            let tid = conn.last_insert_rowid();
            let steps = vec![
                (1, "Naskah Masuk", "Admin Produksi", 1),
                (2, "Layout", "Layouter", 5),
                (3, "Desain Cover", "Desainer Cover", 3),
                (4, "Proofreading", "Proofreader", 3),
                (5, "ACC Cetak", "Admin Produksi", 1),
                (6, "Cetak & Distribusi", "Admin Cetak", 7),
                (7, "Upload & Pengiriman", "Admin Upload", 2),
            ];
            for (order, name, role, duration) in &steps {
                conn.execute(
                    "INSERT INTO workflow_template_steps (template_id, step_order, step_name, default_role, default_duration_days, is_required) VALUES (?1, ?2, ?3, ?4, ?5, 1)",
                    params![tid, order, name, role, duration]
                )?;
            }
        }

        // Ambil default IDs yang valid
        let penulis_id = penulis_ids.first().copied().unwrap_or(1);
        let penerbit_id = penerbit_ids.first().copied().unwrap_or(1);
        
        let target_layouter_id = if layouter_id != 0 { layouter_id } else { 
            conn.query_row("SELECT id FROM tim WHERE role = 'Layouter' LIMIT 1", [], |r| r.get(0)).unwrap_or(1)
        };
        let target_admin_id = if admin_produksi_id != 0 { admin_produksi_id } else {
            conn.query_row("SELECT id FROM tim WHERE role = 'Admin Produksi' LIMIT 1", [], |r| r.get(0)).unwrap_or(1)
        };

        // Naskah naskah baru
        let naskah_data = vec![
            ("Panduan Lengkap Rust Programming - Demo", penulis_id, penerbit_id),
            ("Kecerdasan Buatan untuk Pemula - Demo", penulis_id, penerbit_id),
        ];
        let mut naskah_ids = Vec::new();
        println!("[SAMPLE SEED] Menyisipkan data naskah...");
        for (title, pid, pubid) in &naskah_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM naskah WHERE title = ?1",
                params![title],
                |row| row.get(0),
            )?;
            let nid = if exists == 0 {
                conn.execute(
                    "INSERT INTO naskah (title, penulis_id, penerbit_id, status, created_at) VALUES (?1, ?2, ?3, 'Proses', ?4)",
                    params![title, pid, pubid, now]
                )?;
                conn.last_insert_rowid()
            } else {
                conn.query_row(
                    "SELECT id FROM naskah WHERE title = ?1 LIMIT 1",
                    params![title],
                    |row| row.get(0),
                )?
            };
            naskah_ids.push(nid);
        }

        // Tasks untuk naskah
        let task_data = vec![
            (naskah_ids[0], "Naskah Masuk", 1, target_admin_id, "Selesai", "Normal", -10, -9, None),
            (naskah_ids[0], "Layout", 2, target_layouter_id, "Proses", "Tinggi", -5, 3, Some("Sedang mengerjakan bab 5-8")),
            (naskah_ids[1], "Naskah Masuk", 1, target_admin_id, "Selesai", "Normal", -15, -14, None),
            (naskah_ids[1], "Layout", 2, target_layouter_id, "Menunggu Revisi", "Tinggi", -10, -3, Some("Layout margin kurang rapi")),
        ];
        let mut task_ids = Vec::new();
        println!("[SAMPLE SEED] Menyisipkan data tasks...");
        for (nid, step_name, step_order, tid, status, priority, start_off, due_off, notes) in &task_data {
            let start_date = chrono::Local::now() + chrono::Duration::days(*start_off);
            let due_date = chrono::Local::now() + chrono::Duration::days(*due_off);
            let completed_date = if *status == "Selesai" {
                Some((chrono::Local::now() + chrono::Duration::days(*due_off)).to_rfc3339())
            } else {
                None
            };
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM tasks WHERE naskah_id = ?1 AND step_name = ?2",
                params![nid, step_name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO tasks (naskah_id, step_name, step_order, assigned_team_id, status, priority, start_date, due_date, completed_date, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                    params![nid, step_name, step_order, tid, status, priority, start_date.to_rfc3339(), due_date.to_rfc3339(), completed_date, notes, now]
                )?;
                task_ids.push(conn.last_insert_rowid());
            }
        }

        // Blockers & Approvals
        if !task_ids.is_empty() {
            println!("[SAMPLE SEED] Menyisipkan kendala dan approval...");
            let _ = conn.execute(
                "INSERT INTO task_blockers (task_id, naskah_id, blocker_type, description, status, created_at) VALUES (?1, ?2, 'Layout Margin', 'Margin halaman dalam terlalu mepet, perlu disesuaikan kembali.', 'Aktif', ?3)",
                params![task_ids[0], naskah_ids[1], now]
            );
            let _ = conn.execute(
                "INSERT INTO task_approvals (task_id, approval_type, status, requested_at, notes) VALUES (?1, 'ACC Cetak', 'Menunggu Approval', ?2, 'Naskah siap naik cetak.')",
                params![task_ids[task_ids.len() - 1], now]
            );
        }

        // Legalitas
        println!("[SAMPLE SEED] Menyisipkan data legalitas...");
        let _ = conn.execute(
            "INSERT INTO legalitas (naskah_id, judul_buku, nama_penulis, tipe, status, nomor_dokumen, tanggal_pengajuan, tanggal_keluar, created_at, updated_at) VALUES (?1, ?2, 'Ahmad Fauzi', 'ISBN', 'Selesai', '978-602-1234-56-7', '2026-06-10', '2026-06-15', ?3, ?3)",
            params![naskah_ids[0], "Panduan Lengkap Rust Programming", now]
        );
        let _ = conn.execute(
            "INSERT INTO legalitas (naskah_id, judul_buku, nama_penulis, tipe, status, tanggal_pengajuan, created_at, updated_at) VALUES (?1, ?2, 'Siti Nurhaliza', 'HAKI', 'Diajukan', '2026-06-20', ?3, ?3)",
            params![naskah_ids[1], "Kecerdasan Buatan untuk Pemula", now]
        );

        // ─── SEED INVOICES (Billing) ───
        println!("[SAMPLE SEED] Menyisipkan tagihan invoice billing...");
        let active_customer_id = if customer_id != 0 { customer_id } else { 1 };
        
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
                params![now, active_customer_id, items_1, metadata_1]
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
                params![now, active_customer_id, items_2, metadata_2]
            )?;
        }

        message_parts.push("naskah, workflow, legalitas, tagihan invoice".to_string());
    }

    _sp.commit()?;
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    if message_parts.is_empty() {
        Ok("Tidak ada data sample yang dipilih untuk dimuat.".to_string())
    } else {
        Ok(format!(
            "Data sample PubDesk berhasil dimuat: {}.",
            message_parts.join(", "))
        )
    }
}

/// Menghapus semua data workflow
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
pub fn reset_total_data(conn: &Connection, _app_name: &str) -> Result<String, DbError> {
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
    
    // Sisipkan default admin untuk keempat aplikasi (admin, ops, billing, files)
    conn.execute(
        "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, app, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 0, ?4, ?5, ?6, ?7, ?7)",
        params!["Admin Master", "Admin Master", "Tim Manajemen", "Default Admin after reset (PubAdmin)", "123456", "admin", now]
    )?;
    conn.execute(
        "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, app, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 0, ?4, ?5, ?6, ?7, ?7)",
        params!["Admin Produksi", "Admin Produksi", "Tim Manajemen", "Default Admin after reset (PubOps)", "123456", "ops", now]
    )?;
    conn.execute(
        "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, app, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 0, ?4, ?5, ?6, ?7, ?7)",
        params!["Budi Keuangan", "Billing Specialist", "Keuangan", "Default Admin after reset (PubBilling)", "123456", "billing", now]
    )?;
    conn.execute(
        "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, app, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 0, ?4, ?5, ?6, ?7, ?7)",
        params!["Dina Arsip", "File Manager", "Arsip & Dokumentasi", "Default Admin after reset (PubFiles)", "123456", "files", now]
    )?;

    conn.execute("PRAGMA foreign_keys = ON", [])?;
    Ok("Semua data berhasil direset. User default untuk PubAdmin, PubOps, PubBilling, dan PubFiles telah diinisialisasi kembali (PIN: 123456).".to_string())
}
