//! WASM 加密模块 - Rust 实现
//! 提供 SM2/SM3/SM4/AES/MD5 等加密算法

use std::alloc::{alloc as rust_alloc, dealloc as rust_dealloc, Layout};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use js_sys::Reflect;
use sm3::Digest;
use base64::{engine::general_purpose, Engine};
use sm2::SecretKey;
use sm2::elliptic_curve::sec1::ToEncodedPoint;
use sm2::elliptic_curve::rand_core::{OsRng, RngCore};
use smcrypto::sm2::{Encrypt, Decrypt};
use serde_json::json;

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

// ============ 工具函数 ============

/// 生成随机 nonce 字符串
#[wasm_bindgen]
pub fn generate_nonce() -> String {
    use sm2::elliptic_curve::rand_core::{OsRng, RngCore};
    
    let mut bytes = [0u8; 16];
    OsRng.fill_bytes(&mut bytes);
    
    // 转换为 base36 格式的字符串
    let mut result = String::with_capacity(24);
    for byte in bytes.iter() {
        result.push_str(&format!("{:02x}", byte));
    }
    result
}

/// 获取当前时间戳
#[wasm_bindgen]
pub fn get_current_timestamp() -> f64 {
    js_sys::Date::now()
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

// ============ 字体加密函数 ============

/// 数字字符列表（0-9）
const NUMBER_CHARS: &[char] = &['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/// 数字映射目标字符列表（字母 a-j）
const NUMBER_TARGET_CHARS: &[char] = &['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/// 常用汉字列表
const CHINESE_CHARS: &[&str] = &[
    "零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "亿",
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "这", "中", "大", "为", "上",
    "个", "国", "他", "时", "来", "用", "们", "生", "到", "作", "地", "于",
    "出", "分", "对", "成", "会", "可", "主", "发", "年", "动", "同", "工", "也", "能", "下",
    "过", "子", "说", "产", "种", "面", "而", "方", "后", "多", "定", "行", "学", "法", "所",
    "民", "得",
    "电", "力", "里", "如", "水", "化", "高", "自", "理", "心", "实", "比", "量", "制", "使",
    "点", "业", "体", "集", "号", "文", "次", "思", "通", "但", "条", "较", "克", "又", "公",
    "孔", "领", "军", "流", "入", "接", "席", "位", "情", "运", "器", "并", "习", "原", "油",
    "放", "立", "题", "质", "指", "建", "区", "验", "活", "众", "很", "教", "决", "特", "此",
    "常", "石", "强", "极", "少", "根", "共", "直", "团", "统", "式", "转", "别", "造", "切",
    "你", "取", "西", "持", "总", "料", "连", "任", "志", "观", "调", "么", "山", "程", "报",
    "更", "见", "必", "真", "保", "热", "委", "手", "改", "管", "处", "已", "修", "支", "识",
    "病", "象", "先", "老", "光", "专", "几", "什", "型", "具", "示", "复", "安", "带", "每",
    "东", "增", "则", "完", "风", "回", "南", "广", "劳", "轮", "科", "北", "打", "积", "车",
    "计", "给", "节", "做", "务", "被", "整", "联", "步", "类", "列", "温", "装",
];

/// 汉字映射目标字符列表
const CHINESE_TARGET_CHARS: &[&str] = &[
    "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y",
    "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
    "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[",
    "]", "{", "}", "|", "\\", ";", ":", "'", "\"", "<", ">", ",", ".", "?", "/",
    "`", "~",
    "\u{E000}", "\u{E001}", "\u{E002}", "\u{E003}", "\u{E004}", "\u{E005}", "\u{E006}", "\u{E007}",
    "\u{E008}", "\u{E009}", "\u{E00A}", "\u{E00B}", "\u{E00C}", "\u{E00D}", "\u{E00E}", "\u{E00F}",
    "\u{E010}", "\u{E011}", "\u{E012}", "\u{E013}", "\u{E014}", "\u{E015}", "\u{E016}", "\u{E017}",
    "\u{E018}", "\u{E019}", "\u{E01A}", "\u{E01B}", "\u{E01C}", "\u{E01D}", "\u{E01E}", "\u{E01F}",
    "\u{E020}", "\u{E021}", "\u{E022}", "\u{E023}", "\u{E024}", "\u{E025}", "\u{E026}", "\u{E027}",
    "\u{E028}", "\u{E029}", "\u{E02A}", "\u{E02B}", "\u{E02C}", "\u{E02D}", "\u{E02E}", "\u{E02F}",
    "\u{E030}", "\u{E031}", "\u{E032}", "\u{E033}", "\u{E034}", "\u{E035}", "\u{E036}", "\u{E037}",
    "\u{E038}", "\u{E039}", "\u{E03A}", "\u{E03B}", "\u{E03C}", "\u{E03D}", "\u{E03E}", "\u{E03F}",
    "\u{E040}", "\u{E041}", "\u{E042}", "\u{E043}", "\u{E044}", "\u{E045}", "\u{E046}", "\u{E047}",
    "\u{E048}", "\u{E049}", "\u{E04A}", "\u{E04B}", "\u{E04C}", "\u{E04D}", "\u{E04E}", "\u{E04F}",
    "\u{E050}", "\u{E051}", "\u{E052}", "\u{E053}", "\u{E054}", "\u{E055}", "\u{E056}", "\u{E057}",
    "\u{E058}", "\u{E059}", "\u{E05A}", "\u{E05B}", "\u{E05C}", "\u{E05D}", "\u{E05E}", "\u{E05F}",
    "\u{E060}", "\u{E061}", "\u{E062}", "\u{E063}", "\u{E064}", "\u{E065}", "\u{E066}", "\u{E067}",
    "\u{E068}", "\u{E069}", "\u{E06A}", "\u{E06B}", "\u{E06C}", "\u{E06D}", "\u{E06E}", "\u{E06F}",
    "\u{E070}", "\u{E071}", "\u{E072}", "\u{E073}", "\u{E074}", "\u{E075}", "\u{E076}", "\u{E077}",
    "\u{E078}", "\u{E079}", "\u{E07A}", "\u{E07B}", "\u{E07C}", "\u{E07D}", "\u{E07E}", "\u{E07F}",
    "\u{E080}", "\u{E081}", "\u{E082}", "\u{E083}", "\u{E084}", "\u{E085}", "\u{E086}", "\u{E087}",
    "\u{E088}", "\u{E089}", "\u{E08A}", "\u{E08B}", "\u{E08C}", "\u{E08D}", "\u{E08E}", "\u{E08F}",
    "\u{E090}", "\u{E091}", "\u{E092}", "\u{E093}",
];

/// 生成随机数种子
fn generate_seed() -> u64 {
    let mut bytes = [0u8; 8];
    OsRng.fill_bytes(&mut bytes);
    u64::from_le_bytes(bytes)
}

/// 简单随机数生成器（线性同余生成器）
struct SimpleRandom {
    seed: u64,
}

impl SimpleRandom {
    fn new(seed: Option<u64>) -> Self {
        Self {
            seed: seed.unwrap_or_else(|| generate_seed()),
        }
    }

    fn next_int(&mut self, max: usize) -> usize {
        self.seed = self.seed.wrapping_mul(1664525).wrapping_add(1013904223);
        ((self.seed as f64 / u64::MAX as f64) * max as f64) as usize
    }
}

/// Fisher-Yates 洗牌算法
fn shuffle<T: Clone>(arr: &mut [T], random: &mut SimpleRandom) {
    for i in (1..arr.len()).rev() {
        let j = random.next_int(i + 1);
        arr.swap(i, j);
    }
}

/// 生成映射表（单例，使用 thread_local 存储）
thread_local! {
    static FONT_MAPS: std::cell::RefCell<Option<(HashMap<char, char>, HashMap<&'static str, &'static str>, HashMap<char, char>, HashMap<&'static str, &'static str>)>> = std::cell::RefCell::new(None);
}

/// 生成新的映射表（每次调用都重新生成）
fn generate_new_maps() -> (HashMap<char, char>, HashMap<&'static str, &'static str>, HashMap<char, char>, HashMap<&'static str, &'static str>) {
    let mut random = SimpleRandom::new(None);
    
    // 复制并打乱数字目标字符
    let mut shuffled_number_targets = NUMBER_TARGET_CHARS.to_vec();
    shuffle(&mut shuffled_number_targets, &mut random);
    
    // 复制并打乱汉字目标字符
    let mut shuffled_chinese_targets = CHINESE_TARGET_CHARS.to_vec();
    shuffle(&mut shuffled_chinese_targets, &mut random);
    
    // 生成数字映射表
    let mut number_map = HashMap::new();
    for (i, &ch) in NUMBER_CHARS.iter().enumerate() {
        number_map.insert(ch, shuffled_number_targets[i]);
    }
    
    // 生成汉字映射表
    let mut chinese_map = HashMap::new();
    for (i, &ch) in CHINESE_CHARS.iter().enumerate() {
        chinese_map.insert(ch, shuffled_chinese_targets[i]);
    }
    
    // 生成反向映射表
    let reverse_number_map: HashMap<char, char> = number_map.iter().map(|(&k, &v)| (v, k)).collect();
    let reverse_chinese_map: HashMap<&'static str, &'static str> = chinese_map.iter().map(|(&k, &v)| (v, k)).collect();
    
    (number_map, chinese_map, reverse_number_map, reverse_chinese_map)
}

fn get_or_init_maps() -> (HashMap<char, char>, HashMap<&'static str, &'static str>, HashMap<char, char>, HashMap<&'static str, &'static str>) {
    FONT_MAPS.with(|maps| {
        let mut maps_ref = maps.borrow_mut();
        if let Some(ref cached) = *maps_ref {
            return cached.clone();
        }

        let result = generate_new_maps();
        *maps_ref = Some(result.clone());
        result
    })
}

/// 字体加密文本
#[wasm_bindgen]
pub fn font_encrypt_text(
    text_ptr: *const u8, text_len: usize,
    encrypt_numbers: bool, encrypt_chinese: bool
) -> *mut u8 {
    let text = str_from_ptr(text_ptr, text_len);
    if text.is_empty() {
        return str_to_ptr("");
    }

    let (number_map, chinese_map, _, _) = get_or_init_maps();
    let mut result = text;

    // 加密数字
    if encrypt_numbers {
        for (original, mapped) in number_map.iter() {
            result = result.replace(*original, &mapped.to_string());
        }
    }

    // 加密汉字
    if encrypt_chinese {
        for (original, mapped) in chinese_map.iter() {
            result = result.replace(original, mapped);
        }
    }

    str_to_ptr(&result)
}

/// 字体解密文本
#[wasm_bindgen]
pub fn font_decrypt_text(text_ptr: *const u8, text_len: usize) -> *mut u8 {
    let text = str_from_ptr(text_ptr, text_len);
    if text.is_empty() {
        return str_to_ptr("");
    }

    let (_, _, reverse_number_map, reverse_chinese_map) = get_or_init_maps();
    let mut result = text;

    // 解密汉字（先处理汉字，因为可能包含多字节字符）
    for (mapped, original) in reverse_chinese_map.iter() {
        result = result.replace(mapped, original);
    }

    // 解密数字
    for (mapped, original) in reverse_number_map.iter() {
        result = result.replace(*mapped, &original.to_string());
    }

    str_to_ptr(&result)
}

/// 检查字符是否为加密字符
#[wasm_bindgen]
pub fn font_is_encrypted_char(char_ptr: *const u8, char_len: usize) -> bool {
    let ch = str_from_ptr(char_ptr, char_len);
    if ch.is_empty() {
        return false;
    }
    
    let (_, _, reverse_number_map, reverse_chinese_map) = get_or_init_maps();
    
    // 检查是否为单字符（数字）
    if ch.len() == 1 {
        if let Some(c) = ch.chars().next() {
            if reverse_number_map.contains_key(&c) {
                return true;
            }
        }
    }
    
    // 检查是否为汉字
    reverse_chinese_map.contains_key(ch.as_str())
}

/// 获取映射的字符数量
#[wasm_bindgen]
pub fn font_get_mapped_char_count() -> *mut u8 {
    let (number_map, chinese_map, _, _) = get_or_init_maps();
    let result = format!(r#"{{"numbers":{},"chinese":{}}}"#, number_map.len(), chinese_map.len());
    str_to_ptr(&result)
}

/// 获取动态映射表（JSON格式，每次调用都重新生成）
#[wasm_bindgen]
pub fn font_get_maps() -> *mut u8 {
    let (number_map, chinese_map, reverse_number_map, reverse_chinese_map) = generate_new_maps();
    
    // 转换为 JSON 格式
    let number_map_json: serde_json::Map<String, serde_json::Value> = number_map
        .iter()
        .map(|(k, v)| (k.to_string(), json!(v.to_string())))
        .collect();
    
    let chinese_map_json: serde_json::Map<String, serde_json::Value> = chinese_map
        .iter()
        .map(|(k, v)| (k.to_string(), json!(v.to_string())))
        .collect();
    
    let reverse_number_map_json: serde_json::Map<String, serde_json::Value> = reverse_number_map
        .iter()
        .map(|(k, v)| (k.to_string(), json!(v.to_string())))
        .collect();
    
    let reverse_chinese_map_json: serde_json::Map<String, serde_json::Value> = reverse_chinese_map
        .iter()
        .map(|(k, v)| (k.to_string(), json!(v.to_string())))
        .collect();
    
    let result = json!({
        "numberMap": number_map_json,
        "chineseMap": chinese_map_json,
        "reverseNumberMap": reverse_number_map_json,
        "reverseChineseMap": reverse_chinese_map_json
    });
    
    str_to_ptr(&result.to_string())
}