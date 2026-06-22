use std::path::Path;
use std::collections::HashMap;
use rusqlite::params;
use crate::db::Database;
use super::extractor::extract_text;
use tauri::{AppHandle, Manager};
use crate::AppState;

// Re-ekspor untuk mempertahankan kompatibilitas eksternal (misalnya dengan lib.rs)
pub use super::types::{FileEntityInfo, FileMetadataPayload, RelatedFileInfo, SearchResultInfo};
use super::nlp::{compute_tf_idf_vector, calculate_cosine_similarity, generate_summary};
use super::classifier::classify_file_content;
use super::utils::calculate_sha256;

pub fn run_indexing_pipeline(app_handle: &AppHandle, file_id: i64) -> Result<(), String> {
    // 0. Ambil informasi berkas dari database (scope lock db sangat singkat)
    let (file_path, file_name) = {
        let state = app_handle.state::<AppState>();
        let db_lock = state.db.lock().unwrap();
        let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
        
        let mut stmt = db.conn.prepare("SELECT path, filename FROM files WHERE id = ?1")
            .map_err(|e| e.to_string())?;
        stmt.query_row(params![file_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        }).map_err(|e| format!("Berkas tidak ditemukan di DB: {}", e))?
    }; // db_lock dilepas di sini!
    
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Berkas fisik tidak ditemukan di path: {}", file_path));
    }

    // 1. Tahap Ekstraksi Teks (I/O & CPU berat - berjalan di luar lock database!)
    let text = extract_text(path)?;
    let text_lower = text.to_lowercase();
    
    // Hitung SHA-256 hash (I/O & CPU berat - berjalan di luar lock database!)
    let hash_val = calculate_sha256(path)?;
    
    // 2. Tahap Ekstraksi Entitas Cerdas (NER Heuristik)
    let mut entities = Vec::new();
    entities.push(("hash".to_string(), hash_val.clone()));

    // Ambil data buku master & kontak master dari DB (lock db singkat)
    let (books, contacts) = {
        let state = app_handle.state::<AppState>();
        let db_lock = state.db.lock().unwrap();
        let db = db_lock.as_ref().ok_or("Database tidak diinisialisasi")?;
        
        let mut books = Vec::new();
        if let Ok(mut stmt_books) = db.conn.prepare("SELECT title FROM books") {
            if let Ok(rows) = stmt_books.query_map([], |row| row.get::<_, String>(0)) {
                books = rows.flatten().collect();
            }
        }
        
        let mut contacts = Vec::new();
        if let Ok(mut stmt_contacts) = db.conn.prepare("SELECT name FROM contacts") {
            if let Ok(rows) = stmt_contacts.query_map([], |row| row.get::<_, String>(0)) {
                contacts = rows.flatten().collect();
            }
        }
        (books, contacts)
    }; // db_lock dilepas di sini!
    
    // 2a. Deteksi Judul Buku Master
    for title in books {
        let title_lower = title.to_lowercase();
        if text_lower.contains(&title_lower) || file_name.to_lowercase().contains(&title_lower) {
            entities.push(("judul".to_string(), title));
        }
    }
    
    // 2b. Deteksi Penulis/Editor dari Kontak Master
    for name in contacts {
        let name_lower = name.to_lowercase();
        if text_lower.contains(&name_lower) || file_name.to_lowercase().contains(&name_lower) {
            entities.push(("penulis".to_string(), name));
        }
    }

    // 2c. Deteksi Nomor Bab / Chapter
    let words: Vec<&str> = text_lower.split_whitespace().collect();
    for i in 0..words.len() {
        if (words[i] == "bab" || words[i] == "chapter") && i + 1 < words.len() {
            let bab_num = words[i+1].chars().filter(|c| c.is_numeric()).collect::<String>();
            if !bab_num.is_empty() {
                entities.push(("bab".to_string(), bab_num));
            }
        }
    }

    // 2d. Deteksi ISBN
    for word in &words {
        let cleaned: String = word.chars().filter(|c| c.is_numeric() || *c == '-').collect();
        if cleaned.contains("978-") && (cleaned.len() == 17 || cleaned.len() == 13) {
            entities.push(("ISBN".to_string(), cleaned));
        }
    }

    // 2e. Deteksi Ringkasan Otomatis (Summary) menggunakan sentence rank heuristik offline
    let summary = generate_summary(&text);
    entities.push(("summary".to_string(), summary));

    // 3. Simpan hasil analisis ke DB (lock db singkat hanya saat menulis data)
    {
        let state = app_handle.state::<AppState>();
        let mut db_lock = state.db.lock().unwrap();
        let db = db_lock.as_mut().ok_or("Database tidak diinisialisasi")?;

        // Mulai transaksi database
        let mut tx = db.conn.transaction().map_err(|e| e.to_string())?;

        // Simpan entitas ke DB
        let _ = tx.execute("DELETE FROM file_entities WHERE file_id = ?1", params![file_id]);
        for entity in &entities {
            let _ = tx.execute(
                "INSERT INTO file_entities (file_id, entity_type, entity_value) VALUES (?1, ?2, ?3)",
                params![file_id, entity.0, entity.1]
            );
        }

        // 2f. Klasifikasi Otomatis Berbasis Konten (Content-Aware Classification)
        let extension = path.extension().unwrap_or_default().to_string_lossy().to_string().to_lowercase();
        let auto_type = classify_file_content(&file_name, &extension, &text_lower);
        let _ = tx.execute(
            "UPDATE files SET type = ?1 WHERE id = ?2",
            params![auto_type, file_id]
        );

        // Tambahkan tag otomatis berdasarkan tipe berkas dan status draft awal langsung di transaksi
        let auto_tag = format!("#{}", auto_type);
        let _ = tx.execute("INSERT OR IGNORE INTO tags (name) VALUES (?1)", params![auto_tag]);
        if let Ok(tag_id) = tx.query_row("SELECT id FROM tags WHERE name = ?1", params![auto_tag], |row| row.get::<usize, i64>(0)) {
            let _ = tx.execute("INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)", params![file_id, tag_id]);
        }
        let _ = tx.execute("INSERT OR IGNORE INTO tags (name) VALUES (?1)", params!["#draft"]);
        if let Ok(tag_id) = tx.query_row("SELECT id FROM tags WHERE name = ?1", params!["#draft"], |row| row.get::<usize, i64>(0)) {
            let _ = tx.execute("INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)", params![file_id, tag_id]);
        }

        // 3. Tahap Pembuatan Vektor Teks (TF-IDF Vectorizer)
        let tf_idf = compute_tf_idf_vector(&text_lower);
        let vector_json = serde_json::to_string(&tf_idf).unwrap_or_default();
        
        let _ = tx.execute("DELETE FROM file_embeddings WHERE file_id = ?1", params![file_id]);
        let _ = tx.execute(
            "INSERT INTO file_embeddings (file_id, vector) VALUES (?1, ?2)",
            params![file_id, vector_json]
        );

        // 4. Deteksi Duplikat & Kemiripan Versi
        let all_embeddings = get_all_embeddings(&tx, file_id)?;
        let mut max_similarity: f32 = 0.0;
        
        let _ = tx.execute("DELETE FROM file_relations WHERE source_file_id = ?1 OR target_file_id = ?1", params![file_id]);

        // Cari duplikat persis menggunakan hash
        let dup_ids: Vec<i64> = {
            let stmt_dup = tx.prepare(
                "SELECT DISTINCT file_id FROM file_entities WHERE entity_type = 'hash' AND entity_value = ?1 AND file_id != ?2"
            );
            match stmt_dup {
                Ok(mut s) => {
                    if let Ok(rows) = s.query_map(params![hash_val, file_id], |row| row.get::<_, i64>(0)) {
                        rows.flatten().collect()
                    } else { Vec::new() }
                }
                Err(_) => Vec::new(),
            }
        };
        for dup_id in dup_ids {
            let _ = tx.execute(
                "INSERT OR IGNORE INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                params![file_id, dup_id, "duplicate_of", 1.0]
            );
        }

        for (other_id, other_vector) in all_embeddings {
            let similarity = calculate_cosine_similarity(&tf_idf, &other_vector);
            
            // Versi/Revisi terdeteksi jika kemiripan sangat tinggi (> 0.80)
            if similarity > 0.80 {
                if similarity > max_similarity {
                    max_similarity = similarity;
                }
                
                // Catat relasi versi
                let _ = tx.execute(
                    "INSERT INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                    params![file_id, other_id, "version_of", similarity]
                );
            } else if similarity > 0.30 {
                // Relasi biasa
                let _ = tx.execute(
                    "INSERT INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                    params![file_id, other_id, "related_to", similarity]
                );
            }
        }
        
        // Perbarui max similarity versi di tabel files
        if max_similarity > 0.0 {
            let _ = tx.execute(
                "UPDATE files SET version_similarity = ?1 WHERE id = ?2",
                params![max_similarity, file_id]
            );
        }

        // 5. Relasi Graf berdasarkan Kesamaan Entitas (Buku & Kontak)
        for entity in &entities {
            if entity.0 == "summary" {
                continue;
            }
            let rel_type = if entity.0 == "judul" { "part_of" } else { "related_to" };
            let other_ids: Vec<i64> = {
                let stmt_rel = tx.prepare(
                    "SELECT DISTINCT file_id FROM file_entities WHERE entity_type = ?1 AND entity_value = ?2 AND file_id != ?3"
                );
                match stmt_rel {
                    Ok(mut s) => {
                        if let Ok(rows) = s.query_map(params![entity.0, entity.1, file_id], |r| r.get::<_, i64>(0)) {
                            rows.flatten().collect()
                        } else { Vec::new() }
                    }
                    Err(_) => Vec::new(),
                }
            };
            for other_file_id in other_ids {
                let _ = tx.execute(
                    "INSERT OR IGNORE INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                    params![file_id, other_file_id, rel_type, 0.70]
                );
            }
        }

        // 5b. Relasi Graf berdasarkan Konteks Folder Induk & Kemiripan Nama Berkas (Cross-File-Type)
        let path_curr = Path::new(&path);
        let parent_curr = path_curr.parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
        let stem_curr = path_curr.file_stem().map(|s| s.to_string_lossy().to_string().to_lowercase()).unwrap_or_default();

        let all_files: Vec<(i64, String)> = {
            let stmt_all = tx.prepare("SELECT id, path FROM files WHERE id != ?1");
            match stmt_all {
                Ok(mut s) => {
                    if let Ok(rows) = s.query_map(params![file_id], |row| {
                        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
                    }) {
                        rows.flatten().collect()
                    } else { Vec::new() }
                }
                Err(_) => Vec::new(),
            }
        };

        for (other_id, other_path_str) in all_files {
            let path_other = Path::new(&other_path_str);
            let parent_other = path_other.parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
            let stem_other = path_other.file_stem().map(|s| s.to_string_lossy().to_string().to_lowercase()).unwrap_or_default();

            let is_same_folder = !parent_curr.is_empty() && parent_curr == parent_other;

            let is_name_related = if stem_curr.len() >= 3 && stem_other.len() >= 3 {
                stem_curr.contains(&stem_other) || stem_other.contains(&stem_curr)
            } else {
                false
            };

            let mut confidence: f32 = 0.0;
            if is_same_folder && is_name_related {
                confidence = 0.85;
            } else if is_name_related {
                confidence = 0.70;
            } else if is_same_folder {
                confidence = 0.50;
            }

            if confidence > 0.0 {
                let _ = tx.execute(
                    "INSERT INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                    params![file_id, other_id, "related_to", confidence]
                );
            }
        }

        // 6. Inisialisasi statistik akses perilaku berkas
        let _ = tx.execute(
            "INSERT OR IGNORE INTO file_stats (file_id, access_count, last_accessed, active_project_boost) VALUES (?1, 0, NULL, 0)",
            params![file_id]
        );

        // Commit seluruh perubahan dalam transaksi
        tx.commit().map_err(|e| e.to_string())?;
    } // db_lock dilepas di sini!

    Ok(())
}

pub fn get_file_metadata(db: &Database, file_id: i64) -> Result<FileMetadataPayload, String> {
    let mut stmt = db.conn.prepare(
        "SELECT id, path, filename, type, status, version_label, last_modified, version_similarity 
         FROM files WHERE id = ?1"
    ).map_err(|e| e.to_string())?;

    let mut file_payload = stmt.query_row(params![file_id], |row| {
        let id: i64 = row.get(0)?;
        let path: String = row.get(1)?;
        let filename: String = row.get(2)?;
        let r#type: String = row.get(3)?;
        let status: String = row.get(4)?;
        let version_label: Option<String> = row.get(5)?;
        let last_modified: String = row.get(6)?;
        let version_similarity: Option<f32> = row.get(7)?;

        Ok(FileMetadataPayload {
            file_id: id,
            path,
            filename,
            r#type,
            status,
            version_label,
            last_modified,
            version_similarity,
            entities: Vec::new(),
            summary: None,
        })
    }).map_err(|e| format!("Berkas tidak ditemukan: {}", e))?;

    // Ambil entitas terkait
    let mut stmt_entities = db.conn.prepare(
        "SELECT entity_type, entity_value FROM file_entities WHERE file_id = ?1"
    ).map_err(|e| e.to_string())?;

    let entity_rows = stmt_entities.query_map(params![file_id], |row| {
        Ok(FileEntityInfo {
            entity_type: row.get(0)?,
            entity_value: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    for entity in entity_rows.flatten() {
        if entity.entity_type == "summary" {
            file_payload.summary = Some(entity.entity_value);
        } else {
            file_payload.entities.push(entity);
        }
    }

    Ok(file_payload)
}

pub fn get_related_files(db: &Database, file_id: i64) -> Result<Vec<RelatedFileInfo>, String> {
    let mut stmt = db.conn.prepare(
        "SELECT f.id, f.path, f.filename, f.type, r.relation_type, r.confidence, f.last_modified
         FROM file_relations r
         JOIN files f ON (r.target_file_id = f.id AND r.source_file_id = ?1)
         UNION
         SELECT f.id, f.path, f.filename, f.type, r.relation_type, r.confidence, f.last_modified
         FROM file_relations r
         JOIN files f ON (r.source_file_id = f.id AND r.target_file_id = ?1)
         ORDER BY confidence DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![file_id], |row| {
        Ok(RelatedFileInfo {
            file_id: row.get(0)?,
            path: row.get(1)?,
            filename: row.get(2)?,
            r#type: row.get(3)?,
            relation_type: row.get(4)?,
            confidence: row.get(5)?,
            last_modified: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for r in rows.flatten() {
        // Hindari duplikasi jika file merelasikan dirinya sendiri (tidak seharusnya terjadi tapi untuk keamanan)
        if r.file_id != file_id {
            results.push(r);
        }
    }

    Ok(results)
}

pub fn record_file_access(db: &Database, file_id: i64) -> Result<(), String> {
    let now = chrono::Local::now().to_rfc3339();
    db.conn.execute(
        "INSERT INTO file_stats (file_id, access_count, last_accessed, active_project_boost)
         VALUES (?1, 1, ?2, 0)
         ON CONFLICT(file_id) DO UPDATE SET
             access_count = access_count + 1,
             last_accessed = ?2",
         params![file_id, now]
     ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn global_semantic_search(db: &Database, query: &str) -> Result<Vec<SearchResultInfo>, String> {
    let query_lower = query.to_lowercase();
    let query_words: Vec<&str> = query_lower.split_whitespace().collect();
    
    // 1. Hitung vektor TF-IDF untuk query
    let query_vector = compute_tf_idf_vector(&query_lower);
    
    // 2. Ambil semua file dari database beserta statistik dan embeddings
    let mut stmt = db.conn.prepare(
        "SELECT f.id, f.path, f.filename, f.type, f.last_modified, f.version_label, 
                e.vector, s.access_count, s.last_accessed
         FROM files f
         LEFT JOIN file_embeddings e ON f.id = e.file_id
         LEFT JOIN file_stats s ON f.id = s.file_id"
    ).map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let path: String = row.get(1)?;
        let filename: String = row.get(2)?;
        let r#type: String = row.get(3)?;
        let last_modified: String = row.get(4)?;
        let version_label: Option<String> = row.get(5)?;
        let vector_str: Option<String> = row.get(6)?;
        let access_count: i32 = row.get(7).unwrap_or(0);
        let last_accessed: Option<String> = row.get(8)?;
        
        Ok((id, path, filename, r#type, last_modified, version_label, vector_str, access_count, last_accessed))
    }).map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();
    
    for row in rows.flatten() {
        let (id, path, filename, r#type, last_modified, version_label, vector_str, access_count, last_accessed) = row;
        
        let filename_lower = filename.to_lowercase();
        
        // A. Hitung kemiripan teks (FTS / Keyword Match pada nama berkas)
        let mut keyword_score = 0.0;
        if !query_words.is_empty() {
            let mut matches = 0;
            for word in &query_words {
                if filename_lower.contains(word) {
                    matches += 1;
                }
            }
            keyword_score = (matches as f32) / (query_words.len() as f32);
        }
        
        // B. Hitung kemiripan semantik (Cosine Similarity dari TF-IDF)
        let mut semantic_score = 0.0;
        if let Some(vec_str) = vector_str {
            if let Ok(file_vector) = serde_json::from_str::<HashMap<String, f32>>(&vec_str) {
                semantic_score = calculate_cosine_similarity(&query_vector, &file_vector);
            }
        }
        
        // C. Hitung skor perilaku (Behavioral Indexing)
        // Frekuensi akses: log-scale boost
        let access_boost = (1.0 + access_count as f32).ln() * 0.1;
        
        // Keterkinian akses: jika diakses baru-baru ini, berikan bonus tambahan
        let recency_boost = if let Some(last_acc) = last_accessed {
            if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&last_acc) {
                let duration = chrono::Local::now().signed_duration_since(dt);
                let hours = duration.num_hours();
                if hours < 24 {
                    0.2 // Diakses dalam 24 jam terakhir
                } else if hours < 24 * 7 {
                    0.1 // Diakses dalam 1 minggu terakhir
                } else {
                    0.0
                }
            } else {
                0.0
            }
        } else {
            0.0
        };
        
        // Total skor gabungan
        let total_score = (keyword_score * 0.5) + (semantic_score * 0.3) + access_boost + recency_boost;
        
        // Filter: Hanya masukkan jika ada kecocokan nama atau konten
        if query.trim().is_empty() || total_score > 0.01 {
            results.push(SearchResultInfo {
                id,
                path,
                filename,
                r#type,
                last_modified,
                score: total_score,
                version_label,
            });
        }
    }
    
    // Urutkan berdasarkan skor tertinggi ke terendah
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(results)
}

fn get_all_embeddings(tx: &crate::db::wrapper::PubhubTransaction<'_>, exclude_id: i64) -> Result<Vec<(i64, HashMap<String, f32>)>, String> {
    let mut stmt = tx.prepare("SELECT file_id, vector FROM file_embeddings WHERE file_id != ?1")
        .map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map(params![exclude_id], |row| {
        let file_id: i64 = row.get(0)?;
        let json_vector: String = row.get(1)?;
        Ok((file_id, json_vector))
    }).map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();
    for row in rows.flatten() {
        if let Ok(vector) = serde_json::from_str::<HashMap<String, f32>>(&row.1) {
            results.push((row.0, vector));
        }
    }
    Ok(results)
}
