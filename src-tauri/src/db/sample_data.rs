// Modul sample data untuk pengujian dan demo fitur produksi naskah
#![allow(dead_code)]
use crate::db::error::DbError;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedOptions {
    pub workflow: bool,
    pub tim: bool,
    pub contacts: bool,
    pub penerbit: bool,
    pub books_services: bool,
}

/// Menyisipkan data sample untuk keperluan demo/testing berdasarkan opsi pilihan (maksimal 2 data per menu)
pub fn seed_sample_data(conn: &Connection, options: SeedOptions) -> Result<String, DbError> {
    let now = chrono::Local::now().to_rfc3339();
    let mut message_parts = Vec::new();

    // Temporarily disable foreign key constraints
    conn.execute("PRAGMA foreign_keys = OFF", [])?;

    // ─── 1. SEED TIM (Maksimal 2) ───
    let mut tim_ids = Vec::new();
    if options.tim {
        let tim_data = vec![
            ("Ika Rahmawati", "Layouter", "Tim Produksi", "123456"),
            ("Admin Produksi", "Admin Master", "Admin Master", "123456"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data tim...");
        for (name, role, dept, pin) in &tim_data {
            // Cek apakah sudah ada anggota tim dengan nama ini
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM tim WHERE name = ?1",
                params![name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 5, 'Demo user', ?4, ?5, ?5)",
                    params![name, role, dept, pin, now]
                )?;
            }
            let id: i64 = conn.query_row(
                "SELECT id FROM tim WHERE name = ?1 LIMIT 1",
                params![name],
                |row| row.get(0),
            )?;
            tim_ids.push(id);
        }
        message_parts.push(format!("{} anggota tim", tim_ids.len()));
    }

    // ─── 2. SEED KONTAK & PENULIS (Maksimal 2 masing-masing) ───
    let mut penulis_ids = Vec::new();
    if options.contacts {
        let penulis_data = vec![
            (
                "Ahmad Fauzi",
                "081234567890",
                "Bandung",
                "Jawa Barat",
                "Penulis Buku Rust",
            ),
            (
                "Siti Nurhaliza",
                "082345678901",
                "Surabaya",
                "Jawa Timur",
                "Penulis Naskah AI",
            ),
        ];
        println!("[SAMPLE SEED] Menyisipkan data penulis/kontak...");
        for (name, wa, city, province, notes) in &penulis_data {
            // Cek di tabel contacts
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

                // Tambahkan ke tabel penulis agar sinkron
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

        // Tambah kontak umum (Pelanggan)
        let customer_data = vec![
            ("Penerbit Andi", "085612345678", "Yogyakarta", "DIY"),
            (
                "Toko Buku Utama",
                "081987654321",
                "Jakarta Pusat",
                "DKI Jakarta",
            ),
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

    // ─── 3. SEED PENERBIT (Maksimal 2) ───
    let mut penerbit_ids = Vec::new();
    if options.penerbit {
        let penerbit_data = vec![
            (
                "Pustaka Ilmu Nusantara",
                "Yogyakarta",
                "DIY",
                "pustaka@nusantara.com",
                "Kerjasama Aktif",
            ),
            (
                "KBM Indonesia",
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

    // ─── 4. SEED BUKU, LAYANAN, & INVOICE (Maksimal 2 masing-masing) ───
    if options.books_services {
        // Layanan (Services - 2 data)
        let services_data = vec![
            (
                "Layout Naskah Standar",
                150000.0,
                "Tata letak interior buku novel/nonfiksi standar",
                "layout",
            ),
            (
                "Desain Cover Premium",
                350000.0,
                "Desain sampul depan, belakang, dan punggung buku",
                "cover",
            ),
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

        // Buku (Books - 2 data)
        let author_id = conn.query_row(
            "SELECT id FROM contacts WHERE type = 'penulis' LIMIT 1",
            [],
            |row| row.get::<_, i64>(0)
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO contacts (name, wa_number, type, created_at) VALUES ('Ahmad Fauzi', '081234567890', 'penulis', ?1)",
                params![now]
            );
            let cid = conn.last_insert_rowid();
            let _ = conn.execute(
                "INSERT INTO penulis (id, name, wa_number, created_at) VALUES (?1, 'Ahmad Fauzi', '081234567890', ?2)",
                params![cid, now]
            );
            cid
        });

        let books_data = vec![
            (
                "Jejak Langkah di Tanah Borneo",
                "978-602-1234-56-7",
                85000.0,
                75000.0,
                250,
            ),
            (
                "Misteri Rumah Tua",
                "978-602-7654-32-1",
                75000.0,
                65000.0,
                200,
            ),
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
                    "INSERT INTO books (title, isbn, regular_price, po_price, weight_grams, author_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![title, isbn, reg_p, po_p, weight, author_id, now]
                )?;
            }
        }

        // Seeding Invoices & Files (Smart Folders - 2 data)
        println!("[SAMPLE SEED] Menyisipkan data invoice...");
        let customer_id = conn.query_row(
            "SELECT id FROM contacts WHERE type = 'customer' LIMIT 1",
            [],
            |row| row.get::<_, i64>(0)
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO contacts (name, wa_number, type, created_at) VALUES ('Penerbit Andi', '085612345678', 'customer', ?1)",
                params![now]
            );
            conn.last_insert_rowid()
        });

        // Invoice 1
        let invoice_no_1 = "INV/2026/06/0001";
        let exists_inv1: i64 = conn.query_row(
            "SELECT COUNT(*) FROM invoices WHERE file_path LIKE ?1",
            params![format!("%{}%", invoice_no_1)],
            |row| row.get(0),
        )?;
        if exists_inv1 == 0 {
            let items_1 = r#"[{"item_title":"Layout Naskah Standar","quantity":1,"price":150000.0,"discount":0.0}]"#;
            let metadata_1 = r#"{"invoiceNo":"INV/2026/06/0001","invoiceDate":"2026-06-22","invoiceHal":"Tagihan Jasa Layout","invoiceLampiran":"-","paymentStatus":"LUNAS","spesifikasiFasilitas":"Sesuai poster paket","invoiceType":"KBM","customerName":"Penerbit Andi","customerWa":"085612345678","customerEmail":"","customerAddress":"Yogyakarta","isPenulis":false}"#;

            conn.execute(
                "INSERT INTO invoices (created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, payment_status, paid_amount, remaining_amount, sync_status) VALUES (?1, ?2, ?3, 0, 0, 150000.0, 'KBM', ?4, 'LUNAS', 150000.0, 0, 'pending')",
                params![now, customer_id, items_1, metadata_1]
            )?;
            let inv_id = conn.last_insert_rowid();

            // Register ke files untuk Smart Folders (File 1)
            let file_path = format!("/mock/invoices/Invoice-INV_2026_06_0001_{}.pdf", inv_id);
            let _ = conn.execute(
                "INSERT OR IGNORE INTO files (path, filename, type, version_label, last_modified, status, created_at) VALUES (?1, ?2, 'invoice', ?3, ?4, 'Tersimpan', ?4)",
                params![file_path, "Invoice-INV_2026_06_0001.pdf", String::from("1"), now]
            );
        }

        // Invoice 2
        let invoice_no_2 = "INV/2026/06/0002";
        let exists_inv2: i64 = conn.query_row(
            "SELECT COUNT(*) FROM invoices WHERE file_path LIKE ?1",
            params![format!("%{}%", invoice_no_2)],
            |row| row.get(0),
        )?;
        if exists_inv2 == 0 {
            let items_2 = r#"[{"item_title":"Desain Cover Premium","quantity":1,"price":350000.0,"discount":0.0}]"#;
            let metadata_2 = r#"{"invoiceNo":"INV/2026/06/0002","invoiceDate":"2026-06-22","invoiceHal":"Tagihan Desain","invoiceLampiran":"-","paymentStatus":"BELUM LUNAS","spesifikasiFasilitas":"Sesuai poster paket","invoiceType":"KBM","customerName":"Ahmad Fauzi","customerWa":"081234567890","customerEmail":"","customerAddress":"Bandung","isPenulis":true}"#;

            conn.execute(
                "INSERT INTO invoices (created_at, customer_id, items_json, shipping_cost, admin_fee, total, export_format, file_path, payment_status, paid_amount, remaining_amount, sync_status) VALUES (?1, ?2, ?3, 0, 0, 350000.0, 'KBM', ?4, 'BELUM LUNAS', 150000.0, 200000.0, 'pending')",
                params![now, author_id, items_2, metadata_2]
            )?;
            let inv_id = conn.last_insert_rowid();

            // Register ke files untuk Smart Folders (File 2)
            let file_path = format!("/mock/invoices/Invoice-INV_2026_06_0002_{}.pdf", inv_id);
            let _ = conn.execute(
                "INSERT OR IGNORE INTO files (path, filename, type, version_label, last_modified, status, created_at) VALUES (?1, ?2, 'invoice', ?3, ?4, 'Tersimpan', ?4)",
                params![file_path, "Invoice-INV_2026_06_0002.pdf", String::from("2"), now]
            );
        }

        message_parts.push("data buku, master layanan, & invoice".to_string());
    }

    // ─── 5. SEED WORKFLOW PRODUKSI NASKAH & LEGALITAS (Maksimal 2 masing-masing) ───
    if options.workflow {
        // Ambil atau buat template
        let exists_tmpl: i64 = conn.query_row(
            "SELECT COUNT(*) FROM workflow_templates WHERE name = 'Alur Produksi Standar'",
            [],
            |row| row.get(0),
        )?;
        let _template_id = if exists_tmpl == 0 {
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
            tid
        } else {
            conn.query_row(
                "SELECT id FROM workflow_templates WHERE name = 'Alur Produksi Standar' LIMIT 1",
                [],
                |row| row.get(0),
            )?
        };

        // Ambil/Buat default penulis
        let penulis_id = conn.query_row(
            "SELECT id FROM contacts WHERE type = 'penulis' LIMIT 1",
            [],
            |row| row.get::<_, i64>(0)
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO contacts (name, wa_number, type, created_at) VALUES ('Ahmad Fauzi (Demo)', '081234567890', 'penulis', ?1)",
                params![now]
            );
            let cid = conn.last_insert_rowid();
            let _ = conn.execute(
                "INSERT INTO penulis (id, name, wa_number, created_at) VALUES (?1, 'Ahmad Fauzi (Demo)', '081234567890', ?2)",
                params![cid, now]
            );
            cid
        });

        // Ambil/Buat default penerbit
        let penerbit_id = conn.query_row(
            "SELECT id FROM penerbit LIMIT 1",
            [],
            |row| row.get::<_, i64>(0)
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO penerbit (name, cooperation_status, created_at) VALUES ('KBM Indonesia (Demo)', 'Kerjasama Aktif', ?1)",
                params![now]
            );
            conn.last_insert_rowid()
        });

        // Ambil/Buat default tim
        let layouter_id = conn.query_row(
            "SELECT id FROM tim WHERE role = 'Layouter' LIMIT 1",
            [],
            |row| row.get::<_, i64>(0)
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO tim (name, role, department, pin, created_at) VALUES ('Ika Rahmawati (Demo)', 'Layouter', 'Tim Produksi', '123456', ?1)",
                params![now]
            );
            conn.last_insert_rowid()
        });

        let admin_id = conn.query_row(
            "SELECT id FROM tim WHERE role = 'Admin Master' OR role = 'Admin Produksi' LIMIT 1",
            [],
            |row| row.get::<_, i64>(0)
        ).unwrap_or_else(|_| {
            let _ = conn.execute(
                "INSERT INTO tim (name, role, department, pin, created_at) VALUES ('Admin Produksi (Demo)', 'Admin Master', 'Tim Manajemen', '123456', ?1)",
                params![now]
            );
            conn.last_insert_rowid()
        });

        // Naskah Data (Maksimal 2)
        let naskah_data = vec![
            ("Panduan Lengkap Rust Programming", penulis_id, penerbit_id),
            ("Kecerdasan Buatan untuk Pemula", penulis_id, penerbit_id),
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

        // Tasks Data
        // Format: (naskah_idx, step_name, step_order, assigned_team_id, status, priority, days_offset_start, days_offset_due, notes)
        let task_data = vec![
            (
                naskah_ids[0],
                "Naskah Masuk",
                1,
                admin_id,
                "Selesai",
                "Normal",
                -10,
                -9,
                None,
            ),
            (
                naskah_ids[0],
                "Layout",
                2,
                layouter_id,
                "Proses",
                "Tinggi",
                -5,
                3,
                Some("Sedang mengerjakan bab 5-8"),
            ),
            (
                naskah_ids[1],
                "Naskah Masuk",
                1,
                admin_id,
                "Selesai",
                "Normal",
                -15,
                -14,
                None,
            ),
            (
                naskah_ids[1],
                "Layout",
                2,
                layouter_id,
                "Menunggu Revisi",
                "Tinggi",
                -10,
                -3,
                Some("Layout margin kurang rapi"),
            ),
        ];

        let mut task_ids = Vec::new();
        println!("[SAMPLE SEED] Menyisipkan data tasks...");
        for (nid, step_name, step_order, tid, status, priority, start_off, due_off, notes) in
            &task_data
        {
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
                    params![
                        nid,
                        step_name,
                        step_order,
                        tid,
                        status,
                        priority,
                        start_date.to_rfc3339(),
                        due_date.to_rfc3339(),
                        completed_date,
                        notes,
                        now
                    ]
                )?;
                task_ids.push(conn.last_insert_rowid());
            }
        }

        // Seeding blocker / approval jika ada task baru (Maksimal 2)
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

        // Seeding Legalitas (Maksimal 2)
        println!("[SAMPLE SEED] Menyisipkan data legalitas...");
        let _ = conn.execute(
            "INSERT INTO legalitas (naskah_id, judul_buku, nama_penulis, tipe, status, nomor_dokumen, tanggal_pengajuan, tanggal_keluar, created_at, updated_at) VALUES (?1, ?2, 'Ahmad Fauzi', 'ISBN', 'Selesai', '978-602-1234-56-7', '2026-06-10', '2026-06-15', ?3, ?3)",
            params![naskah_ids[0], "Panduan Lengkap Rust Programming", now]
        );
        let _ = conn.execute(
            "INSERT INTO legalitas (naskah_id, judul_buku, nama_penulis, tipe, status, tanggal_pengajuan, created_at, updated_at) VALUES (?1, ?2, 'Siti Nurhaliza', 'HAKI', 'Diajukan', '2026-06-20', ?3, ?3)",
            params![naskah_ids[1], "Kecerdasan Buatan untuk Pemula", now]
        );

        message_parts.push(format!(
            "{} naskah, tugas workflow, kendala, approval, & legalitas",
            naskah_ids.len()
        ));
    }

    // Re-enable foreign key constraints
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    if message_parts.is_empty() {
        Ok("Tidak ada data sample yang dipilih untuk dimuat.".to_string())
    } else {
        Ok(format!(
            "Data sample berhasil dimuat untuk: {}.",
            message_parts.join(", ")
        ))
    }
}

/// Menghapus semua data workflow (tasks, history, blockers, approvals, template)
/// tanpa menghapus data master (naskah, tim, penulis, penerbit)
pub fn reset_workflow_data(conn: &Connection) -> Result<String, DbError> {
    // Urutan penting karena foreign key constraints
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
pub fn reset_total_data(conn: &Connection) -> Result<String, DbError> {
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

    // Seed satu user admin default agar aplikasi tidak macet saat kembali ke layar login
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO tim (name, role, department, is_active, weekly_target, notes, pin, created_at, updated_at) VALUES (?1, ?2, ?3, 1, 0, ?4, ?5, ?6, ?6)",
        params!["Admin Master", "Admin Master", "Tim Manajemen", "Default Admin after reset", "123456", now]
    )?;

    conn.execute("PRAGMA foreign_keys = ON", [])?;

    Ok("Semua data aplikasi berhasil dihapus total. User default 'Admin Master' (PIN: 123456) telah dibuat.".to_string())
}
