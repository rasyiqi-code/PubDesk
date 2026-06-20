use std::collections::HashMap;

pub fn compute_tf_idf_vector(text: &str) -> HashMap<String, f32> {
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

pub fn calculate_cosine_similarity(vec1: &HashMap<String, f32>, vec2: &HashMap<String, f32>) -> f32 {
    let mut dot_product = 0.0;
    for (word, val1) in vec1 {
        if let Some(val2) = vec2.get(word) {
            dot_product += val1 * val2;
        }
    }
    dot_product
}

pub fn generate_summary(text: &str) -> String {
    if text.trim().is_empty() {
        return "Tidak ada konten teks yang dapat diekstrak.".to_string();
    }

    // 1. Pemisahan teks menjadi kalimat-kalimat
    let mut sentences = Vec::new();
    let mut current_sentence = String::new();
    
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        current_sentence.push(c);
        
        if (c == '.' || c == '?' || c == '!') && (i + 1 == chars.len() || chars[i + 1].is_whitespace()) {
            let trimmed = current_sentence.trim().to_string();
            if !trimmed.is_empty() {
                sentences.push(trimmed);
            }
            current_sentence = String::new();
        }
        i += 1;
    }
    if !current_sentence.trim().is_empty() {
        sentences.push(current_sentence.trim().to_string());
    }

    if sentences.is_empty() {
        return "Tidak ada konten teks yang dapat diekstrak.".to_string();
    }

    // Jika jumlah kalimat sangat sedikit, langsung gabungkan saja
    if sentences.len() <= 3 {
        return sentences.join(" ");
    }

    // 2. Hitung frekuensi kata kunci penting (untuk scoring kalimat)
    let stopwords = vec![
        "yang", "di", "dan", "dari", "untuk", "dengan", "ke", "ini", "itu", "pada", "adalah", "sebagai",
        "the", "of", "and", "in", "to", "a", "for", "with", "is", "on", "that", "by", "an", "kami", "kita",
        "mereka", "dia", "ia", "kamu", "saya", "aku", "akan", "telah", "sudah", "dapat", "bisa", "ada",
        "oleh", "atau", "juga", "bahwa", "seperti", "hanya", "untuk", "dalam", "namun", "tetapi", "karena"
    ];

    let mut word_freqs = HashMap::new();
    for sentence in &sentences {
        let words: Vec<&str> = sentence.split(|c: char| !c.is_alphanumeric())
            .map(|w| w.trim())
            .filter(|w| !w.is_empty())
            .collect();
        for word in words {
            let w_lower = word.to_lowercase();
            if w_lower.len() > 2 && !stopwords.contains(&w_lower.as_str()) {
                *word_freqs.entry(w_lower).or_insert(0) += 1;
            }
        }
    }

    // 3. Beri skor pada setiap kalimat
    let mut sentence_scores = Vec::new();
    for (idx, sentence) in sentences.iter().enumerate() {
        let words: Vec<&str> = sentence.split(|c: char| !c.is_alphanumeric())
            .map(|w| w.trim())
            .filter(|w| !w.is_empty())
            .collect();
        
        if words.is_empty() {
            sentence_scores.push((idx, 0.0f32));
            continue;
        }

        let mut keyword_score = 0.0f32;
        for word in &words {
            let w_lower = word.to_lowercase();
            if let Some(&freq) = word_freqs.get(&w_lower) {
                keyword_score += freq as f32;
            }
        }
        keyword_score /= words.len() as f32;

        let position_weight = if idx == 0 {
            1.5f32
        } else if idx < 3 {
            1.0f32
        } else {
            0.0f32
        };

        let word_count = words.len();
        let length_weight = if word_count >= 12 && word_count <= 35 {
            0.5f32
        } else {
            0.0f32
        };

        let total_score = keyword_score + position_weight + length_weight;
        sentence_scores.push((idx, total_score));
    }

    // 4. Pilih 3 kalimat terbaik dengan skor tertinggi
    sentence_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    let mut top_sentences = sentence_scores.into_iter().take(3).collect::<Vec<_>>();
    top_sentences.sort_by_key(|a| a.0);

    let summary_sentences: Vec<String> = top_sentences.into_iter()
        .map(|(idx, _)| sentences[idx].clone())
        .collect();

    let mut result = summary_sentences.join(" ");
    result = result.split_whitespace().collect::<Vec<&str>>().join(" ");
    
    let char_count = result.chars().count();
    if char_count > 350 {
        let mut truncated: String = result.chars().take(347).collect();
        truncated.push_str("...");
        result = truncated;
    }

    result
}
