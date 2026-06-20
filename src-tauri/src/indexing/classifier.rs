pub fn classify_file_content(filename: &str, extension: &str, text: &str) -> String {
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
