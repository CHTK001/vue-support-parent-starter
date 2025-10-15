// codec-wasm - Rust implementation of encryption/decryption algorithms
// Directly exporting functions for WebAssembly without wasm-bindgen

use std::alloc::{alloc as rust_alloc, dealloc as rust_dealloc, Layout};
use sm3::Digest; // 导入Digest trait
use base64::{engine::general_purpose, Engine as _};

// 添加wasm-bindgen宏
use wasm_bindgen::prelude::*;
use js_sys::Reflect;

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
// 与DigestUtils.java保持一致，使用ECB模式和PKCS5Padding
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
    // 与DigestUtils.java保持一致，使用ECB模式而不是CBC模式
    use aes::cipher::{KeyInit, BlockEncryptMut, block_padding::Pkcs7};
    
    let cipher = aes::Aes128Enc::new(&key_bytes.into());
    
    // 将数据转换为字节数组
    let data_bytes = data.as_bytes();
    
    // 创建足够大的缓冲区（必须是16字节的倍数）
    let padded_len = ((data_bytes.len() + 15) / 16) * 16;
    let mut buffer = vec![0u8; padded_len + 16]; // 添加额外空间确保足够
    buffer[..data_bytes.len()].copy_from_slice(data_bytes);
    
    // 执行AES加密，使用PKCS5Padding（在Rust中对应Pkcs7）
    let encrypted_data = cipher.encrypt_padded_mut::<Pkcs7>(&mut buffer, data_bytes.len())
        .expect("AES encryption failed");
    
    // 将加密结果转换为Base64编码
    let encoded = general_purpose::STANDARD.encode(encrypted_data);
    
    // 直接返回字符串指针
    string_to_ptr(&encoded)
}

// AES decryption function - 使用标准AES解密库
// 与DigestUtils.java保持一致，使用ECB模式和PKCS5Padding
#[wasm_bindgen]
pub fn aes_decrypt(encrypted_data_ptr: *const u8, encrypted_data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let encrypted_data_str = string_from_ptr(encrypted_data_ptr, encrypted_data_len);
    let key_str = string_from_ptr(key_ptr, key_len);
    
    // 检查输入是否为空
    if encrypted_data_str.is_empty() {
        return string_to_ptr("");
    }
    
    if key_str.is_empty() {
        return string_to_ptr("");
    }
    
    // Base64解码
    let encrypted_bytes = match general_purpose::STANDARD.decode(&encrypted_data_str) {
        Ok(bytes) => {
            bytes
        },
        Err(_e) => {
            // 解码失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 检查数据长度是否为16字节的倍数
    if encrypted_bytes.len() % 16 != 0 {
        return string_to_ptr("");
    }
    
    // 将密钥转换为16字节的密钥数组
    let mut key_bytes = [0u8; 16];
    let key_input_bytes = key_str.as_bytes();
    let copy_len = std::cmp::min(key_bytes.len(), key_input_bytes.len());
    key_bytes[..copy_len].copy_from_slice(&key_input_bytes[..copy_len]);
    

    
    // 创建AES解密器
    // 与DigestUtils.java保持一致，使用ECB模式而不是CBC模式
    use aes::cipher::{KeyInit, BlockDecryptMut, block_padding::Pkcs7};
    
    let cipher = aes::Aes128Dec::new(&key_bytes.into());
    
    // 创建缓冲区
    let mut buffer = encrypted_bytes.clone();
    
    // 执行AES解密，使用PKCS5Padding（在Rust中对应Pkcs7）
    let decrypted_data = match cipher.decrypt_padded_mut::<Pkcs7>(&mut buffer) {
        Ok(data) => {
            data
        },
        Err(_e) => {
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
        Ok(bytes) => {
            bytes
        },
        Err(_e) => {
            // 解码失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 使用smcrypto库进行SM2解密（使用C1C2C3格式）
    // 注意：smcrypto库期望私钥是十六进制字符串格式
    let decrypt_ctx = Decrypt::new(&private_key_hex);
    let decrypted_data = decrypt_ctx.decrypt_c1c2c3(&encrypted_bytes);
    
    // 改进的解密后数据处理逻辑，解决乱码问题
    // 优先尝试标准UTF-8字符串转换
    let decrypted_str = match String::from_utf8(decrypted_data.clone()) {
        Ok(utf8_result) => {
            utf8_result
        },
        Err(_) => {
            // 如果标准UTF-8转换失败，使用from_utf8_lossy进行容错处理
            let lossy_result = String::from_utf8_lossy(&decrypted_data);
            lossy_result.into_owned()
        }
    };
    
    // 返回解密结果
    string_to_ptr(&decrypted_str)
}

// UU1 function - Response decryption
#[wasm_bindgen]
pub fn uu1_decrypt_response(response_data_ptr: *const u8, response_data_len: usize, origin_ptr: *const u8, origin_len: usize, ts_ptr: *const u8, ts_len: usize) -> *mut u8 {
    // 验证输入参数
    if response_data_ptr.is_null() || ts_ptr.is_null() {
        // 创建并返回错误对象
        let error_obj = js_sys::Object::new();
        let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
        let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
        let _ = Reflect::set(&error_obj, &"error".into(), &"输入指针为空".into());
        
        match js_sys::JSON::stringify(&error_obj) {
            Ok(json_str) => {
                let json_string: String = json_str.into();
                return string_to_ptr(&json_string);
            },
            Err(_) => {
                return string_to_ptr("");
            }
        }
    }

    if response_data_len == 0 || ts_len == 0 {
        // 创建并返回错误对象
        let error_obj = js_sys::Object::new();
        let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
        let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
        let _ = Reflect::set(&error_obj, &"error".into(), &"输入长度为0".into());
        
        match js_sys::JSON::stringify(&error_obj) {
            Ok(json_str) => {
                let json_string: String = json_str.into();
                return string_to_ptr(&json_string);
            },
            Err(_) => {
                return string_to_ptr("");
            }
        }
    }

    // 获取字符串数据
    let response_data = string_from_ptr(response_data_ptr, response_data_len);
    let ts = string_from_ptr(ts_ptr, ts_len);
    
    // origin可能为空指针，需要检查
    let _origin = if !origin_ptr.is_null() && origin_len > 0 {
        string_from_ptr(origin_ptr, origin_len)
    } else {
        String::new()
    };

    // 检查数据是否以"02"开头
    if !response_data.starts_with("02") {
        // 创建并返回错误对象
        let error_obj = js_sys::Object::new();
        let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
        let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
        let _ = Reflect::set(&error_obj, &"error".into(), &"响应数据不以02开头".into());
        
        match js_sys::JSON::stringify(&error_obj) {
            Ok(json_str) => {
                let json_string: String = json_str.into();
                return string_to_ptr(&json_string);
            },
            Err(_) => {
                return string_to_ptr("");
            }
        }
    }

    // 根据access-control-timestamp-user判断是否加密
    // ts一定不为空，表示已加密，需要解密
    // 解密模式：ts表示key的长度
    match ts.parse::<usize>() {
        Ok(key_length) => {
            // 检查响应数据长度是否足够
            if response_data.len() < 2 + key_length + 3 + 4 {
                // 创建并返回错误对象
                let error_obj = js_sys::Object::new();
                let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
                let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
                let _ = Reflect::set(&error_obj, &"error".into(), &"响应数据长度不足，无法解密".into());
                
                match js_sys::JSON::stringify(&error_obj) {
                    Ok(json_str) => {
                        let json_string: String = json_str.into();
                        return string_to_ptr(&json_string);
                    },
                    Err(_) => {
                        return string_to_ptr("");
                    }
                }
            }

            // 提取key（直接从response_data中获取，位于"02"之后）
            let key_start = 2; // "02"之后的位置
            let key_end = key_start + key_length;
            
            // 确保索引有效
            if key_end > response_data.len() {
                // 创建并返回错误对象
                let error_obj = js_sys::Object::new();
                let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
                let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
                let _ = Reflect::set(&error_obj, &"error".into(), &"密钥索引无效".into());
                
                match js_sys::JSON::stringify(&error_obj) {
                    Ok(json_str) => {
                        let json_string: String = json_str.into();
                        return string_to_ptr(&json_string);
                    },
                    Err(_) => {
                        return string_to_ptr("");
                    }
                }
            }
            
            let key = &response_data[key_start..key_end];

            // 提取加密数据（在key之后，"200"之前）
            let data_start = key_end + 3; // key之后加上"200"的长度
            let data_end = response_data.len().saturating_sub(4); // 去掉末尾的"ffff"
            
            // 确保索引有效
            if data_start >= data_end {
                // 创建并返回错误对象
                let error_obj = js_sys::Object::new();
                let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
                let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
                let _ = Reflect::set(&error_obj, &"error".into(), &"数据索引无效".into());
                
                match js_sys::JSON::stringify(&error_obj) {
                    Ok(json_str) => {
                        let json_string: String = json_str.into();
                        return string_to_ptr(&json_string);
                    },
                    Err(_) => {
                        return string_to_ptr("");
                    }
                }
            }
            
            let encrypted_data = &response_data[data_start..data_end];
            
            // 去除encrypted_data前两位
            let processed_encrypted_data = if encrypted_data.len() > 2 {
                &encrypted_data[2..]
            } else {
                encrypted_data
            };

            // 检查提取的加密数据是否为空
            if processed_encrypted_data.is_empty() {
                // 创建并返回错误对象
                let error_obj = js_sys::Object::new();
                let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
                let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
                let _ = Reflect::set(&error_obj, &"error".into(), &"提取的加密数据为空".into());
                
                match js_sys::JSON::stringify(&error_obj) {
                    Ok(json_str) => {
                        let json_string: String = json_str.into();
                        return string_to_ptr(&json_string);
                    },
                    Err(_) => {
                        return string_to_ptr("");
                    }
                }
            }

            // 使用提取的key解密数据
            // 直接使用SM2库解密，而不是调用sm2_decrypt函数
            let decrypted_data = {
                // 先尝试十六进制解码，再进行SM2解密
                match hex::decode(&processed_encrypted_data) {
                    Ok(encrypted_bytes) => {
                        // 使用smcrypto库进行SM2解密
                        let decrypt_ctx = smcrypto::sm2::Decrypt::new(&key);
                        let decrypted_bytes = decrypt_ctx.decrypt_c1c2c3(&encrypted_bytes);
                        
                        // 改进的解密后数据处理逻辑，解决乱码问题
                        // 优先尝试标准UTF-8字符串转换
                        match String::from_utf8(decrypted_bytes.clone()) {
                            Ok(utf8_result) => {
                                utf8_result
                            },
                            Err(_) => {
                                // 如果标准UTF-8转换失败，使用from_utf8_lossy进行容错处理
                                let lossy_result = String::from_utf8_lossy(&decrypted_bytes);
                                
                                // 检查是否是有效的JSON字符串
                                let result_str = lossy_result.into_owned();
                                if (result_str.starts_with("{") && result_str.ends_with("}")) || 
                                   (result_str.starts_with("[") && result_str.ends_with("]")) {
                                    result_str
                                } else {
                                    // 返回空字符串表示解码失败
                                    String::new()
                                }
                            }
                        }
                    },
                    Err(_e) => {
                        String::new()
                    }
                }
            };

            // 创建一个JavaScript对象来返回解密结果
            let result_obj = js_sys::Object::new();
            // 使用clone()来避免所有权问题
            let _ = Reflect::set(&result_obj, &"data".into(), &decrypted_data.clone().into());
            let _ = Reflect::set(&result_obj, &"success".into(), &true.into());
            
            // 将对象转换为JSON字符串，然后返回指针
            match js_sys::JSON::stringify(&result_obj) {
                Ok(json_str) => {
                    let json_string: String = json_str.into();
                    string_to_ptr(&json_string)
                },
                Err(_) => {
                    // 如果转换为JSON失败，返回原始解密数据
                    string_to_ptr(&decrypted_data)
                }
            }
        },
        Err(_) => {
            // 返回错误对象
            let error_obj = js_sys::Object::new();
            let _ = Reflect::set(&error_obj, &"data".into(), &"".into());
            let _ = Reflect::set(&error_obj, &"success".into(), &false.into());
            let _ = Reflect::set(&error_obj, &"error".into(), &"解析密钥长度失败".into());
            
            match js_sys::JSON::stringify(&error_obj) {
                Ok(json_str) => {
                    let json_string: String = json_str.into();
                    string_to_ptr(&json_string)
                },
                Err(_) => {
                    string_to_ptr("")
                }
            }
        }
    }
}

// UU2 function - Request encryption
#[wasm_bindgen]
pub fn uu2_encrypt_request(request_data_ptr: *const u8, request_data_len: usize, key_ptr: *const u8, key_len: usize) -> *mut u8 {
    // 直接使用AES加密函数
    aes_encrypt(request_data_ptr, request_data_len, key_ptr, key_len)
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