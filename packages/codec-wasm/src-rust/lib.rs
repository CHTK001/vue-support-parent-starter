// codec-wasm - Rust implementation of encryption/decryption algorithms
// Using wasm-bindgen to expose functions to JavaScript

use wasm_bindgen::prelude::*;
use sm4::{Sm4, Mode};
use getrandom::getrandom;
use serde::{Deserialize, Serialize};

// Utility functions for string conversion
fn string_to_bytes(s: &str) -> Vec<u8> {
    s.as_bytes().to_vec()
}

fn bytes_to_string(bytes: Vec<u8>) -> String {
    String::from_utf8_lossy(&bytes).to_string()
}

// SM2 encryption
#[wasm_bindgen]
pub fn sm2_encrypt(data: &str, public_key: &str) -> String {
    use libsm::sm2::signature::SigCtx;
    use libsm::sm2::ecc::Point;
    use hex::decode;
    
    // In a real implementation, we would use the public key to encrypt the data
    // For now, we'll use a placeholder that demonstrates the interface
    // A full implementation would require parsing the public key and using it for encryption
    
    // This is a simplified placeholder implementation
    format!("sm2_encrypted_{}_with_{}", data, public_key)
}

// SM2 decryption
#[wasm_bindgen]
pub fn sm2_decrypt(encrypted_data: &str, private_key: &str) -> String {
    use libsm::sm2::signature::SigCtx;
    use hex::decode;
    
    // In a real implementation, we would use the private key to decrypt the data
    // For now, we'll use a placeholder that demonstrates the interface
    // A full implementation would require parsing the private key and using it for decryption
    
    // This is a simplified placeholder implementation
    // In reality, we would parse the encrypted_data and decrypt it using the private key
    if encrypted_data.starts_with("sm2_encrypted_") {
        // Extract the original data from our placeholder format
        if let Some(data_start) = encrypted_data.find('_') {
            if let Some(key_start) = encrypted_data.find("_with_") {
                let original_data = &encrypted_data[data_start+1..key_start];
                return original_data.to_string();
            }
        }
    }
    
    // If we can't parse our placeholder format, return the encrypted data as-is
    encrypted_data.to_string()
}

// SM2 decryption with cipher mode
#[wasm_bindgen]
pub fn sm2_decrypt_with_mode(encrypted_data: &str, private_key: &str, cipher_mode: i32) -> String {
    // For now, we ignore the cipher_mode and just call sm2_decrypt
    // A full implementation would use the cipher_mode parameter
    sm2_decrypt(encrypted_data, private_key)
}

// SM2 key generation
#[wasm_bindgen]
pub fn sm2_generate_keypair() -> String {
    use libsm::sm2::signature::SigCtx;
    
    // In a real implementation, we would generate a keypair and return it
    // For now, we'll use a placeholder that demonstrates the interface
    "sm2_keypair_placeholder".to_string()
}

// SM3 hash
#[wasm_bindgen]
pub fn sm3_hash(data: &str) -> String {
    use sm3::{Sm3, Digest};
    
    let mut hasher = Sm3::new();
    hasher.update(data.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

// SM4 encryption
#[wasm_bindgen]
pub fn sm4_encrypt(data: &str, key: &str) -> String {
    // Convert key to 16 bytes
    let mut key_bytes = [0u8; 16];
    let key_data = key.as_bytes();
    let len = std::cmp::min(key_bytes.len(), key_data.len());
    key_bytes[..len].copy_from_slice(&key_data[..len]);
    
    let sm4 = Sm4::new(&key_bytes, Mode::Cbc);
    let plaintext = data.as_bytes();
    let mut ciphertext = vec![0u8; plaintext.len() + 16]; // Add padding space
    
    // Generate a random IV
    let mut iv = [0u8; 16];
    getrandom(&mut iv).expect("Failed to generate random IV");
    
    let encrypted_len = sm4.encrypt(plaintext, &mut ciphertext, &iv);
    let encrypted_data = &ciphertext[..encrypted_len];
    
    // Combine IV and encrypted data
    let mut result = iv.to_vec();
    result.extend_from_slice(encrypted_data);
    
    hex::encode(result)
}

// SM4 decryption
#[wasm_bindgen]
pub fn sm4_decrypt(encrypted_data: &str, key: &str) -> String {
    // Parse the hex encoded data
    let data = hex::decode(encrypted_data).unwrap_or_default();
    
    if data.len() < 16 {
        return String::new();
    }
    
    // Extract IV and ciphertext
    let iv = &data[..16];
    let ciphertext = &data[16..];
    
    // Convert key to 16 bytes
    let mut key_bytes = [0u8; 16];
    let key_data = key.as_bytes();
    let len = std::cmp::min(key_bytes.len(), key_data.len());
    key_bytes[..len].copy_from_slice(&key_data[..len]);
    
    let sm4 = Sm4::new(&key_bytes, Mode::Cbc);
    let mut plaintext = vec![0u8; ciphertext.len()];
    
    let decrypted_len = sm4.decrypt(ciphertext, &mut plaintext, iv);
    bytes_to_string(plaintext[..decrypted_len].to_vec())
}

// AES encryption (using SM4 as placeholder)
#[wasm_bindgen]
pub fn aes_encrypt(data: &str, key: &str) -> String {
    sm4_encrypt(data, key)
}

// AES decryption (using SM4 as placeholder)
#[wasm_bindgen]
pub fn aes_decrypt(encrypted_data: &str, key: &str) -> String {
    sm4_decrypt(encrypted_data, key)
}

// Generate random nonce
#[wasm_bindgen]
pub fn generate_nonce() -> String {
    let mut bytes = [0u8; 16];
    getrandom(&mut bytes).expect("Failed to generate random bytes");
    hex::encode(bytes)
}

// MD5 hash
#[wasm_bindgen]
pub fn md5_hash(input: &str) -> String {
    use md5::{Md5, Digest};
    
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

// Add two numbers
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Get current timestamp
#[wasm_bindgen]
pub fn get_current_timestamp() -> f64 {
    js_sys::Date::now()
}

// uu2 function - request encryption
#[wasm_bindgen]
pub fn uu2(request_data: &str, request_url: &str, config_open: bool, codec_request_key: &str) -> String {
    // Check if request URL starts with "/v2/setting"
    if request_url.starts_with("/v2/setting") {
        return request_data.to_string();
    }
    
    // Check if body is empty
    if request_data.is_empty() {
        return request_data.to_string();
    }
    
    // Check if encryption is enabled and key is provided
    if !config_open || codec_request_key.is_empty() {
        return request_data.to_string();
    }
    
    // In the original TypeScript code, there's logic to check if the body contains File or Blob objects
    // For simplicity in this Rust implementation, we'll assume it's a regular JSON object
    
    // Encrypt the data using SM4
    let encrypted_data = sm4_encrypt(request_data, codec_request_key);
    
    // Return the encrypted data in the expected format
    format!("{{\"data\":\"{}\"}}", encrypted_data)
}

// uu1 function - response decryption
#[wasm_bindgen]
pub fn uu1(response_status: i32, response_data: &str, origin_key: &str, timestamp: &str) -> String {
    // Check if status is 200
    if response_status != 200 {
        return response_data.to_string();
    }
    
    // Parse response data to extract the actual data
    // In the original code, this is response.data?.data || response.data
    let data = response_data;
    
    // Check if data is a string
    if !data.starts_with("\"") && !data.starts_with("{") && !data.starts_with("[") {
        // If data is not a string, return the original response
        return response_data.to_string();
    }
    
    // Extract the actual string content if it's JSON-encoded
    let actual_data = if data.starts_with("\"") && data.ends_with("\"") {
        // Remove surrounding quotes
        &data[1..data.len()-1]
    } else {
        data
    };
    
    // Check if data starts with "02"
    if actual_data.len() < 2 || !actual_data.starts_with("02") {
        return response_data.to_string();
    }
    
    // Check if origin key exists
    if origin_key.is_empty() {
        return response_data.to_string();
    }
    
    // Decrypt origin key with timestamp using AES
    let decrypted_origin_key = aes_decrypt(origin_key, timestamp);
    
    // Extract encrypted data (skip first 8 chars and last 4 chars)
    if actual_data.len() <= 12 {
        return response_data.to_string();
    }
    
    let encrypted_data = &actual_data[8..actual_data.len() - 4];
    
    // Check if encrypted data is empty
    if encrypted_data.is_empty() {
        return response_data.to_string();
    }
    
    // Decrypt data using SM2
    let decrypted_data = sm2_decrypt_with_mode(encrypted_data, &decrypted_origin_key, 0);
    
    // Return the decrypted data
    decrypted_data
}

// uu3 function - simple AES decryption
#[wasm_bindgen]
pub fn uu3(value: &str) -> String {
    // Use default key as in the original TypeScript code
    let default_key = "1234567890Oil#@1";
    aes_decrypt(value, default_key)
}

// uu4 function - special response decryption
#[wasm_bindgen]
pub fn uu4(response_data: &str, uuid: &str, timestamp: &str) -> String {
    // Check if data starts with "02"
    if response_data.len() < 2 || !response_data.starts_with("02") {
        return "{}".to_string();
    }
    
    // Check if uuid exists
    if uuid.is_empty() {
        return "{}".to_string();
    }
    
    // Decrypt uuid with timestamp using AES
    let decrypted_uuid = aes_decrypt(uuid, timestamp);
    
    // Extract encrypted data (skip first 8 chars and last 4 chars)
    if response_data.len() <= 12 {
        return "{}".to_string();
    }
    
    let encrypted_data = &response_data[8..response_data.len() - 4];
    
    // Check if encrypted data is empty
    if encrypted_data.is_empty() {
        return "{}".to_string();
    }
    
    // Decrypt data using SM2
    let decrypted_data = sm2_decrypt_with_mode(encrypted_data, &decrypted_uuid, 0);
    
    // Return the decrypted data
    decrypted_data
}

// processRequest function
#[wasm_bindgen]
pub fn process_request(request_data: &str, request_url: &str, codec_config: &str, codec_key: &str) -> String {
    // Placeholder implementation
    format!("processed_request_{}_{}_{}_{}", request_data, request_url, codec_config, codec_key)
}

// processResponse function
#[wasm_bindgen]
pub fn process_response(response_data: &str, origin_key: &str, timestamp: &str) -> String {
    // Placeholder implementation
    format!("processed_response_{}_{}_{}", response_data, origin_key, timestamp)
}

// generateSign function
#[wasm_bindgen]
pub fn generate_sign(params_json: &str, timestamp: f64, nonce: &str, secret_key: &str) -> String {
    // Placeholder implementation for signature generation
    format!("signature_{}_{}_{}_{}", params_json, timestamp, nonce, secret_key)
}