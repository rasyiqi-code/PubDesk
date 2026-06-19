use std::path::Path;
use std::collections::HashMap;
use rusqlite::{params, Connection};
use crate::db::Database;
use super::extractor::extract_text;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntityInfo {
    pub entity_type: String,
    pub entity_value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileMetadataPayload {
    pub file_id: i64,
    pub path: String,
    pub filename: String,
    pub r#type: String,
    pub status: String,
    pub version_label: Option<String>,
    pub last_modified: String,
    pub version_similarity: Option<f32>,
    pub entities: Vec<FileEntityInfo>,
    pub summary: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RelatedFileInfo {
    pub file_id: i64,
    pub path: String,
    pub filename: String,
    pub r#type: String,
    pub relation_type: String, // "version_of", "related_to", "part_of"
    pub confidence: f32,
    pub last_modified: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResultInfo {
    pub id: i64,
    pub path: String,
    pub filename: String,
    pub r#type: String,
    pub last_modified: String,
    pub score: f32,
    pub version_label: Option<String>,
}

pub fn run_indexing_pipeline(db: &Database, file_id: i64) -> Result<(), String> {
    // 0. Ambil informasi berkas dari database
    let mut stmt = db.conn.prepare("SELECT path, filename FROM files WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let (file_path, file_name): (String, String) = stmt.query_row(params![file_id], |row| {
        Ok((row.get(0)?, row.get(1)?))
    }).map_err(|e| format!("Berkas tidak ditemukan di DB: {}", e))?;
    
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Berkas fisik tidak ditemukan di path: {}", file_path));
    }

    // 1. Tahap Ekstraksi Teks
    let text = extract_text(path)?;
    let text_lower = text.to_lowercase();
    
    // 2. Tahap Ekstraksi Entitas Cerdas (NER Heuristik)
    let mut entities = Vec::new();
    
    // 2a. Deteksi Judul Buku Master
    if let Ok(mut stmt_books) = db.conn.prepare("SELECT id, title FROM books") {
        if let Ok(rows) = stmt_books.query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))) {
            for row in rows.flatten() {
                let title_lower = row.1.to_lowercase();
                if text_lower.contains(&title_lower) || file_name.to_lowercase().contains(&title_lower) {
                    entities.push(("judul".to_string(), row.1.clone()));
                }
            }
        }
    }
    
    // 2b. Deteksi Penulis/Editor dari Kontak Master
    if let Ok(mut stmt_contacts) = db.conn.prepare("SELECT id, name FROM contacts") {
        if let Ok(rows) = stmt_contacts.query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))) {
            for row in rows.flatten() {
                let name_lower = row.1.to_lowercase();
                if text_lower.contains(&name_lower) || file_name.to_lowercase().contains(&name_lower) {
                    entities.push(("penulis".to_string(), row.1.clone()));
                }
            }
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

    // 2e. Deteksi Ringkasan Otomatis (Summary)
    let summary_len = text.chars().count();
    let summary = if summary_len > 0 {
        let end_idx = std::cmp::min(summary_len, 200);
        let mut s: String = text.chars().take(end_idx).collect();
        if summary_len > 200 {
            s.push_str("...");
        }
        s.replace("\n", " ").replace("\r", " ")
    } else {
        "Tidak ada konten teks yang dapat diekstrak.".to_string()
    };
    entities.push(("summary".to_string(), summary));

    // Simpan entitas ke DB
    let _ = db.conn.execute("DELETE FROM file_entities WHERE file_id = ?1", params![file_id]);
    for entity in &entities {
        let _ = db.conn.execute(
            "INSERT INTO file_entities (file_id, entity_type, entity_value) VALUES (?1, ?2, ?3)",
            params![file_id, entity.0, entity.1]
        );
    }

    // 2f. Klasifikasi Otomatis Berbasis Konten (Content-Aware Classification)
    let extension = path.extension().unwrap_or_default().to_string_lossy().to_string().to_lowercase();
    let auto_type = classify_file_content(&file_name, &extension, &text_lower);
    let _ = db.conn.execute(
        "UPDATE files SET type = ?1 WHERE id = ?2",
        params![auto_type, file_id]
    );

    // 3. Tahap Pembuatan Vektor Teks (TF-IDF Vectorizer)
    let tf_idf = compute_tf_idf_vector(&text_lower);
    let vector_json = serde_json::to_string(&tf_idf).unwrap_or_default();
    
    let _ = db.conn.execute("DELETE FROM file_embeddings WHERE file_id = ?1", params![file_id]);
    let _ = db.conn.execute(
        "INSERT INTO file_embeddings (file_id, vector) VALUES (?1, ?2)",
        params![file_id, vector_json]
    );

    // 4. Deteksi Duplikat & Kemiripan Versi
    let all_embeddings = get_all_embeddings(&db.conn, file_id)?;
    let mut max_similarity: f32 = 0.0;
    
    let _ = db.conn.execute("DELETE FROM file_relations WHERE source_file_id = ?1 OR target_file_id = ?1", params![file_id]);

    for (other_id, other_vector) in all_embeddings {
        let similarity = calculate_cosine_similarity(&tf_idf, &other_vector);
        
        // Versi/Revisi terdeteksi jika kemiripan sangat tinggi (> 0.80)
        if similarity > 0.80 {
            if similarity > max_similarity {
                max_similarity = similarity;
            }
            
            // Catat relasi versi
            let _ = db.conn.execute(
                "INSERT INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                params![file_id, other_id, "version_of", similarity]
            );
        } else if similarity > 0.30 {
            // Relasi biasa
            let _ = db.conn.execute(
                "INSERT INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                params![file_id, other_id, "related_to", similarity]
            );
        }
    }
    
    // Perbarui max similarity versi di tabel files
    if max_similarity > 0.0 {
        let _ = db.conn.execute(
            "UPDATE files SET version_similarity = ?1 WHERE id = ?2",
            params![max_similarity, file_id]
        );
    }

    // 5. Relasi Graf berdasarkan Kesamaan Entitas (Buku & Kontak)
    for entity in &entities {
        if entity.0 == "summary" {
            continue;
        }
        // Cari berkas lain yang memiliki entitas yang sama
        if let Ok(mut stmt_rel) = db.conn.prepare(
            "SELECT DISTINCT file_id FROM file_entities WHERE entity_type = ?1 AND entity_value = ?2 AND file_id != ?3"
        ) {
            if let Ok(rows) = stmt_rel.query_map(params![entity.0, entity.1, file_id], |r| r.get::<_, i64>(0)) {
                for other_file_id in rows.flatten() {
                    let rel_type = if entity.0 == "judul" { "part_of" } else { "related_to" };
                    let _ = db.conn.execute(
                        "INSERT OR IGNORE INTO file_relations (source_file_id, target_file_id, relation_type, confidence) VALUES (?1, ?2, ?3, ?4)",
                        params![file_id, other_file_id, rel_type, 0.70]
                    );
                }
            }
        }
    }

    // 6. Inisialisasi statistik akses perilaku berkas
    let _ = db.conn.execute(
        "INSERT OR IGNORE INTO file_stats (file_id, access_count, last_accessed, active_project_boost) VALUES (?1, 0, NULL, 0)",
        params![file_id]
    );

    Ok(())
}

fn classify_file_content(filename: &str, extension: &str, text: &str) -> String {
    let filename_lower = filename.to_lowercase();
    let text_lower = text.to_lowercase();
    
    // 1. Klasifikasi Naskah
    if filename_lower.contains("bab") || filename_lower.contains("chapter") 
       || text_lower.contains("bab i") || text_lower.contains("bab 1") || text_lower.contains("chapter 1")
       || (text_lower.contains("daftar isi") && text_lower.contains("naskah"))
    {
        return "naskah".to_string();
    }
    
    // 2. Klasifikasi Kontrak / Legal
    if filename_lower.contains("perjanjian") || filename_lower.contains("pasal") || filename_lower.contains("kontrak")
       || text_lower.contains("pihak pertama") || text_lower.contains("pihak kedua") || text_lower.contains("surat perjanjian") 
       || text_lower.contains("pasal 1") || text_lower.contains("pasal i")
    {
        return "kontrak".to_string();
    }
    
    // 3. Klasifikasi Aset Grafis / Promo
    if (extension == "png" || extension == "jpg" || extension == "jpeg")
        && (filename_lower.contains("cover") || filename_lower.contains("banner") || filename_lower.contains("sampul") || filename_lower.contains("promo"))
    {
        return "aset".to_string();
    }
    
    "other".to_string()
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

fn compute_tf_idf_vector(text: &str) -> HashMap<String, f32> {
    let mut tf = HashMap::new();
    let stopwords = vec![
        "yang", "di", "dan", "dari", "untuk", "dengan", "ke", "ini", "itu", "pada", "adalah", "sebagai",
        "the", "of", "and", "in", "to", "a", "for", "with", "is", "on", "that", "by", "an"
    ];
    
    let words: Vec<String> = text.split(|c: char| !c.is_alphanumeric())
        .map(|w| w.to_lowercase())
        .filter(|w| w.len() > 1 && !stopwords.contains(&w.as_str()))
        .collect();
        
    let total_words = words.len() as f32;
    if total_words == 0.0 {
        return tf;
    }
    
    for word in words {
        *tf.entry(word).or_insert(0.0) += 1.0;
    }
    
    // Normalisasi L2 Vector
    let sum_squares: f32 = tf.values().map(|v| v * v).sum();
    let norm = sum_squares.sqrt();
    if norm > 0.0 {
        for val in tf.values_mut() {
            *val /= norm;
        }
    }
    
    tf
}

fn get_all_embeddings(conn: &Connection, exclude_id: i64) -> Result<Vec<(i64, HashMap<String, f32>)>, String> {
    let mut stmt = conn.prepare("SELECT file_id, vector FROM file_embeddings WHERE file_id != ?1")
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

fn calculate_cosine_similarity(vec1: &HashMap<String, f32>, vec2: &HashMap<String, f32>) -> f32 {
    let mut dot_product = 0.0;
    for (word, val1) in vec1 {
        if let Some(val2) = vec2.get(word) {
            dot_product += val1 * val2;
        }
    }
    dot_product
}

