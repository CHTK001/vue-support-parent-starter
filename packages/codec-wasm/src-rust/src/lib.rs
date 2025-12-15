//! WASM 加密模块 - Rust 实现
//! 提供 SM2/SM3/SM4/AES/MD5 等加密算法

use std::alloc::{alloc as rust_alloc, dealloc as rust_dealloc, Layout};
use wasm_bindgen::prelude::*;
use js_sys::Reflect;
use sm3::Digest;
use base64::{engine::general_purpose, Engine};
use sm2::SecretKey;
use sm2::elliptic_curve::sec1::ToEncodedPoint;
use smcrypto::sm2::{Encrypt, Decrypt};

// ============ 内存管理 ============

#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    if size == 0 { return std::ptr::null_mut(); }
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { rust_alloc(layout) }
}

#[wasm_bindgen]
pub fn dealloc(ptr: *mut u8, size: usize) {
    if ptr.is_null() || size == 0 { return; }
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { rust_dealloc(ptr, layout) }
}

// ============ 字符串工具 ============

fn str_from_ptr(ptr: *const u8, len: usize) -> String {
    if ptr.is_null() || len == 0 || len > 1_000_000 { return String::new(); }
    unsafe {
        let slice = std::slice::from_raw_parts(ptr, len);
        String::from_utf8_lossy(slice).into_owned()
    }
}

fn str_to_ptr(s: &str) -> *mut u8 {
    let bytes = s.as_bytes();
    let ptr = alloc(bytes.len() + 1);
    if ptr.is_null() { return ptr; }
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), ptr, bytes.len());
        std::ptr::write(ptr.add(bytes.len()), 0);
    }
    ptr
}

fn strlen(ptr: *mut u8) -> usize {
    if ptr.is_null() { return 0; }
    unsafe {
        let mut len = 0;
        while *ptr.add(len) != 0 { len += 1; }
        len
    }
}

fn to_16_key(key: &str) -> [u8; 16] {
    let mut arr = [0u8; 16];
    let bytes = key.as_bytes();
    let len = std::cmp::min(16, bytes.len());
    arr[..len].copy_from_slice(&bytes[..len]);
    arr
}

// ============ 哈希函数 ============

#[wasm_bindgen]
pub fn sm3_hash(data_ptr: *const u8, data_len: usize) -> *mut u8 {
    let data = str_from_ptr(data_ptr, data_len);
    let mut hasher = sm3::Sm3::new();
    hasher.update(data.as_bytes());
    str_to_ptr(&hex::encode(hasher.finalize()))
}

#[wasm_bindgen]
pub fn md5_hash(data_ptr: *const u8, data_len: usize) -> *mut u8 {
    let data = str_from_ptr(data_ptr, data_len);
    let mut hasher = md5::Md5::new();
    hasher.update(data.as_bytes());
    str_to_ptr(&hex::encode(hasher.finalize()))
}

// ============ AES 加解密 ============

#[wasm_bindgen]
pub fn aes_encrypt(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    use aes::cipher::{KeyInit, BlockEncryptMut, block_padding::Pkcs7};
    
    let data = str_from_ptr(data_ptr, data_len);
    let key = to_16_key(&str_from_ptr(key_ptr, key_len));
    let cipher = aes::Aes128Enc::new(&key.into());
    
    let data_bytes = data.as_bytes();
    let padded_len = ((data_bytes.len() + 15) / 16) * 16;
    let mut buffer = vec![0u8; padded_len + 16];
    buffer[..data_bytes.len()].copy_from_slice(data_bytes);
    
    let encrypted = cipher.encrypt_padded_mut::<Pkcs7>(&mut buffer, data_bytes.len())
        .expect("AES encryption failed");
    str_to_ptr(&general_purpose::STANDARD.encode(encrypted))
}

#[wasm_bindgen]
pub fn aes_decrypt(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    use aes::cipher::{KeyInit, BlockDecryptMut, block_padding::Pkcs7};
    
    let data = str_from_ptr(data_ptr, data_len);
    let key = to_16_key(&str_from_ptr(key_ptr, key_len));
    
    if data.is_empty() { return str_to_ptr(""); }
    
    let encrypted = match general_purpose::STANDARD.decode(&data) {
        Ok(b) if b.len() % 16 == 0 => b,
        _ => return str_to_ptr(""),
    };
    
    let cipher = aes::Aes128Dec::new(&key.into());
    let mut buffer = encrypted.clone();
    
    match cipher.decrypt_padded_mut::<Pkcs7>(&mut buffer) {
        Ok(decrypted) => str_to_ptr(&String::from_utf8_lossy(decrypted)),
        Err(_) => str_to_ptr(""),
    }
}

// ============ SM4 加解密 ============

#[wasm_bindgen]
pub fn sm4_encrypt(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    use sm4::cipher::{BlockEncrypt, NewBlockCipher};
    
    let data = str_from_ptr(data_ptr, data_len);
    let key = to_16_key(&str_from_ptr(key_ptr, key_len));
    let cipher = sm4::Sm4::new(&key.into());
    
    let data_bytes = data.as_bytes();
    let padded_len = ((data_bytes.len() + 15) / 16) * 16;
    let padding = padded_len - data_bytes.len();
    
    let mut padded = vec![0u8; padded_len];
    padded[..data_bytes.len()].copy_from_slice(data_bytes);
    for i in 0..padding { padded[data_bytes.len() + i] = padding as u8; }
    
    let mut encrypted = vec![0u8; padded_len];
    for (chunk, enc_chunk) in padded.chunks(16).zip(encrypted.chunks_mut(16)) {
        let mut block = [0u8; 16];
        block.copy_from_slice(chunk);
        cipher.encrypt_block((&mut block).into());
        enc_chunk.copy_from_slice(&block);
    }
    
    str_to_ptr(&hex::encode(&encrypted))
}

#[wasm_bindgen]
pub fn sm4_decrypt(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    use sm4::cipher::{BlockDecrypt, NewBlockCipher};
    
    let data = str_from_ptr(data_ptr, data_len);
    let key = to_16_key(&str_from_ptr(key_ptr, key_len));
    
    let encrypted = match hex::decode(&data) {
        Ok(b) if b.len() % 16 == 0 => b,
        _ => return str_to_ptr(""),
    };
    
    let cipher = sm4::Sm4::new(&key.into());
    let mut decrypted = vec![0u8; encrypted.len()];
    
    for (chunk, dec_chunk) in encrypted.chunks(16).zip(decrypted.chunks_mut(16)) {
        let mut block = [0u8; 16];
        block.copy_from_slice(chunk);
        cipher.decrypt_block((&mut block).into());
        dec_chunk.copy_from_slice(&block);
    }
    
    // 移除 PKCS7 填充
    if let Some(&pad) = decrypted.last() {
        if pad > 0 && pad <= 16 {
            decrypted.truncate(decrypted.len() - pad as usize);
        }
    }
    
    str_to_ptr(&String::from_utf8_lossy(&decrypted))
}

// ============ SM2 加解密 ============

#[wasm_bindgen]
pub fn generate_sm2_key_pair() -> *mut u8 {
    use sm2::elliptic_curve::rand_core::OsRng;
    
    let secret = SecretKey::random(&mut OsRng);
    let public = secret.public_key();
    
    let priv_hex = hex::encode(secret.to_bytes());
    let pub_hex = hex::encode(public.as_affine().to_encoded_point(false).as_bytes());
    
    str_to_ptr(&format!(r#"{{"privateKey":"{}","publicKey":"{}"}}"#, priv_hex, pub_hex))
}

#[wasm_bindgen]
pub fn sm2_encrypt(data_ptr: *const u8, data_len: usize, pubkey_ptr: *const u8, pubkey_len: usize) -> *mut u8 {
    let data = str_from_ptr(data_ptr, data_len);
    let pubkey = str_from_ptr(pubkey_ptr, pubkey_len);
    
    let ctx = Encrypt::new(&pubkey);
    str_to_ptr(&hex::encode(ctx.encrypt(data.as_bytes())))
}

#[wasm_bindgen]
pub fn sm2_decrypt(data_ptr: *const u8, data_len: usize, privkey_ptr: *const u8, privkey_len: usize) -> *mut u8 {
    let data = str_from_ptr(data_ptr, data_len);
    let privkey = str_from_ptr(privkey_ptr, privkey_len);
    
    let encrypted = match hex::decode(&data) {
        Ok(b) => b,
        Err(_) => return str_to_ptr(""),
    };
    
    let ctx = Decrypt::new(&privkey);
    let decrypted = ctx.decrypt_c1c2c3(&encrypted);
    
    str_to_ptr(&String::from_utf8(decrypted.clone())
        .unwrap_or_else(|_| String::from_utf8_lossy(&decrypted).into_owned()))
}

// ============ 签名函数 ============

#[wasm_bindgen]
pub fn generate_sign(data_ptr: *const u8, data_len: usize, privkey_ptr: *const u8, privkey_len: usize) -> *mut u8 {
    let data = str_from_ptr(data_ptr, data_len);
    let privkey = str_from_ptr(privkey_ptr, privkey_len);
    
    if data.is_empty() || privkey.is_empty() { return str_to_ptr(""); }
    
    let ctx = smcrypto::sm2::Sign::new(&privkey);
    str_to_ptr(&hex::encode(ctx.sign(data.as_bytes())))
}

#[wasm_bindgen]
pub fn verify_sign(
    data_ptr: *const u8, data_len: usize,
    sig_ptr: *const u8, sig_len: usize,
    pubkey_ptr: *const u8, pubkey_len: usize
) -> bool {
    let data = str_from_ptr(data_ptr, data_len);
    let sig = str_from_ptr(sig_ptr, sig_len);
    let pubkey = str_from_ptr(pubkey_ptr, pubkey_len);
    
    if data.is_empty() || sig.is_empty() || pubkey.is_empty() { return false; }
    
    let sig_bytes = match hex::decode(&sig) {
        Ok(b) => b,
        Err(_) => return false,
    };
    
    let ctx = smcrypto::sm2::Verify::new(&pubkey);
    ctx.verify(data.as_bytes(), &sig_bytes)
}

// ============ UU 系列函数 ============

#[wasm_bindgen]
pub fn uu3_decrypt_simple(data_ptr: *const u8, data_len: usize) -> *mut u8 {
    const KEY: &str = "1234567890Oil#@1";
    aes_decrypt(data_ptr, data_len, KEY.as_ptr(), KEY.len())
}

#[wasm_bindgen]
pub fn uu1_decrypt_response(
    data_ptr: *const u8, data_len: usize,
    _origin_ptr: *const u8, _origin_len: usize,
    ts_ptr: *const u8, ts_len: usize
) -> *mut u8 {
    let data = str_from_ptr(data_ptr, data_len);
    let ts = str_from_ptr(ts_ptr, ts_len);
    
    if !data.starts_with("02") { return str_to_ptr(""); }
    
    let key_len: usize = match ts.parse() {
        Ok(v) => v,
        Err(_) => return str_to_ptr(""),
    };
    
    if data.len() < 2 + key_len + 3 + 4 { return str_to_ptr(""); }
    
    let key = &data[2..2 + key_len];
    let encrypted = &data[2 + key_len + 3..data.len() - 4];
    let encrypted = if encrypted.len() > 2 { &encrypted[2..] } else { encrypted };
    
    let decrypted = match hex::decode(encrypted) {
        Ok(bytes) => {
            let ctx = Decrypt::new(key);
            let dec = ctx.decrypt_c1c2c3(&bytes);
            String::from_utf8(dec.clone()).unwrap_or_else(|_| String::from_utf8_lossy(&dec).into_owned())
        }
        Err(_) => String::new(),
    };
    
    str_to_ptr(&format!(r#"{{"data":"{}","success":true}}"#, decrypted.replace('"', "\\\"")))
}

#[wasm_bindgen]
pub fn uu1_decrypt_response_object(response: &JsValue) -> JsValue {
    let headers = match Reflect::get(response, &"headers".into()) {
        Ok(h) => h,
        Err(_) => return response.clone(),
    };
    
    let data = match Reflect::get(response, &"data".into()) {
        Ok(d) => d,
        Err(_) => return response.clone(),
    };
    
    let ts = Reflect::get(&headers, &"access-control-timestamp-user".into())
        .ok()
        .and_then(|v| v.as_string())
        .unwrap_or_default();
    
    let origin = Reflect::get(&headers, &"access-control-origin-key".into())
        .ok()
        .and_then(|v| v.as_string())
        .unwrap_or_default();
    
    let data_str = data.as_string().unwrap_or_else(|| {
        js_sys::JSON::stringify(&data).ok().map(|s| s.into()).unwrap_or_default()
    });
    
    if ts.is_empty() { return response.clone(); }
    
    let ptr = uu1_decrypt_response(
        data_str.as_ptr(), data_str.len(),
        origin.as_ptr(), origin.len(),
        ts.as_ptr(), ts.len()
    );
    
    let result = str_from_ptr(ptr, strlen(ptr));
    if result.is_empty() { return response.clone(); }
    
    let new_resp = response.clone();
    let _ = Reflect::set(&new_resp, &"data".into(), &result.into());
    new_resp
}

#[wasm_bindgen]
pub fn uu1_decrypt_response_object_with_arraybuffer(response: &JsValue) -> JsValue {
    if !response.is_object() { return response.clone(); }
    
    let headers = match Reflect::get(response, &"headers".into()) {
        Ok(h) if h.is_object() => h,
        _ => return response.clone(),
    };
    
    // 检查是否加密
    let no_data = Reflect::get(&headers, &"access-control-no-data".into()).unwrap_or(JsValue::UNDEFINED);
    let is_encrypted = no_data.as_string().map(|s| s.eq_ignore_ascii_case("true"))
        .or_else(|| no_data.as_bool())
        .unwrap_or(false);
    
    if !is_encrypted { return response.clone(); }
    
    let data = match Reflect::get(response, &"data".into()) {
        Ok(d) => d,
        Err(_) => return response.clone(),
    };
    
    // 处理 ArrayBuffer
    if js_sys::ArrayBuffer::instanceof(&data) || js_sys::Uint8Array::instanceof(&data) {
        let decode_fn = js_sys::Function::new_with_args("d", "try{return new TextDecoder('utf-8').decode(d)}catch{return''}");
        let data_str = match decode_fn.call1(&js_sys::global(), &data) {
            Ok(r) => r.as_string().unwrap_or_default(),
            Err(_) => return response.clone(),
        };
        
        if !data_str.starts_with("02") { return response.clone(); }
        
        let ts = Reflect::get(&headers, &"access-control-timestamp-user".into())
            .ok().and_then(|v| v.as_string()).unwrap_or_default();
        let origin = Reflect::get(&headers, &"access-control-origin-key".into())
            .ok().and_then(|v| v.as_string()).unwrap_or_default();
        
        let ptr = uu1_decrypt_response(
            data_str.as_ptr(), data_str.len(),
            origin.as_ptr(), origin.len(),
            ts.as_ptr(), ts.len()
        );
        
        let result = str_from_ptr(ptr, strlen(ptr));
        if result.is_empty() { return response.clone(); }
        
        let new_resp = response.clone();
        
        // 尝试解析 JSON
        if let Ok(parsed) = js_sys::JSON::parse(&result) {
            if let Ok(inner) = Reflect::get(&parsed, &"data".into()) {
                let final_data = if let Some(s) = inner.as_string() {
                    js_sys::JSON::parse(&s).unwrap_or(s.into())
                } else {
                    inner
                };
                let _ = Reflect::set(&new_resp, &"data".into(), &final_data);
            } else {
                let _ = Reflect::set(&new_resp, &"data".into(), &parsed);
            }
        } else {
            let _ = Reflect::set(&new_resp, &"data".into(), &result.into());
        }
        
        return new_resp;
    }
    
    uu1_decrypt_response_object(response)
}

#[wasm_bindgen]
pub fn uu2_encrypt_request(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    aes_encrypt(data_ptr, data_len, key_ptr, key_len)
}

#[wasm_bindgen]
pub fn uu2_process_request(request: &JsValue) -> JsValue {
    let method = Reflect::get(request, &"method".into())
        .ok()
        .and_then(|v| v.as_string())
        .map(|s| s.to_lowercase())
        .unwrap_or_else(|| "get".to_string());
    
    if method != "get" { return request.clone(); }
    
    let body = match Reflect::get(request, &"data".into()) {
        Ok(d) if !d.is_undefined() && !d.is_null() => d,
        _ => return request.clone(),
    };
    
    let url = Reflect::get(request, &"url".into())
        .ok()
        .and_then(|v| v.as_string())
        .unwrap_or_default();
    
    if url.starts_with("/v2/setting") { return request.clone(); }
    
    // 检查 Content-Type
    let is_json = Reflect::get(request, &"headers".into())
        .ok()
        .and_then(|h| Reflect::get(&h, &"Content-Type".into()).ok())
        .and_then(|v| v.as_string())
        .map(|s| s.to_lowercase().contains("application/json"))
        .unwrap_or(false);
    
    if !is_json { return request.clone(); }
    
    let data_str = match js_sys::JSON::stringify(&body) {
        Ok(s) => String::from(s),
        Err(_) => return request.clone(),
    };
    
    const KEY: &str = "defaultKey";
    let enc_ptr = aes_encrypt(data_str.as_ptr(), data_str.len(), KEY.as_ptr(), KEY.len());
    let encrypted = str_from_ptr(enc_ptr, strlen(enc_ptr));
    
    let new_req = request.clone();
    let obj = js_sys::Object::new();
    let _ = Reflect::set(&obj, &"data".into(), &encrypted.into());
    let _ = Reflect::set(&new_req, &"data".into(), &obj);
    
    // 添加 header
    let headers = Reflect::get(&new_req, &"headers".into())
        .ok()
        .filter(|h| h.is_object())
        .unwrap_or_else(|| {
            let h = js_sys::Object::new();
            let _ = Reflect::set(&new_req, &"headers".into(), &h);
            h.into()
        });
    
    let _ = Reflect::set(&headers, &"access-control-origin-key".into(), &js_sys::Date::now().into());
    
    new_req
}

#[wasm_bindgen]
pub fn uu4_decrypt_response(
    data_ptr: *const u8, data_len: usize,
    _uuid_ptr: *const u8, _uuid_len: usize,
    ts_ptr: *const u8, ts_len: usize
) -> *mut u8 {
    let data = str_from_ptr(data_ptr, data_len);
    let ts = str_from_ptr(ts_ptr, ts_len);
    
    if !data.starts_with("02") { return str_to_ptr(""); }
    
    let key_len: usize = match ts.parse() {
        Ok(v) => v,
        Err(_) => return str_to_ptr(""),
    };
    
    if data.len() < 2 + key_len + 3 + 4 { return str_to_ptr(""); }
    
    let key = &data[2..2 + key_len];
    let encrypted = &data[2 + key_len + 3..data.len() - 4];
    let encrypted = if encrypted.len() > 2 { &encrypted[2..] } else { encrypted };
    
    match hex::decode(encrypted) {
        Ok(bytes) => {
            let ctx = Decrypt::new(key);
            let dec = ctx.decrypt_c1c2c3(&bytes);
            str_to_ptr(&String::from_utf8(dec.clone()).unwrap_or_else(|_| String::from_utf8_lossy(&dec).into_owned()))
        }
        Err(_) => str_to_ptr(""),
    }
}

// ============ 存储函数（占位） ============

#[wasm_bindgen]
pub fn encrypt_storage_key(key_ptr: *const u8, key_len: usize, _: *const u8, _: usize) -> *mut u8 {
    str_to_ptr(&str_from_ptr(key_ptr, key_len))
}

#[wasm_bindgen]
pub fn encrypt_storage_value(val_ptr: *const u8, val_len: usize, _: *const u8, _: usize, _: *const u8, _: usize, _: *const u8, _: usize, _: *const u8, _: usize) -> *mut u8 {
    str_to_ptr(&str_from_ptr(val_ptr, val_len))
}

#[wasm_bindgen]
pub fn decrypt_storage_value(val_ptr: *const u8, val_len: usize, _: *const u8, _: usize, _: *const u8, _: usize, _: *const u8, _: usize, _: *const u8, _: usize) -> *mut u8 {
    str_to_ptr(&str_from_ptr(val_ptr, val_len))
}

#[wasm_bindgen]
pub fn custom_encrypt_with_codec_keypair(
    data_ptr: *const u8, data_len: usize,
    pubkey_ptr: *const u8, pubkey_len: usize,
    privkey_ptr: *const u8, privkey_len: usize
) -> *mut u8 {
    let enc_data_ptr = sm2_encrypt(data_ptr, data_len, pubkey_ptr, pubkey_len);
    let enc_data = str_from_ptr(enc_data_ptr, strlen(enc_data_ptr));
    
    let ts = format!("{:016}", js_sys::Date::now() as u64 % 10_000_000_000_000_000);
    let enc_key_ptr = aes_encrypt(privkey_ptr, privkey_len, ts.as_ptr(), ts.len());
    let enc_key = str_from_ptr(enc_key_ptr, strlen(enc_key_ptr));
    
    str_to_ptr(&format!(r#"{{"encryptedData":"{}","encryptedKey":"{}","timestamp":"{}"}}"#, enc_data, enc_key, ts))
}
