//! Archive parsing WASM module for frontend file preview
//!
//! This is a reference Rust implementation. The project currently uses
//! the `archive-wasm` npm package (libarchive compiled to WASM) for runtime.
//! This Rust code is preserved for:
//! - Future native compilation without external dependencies
//! - Extending with custom archive features
//! - Reference for the API contract
//!
//! Build with: `wasm-pack build --target web`

use serde::Serialize;
use wasm_bindgen::prelude::*;

mod error;
mod scanner;
mod utils;

pub use scanner::{scan_archive, extract_entry, ArchiveScanResponse, ArchiveEntryInfo};

/// Initialize the WASM module with enhanced error reporting.
#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();
}

/// Scan an archive and return its contents as a JSON string.
///
/// # Arguments
/// * `data` - Raw archive bytes
/// * `format` - Archive format extension (e.g., "zip", "tar.gz")
///
/// # Returns
/// JSON string with the archive structure, or an error if parsing fails.
/// The JSON structure matches the backend's `?format=archive` response format.
#[wasm_bindgen]
pub fn scanZip(data: &[u8], format: &str) -> Result<String, String> {
    match scan_archive(data, format) {
        Ok(response) => serde_json::to_string(&response)
            .map_err(|e| format!("JSON serialization error: {}", e)),
        Err(e) => Err(e.to_string()),
    }
}

/// Extract a specific entry from an archive by path.
///
/// # Arguments
/// * `data` - Raw archive bytes
/// * `format` - Archive format extension
/// * `entryPath` - Path of the entry within the archive
///
/// # Returns
/// Uint8Array of the entry content, or an error message string.
#[wasm_bindgen]
pub fn extractEntry(data: &[u8], format: &str, entryPath: &str) -> Result<Vec<u8>, String> {
    match extract_entry(data, format, entryPath) {
        Ok(bytes) => Ok(bytes),
        Err(e) => Err(e.to_string()),
    }
}

/// Check if the given data looks like a supported archive format.
///
/// # Arguments
/// * `data` - File bytes (first few bytes are enough)
/// * `format` - File extension to check
///
/// # Returns
/// true if the header matches expected magic bytes for the format
#[wasm_bindgen]
pub fn isArchive(data: &[u8], format: &str) -> bool {
    utils::is_archive_magic(data, format)
}