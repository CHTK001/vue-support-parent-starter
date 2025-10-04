// codec-wasm - Rust implementation of encryption/decryption algorithms
// Directly exporting functions for WebAssembly without wasm-bindgen

use std::alloc::{alloc as rust_alloc, dealloc as rust_dealloc, Layout};
use getrandom;
use sm3::Digest; // 导入Digest trait
use base64::{engine::general_purpose, Engine as _};
use aes::Aes128;
use cbc::{Decryptor, Encryptor};
use aes::cipher::{KeyIvInit, BlockEncryptMut, BlockDecryptMut};
use block_padding::Pkcs7;
use generic_array::GenericArray;
// 暂时注释掉SM4相关代码，解决版本冲突问题
// use sm4::Sm4;
// use sm4::cipher::{BlockEncryptMut as Sm4BlockEncryptMut, BlockDecryptMut as Sm4BlockDecryptMut};

// We need to add memory management functions for WASM
#[export_name = "alloc"]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    if size == 0 {
        return std::ptr::null_mut();
    }
    
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { rust_alloc(layout) }
}

#[export_name = "dealloc"]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if ptr.is_null() || size == 0 {
        return;
    }
    
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { rust_dealloc(ptr, layout) }
}

// String utilities
fn string_from_ptr(ptr: *const u8, len: usize) -> String {
    unsafe {
        let slice = std::slice::from_raw_parts(ptr, len);
        String::from_utf8_lossy(slice).into_owned()
    }
}

fn string_to_ptr(s: &str) -> *mut u8 {
    let bytes = s.as_bytes();
    let len = bytes.len();
    let ptr = alloc(len);
    if ptr.is_null() {
        return ptr;
    }
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), ptr, len);
    }
    ptr
}

// AES encryption function - 使用标准AES加密
#[export_name = "aesEncrypt"]
pub extern "C" fn aes_encrypt_wrapper(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    let key_str = string_from_ptr(key_ptr, key_len);
    
    // 将密钥转换为16字节的数组（AES-128需要16字节密钥）
    let mut key_bytes = [0u8; 16];
    let key_data = key_str.as_bytes();
    let copy_len = std::cmp::min(key_data.len(), 16);
    key_bytes[..copy_len].copy_from_slice(&key_data[..copy_len]);
    
    // 生成随机IV（16字节）
    let mut iv = [0u8; 16];
    getrandom::getrandom(&mut iv).expect("Failed to generate random IV");
    
    // 创建加密器，使用GenericArray包装密钥和IV
    let key_array = GenericArray::from_slice(&key_bytes);
    let iv_array = GenericArray::from_slice(&iv);
    let encryptor = Encryptor::<Aes128>::new(key_array, iv_array);
    
    // 准备数据缓冲区（需要考虑PKCS7填充）
    let data_bytes = data.as_bytes();
    let mut buffer = vec![0u8; data_bytes.len() + 16]; // 多分配16字节以确保足够空间
    buffer[..data_bytes.len()].copy_from_slice(data_bytes);
    
    // 执行加密
    let encrypted_data = encryptor.encrypt_padded_mut::<Pkcs7>(&mut buffer, data_bytes.len())
        .expect("Encryption failed");
    
    // 将IV和加密数据组合在一起
    let mut result = Vec::new();
    result.extend_from_slice(&iv); // 先添加IV
    result.extend_from_slice(encrypted_data); // 再添加加密数据
    
    // 将结果转换为Base64编码
    let encoded = general_purpose::STANDARD.encode(&result);
    
    // 直接返回字符串指针
    string_to_ptr(&encoded)
}

// AES decryption function - 对Base64解码后执行标准AES解密
#[export_name = "aesDecrypt"]
pub extern "C" fn aes_decrypt_wrapper(encrypted_data_ptr: *const u8, encrypted_data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let encrypted_data_str = string_from_ptr(encrypted_data_ptr, encrypted_data_len);
    let key_str = string_from_ptr(key_ptr, key_len);
    
    // 解码Base64
    let encrypted_data_with_iv = match general_purpose::STANDARD.decode(&encrypted_data_str) {
        Ok(data) => data,
        Err(_) => {
            // 解码失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 检查数据长度是否足够（至少包含IV和一些加密数据）
    if encrypted_data_with_iv.len() < 16 {
        return string_to_ptr("");
    }
    
    // 提取IV和加密数据
    let iv = &encrypted_data_with_iv[..16];
    let encrypted_data = &encrypted_data_with_iv[16..];
    
    // 将密钥转换为16字节的数组（AES-128需要16字节密钥）
    let mut key_bytes = [0u8; 16];
    let key_data = key_str.as_bytes();
    let copy_len = std::cmp::min(key_data.len(), 16);
    key_bytes[..copy_len].copy_from_slice(&key_data[..copy_len]);
    
    // 创建解密器，使用GenericArray包装密钥和IV
    let key_array = GenericArray::from_slice(&key_bytes);
    let iv_array = GenericArray::from_slice(iv);
    let decryptor = Decryptor::<Aes128>::new(key_array, iv_array);
    
    // 准备解密缓冲区
    let mut buffer = vec![0u8; encrypted_data.len()];
    buffer.copy_from_slice(encrypted_data);
    
    // 执行解密
    let decrypted_data = match decryptor.decrypt_padded_mut::<Pkcs7>(&mut buffer) {
        Ok(data) => data,
        Err(_) => {
            // 解密失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 将解密结果转换为字符串
    let decrypted_str = match String::from_utf8(decrypted_data.to_vec()) {
        Ok(s) => s,
        Err(_) => {
            // UTF-8转换失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 直接返回字符串指针
    string_to_ptr(&decrypted_str)
}

// SM3 hash function
#[export_name = "sm3_hash"]
pub extern "C" fn sm3_hash_wrapper(data_ptr: *const u8, data_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    
    // 使用sm3库进行SM3哈希
    let mut hasher = sm3::Sm3::new();
    hasher.update(data.as_bytes());
    let hash = hasher.finalize();
    let hex_hash = hex::encode(hash);
    
    // 将结果字符串转换为C风格的字符串指针并返回
    // 这样JavaScript端可以直接使用该指针读取结果
    let result_bytes = hex_hash.as_bytes();
    let result_len = result_bytes.len();
    
    // 分配内存
    let ptr = alloc(result_len);
    if ptr.is_null() {
        return ptr;
    }
    
    // 复制数据到分配的内存
    unsafe {
        std::ptr::copy_nonoverlapping(result_bytes.as_ptr(), ptr, result_len);
    }
    
    ptr
}

#[export_name = "add"]
pub extern "C" fn add_wrapper(a: i32, b: i32) -> i32 {
    a + b
}

#[export_name = "get_current_timestamp"]
pub extern "C" fn get_current_timestamp_wrapper() -> f64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    
    let now = SystemTime::now();
    let since_epoch = now.duration_since(UNIX_EPOCH).expect("Time went backwards");
    since_epoch.as_millis() as f64
}

// uu2 function - request encryption
#[export_name = "uu2"]
pub extern "C" fn uu2_wrapper(_request_data_ptr: *const u8, _request_data_len: usize, _request_url_ptr: *const u8, _request_url_len: usize, config_open: i32, _codec_request_key_ptr: *const u8, _codec_request_key_len: usize) -> i32 {
    // Simple implementation for demonstration
    if config_open != 0 {
        (_request_data_len as i32) ^ (_codec_request_key_len as i32)
    } else {
        _request_data_len as i32
    }
}

// uu1 function - response decryption
#[export_name = "uu1"]
pub extern "C" fn uu1_wrapper(response_status: i32, _response_data_ptr: *const u8, _response_data_len: usize, _origin_key_ptr: *const u8, _origin_key_len: usize, _timestamp_ptr: *const u8, _timestamp_len: usize) -> i32 {
    // Simple implementation for demonstration
    if response_status == 200 {
        (_response_data_len as i32) ^ (_origin_key_len as i32)
    } else {
        _response_data_len as i32
    }
}

// uu3 function - simple AES decryption
#[export_name = "uu3"]
pub extern "C" fn uu3_wrapper(_value_ptr: *const u8, _value_len: usize) -> i32 {
    // Use default key transformation
    let default_key = 1234567890;
    (_value_len as i32) ^ default_key
}

// uu4 function - special response decryption
#[export_name = "uu4"]
pub extern "C" fn uu4_wrapper(_response_data_ptr: *const u8, _response_data_len: usize, _uuid_ptr: *const u8, _uuid_len: usize, _timestamp_ptr: *const u8, _timestamp_len: usize) -> i32 {
    // Simple implementation for demonstration
    (_response_data_len as i32) ^ (_uuid_len as i32) ^ (_timestamp_len as i32)
}

// processRequest function
#[export_name = "process_request"]
pub extern "C" fn process_request_wrapper(_request_data_ptr: *const u8, _request_data_len: usize, _request_url_ptr: *const u8, _request_url_len: usize, _codec_config: i32, _codec_key_ptr: *const u8, _codec_key_len: usize) -> i32 {
    // Simple implementation for demonstration
    (_request_data_len as i32) ^ (_codec_key_len as i32)
}

// processResponse function
#[export_name = "process_response"]
pub extern "C" fn process_response_wrapper(_response_data_ptr: *const u8, _response_data_len: usize, _origin_key_ptr: *const u8, _origin_key_len: usize, _timestamp_ptr: *const u8, _timestamp_len: usize) -> i32 {
    // Simple implementation for demonstration
    (_response_data_len as i32) ^ (_origin_key_len as i32)
}

// generateSign function
#[export_name = "generate_sign"]
pub extern "C" fn generate_sign_wrapper(_params_json_ptr: *const u8, _params_json_len: usize, _timestamp: f64, _nonce_ptr: *const u8, _nonce_len: usize, _secret_key_ptr: *const u8, _secret_key_len: usize) -> i32 {
    // Simple implementation for demonstration
    (_params_json_len as i32) ^ (_nonce_len as i32) ^ (_secret_key_len as i32)
}

// encryptStorageKey function
#[export_name = "encrypt_storage_key"]
pub extern "C" fn encrypt_storage_key_wrapper(_key_ptr: *const u8, _key_len: usize, _system_code_ptr: *const u8, _system_code_len: usize) -> i32 {
    // Simple implementation for demonstration
    (_key_len as i32) ^ (_system_code_len as i32)
}

// encryptStorageValue function
#[export_name = "encrypt_storage_value"]
pub extern "C" fn encrypt_storage_value_wrapper(_value_ptr: *const u8, _value_len: usize, _key_ptr: *const u8, _key_len: usize, _system_code_ptr: *const u8, _system_code_len: usize, _storage_key_ptr: *const u8, _storage_key_len: usize, _storage_encode_ptr: *const u8, _storage_encode_len: usize) -> i32 {
    // Simple implementation for demonstration
    (_value_len as i32) ^ (_key_len as i32)
}

// decryptStorageValue function
#[export_name = "decrypt_storage_value"]
pub extern "C" fn decrypt_storage_value_wrapper(_value_ptr: *const u8, _value_len: usize, _key_ptr: *const u8, _key_len: usize, _system_code_ptr: *const u8, _system_code_len: usize, _storage_key_ptr: *const u8, _storage_key_len: usize, _storage_encode_ptr: *const u8, _storage_encode_len: usize) -> i32 {
    // Simple implementation for demonstration
    (_value_len as i32) ^ (_key_len as i32)
}

// generateNonce function
#[export_name = "generate_nonce"]
pub extern "C" fn generate_nonce_wrapper() -> i32 {
    // 使用getrandom crate生成随机数
    let mut buf = [0u8; 4];
    getrandom::getrandom(&mut buf).expect("Failed to generate random number");
    i32::from_le_bytes(buf)
}