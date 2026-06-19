use std::path::Path;
use std::fs::File;
use std::io::Read;
use zip::ZipArchive;
use calamine::{Reader, Xlsx, open_workbook};

pub fn extract_text(path: &Path) -> Result<String, String> {
    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "txt" | "md" | "json" => {
            let mut file = File::open(path).map_err(|e| e.to_string())?;
            let mut content = String::new();
            file.read_to_string(&mut content).map_err(|e| e.to_string())?;
            Ok(content)
        }
        "docx" => {
            extract_docx(path)
        }
        "xlsx" | "xls" => {
            extract_xlsx(path)
        }
        "pdf" => {
            extract_pdf(path)
        }
        _ => {
            // Fallback: baca metadata nama berkas saja jika bukan format dokumen teks
            Ok(path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string())
        }
    }
}

fn extract_docx(path: &Path) -> Result<String, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    let mut doc_file = archive.by_name("word/document.xml")
        .map_err(|e| format!("Bukan berkas Word valid: {}", e))?;
        
    let mut xml_content = String::new();
    doc_file.read_to_string(&mut xml_content).map_err(|e| e.to_string())?;
    
    // Parse tag w:t untuk mendapatkan teks naskah docx
    let mut text = String::new();
    let mut pos = 0;
    while let Some(start) = xml_content[pos..].find("<w:t") {
        let absolute_start = pos + start;
        if let Some(tag_end) = xml_content[absolute_start..].find(">") {
            let content_start = absolute_start + tag_end + 1;
            if let Some(end) = xml_content[content_start..].find("</w:t>") {
                let absolute_end = content_start + end;
                text.push_str(&xml_content[content_start..absolute_end]);
                text.push(' ');
                pos = absolute_end + 6;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    
    Ok(text)
}

fn extract_xlsx(path: &Path) -> Result<String, String> {
    let mut excel: Xlsx<std::io::BufReader<std::fs::File>> = open_workbook(path).map_err(|e: calamine::XlsxError| e.to_string())?;
    let mut text = String::new();
    for sheet in excel.sheet_names() {
        if let Ok(range) = excel.worksheet_range(&sheet) {
            for row in range.rows() {
                for cell in row {
                    let cell_str = cell.to_string();
                    if !cell_str.trim().is_empty() {
                        text.push_str(&cell_str);
                        text.push(' ');
                    }
                }
            }
        }
    }
    Ok(text)
}

fn extract_pdf(path: &Path) -> Result<String, String> {
    // Parser stream PDF sederhana untuk mengekstrak string literal (pola ASCII)
    // Menghindari ketergantungan library dynamic runtime ONNX / PDF external yang berat
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes).map_err(|e| e.to_string())?;
    
    let mut text = String::new();
    let mut in_string = false;
    let mut current_str = Vec::new();
    
    let mut i = 0;
    while i < bytes.len() {
        let b = bytes[i];
        if b == b'(' && !in_string {
            in_string = true;
            current_str.clear();
        } else if b == b')' && in_string {
            in_string = false;
            if let Ok(s) = String::from_utf8(current_str.clone()) {
                let cleaned: String = s.chars()
                    .filter(|c| c.is_alphanumeric() || c.is_whitespace() || *c == '.' || *c == ',')
                    .collect();
                if cleaned.len() > 2 {
                    text.push_str(&cleaned);
                    text.push(' ');
                }
            }
        } else if in_string {
            if b == b'\\' && i + 1 < bytes.len() {
                i += 1;
                current_str.push(bytes[i]);
            } else {
                current_str.push(b);
            }
        }
        i += 1;
    }
    
    Ok(text)
}
