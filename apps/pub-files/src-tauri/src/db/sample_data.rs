// Modul sample data untuk pengujian dan demo — PubFiles (Smart Folders & Indexer)
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

/// Menyisipkan data sample untuk PubFiles (fokus: file, tag, folder watch, indexing)
pub fn seed_sample_data(conn: &Connection, options: SeedOptions, app_name: &str) -> Result<String, DbError> {
    let now = chrono::Local::now().to_rfc3339();
    let mut message_parts = Vec::new();

    conn.execute("PRAGMA foreign_keys = OFF", [])?;
    let _sp = SeedSavepoint::begin(conn)?;

    // ─── 1. SEED TIM (1 anggota file manager) ───
    let mut tim_ids = Vec::new();
    if options.tim {
        let tim_data = vec![
            ("Dina Arsip - Demo", "File Manager", "Arsip & Dokumentasi", "123456", "081234567890", "dina.arsip@pubdesk.com", "Bandung"),
        ];
        println!("[SAMPLE SEED] Menyisipkan data tim files...");
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

    // ─── 2. SEED PROJECT & FOLDER WATCH ───
    if options.contacts {
        println!("[SAMPLE SEED] Menyisipkan data project...");
        let project_data = vec![
            ("Proyek Buku Rust - Demo", "active", "2026-08-30T00:00:00+07:00"),
            ("Proyek Buku AI - Demo", "draft", "2026-09-15T00:00:00+07:00"),
        ];
        for (title, status, deadline) in &project_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM projects WHERE title = ?1",
                params![title],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO projects (title, status, deadline, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
                    params![title, status, deadline, now]
                )?;
            }
        }

        // Folder Watch
        let watch_data = vec![
            "/mock/documents/naskah_masuk",
            "/mock/documents/naskah_revisi",
        ];
        for path in &watch_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM watch_folders WHERE path = ?1",
                params![path],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO watch_folders (path, created_at, updated_at) VALUES (?1, ?2, ?2)",
                    params![path, now]
                )?;
            }
        }
        message_parts.push("project & folder watch".to_string());
    }

    // ─── 3. SEED FILES & TAGS ───
    if options.books_services {
        println!("[SAMPLE SEED] Menyisipkan data file & tag...");

        // Tags
        let tag_data = vec![
            "naskah", "revisi", "final", "layout", "cover", "billing",
        ];
        let mut tag_ids = Vec::new();
        for tag_name in &tag_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM tags WHERE name = ?1",
                params![tag_name],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO tags (name, created_at, updated_at) VALUES (?1, ?2, ?2)",
                    params![tag_name, now]
                )?;
            }
            let id: i64 = conn.query_row(
                "SELECT id FROM tags WHERE name = ?1 LIMIT 1",
                params![tag_name],
                |row| row.get(0),
            )?;
            tag_ids.push(id);
        }

        // Files
        let file_data = vec![
            ("/mock/documents/naskah_masuk/Panduan_Rust_Bab1_5.docx", "Panduan_Rust_Bab1_5.docx", "naskah", "v1", "Tersimpan"),
            ("/mock/documents/naskah_revisi/Panduan_Rust_Bab1_5_rev.docx", "Panduan_Rust_Bab1_5_rev.docx", "naskah", "v2-revisi", "Tersimpan"),
            ("/mock/documents/layout/Panduan_Rust_Layout_Final.pdf", "Panduan_Rust_Layout_Final.pdf", "layout", "final", "Tersimpan"),
            ("/mock/documents/cover/Cover_Panduan_Rust.ai", "Cover_Panduan_Rust.ai", "cover", "draft", "Diproses"),
            ("/mock/documents/billing/Invoice-INV_2026_06_0001.pdf", "Invoice-INV_2026_06_0001.pdf", "invoice", "v1", "Tersimpan"),
        ];
        let mut file_ids = Vec::new();
        for (path, filename, ftype, version, status) in &file_data {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM files WHERE path = ?1",
                params![path],
                |row| row.get(0),
            )?;
            if exists == 0 {
                conn.execute(
                    "INSERT INTO files (path, filename, type, version_label, last_modified, status, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'File demo PubFiles', ?7, ?7)",
                    params![path, filename, ftype, version, now, status, now]
                )?;
            }
            let id: i64 = conn.query_row(
                "SELECT id FROM files WHERE path = ?1 LIMIT 1",
                params![path],
                |row| row.get(0),
            )?;
            file_ids.push(id);
        }

        // File-Tag assignments
        // file 0 (naskah) -> tags: naskah (tag 0)
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_ids[0], tag_ids[0]]
        );
        // file 1 (revisi) -> tags: naskah, revisi
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_ids[1], tag_ids[0]]
        );
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_ids[1], tag_ids[1]]
        );
        // file 2 (layout final) -> tags: layout, final
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_ids[2], tag_ids[3]]
        );
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_ids[2], tag_ids[2]]
        );
        // file 3 (cover) -> tags: cover
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_ids[3], tag_ids[4]]
        );
        // file 4 (invoice) -> tags: billing
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
            params![file_ids[4], tag_ids[5]]
        );

        // File relations (revisi sebagai versi baru dari original)
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, 'version', 0.95)",
            params![file_ids[1], file_ids[0]]
        );
        // layout sebagai downstream dari naskah
        let _ = conn.execute(
            "INSERT OR IGNORE INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, 'derivative', 0.85)",
            params![file_ids[2], file_ids[0]]
        );

        message_parts.push("file, tag, & relasi".to_string());
    }

    _sp.commit()?;
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    if message_parts.is_empty() {
        Ok("Tidak ada data sample yang dipilih untuk dimuat.".to_string())
    } else {
        Ok(format!(
            "Data sample PubFiles berhasil dimuat: {}.",
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
        params!["Dina Arsip", "File Manager", "Arsip & Dokumentasi", "Default Admin after reset (PubFiles)", "123456", app_name, now]
    )?;

    conn.execute("PRAGMA foreign_keys = ON", [])?;
    Ok(format!("Semua data PubFiles berhasil dihapus total. User default 'Dina Arsip' (PIN: 123456) telah dibuat."))
}
