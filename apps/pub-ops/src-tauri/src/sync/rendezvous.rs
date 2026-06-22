//! Lightweight rendezvous via Cloudflare Worker (free tier compatible).
//!
//! This module registers our peer addresses and fetches other peers in the
//! same workspace. Actual sync data never touches the Worker.

use serde::{Deserialize, Serialize};

const DEFAULT_RENDEZVOUS_URL: &str = "https://pubdesk-rendezvous.retaslintasbatas.workers.dev";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerRecord {
    pub peer_id: String,
    pub addresses: Vec<String>,
    #[serde(default)]
    pub ts: i64,
}

/// Register this peer's public addresses with the rendezvous server.
pub async fn register(
    client: &reqwest::Client,
    base_url: &str,
    workspace_id: &str,
    peer_id: &str,
    addresses: &[String],
) -> Result<(), String> {
    if base_url.is_empty() {
        return Ok(());
    }
    let url = format!("{}/register", base_url.trim_end_matches('/'));
    let body = serde_json::json!({
        "workspace_id": workspace_id,
        "peer_id": peer_id,
        "addresses": addresses,
    });
    let res = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Rendezvous register failed: {}", e))?;
    if !res.status().is_success() {
        return Err(format!("Rendezvous register returned {}", res.status()));
    }
    Ok(())
}

/// Fetch peer records for a workspace.
pub async fn fetch_peers(
    client: &reqwest::Client,
    base_url: &str,
    workspace_id: &str,
) -> Result<Vec<PeerRecord>, String> {
    if base_url.is_empty() {
        return Ok(vec![]);
    }
    let url = format!("{}/peers/{}", base_url.trim_end_matches('/'), workspace_id);
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Rendezvous fetch failed: {}", e))?;
    if !res.status().is_success() {
        return Err(format!("Rendezvous fetch returned {}", res.status()));
    }
    let peers: Vec<PeerRecord> = res
        .json()
        .await
        .map_err(|e| format!("Rendezvous parse failed: {}", e))?;
    Ok(peers)
}

/// Read the configured rendezvous URL from the local DB, if any.
pub fn get_rendezvous_url(conn: &rusqlite::Connection) -> String {
    conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'sync_rendezvous_url'",
        [],
        |row| row.get::<_, String>(0),
    )
    .unwrap_or_else(|_| DEFAULT_RENDEZVOUS_URL.to_string())
}

/// Save a rendezvous URL.
pub fn set_rendezvous_url(conn: &rusqlite::Connection, url: &str) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT OR REPLACE INTO p2p_config (key, value) VALUES ('sync_rendezvous_url', ?1)",
        [url],
    )?;
    Ok(())
}
