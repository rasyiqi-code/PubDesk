//! Shared types for the PubDesk sync engine.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub peer_id: String,
    pub source: String,
}

/// A single operation to be replicated to peers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncOperation {
    /// Globally unique operation ID. Format recommended: <device_id>:<nanosecond-timestamp>:<counter>
    pub op_id: String,
    /// Logical clock / wall-clock timestamp in RFC3339.
    pub timestamp: String,
    /// Device that originated this operation.
    pub device_id: String,
    /// Table being modified.
    pub table: String,
    /// Primary key of the row (as string, supports integer or text keys).
    pub row_id: String,
    /// Action type.
    pub action: SyncAction,
    /// Column values after the change (for INSERT/UPDATE). For DELETE this is usually empty.
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum SyncAction {
    Insert,
    Update,
    Delete,
}

/// Wrapper sent over the wire: encrypted payload + a short header for routing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEnvelope {
    pub workspace_id: String,
    /// base64-encoded encrypted payload.
    pub payload_b64: String,
}

/// Status reported to the UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub enabled: bool,
    pub workspace_id: Option<String>,
    pub local_peer_id: String,
    pub connected_peers: Vec<PeerInfo>,
    pub pending_outbox_count: i64,
    pub last_sync_at: Option<String>,
    pub error: Option<String>,
}

/// Configuration stored in p2p_config / local DB.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SyncConfig {
    pub enabled: bool,
    pub device_id: Option<String>,
    pub workspace_id: Option<String>,
    pub admin_setup_complete: bool,
}
