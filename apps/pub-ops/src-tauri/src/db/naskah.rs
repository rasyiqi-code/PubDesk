use super::{Database, DbError};
use crate::db::models::{Naskah, Penerbit};
use rusqlite::params;

impl Database {
    // Penerbit CRUD
    pub fn add_penerbit(&self, p: &Penerbit) -> Result<i64, DbError> {
        let now = chrono::Local::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO penerbit (name, instagram, facebook, email, wa_number, linkedin, twitter, tiktok, wa_valid, email_valid, cooperation_status, created_at, address, notes, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                p.name,
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
                now
            ]
        )?;
        let id = self.conn.last_insert_rowid();
        self.log_activity("penerbit", Some(id), "CREATE", &format!("Menambahkan penerbit '{}'", p.name))?;
        Ok(id)
    }

    pub fn get_penerbit(&self) -> Result<Vec<Penerbit>, DbError> {
        let mut stmt = self.conn.prepare("SELECT id, name, instagram, facebook, email, wa_number, linkedin, twitter, tiktok, wa_valid, email_valid, cooperation_status, created_at, address, notes, updated_at FROM penerbit ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(Penerbit {
                id: row.get(0)?,
                name: row.get(1)?,
                instagram: row.get(2)?,
                facebook: row.get(3)?,
                email: row.get(4)?,
                wa_number: row.get(5)?,
                linkedin: row.get(6)?,
                twitter: row.get(7)?,
                tiktok: row.get(8)?,
                wa_valid: row.get(9)?,
                email_valid: row.get(10)?,
                cooperation_status: row.get(11)?,
                created_at: row.get(12)?,
                address: row.get(13)?,
                notes: row.get(14)?,
                updated_at: row.get(15)?,
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

        // Ambil status lama sebelum diupdate untuk audit trail
        let old_status: Option<String> = p.id.and_then(|pid| {
            self.conn
                .query_row("SELECT cooperation_status FROM penerbit WHERE id = ?1", params![pid], |row| row.get(0))
                .ok()
        });

        self.conn.execute(
            "UPDATE penerbit SET name = ?1, instagram = ?2, facebook = ?3, email = ?4, wa_number = ?5, linkedin = ?6, twitter = ?7, tiktok = ?8, wa_valid = ?9, email_valid = ?10, cooperation_status = ?11, address = ?12, notes = ?13, updated_at = ?14 WHERE id = ?15",
            params![
                p.name,
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
                now,
                p.id
            ]
        )?;

        let new_status = p.cooperation_status.as_deref().unwrap_or("-");
        let old_val = old_status.as_deref().unwrap_or("-");
        self.log_activity_audit(
            "penerbit", p.id, "UPDATE",
            &format!("Memperbarui penerbit '{}'", p.name),
            None, None,
            Some(&format!("cooperation_status: {}", old_val)),
            Some(&format!("cooperation_status: {}", new_status)),
            Some("pub-ops"),
        )?;
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
        
        // Auto-generate naskah_id_code jika kosong atau None
        let final_id_code = match &n.naskah_id_code {
            Some(code) if !code.trim().is_empty() => code.clone(),
            _ => {
                let mut stmt = self.conn.prepare("SELECT naskah_id_code FROM naskah WHERE naskah_id_code LIKE 'NSK-%'")?;
                let codes: Vec<String> = stmt.query_map([], |row| row.get::<_, Option<String>>(0))?
                    .filter_map(|r| r.ok().flatten())
                    .collect();
                
                let mut max_num = 0;
                for c in codes {
                    if let Some(num_str) = c.strip_prefix("NSK-") {
                        if let Ok(num) = num_str.parse::<i32>() {
                            if num > max_num {
                                max_num = num;
                            }
                        }
                    }
                }
                format!("NSK-{:03}", max_num + 1)
            }
        };

        self.conn.execute(
            "INSERT INTO naskah (naskah_id_code, title, penulis_id, penerbit_id, genre, total_pages, synopsis, order_type, copies, book_size, legal_type, assigned_team_ids, initial_request, revised_request, shipping_address, store_links, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                final_id_code,
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
        self.log_activity("naskah", Some(id), "CREATE", &format!("Menambahkan naskah '{}' dengan kode ID '{}'", n.title, final_id_code))?;
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

        // Ambil status lama sebelum diupdate untuk audit trail
        let old_status: Option<String> = n.id.and_then(|nid| {
            self.conn
                .query_row("SELECT status FROM naskah WHERE id = ?1", params![nid], |row| row.get(0))
                .ok()
        });

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

        let new_status = &n.status;
        let old_val = old_status.as_deref().unwrap_or("-");
        self.log_activity_audit(
            "naskah", n.id, "UPDATE",
            &format!("Memperbarui naskah '{}'", n.title),
            None, None,
            Some(&format!("status: {}", old_val)),
            Some(&format!("status: {}", new_status)),
            Some("pub-ops"),
        )?;
        Ok(())
    }

    pub fn delete_naskah(&self, id: i64) -> Result<(), DbError> {
        self.conn
            .execute("DELETE FROM naskah WHERE id = ?1", params![id])?;
        self.log_activity("naskah", Some(id), "DELETE", &format!("Menghapus naskah id={}", id))?;
        Ok(())
    }
}
