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
