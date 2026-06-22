//! Enkripsi untuk sinkronisasi P2P PubDesk.
//!
//! Model keamanan:
//! - Ada satu master key 256-bit per workspace.
//! - Master key di-encrypt dengan PIN (admin/employee) lalu disimpan di crypto_vault.
//! - Semua pesan sync di-encrypt dengan AES-256-GCM menggunakan kunci turunan dari master key.
//! - PIN sendiri tidak pernah disimpan plain text.

use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use hkdf::Hkdf;
use pbkdf2::pbkdf2_hmac;
use sha2::{Digest, Sha256};

pub const VAULT_SALT_SIZE: usize = 16;
pub const KEY_SIZE: usize = 32;
pub const NONCE_SIZE: usize = 12;

/// Derive a 256-bit key from a UTF-8 PIN + random salt using PBKDF2-HMAC-SHA256.
pub fn derive_key_from_pin(pin: &str, salt: &[u8]) -> [u8; KEY_SIZE] {
    let mut key = [0u8; KEY_SIZE];
    pbkdf2_hmac::<Sha256>(pin.as_bytes(), salt, 200_000, &mut key);
    key
}

/// Generate a random 256-bit master key.
pub fn generate_master_key() -> [u8; KEY_SIZE] {
    let mut key = [0u8; KEY_SIZE];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut key);
    key
}

/// Encrypt a plaintext payload with AES-256-GCM using the given key.
/// Returns (nonce || ciphertext || tag) as a single byte vector.
pub fn encrypt_with_key(key: &[u8; KEY_SIZE], plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| format!("Invalid key length: {:?}", e))?;
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|e| format!("Encryption failed: {:?}", e))?;
    let mut out = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    out.extend_from_slice(nonce.as_slice());
    out.extend_from_slice(&ciphertext);
    Ok(out)
}

/// Decrypt a (nonce || ciphertext || tag) payload.
pub fn decrypt_with_key(key: &[u8; KEY_SIZE], encrypted: &[u8]) -> Result<Vec<u8>, String> {
    if encrypted.len() < NONCE_SIZE {
        return Err("Encrypted payload too short".to_string());
    }
    let nonce = Nonce::from_slice(&encrypted[..NONCE_SIZE]);
    let ciphertext = &encrypted[NONCE_SIZE..];
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| format!("Invalid key length: {:?}", e))?;
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed (wrong PIN/key?): {:?}", e))
}

/// Encrypt a master key with a PIN-derived key.
/// Returns (salt || nonce || ciphertext) as base64.
pub fn seal_master_key_with_pin(master_key: &[u8; KEY_SIZE], pin: &str) -> String {
    let mut salt = [0u8; VAULT_SALT_SIZE];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut salt);
    let kek = derive_key_from_pin(pin, &salt);
    let encrypted = encrypt_with_key(&kek, master_key).expect("encrypt master key");
    let mut combined = Vec::with_capacity(VAULT_SALT_SIZE + encrypted.len());
    combined.extend_from_slice(&salt);
    combined.extend_from_slice(&encrypted);
    base64::Engine::encode(&base64::prelude::BASE64_STANDARD, &combined)
}

/// Decrypt a master key from base64 (salt || nonce || ciphertext).
pub fn unseal_master_key_with_pin(sealed: &str, pin: &str) -> Result<[u8; KEY_SIZE], String> {
    let combined = base64::Engine::decode(&base64::prelude::BASE64_STANDARD, sealed)
        .map_err(|e| format!("Invalid base64: {}", e))?;
    if combined.len() < VAULT_SALT_SIZE + NONCE_SIZE + 1 {
        return Err("Sealed key too short".to_string());
    }
    let salt = &combined[..VAULT_SALT_SIZE];
    let encrypted = &combined[VAULT_SALT_SIZE..];
    let kek = derive_key_from_pin(pin, salt);
    let plaintext = decrypt_with_key(&kek, encrypted)?;
    if plaintext.len() != KEY_SIZE {
        return Err("Decrypted master key has wrong length".to_string());
    }
    let mut key = [0u8; KEY_SIZE];
    key.copy_from_slice(&plaintext);
    Ok(key)
}

/// Derive a workspace identifier from the master key (public, not secret).
pub fn workspace_id_from_master_key(master_key: &[u8; KEY_SIZE]) -> String {
    let hash = Sha256::digest(master_key);
    hex::encode(&hash[..16])
}

/// Derive a sync message encryption key from the master key via HKDF-SHA256.
pub fn derive_sync_message_key(master_key: &[u8; KEY_SIZE]) -> [u8; KEY_SIZE] {
    let hkdf = Hkdf::<Sha256>::new(None, master_key);
    let mut okm = [0u8; KEY_SIZE];
    // This context string separates sync-message encryption from other derived keys.
    hkdf.expand(b"pubdesk-sync-message-v1", &mut okm)
        .expect("HKDF expand to 32 bytes");
    okm
}

/// Encrypt a sync message (typically JSON) for transport.
pub fn encrypt_sync_message(master_key: &[u8; KEY_SIZE], plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let key = derive_sync_message_key(master_key);
    encrypt_with_key(&key, plaintext)
}

/// Decrypt a sync message received from transport.
pub fn decrypt_sync_message(master_key: &[u8; KEY_SIZE], encrypted: &[u8]) -> Result<Vec<u8>, String> {
    let key = derive_sync_message_key(master_key);
    decrypt_with_key(&key, encrypted)
}

/// Hash a PIN for local verification (not for encryption).
/// Uses a static salt per workspace? In this design we use the same PBKDF2
/// flow with a stored random salt; verification compares sealed master key.
pub fn hash_pin(pin: &str, salt: &[u8]) -> [u8; KEY_SIZE] {
    derive_key_from_pin(pin, salt)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pin_master_key_roundtrip() {
        let master = generate_master_key();
        let pin = "123456";
        let sealed = seal_master_key_with_pin(&master, pin);
        let recovered = unseal_master_key_with_pin(&sealed, pin).unwrap();
        assert_eq!(master, recovered);
    }

    #[test]
    fn test_sync_message_roundtrip() {
        let master = generate_master_key();
        let msg = br#"{"table":"contacts","action":"INSERT"}"#;
        let encrypted = encrypt_sync_message(&master, msg).unwrap();
        let decrypted = decrypt_sync_message(&master, &encrypted).unwrap();
        assert_eq!(msg.to_vec(), decrypted);
    }
}
