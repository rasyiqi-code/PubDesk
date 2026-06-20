use std::path::Path;
use std::io::Read;
use std::fs::File as StdFile;
use sha2::{Sha256, Digest};

#[allow(dead_code)]
pub fn calculate_sha256(path: &Path) -> Result<String, String> {
    let mut file = StdFile::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 4096];
    loop {
        let count = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}
