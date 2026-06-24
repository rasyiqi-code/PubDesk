// Modul sample data untuk pengujian dan demo — PubOps (CRM & Produksi Naskah)
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

/// Menyisipkan data sample untuk PubOps (fokus: CRM, naskah, workflow produksi, legalitas)
pub fn seed_sample_data(conn: &Connection, options: SeedOptions, app_name: &str) -> Result<String, DbError> {
    let now = chrono::Local::now().to_rfc3339();
    let mut message_parts = Vec::new();

    conn.execute("PRAGMA foreign_keys = OFF", [])?;
    let _sp = SeedSavepoint::begin(conn)?;

    // ─── 1. SEED TIM (2 anggota produksi: 1 layouter + 1 admin) ───
    let mut tim_ids = Vec::new();
    if options.tim {
        let tim_data = vec![
            ("Ika Rahmawati - Demo", "Layouter", "Tim Produksi", "123456", "081234567890", "ika.rahmawati@pubdesk.com", "Yogyakarta"),
            ("Admin Produksi - Demo", "Admin Produksi", "Tim Manajemen", "123456", "089876543210", "admin.produksi@pubdesk.com", "Jakarta"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data tim produksi...");
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

    // ─── 2. SEED KONTAK & PENULIS ───
    let mut penulis_ids = Vec::new();
    if options.contacts {
        let penulis_data = vec![
            ("Ahmad Fauzi - Demo", "081234567890", "Bandung", "Jawa Barat", "Penulis Buku Rust"),
            ("Siti Nurhaliza - Demo", "082345678901", "Surabaya", "Jawa Timur", "Penulis Naskah AI"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data penulis/kontak...");
        for (name, wa, city, province, notes) in &penulis_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM contacts WHERE name = ?1",
                params![name],
                |row| row.get(0),
            )?;
            let id: i64;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO contacts (name, wa_number, city, province, notes, type, created_at) VALUES (?1, ?2, ?3, ?4, ?5, 'penulis', ?6)",
                    params![name, wa, city, province, notes, now]
                )?;
                id = conn.last_insert_rowid();
                conn.execute(
                    "INSERT INTO penulis (id, name, wa_number, city, province, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![id, name, wa, city, province, notes, now]
                )?;
            } else {
                id = conn.query_row(
                    "SELECT id FROM contacts WHERE name = ?1 LIMIT 1",
                    params![name],
                    |row| row.get(0),
                )?;
            }
            penulis_ids.push(id);
        }

        // Pelanggan
        let customer_data = vec![
            ("Penerbit Andi - Demo", "085612345678", "Yogyakarta", "DIY"),
            ("Toko Buku Utama - Demo", "081987654321", "Jakarta Pusat", "DKI Jakarta"),
        ];
        for (name, wa, city, province) in &customer_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM contacts WHERE name = ?1 AND type = 'customer'",
                params![name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO contacts (name, wa_number, city, province, type, created_at) VALUES (?1, ?2, ?3, ?4, 'customer', ?5)",
                    params![name, wa, city, province, now]
                )?;
            }
        }
        message_parts.push(format!("{} penulis & pelanggan", penulis_ids.len() + 2));
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

    // ─── 4. SEED BUKU & LAYANAN ───
    if options.books_services {
        let services_data = vec![
            ("Layout Naskah Standar - Demo", 150000.0, "Tata letak interior buku novel/nonfiksi standar", "layout"),
            ("Desain Cover Premium - Demo", 350000.0, "Desain sampul depan, belakang, dan punggung buku", "cover"),
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

        let books_data = vec![
            ("Jejak Langkah di Tanah Borneo - Demo", "978-602-1234-56-7", 85000.0, 75000.0, 250),
            ("Misteri Rumah Tua - Demo", "978-602-7654-32-1", 75000.0, 65000.0, 200),
        ];
        println!("[SAMPLE SEED] Menyisipkan data buku...");
        let author_id = penulis_ids.first().copied().unwrap_or_else(|| {
            let _ = conn.execute(
                "INSERT INTO contacts (name, wa_number, type, created_at) VALUES ('Ahmad Fauzi - Demo', '081234567890', 'penulis', ?1)",
                params![now]
            );
            let cid = conn.last_insert_rowid();
            let _ = conn.execute(
                "INSERT INTO penulis (id, name, wa_number, created_at) VALUES (?1, 'Ahmad Fauzi - Demo', '081234567890', ?2)",
                params![cid, now]
            );
            cid
        });
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

    // ─── 5. SEED WORKFLOW PRODUKSI NASKAH & LEGALITAS ───
    if options.workflow {
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

        // Default IDs
        let penulis_id = penulis_ids.first().copied().unwrap_or_else(|| {
            let _ = conn.execute(
                "INSERT INTO contacts (name, wa_number, type, created_at) VALUES ('Ahmad Fauzi - Demo', '081234567890', 'penulis', ?1)",
                params![now]
            );
            let cid = conn.last_insert_rowid();
            let _ = conn.execute(
                "INSERT INTO penulis (id, name, wa_number, created_at) VALUES (?1, 'Ahmad Fauzi - Demo', '081234567890', ?2)",
                params![cid, now]
            );
            cid
        });

        let penerbit_id = penerbit_ids.first().copied().unwrap_or_else(|| {
            let _ = conn.execute(
                "INSERT INTO penerbit (name, cooperation_status, created_at) VALUES ('KBM Indonesia - Demo', 'Kerjasama Aktif', ?1)",
                params![now]
            );
            conn.last_insert_rowid()
        });

        let layouter_id = tim_ids.first().copied().unwrap_or_else(|| {
            let _ = conn.execute(
                "INSERT INTO tim (name, role, department, pin, app, created_at) VALUES ('Ika Rahmawati - Demo', 'Layouter', 'Tim Produksi', '123456', ?1, ?2)",
                params![app_name, now]
            );
            conn.last_insert_rowid()
        });

        let admin_id = if tim_ids.len() > 1 { tim_ids[1] } else {
            let _ = conn.execute(
                "INSERT INTO tim (name, role, department, pin, app, created_at) VALUES ('Admin Produksi - Demo', 'Admin Produksi', 'Tim Manajemen', '123456', ?1, ?2)",
                params![app_name, now]
            );
            conn.last_insert_rowid()
        };

        // Naskah
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

        // Tasks
        let task_data = vec![
            (naskah_ids[0], "Naskah Masuk", 1, admin_id, "Selesai", "Normal", -10, -9, None),
            (naskah_ids[0], "Layout", 2, layouter_id, "Proses", "Tinggi", -5, 3, Some("Sedang mengerjakan bab 5-8")),
            (naskah_ids[1], "Naskah Masuk", 1, admin_id, "Selesai", "Normal", -15, -14, None),
            (naskah_ids[1], "Layout", 2, layouter_id, "Menunggu Revisi", "Tinggi", -10, -3, Some("Layout margin kurang rapi")),
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

        message_parts.push(format!("{} naskah, workflow, legalitas", naskah_ids.len()));
    }

    _sp.commit()?;
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    if message_parts.is_empty() {
        Ok("Tidak ada data sample yang dipilih untuk dimuat.".to_string())
    } else {
        Ok(format!(
            "Data sample PubOps berhasil dimuat: {}.",
            message_parts.join(", "))
        )
    }
}

/// Menghapus semua data workflow tanpa menghapus data master
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
        params!["Admin Produksi", "Admin Produksi", "Tim Manajemen", "Default Admin after reset (PubOps)", "123456", app_name, now]
    )?;

    conn.execute("PRAGMA foreign_keys = ON", [])?;
    Ok(format!("Semua data PubOps berhasil dihapus total. User default 'Admin Produksi' (PIN: 123456) telah dibuat."))
}
