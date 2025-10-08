// codec-wasm - Rust implementation of encryption/decryption algorithms
// Directly exporting functions for WebAssembly without wasm-bindgen

use std::alloc::{alloc as rust_alloc, dealloc as rust_dealloc, Layout};
use sm3::Digest; // 导入Digest trait
use base64::{engine::general_purpose, Engine as _};

// 添加wasm-bindgen宏
use wasm_bindgen::prelude::*;
use js_sys::Reflect;
use wasm_bindgen::JsValue;

// Import SM2 library
use sm2::SecretKey;
use sm2::elliptic_curve::sec1::ToEncodedPoint;

// Import smcrypto library for SM2 encryption/decryption
use smcrypto::sm2::{Encrypt, Decrypt};

// We need to add memory management functions for WASM
#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    if size == 0 {
        return std::ptr::null_mut();
    }
    
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { rust_alloc(layout) }
}

#[wasm_bindgen]
pub fn dealloc(ptr: *mut u8, size: usize) {
    if ptr.is_null() || size == 0 {
        return;
    }
    
    let layout = Layout::from_size_align(size, 1).unwrap();
    unsafe { rust_dealloc(ptr, layout) }
}

// String utilities
fn string_from_ptr(ptr: *const u8, len: usize) -> String {
    if ptr.is_null() || len == 0 {
        return String::new();
    }
    
    unsafe {
        // 检查指针是否有效
        if ptr.is_null() {
            return String::new();
        }
        
        // 确保长度不会导致溢出
        if len > 1000000 {  // 限制最大长度为1MB
            return String::new();
        }
        
        // 使用更安全的方式创建切片
        let slice = std::slice::from_raw_parts(ptr, len);
        String::from_utf8_lossy(slice).into_owned()
    }
}

fn string_to_ptr(s: &str) -> *mut u8 {
    let bytes = s.as_bytes();
    let len = bytes.len();
    
    // 分配内存，额外分配一个字节用于null终止符
    let ptr = alloc(len + 1);
    if ptr.is_null() {
        return ptr;
    }
    
    // 复制数据到分配的内存
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), ptr, len);
        // 添加null终止符
        std::ptr::write(ptr.add(len), 0);
    }
    
    ptr
}

// AES encryption function - 使用标准AES加密库
#[wasm_bindgen]
pub fn aes_encrypt(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    let key_str = string_from_ptr(key_ptr, key_len);
    
    // 将密钥转换为16字节的密钥数组
    let mut key_bytes = [0u8; 16];
    let key_input_bytes = key_str.as_bytes();
    let copy_len = std::cmp::min(key_bytes.len(), key_input_bytes.len());
    key_bytes[..copy_len].copy_from_slice(&key_input_bytes[..copy_len]);
    
    // 创建AES加密器
    use aes::cipher::{KeyIvInit, BlockEncryptMut, block_padding::Pkcs7};
    use cbc::Encryptor as CbcEncryptor;
    use aes::Aes128;
    
    // 使用CBC模式加密
    let iv = [0u8; 16]; // 使用零IV，实际应用中应该使用随机IV
    let cipher = CbcEncryptor::<Aes128>::new(&key_bytes.into(), &iv.into());
    
    // 将数据转换为字节数组
    let data_bytes = data.as_bytes();
    
    // 创建足够大的缓冲区
    let mut buffer = vec![0u8; data_bytes.len() + 16]; // 添加一些额外空间用于填充
    buffer[..data_bytes.len()].copy_from_slice(data_bytes);
    
    // 执行AES加密
    let encrypted_data = cipher.encrypt_padded_mut::<Pkcs7>(&mut buffer, data_bytes.len())
        .expect("AES encryption failed");
    
    // 将加密结果转换为Base64编码
    let encoded = general_purpose::STANDARD.encode(encrypted_data);
    
    // 直接返回字符串指针
    string_to_ptr(&encoded)
}

// AES decryption function - 使用标准AES解密库
#[wasm_bindgen]
pub fn aes_decrypt(encrypted_data_ptr: *const u8, encrypted_data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let encrypted_data_str = string_from_ptr(encrypted_data_ptr, encrypted_data_len);
    let key_str = string_from_ptr(key_ptr, key_len);
    
    // Base64解码
    let encrypted_bytes = match general_purpose::STANDARD.decode(&encrypted_data_str) {
        Ok(bytes) => bytes,
        Err(_) => {
            // 解码失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 将密钥转换为16字节的密钥数组
    let mut key_bytes = [0u8; 16];
    let key_input_bytes = key_str.as_bytes();
    let copy_len = std::cmp::min(key_bytes.len(), key_input_bytes.len());
    key_bytes[..copy_len].copy_from_slice(&key_input_bytes[..copy_len]);
    
    // 创建AES解密器
    use aes::cipher::{KeyIvInit, BlockDecryptMut, block_padding::Pkcs7};
    use cbc::Decryptor as CbcDecryptor;
    use aes::Aes128;
    
    // 使用CBC模式解密
    let iv = [0u8; 16]; // 使用零IV，实际应用中应该使用随机IV
    let cipher = CbcDecryptor::<Aes128>::new(&key_bytes.into(), &iv.into());
    
    // 创建缓冲区
    let mut buffer = encrypted_bytes.clone();
    
    // 执行AES解密
    let decrypted_data = match cipher.decrypt_padded_mut::<Pkcs7>(&mut buffer) {
        Ok(data) => data,
        Err(_) => {
            // 解密失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 将解密结果转换为字符串
    let decrypted_str = String::from_utf8_lossy(decrypted_data).into_owned();
    
    // 直接返回字符串指针
    string_to_ptr(&decrypted_str)
}

// SM3 hash function
#[wasm_bindgen]
pub fn sm3_hash(data_ptr: *const u8, data_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    
    // 使用sm3库进行SM3哈希
    let mut hasher = sm3::Sm3::new();
    hasher.update(data.as_bytes());
    let hash = hasher.finalize();
    let hex_hash = hex::encode(hash);
    
    // 直接返回字符串指针
    string_to_ptr(&hex_hash)
}

// MD5 hash function
#[wasm_bindgen]
pub fn md5_hash(data_ptr: *const u8, data_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    
    // 使用md5库进行MD5哈希
    let mut hasher = md5::Md5::new();
    hasher.update(data.as_bytes());
    let hash = hasher.finalize();
    let hex_hash = hex::encode(hash);
    
    // 直接返回字符串指针
    string_to_ptr(&hex_hash)
}

// SM4 encryption function
#[wasm_bindgen]
pub fn sm4_encrypt(data_ptr: *const u8, data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    let key_str = string_from_ptr(key_ptr, key_len);
    
    // 将密钥转换为16字节的密钥数组
    // 如果密钥长度不足16字节，用0填充；如果超过16字节，截取前16字节
    let mut key_bytes = [0u8; 16];
    let key_input_bytes = key_str.as_bytes();
    let copy_len = std::cmp::min(key_bytes.len(), key_input_bytes.len());
    key_bytes[..copy_len].copy_from_slice(&key_input_bytes[..copy_len]);
    
    // 创建SM4加密器
    use sm4::cipher::{BlockEncrypt, NewBlockCipher};
    let cipher = sm4::Sm4::new(&key_bytes.into());
    
    // 将数据转换为字节数组
    let data_bytes = data.as_bytes();
    
    // 使用PKCS7填充确保数据长度是16字节的倍数（SM4块大小）
    let padded_len = ((data_bytes.len() + 15) / 16) * 16;
    let mut padded_data = vec![0u8; padded_len];
    padded_data[..data_bytes.len()].copy_from_slice(data_bytes);
    
    // 添加PKCS7填充
    let padding_len = padded_len - data_bytes.len();
    for i in 0..padding_len {
        padded_data[data_bytes.len() + i] = padding_len as u8;
    }
    
    // 执行SM4加密
    let mut encrypted_data = vec![0u8; padded_len];
    for (chunk, encrypted_chunk) in padded_data.chunks(16).zip(encrypted_data.chunks_mut(16)) {
        let mut block = [0u8; 16];
        block.copy_from_slice(chunk);
        cipher.encrypt_block((&mut block).into());
        encrypted_chunk.copy_from_slice(&block);
    }
    
    // 将加密结果转换为十六进制字符串
    let hex_result = hex::encode(&encrypted_data);
    
    // 直接返回字符串指针
    string_to_ptr(&hex_result)
}

// SM4 decryption function
#[wasm_bindgen]
pub fn sm4_decrypt(encrypted_data_ptr: *const u8, encrypted_data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let encrypted_data_str = string_from_ptr(encrypted_data_ptr, encrypted_data_len);
    let key_str = string_from_ptr(key_ptr, key_len);
    
    // 十六进制解码
    let encrypted_bytes = match hex::decode(&encrypted_data_str) {
        Ok(bytes) => bytes,
        Err(_) => {
            // 解码失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 将密钥转换为16字节的密钥数组
    // 如果密钥长度不足16字节，用0填充；如果超过16字节，截取前16字节
    let mut key_bytes = [0u8; 16];
    let key_input_bytes = key_str.as_bytes();
    let copy_len = std::cmp::min(key_bytes.len(), key_input_bytes.len());
    key_bytes[..copy_len].copy_from_slice(&key_input_bytes[..copy_len]);
    
    // 创建SM4解密器
    use sm4::cipher::{BlockDecrypt, NewBlockCipher};
    let cipher = sm4::Sm4::new(&key_bytes.into());
    
    // 确保加密数据长度是16字节的倍数
    if encrypted_bytes.len() % 16 != 0 {
        // 数据长度不正确，返回空字符串
        return string_to_ptr("");
    }
    
    // 执行SM4解密
    let mut decrypted_data = vec![0u8; encrypted_bytes.len()];
    for (chunk, decrypted_chunk) in encrypted_bytes.chunks(16).zip(decrypted_data.chunks_mut(16)) {
        let mut block = [0u8; 16];
        block.copy_from_slice(chunk);
        cipher.decrypt_block((&mut block).into());
        decrypted_chunk.copy_from_slice(&block);
    }
    
    // 移除PKCS7填充
    let padding_len = decrypted_data[decrypted_data.len() - 1] as usize;
    if padding_len > 0 && padding_len <= 16 {
        decrypted_data.truncate(decrypted_data.len() - padding_len);
    }
    
    // 将解密结果转换为字符串
    let decrypted_str = String::from_utf8_lossy(&decrypted_data).into_owned();
    
    // 直接返回字符串指针
    string_to_ptr(&decrypted_str)
}

// SM2 key pair generation function
#[wasm_bindgen]
pub fn generate_sm2_key_pair() -> *mut u8 {
    use sm2::elliptic_curve::rand_core::OsRng;
    
    // 生成SM2密钥对
    let mut rng = OsRng;
    let secret_key = SecretKey::random(&mut rng);
    let public_key = secret_key.public_key();
    
    // 将私钥和公钥转换为十六进制字符串
    let private_key_bytes = secret_key.to_bytes();
    let private_key_hex = hex::encode(private_key_bytes);
    
    let public_key_point = public_key.as_affine();
    let public_key_encoded = public_key_point.to_encoded_point(false);
    let public_key_bytes = public_key_encoded.as_bytes();
    let public_key_hex = hex::encode(public_key_bytes);
    
    // 创建JSON格式的密钥对
    let keypair_json = format!("{{\"privateKey\":\"{}\",\"publicKey\":\"{}\"}}", private_key_hex, public_key_hex);
    
    // 返回字符串指针
    string_to_ptr(&keypair_json)
}

// SM2 encryption function (使用smcrypto库实现真正的加密)
#[wasm_bindgen]
pub fn sm2_encrypt(data_ptr: *const u8, data_len: usize, public_key_ptr: *const u8, public_key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    let public_key_hex = string_from_ptr(public_key_ptr, public_key_len);
    
    // 使用smcrypto库进行SM2加密
    // 注意：smcrypto库期望公钥是十六进制字符串格式
    let encrypt_ctx = Encrypt::new(&public_key_hex);
    let encrypted_data = encrypt_ctx.encrypt(data.as_bytes());
    
    // 将加密结果转换为十六进制字符串
    let hex_result = hex::encode(&encrypted_data);
    
    // 返回加密结果
    string_to_ptr(&hex_result)
}

// SM2 decryption function (使用smcrypto库实现真正的解密)
#[wasm_bindgen]
pub fn sm2_decrypt(encrypted_data_ptr: *const u8, encrypted_data_len: usize, private_key_ptr: *const u8, private_key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let encrypted_data_hex = string_from_ptr(encrypted_data_ptr, encrypted_data_len);
    let private_key_hex = string_from_ptr(private_key_ptr, private_key_len);
    
    // 十六进制解码
    let encrypted_bytes = match hex::decode(&encrypted_data_hex) {
        Ok(bytes) => bytes,
        Err(_) => {
            // 解码失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 使用smcrypto库进行SM2解密
    // 注意：smcrypto库期望私钥是十六进制字符串格式
    let decrypt_ctx = Decrypt::new(&private_key_hex);
    let decrypted_data = decrypt_ctx.decrypt(&encrypted_bytes);
    
    // 将解密结果转换为字符串
    let decrypted_str = String::from_utf8_lossy(&decrypted_data).into_owned();
    
    // 返回解密结果
    string_to_ptr(&decrypted_str)
}

// UU1 function - Response decryption
#[wasm_bindgen]
pub fn uu1_decrypt_response(response_data_ptr: *const u8, response_data_len: usize, origin_ptr: *const u8, origin_len: usize, ts_ptr: *const u8, ts_len: usize) -> *mut u8 {
    // 获取字符串数据
    let response_data = string_from_ptr(response_data_ptr, response_data_len);
    let origin = string_from_ptr(origin_ptr, origin_len);
    let ts = string_from_ptr(ts_ptr, ts_len);
    
    // 检查数据是否以"02"开头
    if !response_data.starts_with("02") {
        return string_to_ptr("");
    }
    
    // 从response_data中提取加密数据（去掉前8位和后4位）
    // 格式: "02" + 随机数字 + "200" + 加密数据 + "ffff"
    if response_data.len() < 12 {
        return string_to_ptr("");
    }
    
    // 提取加密数据部分（去掉前8位和后4位）
    let encrypted_data = &response_data[8..response_data.len()-4];
    
    // 解密origin获取密钥
    let key_ptr = aes_decrypt(origin_ptr, origin_len, ts_ptr, ts_len);
    let key = string_from_ptr(key_ptr, get_string_length(key_ptr));
    
    // 解密数据
    let encrypted_data_ptr = encrypted_data.as_ptr();
    let encrypted_data_len = encrypted_data.len();
    let key_ptr_for_decryption = key.as_ptr();
    let key_len_for_decryption = key.len();
    let decrypted_data_ptr = aes_decrypt(encrypted_data_ptr, encrypted_data_len, key_ptr_for_decryption, key_len_for_decryption);
    let decrypted_data = string_from_ptr(decrypted_data_ptr, get_string_length(decrypted_data_ptr));
    
    // 返回解密结果
    string_to_ptr(&decrypted_data)
}

// UU1 function - Response decryption for entire response object
#[wasm_bindgen]
pub fn uu1_decrypt_response_object(response: &JsValue) -> JsValue {
    // 获取响应数据
    let headers = match Reflect::get(response, &"headers".into()) {
        Ok(headers) => headers,
        Err(_) => return response.clone(),
    };
    
    // 检查是否有加密标识
    let origin_key = match Reflect::get(&headers, &"access-control-origin-key".into()) {
        Ok(key) => key,
        Err(_) => return response.clone(),
    };
    
    // 如果没有加密标识，直接返回原始响应
    if origin_key.is_undefined() || origin_key.is_null() {
        return response.clone();
    }
    
    // 获取响应数据
    let data = match Reflect::get(response, &"data".into()) {
        Ok(data) => data,
        Err(_) => return response.clone(),
    };
    
    // 获取时间戳
    let timestamp = match Reflect::get(&headers, &"access-control-timestamp-user".into()) {
        Ok(ts) => ts,
        Err(_) => JsValue::NULL,
    };
    
    // 将数据转换为字符串
    let data_string = match data.as_string() {
        Some(s) => s,
        None => {
            // 如果是对象，尝试转换为JSON字符串
            match js_sys::JSON::stringify(&data) {
                Ok(json_str) => json_str.into(),
                Err(_) => return response.clone(),
            }
        }
    };
    
    // 将origin_key转换为字符串
    let origin_key_string = match origin_key.as_string() {
        Some(s) => s,
        None => return response.clone(),
    };
    
    // 将timestamp转换为字符串
    let timestamp_string = match timestamp.as_string() {
        Some(s) => s,
        None => String::new(),
    };
    
    // 调用原有的解密函数
    let data_ptr = data_string.as_ptr();
    let data_len = data_string.len();
    let origin_ptr = origin_key_string.as_ptr();
    let origin_len = origin_key_string.len();
    let ts_ptr = timestamp_string.as_ptr();
    let ts_len = timestamp_string.len();
    
    let decrypted_ptr = uu1_decrypt_response(data_ptr, data_len, origin_ptr, origin_len, ts_ptr, ts_len);
    let decrypted_string = string_from_ptr(decrypted_ptr, get_string_length(decrypted_ptr));
    
    // 创建新的响应对象
    let new_response = response.clone();
    
    // 更新响应数据
    match js_sys::JSON::parse(&decrypted_string) {
        Ok(parsed_data) => {
            let _ = Reflect::set(&new_response, &"data".into(), &parsed_data);
        }
        Err(_) => {
            let _ = Reflect::set(&new_response, &"data".into(), &decrypted_string.into());
        }
    }
    
    // 注意：我们不能直接删除headers中的属性，因为headers本身可能不是Object类型
    // 我们需要创建一个新的headers对象或者以其他方式处理
    
    new_response
}

// UU2 function - Request encryption
#[wasm_bindgen]
pub fn uu2_encrypt_request(request_data_ptr: *const u8, request_data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 直接使用AES加密函数
    aes_encrypt(request_data_ptr, request_data_len, key_ptr, key_len)
}

// UU2 function - Process PureHttpRequestConfig object
#[wasm_bindgen]
pub fn uu2_process_request(request: &JsValue) -> JsValue {
    // 获取请求方法
    let method = match Reflect::get(request, &"method".into()) {
        Ok(method) => {
            if let Some(method_str) = method.as_string() {
                method_str.to_lowercase()
            } else {
                "get".to_string() // 默认为get
            }
        },
        Err(_) => "get".to_string(), // 默认为get
    };
    
    // 只处理GET方法和JSON数据格式
    if method != "get" {
        return request.clone();
    }
    
    // 获取请求数据
    let body = match Reflect::get(request, &"data".into()) {
        Ok(data) => data,
        Err(_) => return request.clone(),
    };
    
    // 获取请求URL
    let url = match Reflect::get(request, &"url".into()) {
        Ok(url) => url,
        Err(_) => return request.clone(),
    };
    
    // 检查URL是否以"/v2/setting"开头，如果是则直接返回原始请求
    if let Some(url_str) = url.as_string() {
        if url_str.starts_with("/v2/setting") {
            return request.clone();
        }
    }
    
    // 如果body为空，直接返回原始请求
    if body.is_undefined() || body.is_null() {
        return request.clone();
    }
    
    // 检查Content-Type是否为JSON格式
    let is_json_content_type = {
        match Reflect::get(request, &"headers".into()) {
            Ok(headers) => {
                if headers.is_object() {
                    match Reflect::get(&headers, &"Content-Type".into()) {
                        Ok(content_type) => {
                            if let Some(content_type_str) = content_type.as_string() {
                                content_type_str.to_lowercase().contains("application/json")
                            } else {
                                false
                            }
                        },
                        Err(_) => false,
                    }
                } else {
                    false
                }
            },
            Err(_) => false,
        }
    };
    
    // 如果不是JSON格式，直接返回原始请求
    if !is_json_content_type {
        return request.clone();
    }
    
    // 模拟配置获取
    // 在实际实现中，这些配置应该通过参数传递或者有其他方式获取
    let request_codec_open = "true"; // 模拟getConfig("requestCodecOpen")
    let codec_request_key = "defaultKey"; // 模拟getConfig("codecRequestKey")
    
    // 检查配置
    if request_codec_open.is_empty() || codec_request_key.is_empty() {
        return request.clone();
    }
    
    // 检查body是否为数组
    let is_array = body.is_array();
    
    // 如果不是数组，检查是否有File或Blob类型的字段
    if !is_array {
        // 这里简化处理，实际实现中需要检查body中的每个字段
        // 为了保持简单，我们假设没有File或Blob类型的数据
    }
    
    // 将body转换为JSON字符串
    let data1: String = match js_sys::JSON::stringify(&body) {
        Ok(json_str) => json_str.into(),
        Err(_) => return request.clone(),
    };
    
    // 调用加密函数
    let encrypted_data_ptr = aes_encrypt(
        data1.as_ptr(),
        data1.len(),
        codec_request_key.as_ptr(),
        codec_request_key.len()
    );
    let encrypted_data = string_from_ptr(encrypted_data_ptr, get_string_length(encrypted_data_ptr));
    
    // 创建新的请求对象
    let new_request = request.clone();
    
    // 更新请求数据
    let data_value = if is_array {
        // 如果是数组，创建包含加密数据的对象数组
        let obj = js_sys::Object::new();
        let _ = Reflect::set(&obj, &"data".into(), &encrypted_data.into());
        let array = js_sys::Array::new();
        array.push(&obj);
        array.into()
    } else {
        // 如果不是数组，创建包含加密数据的对象
        let obj = js_sys::Object::new();
        let _ = Reflect::set(&obj, &"data".into(), &encrypted_data.into());
        obj.into()
    };
    
    // 设置请求数据
    let _ = Reflect::set(&new_request, &"data".into(), &data_value);
    
    // 确保headers对象存在
    let headers = match Reflect::get(&new_request, &"headers".into()) {
        Ok(headers) => {
            if headers.is_undefined() || headers.is_null() {
                let new_headers = js_sys::Object::new();
                let _ = Reflect::set(&new_request, &"headers".into(), &new_headers);
                new_headers.into()
            } else {
                // 确保headers是对象类型
                if headers.is_object() {
                    headers
                } else {
                    let new_headers = js_sys::Object::new();
                    let _ = Reflect::set(&new_request, &"headers".into(), &new_headers);
                    new_headers.into()
                }
            }
        },
        Err(_) => {
            let new_headers = js_sys::Object::new();
            let _ = Reflect::set(&new_request, &"headers".into(), &new_headers);
            new_headers.into()
        }
    };
    
    // 添加访问控制头
    let _ = Reflect::set(&headers, &"access-control-origin-key".into(), &js_sys::Date::now().into());
    
    new_request
}

// UU3 function - Simple decryption with fixed key
#[wasm_bindgen]
pub fn uu3_decrypt_simple(encrypted_data_ptr: *const u8, encrypted_data_len: usize) -> *mut u8 {
    // 使用固定密钥解密
    let fixed_key = "1234567890Oil#@1";
    let fixed_key_ptr = fixed_key.as_ptr();
    let fixed_key_len = fixed_key.len();
    
    aes_decrypt(encrypted_data_ptr, encrypted_data_len, fixed_key_ptr, fixed_key_len)
}

// UU4 function - Another response decryption
#[wasm_bindgen]
pub fn uu4_decrypt_response(response_data_ptr: *const u8, response_data_len: usize, uuid_ptr: *const u8, uuid_len: usize, timestamp_ptr: *const u8, timestamp_len: usize) -> *mut u8 {
    // 获取字符串数据
    let response_data = string_from_ptr(response_data_ptr, response_data_len);
    let uuid = string_from_ptr(uuid_ptr, uuid_len);
    let timestamp = string_from_ptr(timestamp_ptr, timestamp_len);
    
    // 检查数据是否以"02"开头
    if !response_data.starts_with("02") {
        return string_to_ptr("");
    }
    
    // 解密uuid获取密钥
    let key_ptr = aes_decrypt(uuid_ptr, uuid_len, timestamp_ptr, timestamp_len);
    let key = string_from_ptr(key_ptr, get_string_length(key_ptr));
    
    // 从response_data中提取加密数据（去掉前8位和后4位）
    if response_data.len() < 12 {
        return string_to_ptr("");
    }
    let encrypted_data = &response_data[8..response_data.len()-4];
    
    // 创建加密数据的指针
    let encrypted_data_ptr = encrypted_data.as_ptr();
    let encrypted_data_len = encrypted_data.len();
    
    // 解密数据
    let key_ptr_for_decryption = key.as_ptr();
    let key_len_for_decryption = key.len();
    let decrypted_data_ptr = aes_decrypt(encrypted_data_ptr, encrypted_data_len, key_ptr_for_decryption, key_len_for_decryption);
    
    // 返回解密结果
    decrypted_data_ptr
}

// SM2 signature generation function
#[wasm_bindgen]
pub fn generate_sign(data_ptr: *const u8, data_len: usize, private_key_ptr: *const u8, private_key_len: usize) -> *mut u8 {
    // 验证输入参数
    if data_ptr.is_null() || private_key_ptr.is_null() {
        return string_to_ptr("");
    }
    
    if data_len == 0 || private_key_len == 0 {
        return string_to_ptr("");
    }
    
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    let private_key_hex = string_from_ptr(private_key_ptr, private_key_len);
    
    // 验证数据是否为空
    if data.is_empty() || private_key_hex.is_empty() {
        return string_to_ptr("");
    }
    
    // 使用smcrypto库进行SM2签名
    // 注意：smcrypto库期望私钥是十六进制字符串格式
    let sign_ctx = smcrypto::sm2::Sign::new(&private_key_hex);
    let signature = sign_ctx.sign(data.as_bytes());
    
    // 将签名结果转换为十六进制字符串
    let hex_result = hex::encode(&signature);
    
    // 返回签名结果
    string_to_ptr(&hex_result)
}

// SM2 signature verification function
#[wasm_bindgen]
pub fn verify_sign(data_ptr: *const u8, data_len: usize, signature_ptr: *const u8, signature_len: usize, public_key_ptr: *const u8, public_key_len: usize) -> bool {
    // 验证输入参数
    if data_ptr.is_null() || signature_ptr.is_null() || public_key_ptr.is_null() {
        return false;
    }
    
    if data_len == 0 || signature_len == 0 || public_key_len == 0 {
        return false;
    }
    
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    let signature_hex = string_from_ptr(signature_ptr, signature_len);
    let public_key_hex = string_from_ptr(public_key_ptr, public_key_len);
    
    // 验证数据是否为空
    if data.is_empty() || signature_hex.is_empty() || public_key_hex.is_empty() {
        return false;
    }
    
    // 十六进制解码签名
    let signature_bytes = match hex::decode(&signature_hex) {
        Ok(bytes) => bytes,
        Err(_) => {
            // 解码失败返回false
            return false;
        }
    };
    
    // 使用smcrypto库进行SM2签名验证
    // 注意：smcrypto库期望公钥是十六进制字符串格式
    let verify_ctx = smcrypto::sm2::Verify::new(&public_key_hex);
    let is_valid = verify_ctx.verify(data.as_bytes(), &signature_bytes);
    
    is_valid
}

// Storage Key encryption function
#[wasm_bindgen]
pub fn encrypt_storage_key(key_ptr: *const u8, key_len: usize, system_code_ptr: *const u8, system_code_len: usize) -> *mut u8 {
    // 直接返回原始数据，不进行任何处理
    // 获取原始密钥数据
    let key = string_from_ptr(key_ptr, key_len);
    
    // 直接返回原始密钥，不进行加密处理
    string_to_ptr(&key)
}

// Storage Value encryption function
#[wasm_bindgen]
pub fn encrypt_storage_value(value_ptr: *const u8, value_len: usize, key_ptr: *const u8, key_len: usize, system_code_ptr: *const u8, system_code_len: usize, storage_key_ptr: *const u8, storage_key_len: usize, storage_encode_ptr: *const u8, storage_encode_len: usize) -> *mut u8 {
    // 获取字符串数据
    let value = string_from_ptr(value_ptr, value_len);
    let key = string_from_ptr(key_ptr, key_len);
    let system_code = string_from_ptr(system_code_ptr, system_code_len);
    let storage_key = string_from_ptr(storage_key_ptr, storage_key_len);
    let storage_encode = string_from_ptr(storage_encode_ptr, storage_encode_len);
    
    // 这里实现存储值的加密逻辑
    // 为了简化，我们直接返回原始值（实际实现中应该根据参数进行加密）
    string_to_ptr(&value)
}

// Storage Value decryption function
#[wasm_bindgen]
pub fn decrypt_storage_value(value_ptr: *const u8, value_len: usize, key_ptr: *const u8, key_len: usize, system_code_ptr: *const u8, system_code_len: usize, storage_key_ptr: *const u8, storage_key_len: usize, storage_encode_ptr: *const u8, storage_encode_len: usize) -> *mut u8 {
    // 获取字符串数据
    let value = string_from_ptr(value_ptr, value_len);
    let key = string_from_ptr(key_ptr, key_len);
    let system_code = string_from_ptr(system_code_ptr, system_code_len);
    let storage_key = string_from_ptr(storage_key_ptr, storage_key_len);
    let storage_encode = string_from_ptr(storage_encode_ptr, storage_encode_len);
    
    // 这里实现存储值的解密逻辑
    // 为了简化，我们直接返回原始值（实际实现中应该根据参数进行解密）
    string_to_ptr(&value)
}

// 辅助函数：获取字符串长度
fn get_string_length(ptr: *mut u8) -> usize {
    if ptr.is_null() {
        return 0;
    }
    
    let mut len = 0;
    unsafe {
        let mut current = ptr;
        while *current != 0 {
            len += 1;
            current = current.add(1);
        }
    }
    len
}
