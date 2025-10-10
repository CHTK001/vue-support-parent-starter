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
    
    web_sys::console::log_1(&format!("aes_decrypt: encrypted_data={}, key={}", encrypted_data_str, key_str).into());
    
    // 检查输入是否为空
    if encrypted_data_str.is_empty() {
        web_sys::console::log_1(&"aes_decrypt: encrypted_data_str is empty".into());
        return string_to_ptr("");
    }
    
    if key_str.is_empty() {
        web_sys::console::log_1(&"aes_decrypt: key_str is empty".into());
        return string_to_ptr("");
    }
    
    // Base64解码
    let encrypted_bytes = match general_purpose::STANDARD.decode(&encrypted_data_str) {
        Ok(bytes) => {
            web_sys::console::log_1(&format!("aes_decrypt: base64 decoded, bytes length={}", bytes.len()).into());
            bytes
        },
        Err(e) => {
            web_sys::console::log_1(&format!("aes_decrypt: base64 decode failed: {:?}", e).into());
            // 解码失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 检查数据长度是否为16字节的倍数
    if encrypted_bytes.len() % 16 != 0 {
        web_sys::console::log_1(&format!("aes_decrypt: invalid data length {}, must be multiple of 16", encrypted_bytes.len()).into());
        return string_to_ptr("");
    }
    
    // 将密钥转换为16字节的密钥数组
    let mut key_bytes = [0u8; 16];
    let key_input_bytes = key_str.as_bytes();
    let copy_len = std::cmp::min(key_bytes.len(), key_input_bytes.len());
    key_bytes[..copy_len].copy_from_slice(&key_input_bytes[..copy_len]);
    
    web_sys::console::log_1(&format!("aes_decrypt: key_bytes prepared, copy_len={}", copy_len).into());
    
    // 创建AES解密器
    // 与DigestUtils.java保持一致，使用ECB模式而不是CBC模式
    use aes::cipher::{KeyInit, BlockDecryptMut, block_padding::Pkcs7};
    
    let cipher = aes::Aes128Dec::new(&key_bytes.into());
    
    // 创建缓冲区
    let mut buffer = encrypted_bytes.clone();
    
    web_sys::console::log_1(&format!("aes_decrypt: about to decrypt, buffer length={}", buffer.len()).into());
    
    // 执行AES解密，使用PKCS5Padding（在Rust中对应Pkcs7）
    let decrypted_data = match cipher.decrypt_padded_mut::<Pkcs7>(&mut buffer) {
        Ok(data) => {
            web_sys::console::log_1(&format!("aes_decrypt: decryption successful, data length={}", data.len()).into());
            data
        },
        Err(e) => {
            web_sys::console::log_1(&format!("aes_decrypt: decryption failed: {:?}", e).into());
            // 解密失败返回空字符串
            return string_to_ptr("");
        }
    };
    
    // 将解密结果转换为字符串
    let decrypted_str = String::from_utf8_lossy(decrypted_data).into_owned();
    web_sys::console::log_1(&format!("aes_decrypt: decrypted string={}", decrypted_str).into());
    
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
    // 验证输入参数
    if response_data_ptr.is_null() || ts_ptr.is_null() {
        web_sys::console::log_1(&"UU1解密响应: 输入指针为空".into());
        return string_to_ptr("");
    }

    if response_data_len == 0 || ts_len == 0 {
        web_sys::console::log_1(&"UU1解密响应: 输入长度为0".into());
        return string_to_ptr("");
    }

    // 获取字符串数据
    let response_data = string_from_ptr(response_data_ptr, response_data_len);
    let ts = string_from_ptr(ts_ptr, ts_len);
    
    // origin可能为空指针，需要检查
    let origin = if !origin_ptr.is_null() && origin_len > 0 {
        string_from_ptr(origin_ptr, origin_len)
    } else {
        String::new()
    };

    web_sys::console::log_1(&format!("UU1解密响应: 响应数据长度={}", response_data.len()).into());
    web_sys::console::log_1(&format!("UU1解密响应: 原始密钥={}", origin).into());
    web_sys::console::log_1(&format!("UU1解密响应: 时间戳={}", ts).into());

    // 检查数据是否以"02"开头
    if !response_data.starts_with("02") {
        web_sys::console::log_1(&"UU1解密响应: 响应数据不以02开头".into());
        return string_to_ptr("");
    }

    // 根据access-control-timestamp-user判断是否加密
    // 如果ts不为空，则表示已加密，需要解密
    if !ts.is_empty() {
        // 解密模式：ts表示key的长度
        match ts.parse::<usize>() {
            Ok(key_length) => {
                // 检查响应数据长度是否足够
                if response_data.len() < 2 + key_length + 3 + 4 {
                    web_sys::console::log_1(&"UU1解密响应: 响应数据长度不足，无法解密".into());
                    return string_to_ptr("");
                }

                // 提取key（直接从response_data中获取，位于"02"之后）
                let key_start = 2; // "02"之后的位置
                let key_end = key_start + key_length;
                
                // 确保索引有效
                if key_end > response_data.len() {
                    web_sys::console::log_1(&"UU1解密响应: 密钥索引无效".into());
                    return string_to_ptr("");
                }
                
                let key = &response_data[key_start..key_end];
                web_sys::console::log_1(&format!("UU1解密响应: 提取的密钥长度={}, 内容={}", key.len(), key).into());

                // 提取加密数据（在key之后，"200"之前）
                let data_start = key_end + 3; // key之后加上"200"的长度
                let data_end = response_data.len().saturating_sub(4); // 去掉末尾的"ffff"
                
                // 确保索引有效
                if data_start >= data_end {
                    web_sys::console::log_1(&"UU1解密响应: 数据索引无效".into());
                    return string_to_ptr("");
                }
                
                let encrypted_data = &response_data[data_start..data_end];
                web_sys::console::log_1(&format!("UU1解密响应: 加密数据长度={}, 内容前100字符={}", encrypted_data.len(), &encrypted_data[..std::cmp::min(100, encrypted_data.len())]).into());

                // 检查提取的加密数据是否为空
                if encrypted_data.is_empty() {
                    web_sys::console::log_1(&"UU1解密响应: 提取的加密数据为空".into());
                    return string_to_ptr("");
                }

                // 使用提取的key解密数据
                // 直接使用SM2库解密，而不是调用sm2_decrypt函数
                let decrypted_data = {
                    web_sys::console::log_1(&format!("UU1解密响应: 密钥={}, 加密数据长度={}", key, encrypted_data.len()).into());
                    // 先尝试十六进制解码，再进行SM2解密
                    match hex::decode(&encrypted_data) {
                        Ok(encrypted_bytes) => {
                            web_sys::console::log_1(&format!("UU1解密响应: 十六进制解码成功, 字节长度={}", encrypted_bytes.len()).into());
                            
                            // 打印前几个字节用于调试
                            let debug_bytes: Vec<String> = encrypted_bytes.iter().take(10).map(|b| format!("{:02x}", b)).collect();
                            web_sys::console::log_1(&format!("UU1解密响应: 加密数据前10字节={}", debug_bytes.join(" ")).into());
                            
                            // 使用smcrypto库进行SM2解密
                            let decrypt_ctx = smcrypto::sm2::Decrypt::new(&key);
                            let decrypted_bytes = decrypt_ctx.decrypt(&encrypted_bytes);
                            web_sys::console::log_1(&format!("UU1解密响应: SM2解密成功, 字节长度={}", decrypted_bytes.len()).into());
                            
                            // 打印解密后的前几个字节用于调试
                            let debug_decrypted_bytes: Vec<String> = decrypted_bytes.iter().take(10).map(|b| format!("{:02x}", b)).collect();
                            web_sys::console::log_1(&format!("UU1解密响应: 解密数据前10字节={}", debug_decrypted_bytes.join(" ")).into());
                            
                            // 尝试不同的方式将解密结果转换为字符串
                            // 首先尝试直接转换为UTF-8字符串
                            match String::from_utf8(decrypted_bytes.clone()) {
                                Ok(utf8_result) => {
                                    web_sys::console::log_1(&format!("UU1解密响应: UTF-8转换成功, 长度={}, 内容前100字符={}", utf8_result.len(), &utf8_result[..std::cmp::min(100, utf8_result.len())]).into());
                                    utf8_result
                                },
                                Err(e) => {
                                    web_sys::console::log_1(&format!("UU1解密响应: UTF-8转换失败: {:?}", e).into());
                                    // 如果UTF-8转换失败，使用from_utf8_lossy
                                    let lossy_result = String::from_utf8_lossy(&decrypted_bytes).into_owned();
                                    web_sys::console::log_1(&format!("UU1解密响应: UTF-8容错转换, 长度={}, 内容前100字符={}", lossy_result.len(), &lossy_result[..std::cmp::min(100, lossy_result.len())]).into());
                                    
                                    // 如果结果看起来像二进制数据，尝试Base64解码
                                    if lossy_result.len() > 0 && lossy_result.chars().any(|c| c as u32 > 127) {
                                        web_sys::console::log_1(&"UU1解密响应: 结果包含非ASCII字符, 尝试Base64解码".into());
                                        match general_purpose::STANDARD.decode(&decrypted_bytes) {
                                            Ok(decoded_bytes) => {
                                                match String::from_utf8(decoded_bytes.clone()) {
                                                    Ok(base64_result) => {
                                                        web_sys::console::log_1(&format!("UU1解密响应: Base64解码成功, 长度={}, 内容前100字符={}", base64_result.len(), &base64_result[..std::cmp::min(100, base64_result.len())]).into());
                                                        base64_result
                                                    },
                                                    Err(_) => {
                                                        let base64_lossy_result = String::from_utf8_lossy(&decoded_bytes).into_owned();
                                                        web_sys::console::log_1(&format!("UU1解密响应: Base64容错转换, 长度={}, 内容前100字符={}", base64_lossy_result.len(), &base64_lossy_result[..std::cmp::min(100, base64_lossy_result.len())]).into());
                                                        base64_lossy_result
                                                    }
                                                }
                                            },
                                            Err(_) => {
                                                web_sys::console::log_1(&"UU1解密响应: Base64解码失败, 返回UTF-8容错结果".into());
                                                lossy_result
                                            }
                                        }
                                    } else {
                                        lossy_result
                                    }
                                }
                            }
                        },
                        Err(e) => {
                            web_sys::console::log_1(&format!("UU1解密响应: 十六进制解码加密数据失败: {:?}", e).into());
                            String::new()
                        }
                    }
                };
                web_sys::console::log_1(&format!("UU1解密响应: 最终解密结果长度={}, 内容前100字符={}", decrypted_data.len(), &decrypted_data[..std::cmp::min(100, decrypted_data.len())]).into());

                // 返回解密结果
                string_to_ptr(&decrypted_data)
            },
            Err(_) => {
                web_sys::console::log_1(&"UU1解密响应: 解析密钥长度失败".into());
                return string_to_ptr("");
            }
        }
    } else {
        // 未加密模式：直接提取数据部分
        // 格式: "02" + key + "200" + data + "ffff"
        if response_data.len() < 6 {
            web_sys::console::log_1(&"UU1解密响应: 未加密模式下响应数据长度不足".into());
            return string_to_ptr("");
        }

        // 找到"200"的位置
        if let Some(data_start_pos) = response_data.find("200") {
            // 数据开始位置在"200"之后
            let data_start = data_start_pos + 3;
            // 数据结束位置在"ffff"之前
            let data_end = response_data.len().saturating_sub(4);
            
            // 确保索引有效
            if data_start >= data_end {
                web_sys::console::log_1(&"UU1解密响应: 未加密模式下数据索引无效".into());
                return string_to_ptr("");
            }
            
            let data = &response_data[data_start..data_end];
            web_sys::console::log_1(&format!("UU1解密响应: 提取未加密数据长度={}, 内容前100字符={}", data.len(), &data[..std::cmp::min(100, data.len())]).into());
            
            // 返回原始数据
            string_to_ptr(data)
        } else {
            web_sys::console::log_1(&"UU1解密响应: 未找到数据分隔符'200'".into());
            return string_to_ptr("");
        }
    }
}

// UU1 function - Response decryption for entire response object
#[wasm_bindgen]
pub fn uu1_decrypt_response_object(response: &JsValue) -> JsValue {
    web_sys::console::log_1(&"UU1解密响应对象: 调用函数".into());
    
    // 获取响应数据
    let headers = match Reflect::get(response, &"headers".into()) {
        Ok(headers) => headers,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象: 获取响应头失败".into());
            // 如果无法获取headers，返回原始响应
            return response.clone();
        },
    };
    
    // 获取响应数据
    let data = match Reflect::get(response, &"data".into()) {
        Ok(data) => data,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象: 获取响应数据失败".into());
            // 如果无法获取data，返回原始响应
            return response.clone();
        },
    };
    
    // 获取时间戳（access-control-timestamp-user）
    let timestamp = match Reflect::get(&headers, &"access-control-timestamp-user".into()) {
        Ok(ts) => ts,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象: 获取时间戳失败".into());
            JsValue::NULL
        },
    };
    
    // 获取origin key（可能不存在）
    let origin_key = match Reflect::get(&headers, &"access-control-origin-key".into()) {
        Ok(key) => key,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象: 未找到origin-key头".into());
            JsValue::UNDEFINED
        },
    };
    
    // 将数据转换为字符串
    let data_string = match data.as_string() {
        Some(s) => {
            web_sys::console::log_1(&format!("UU1解密响应对象: 响应数据字符串 = {}", s).into());
            s
        },
        None => {
            web_sys::console::log_1(&"UU1解密响应对象: 响应数据不是字符串，尝试转换为JSON字符串".into());
            // 如果不是字符串，尝试转换为JSON字符串
            match js_sys::JSON::stringify(&data) {
                Ok(json_str) => {
                    web_sys::console::log_1(&format!("UU1解密响应对象: 转换为JSON字符串 = {}", json_str.as_string().unwrap_or_default()).into());
                    json_str.into()
                },
                Err(_) => {
                    web_sys::console::log_1(&"UU1解密响应对象: 转换为JSON字符串失败".into());
                    // 如果无法转换为字符串，返回原始响应
                    return response.clone();
                },
            }
        }
    };
    
    // 将timestamp转换为字符串（可能为空）
    let timestamp_string = match timestamp.as_string() {
        Some(s) => {
            web_sys::console::log_1(&format!("UU1解密响应对象: 时间戳 = {}", s).into());
            s
        },
        None => {
            web_sys::console::log_1(&"UU1解密响应对象: 无时间戳，假设未加密".into());
            String::new() // 如果没有时间戳，使用空字符串表示未加密
        },
    };
    
    // 将origin_key转换为字符串（可能为空）
    let origin_key_string = match origin_key.as_string() {
        Some(s) => {
            web_sys::console::log_1(&format!("UU1解密响应对象: 原始密钥 = {}", s).into());
            s
        },
        None => {
            web_sys::console::log_1(&"UU1解密响应对象: 无原始密钥".into());
            String::new() // 如果没有origin_key，使用空字符串
        },
    };
    
    // 调用原有的解密函数
    let data_ptr = data_string.as_ptr();
    let data_len = data_string.len();
    let origin_ptr = if !origin_key_string.is_empty() {
        origin_key_string.as_ptr()
    } else {
        std::ptr::null()
    };
    let origin_len = origin_key_string.len();
    let ts_ptr = if !timestamp_string.is_empty() {
        timestamp_string.as_ptr()
    } else {
        std::ptr::null()
    };
    let ts_len = timestamp_string.len();
    
    web_sys::console::log_1(&format!("UU1解密响应对象: 调用uu1_decrypt_response函数，数据长度={}, 原始密钥长度={}, 时间戳长度={}", data_len, origin_len, ts_len).into());
    
    let decrypted_ptr = uu1_decrypt_response(data_ptr, data_len, origin_ptr, origin_len, ts_ptr, ts_len);
    let decrypted_string = string_from_ptr(decrypted_ptr, get_string_length(decrypted_ptr));
    
    web_sys::console::log_1(&format!("UU1解密响应对象: 解密结果 = {}", decrypted_string).into());
    
    // 如果解密结果为空，返回原始响应
    if decrypted_string.is_empty() {
        web_sys::console::log_1(&"UU1解密响应对象: 解密结果为空，返回原始响应".into());
        return response.clone();
    }
    
    // 创建新的响应对象
    let new_response = response.clone();
    
    // 直接将解密后的字符串设置为data，不需要解析JSON
    let _ = Reflect::set(&new_response, &"data".into(), &decrypted_string.into());
    
    web_sys::console::log_1(&"UU1解密响应对象: 成功更新响应数据".into());
    
    // 注意：我们不能直接删除headers中的属性，因为headers本身可能不是Object类型
    // 我们需要创建一个新的headers对象或者以其他方式处理
    
    new_response
}

// UU1 function - Response decryption for entire response object with ArrayBuffer support
#[wasm_bindgen]
pub fn uu1_decrypt_response_object_with_arraybuffer(response: &JsValue) -> JsValue {
    web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 调用函数".into());
    
    // 获取响应数据
    let headers = match Reflect::get(response, &"headers".into()) {
        Ok(headers) => headers,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 获取响应头失败".into());
            // 如果无法获取headers，返回原始响应
            return response.clone();
        },
    };
    
    // 获取响应数据
    let data = match Reflect::get(response, &"data".into()) {
        Ok(data) => data,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 获取响应数据失败".into());
            // 如果无法获取data，返回原始响应
            return response.clone();
        },
    };
    
    // 获取时间戳（access-control-timestamp-user）
    let timestamp = match Reflect::get(&headers, &"access-control-timestamp-user".into()) {
        Ok(ts) => ts,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 获取时间戳失败".into());
            JsValue::NULL
        },
    };
    
    // 获取origin key（可能不存在）
    let origin_key = match Reflect::get(&headers, &"access-control-origin-key".into()) {
        Ok(key) => key,
        Err(_) => {
            web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 未找到origin-key头".into());
            JsValue::UNDEFINED
        },
    };
    
    // 检查data是否为ArrayBuffer或Blob
    if data.is_object() && (js_sys::ArrayBuffer::instanceof(&data) || js_sys::Uint8Array::instanceof(&data)) {
        web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 数据为ArrayBuffer或Uint8Array类型".into());
        
        // 打印原始ArrayBuffer数据的长度
        let data_length = if js_sys::ArrayBuffer::instanceof(&data) {
            let uint8_array = js_sys::Uint8Array::new(&data);
            uint8_array.length()
        } else {
            let uint8_array = js_sys::Uint8Array::from(data.clone());
            uint8_array.length()
        };
        
        web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 数据长度 = {}", data_length).into());
        
        // 打印原始ArrayBuffer数据的前几个字节（用于调试）
        let uint8_array = if js_sys::ArrayBuffer::instanceof(&data) {
            js_sys::Uint8Array::new(&data)
        } else {
            js_sys::Uint8Array::from(data.clone())
        };
        
        // 创建一个包含前10个字节的子数组用于打印
        let print_length = std::cmp::min(10, data_length);
        let sub_array = uint8_array.subarray(0, print_length);
        let mut bytes_string = String::new();
        
        for i in 0..sub_array.length() {
            bytes_string.push_str(&format!("{:02x} ", sub_array.get_index(i)));
        }
        
        web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 前{}字节数据 = {}", print_length, bytes_string).into());
        
        // 使用JavaScript的TextDecoder来解析ArrayBuffer
        // 创建一个JavaScript函数来处理TextDecoder解码，明确指定UTF-8编码
        let decode_function = js_sys::Function::new_with_args("data", "
            try {
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(data);
            } catch (error) {
                console.error('TextDecoder解码错误:', error);
                return '';
            }
        ");
        
        // 调用函数解码数据
        let decoded_result = match decode_function.call1(&js_sys::global(), &data) {
            Ok(result) => result,
            Err(_) => {
                web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 使用TextDecoder解码数据失败".into());
                return response.clone();
            }
        };
        
        // 将结果转换为字符串
        let data_string = match decoded_result.as_string() {
            Some(s) => s,
            None => {
                web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 解码结果不是字符串".into());
                return response.clone();
            }
        };
        
        web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 数据字符串 = {}", data_string).into());
        
        // 检查数据是否以"02"开头
        if !data_string.starts_with("02") {
            web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 数据不以02开头".into());
            return response.clone();
        }
        
        // 将timestamp转换为字符串（可能为空）
        let timestamp_string = match timestamp.as_string() {
            Some(s) => {
                web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 时间戳 = {}", s).into());
                s
            },
            None => {
                web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 无时间戳，假设未加密".into());
                String::new() // 如果没有时间戳，使用空字符串表示未加密
            },
        };
        
        // 将origin_key转换为字符串（可能为空）
        let origin_key_string = match origin_key.as_string() {
            Some(s) => {
                web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 原始密钥 = {}", s).into());
                s
            },
            None => {
                web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 无原始密钥".into());
                String::new() // 如果没有origin_key，使用空字符串
            },
        };
        
        // 调用原有的解密函数
        let data_ptr = data_string.as_ptr();
        let data_len = data_string.len();
        let origin_ptr = if !origin_key_string.is_empty() {
            origin_key_string.as_ptr()
        } else {
            std::ptr::null()
        };
        let origin_len = origin_key_string.len();
        let ts_ptr = if !timestamp_string.is_empty() {
            timestamp_string.as_ptr()
        } else {
            std::ptr::null()
        };
        let ts_len = timestamp_string.len();
        
        web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 调用uu1_decrypt_response函数，数据长度={}, 原始密钥长度={}, 时间戳长度={}", data_len, origin_len, ts_len).into());
        
        let decrypted_ptr = uu1_decrypt_response(data_ptr, data_len, origin_ptr, origin_len, ts_ptr, ts_len);
        let decrypted_string = string_from_ptr(decrypted_ptr, get_string_length(decrypted_ptr));
        
        web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 解密结果 = {}", decrypted_string).into());
        
        // 如果解密结果为空，返回原始响应
        if decrypted_string.is_empty() {
            web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 解密结果为空，返回原始响应".into());
            return response.clone();
        }
        
        // 创建新的响应对象
        let new_response = response.clone();
        
        // 直接将解密后的字符串设置为data，不需要解析JSON
        let decrypted_string_clone = decrypted_string.clone();
        let _ = Reflect::set(&new_response, &"data".into(), &decrypted_string_clone.into());
        
        // 添加长度响应头
        let data_length = decrypted_string.len();
        let headers = match Reflect::get(&new_response, &"headers".into()) {
            Ok(headers) => headers,
            Err(_) => {
                // 如果无法获取headers，创建一个新的headers对象
                let new_headers = js_sys::Object::new();
                let _ = Reflect::set(&new_response, &"headers".into(), &new_headers);
                new_headers.into()
            }
        };
        
        // 设置Content-Length头
        let length_string = data_length.to_string();
        let length_string_clone = length_string.clone();
        let _ = Reflect::set(&headers, &"content-length".into(), &length_string_clone.into());
        
        web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 添加content-length头 = {}", length_string).into());
        
        // 直接打印更新后的响应对象（不转换为JSON字符串）
        web_sys::console::log_1(&format!("UU1解密响应对象(带ArrayBuffer支持): 更新后的响应对象 = {:?}", new_response).into());
        
        web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 成功更新响应数据".into());
        
        // 注意：我们不能直接删除headers中的属性，因为headers本身可能不是Object类型
        // 我们需要创建一个新的headers对象或者以其他方式处理
        
        return new_response;
    } else {
        // 如果不是ArrayBuffer，使用原来的处理逻辑
        web_sys::console::log_1(&"UU1解密响应对象(带ArrayBuffer支持): 数据不是ArrayBuffer类型，使用原始逻辑处理".into());
        return uu1_decrypt_response_object(response);
    }
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
    
    web_sys::console::log_1(&format!("uu4_decrypt_response: response_data={}, uuid={}, timestamp={}", response_data, uuid, timestamp).into());
    
    // 检查数据是否以"02"开头
    if !response_data.starts_with("02") {
        web_sys::console::log_1(&"uu4_decrypt_response: response_data does not start with 02".into());
        return string_to_ptr("");
    }
    
    // 解密uuid获取密钥
    web_sys::console::log_1(&format!("uu4_decrypt_response: about to decrypt uuid={}, timestamp={}", uuid, timestamp).into());
    let key_ptr = aes_decrypt(uuid_ptr, uuid_len, timestamp_ptr, timestamp_len);
    let key = string_from_ptr(key_ptr, get_string_length(key_ptr));
    web_sys::console::log_1(&format!("uu4_decrypt_response: decrypted key={}", key).into());
    
    // 检查解密后的密钥是否为空
    if key.is_empty() {
        web_sys::console::log_1(&"uu4_decrypt_response: decrypted key is empty, AES decryption failed".into());
        // 添加调试信息
        web_sys::console::log_1(&format!("uu4_decrypt_response: uuid length={}, timestamp length={}", uuid.len(), timestamp.len()).into());
        return string_to_ptr("");
    }
    
    // 从response_data中提取加密数据（去掉前6位和后4位）
    if response_data.len() < 10 {
        web_sys::console::log_1(&"uu4_decrypt_response: response_data too short".into());
        return string_to_ptr("");
    }
    
    // 提取加密数据部分（去掉前6位和后4位）
    let start_index = 6;
    let end_index = response_data.len().saturating_sub(4); // 使用saturating_sub防止下溢
    
    // 确保开始索引小于结束索引
    if start_index >= end_index {
        web_sys::console::log_1(&"uu4_decrypt_response: invalid indices for data extraction".into());
        return string_to_ptr("");
    }
    
    // 提取加密数据部分（去掉前6位和后4位）
    let encrypted_data = &response_data[start_index..end_index];
    web_sys::console::log_1(&format!("uu4_decrypt_response: encrypted_data={}", encrypted_data).into());
    
    // 检查提取的加密数据是否为空
    if encrypted_data.is_empty() {
        web_sys::console::log_1(&"uu4_decrypt_response: extracted encrypted_data is empty".into());
        return string_to_ptr("");
    }
    
    // 创建加密数据的指针
    web_sys::console::log_1(&format!("uu4_decrypt_response: about to decrypt encrypted_data with key={}", key).into());
    let encrypted_data_ptr = encrypted_data.as_ptr();
    let encrypted_data_len = encrypted_data.len();
    
    // 解密数据
    let key_ptr_for_decryption = key.as_ptr();
    let key_len_for_decryption = key.len();
    let decrypted_data_ptr = aes_decrypt(encrypted_data_ptr, encrypted_data_len, key_ptr_for_decryption, key_len_for_decryption);
    let decrypted_data = string_from_ptr(decrypted_data_ptr, get_string_length(decrypted_data_ptr));
    web_sys::console::log_1(&format!("uu4_decrypt_response: decrypted_data={}", decrypted_data).into());
    
    // 返回解密结果
    string_to_ptr(&decrypted_data)
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
pub fn encrypt_storage_key(_key_ptr: *const u8, _key_len: usize, _system_code_ptr: *const u8, _system_code_len: usize) -> *mut u8 {
    // 直接返回原始数据，不进行任何处理
    // 获取原始密钥数据
    let key = string_from_ptr(_key_ptr, _key_len);
    
    // 直接返回原始密钥，不进行加密处理
    string_to_ptr(&key)
}

// Storage Value encryption function
#[wasm_bindgen]
pub fn encrypt_storage_value(_value_ptr: *const u8, _value_len: usize, _key_ptr: *const u8, _key_len: usize, _system_code_ptr: *const u8, _system_code_len: usize, _storage_key_ptr: *const u8, _storage_key_len: usize, _storage_encode_ptr: *const u8, _storage_encode_len: usize) -> *mut u8 {
    // 获取字符串数据
    let value = string_from_ptr(_value_ptr, _value_len);
    let _key = string_from_ptr(_key_ptr, _key_len);
    let _system_code = string_from_ptr(_system_code_ptr, _system_code_len);
    let _storage_key = string_from_ptr(_storage_key_ptr, _storage_key_len);
    let _storage_encode = string_from_ptr(_storage_encode_ptr, _storage_encode_len);
    
    // 这里实现存储值的加密逻辑
    // 为了简化，我们直接返回原始值（实际实现中应该根据参数进行加密）
    string_to_ptr(&value)
}

// Storage Value decryption function
#[wasm_bindgen]
pub fn decrypt_storage_value(_value_ptr: *const u8, _value_len: usize, _key_ptr: *const u8, _key_len: usize, _system_code_ptr: *const u8, _system_code_len: usize, _storage_key_ptr: *const u8, _storage_key_len: usize, _storage_encode_ptr: *const u8, _storage_encode_len: usize) -> *mut u8 {
    // 获取字符串数据
    let value = string_from_ptr(_value_ptr, _value_len);
    let _key = string_from_ptr(_key_ptr, _key_len);
    let _system_code = string_from_ptr(_system_code_ptr, _system_code_len);
    let _storage_key = string_from_ptr(_storage_key_ptr, _storage_key_len);
    let _storage_encode = string_from_ptr(_storage_encode_ptr, _storage_encode_len);
    
    // 这里实现存储值的解密逻辑
    // 为了简化，我们直接返回原始值（实际实现中应该根据参数进行解密）
    string_to_ptr(&value)
}

// Custom encryption function - Encrypt data with codecKeyPair, handle key separately
#[wasm_bindgen]
pub fn custom_encrypt_with_codec_keypair(data_ptr: *const u8, data_len: usize, public_key_ptr: *const u8, public_key_len: usize, private_key_ptr: *const u8, private_key_len: usize) -> *mut u8 {
    // 获取字符串数据
    let data = string_from_ptr(data_ptr, data_len);
    let public_key_hex = string_from_ptr(public_key_ptr, public_key_len);
    let private_key_hex = string_from_ptr(private_key_ptr, private_key_len);
    
    web_sys::console::log_1(&format!("custom_encrypt_with_codec_keypair: data={}, public_key={}, private_key={}", data, public_key_hex, private_key_hex).into());
    
    // 使用codecKeyPair加密原始数据 (SM2加密)
    let encrypted_data_ptr = sm2_encrypt(data_ptr, data_len, public_key_ptr, public_key_len);
    let encrypted_data = string_from_ptr(encrypted_data_ptr, get_string_length(encrypted_data_ptr));
    
    web_sys::console::log_1(&format!("custom_encrypt_with_codec_keypair: encrypted_data={}", encrypted_data).into());
    
    // 对于密钥，我们使用AES加密私钥（您可以根据需要修改这部分逻辑）
    let timestamp = format!("{:016}", js_sys::Date::now() as u64 % 10000000000000000u64);
    let key_encryption_result_ptr = aes_encrypt(private_key_ptr, private_key_len, timestamp.as_ptr(), timestamp.len());
    let key_encryption_result = string_from_ptr(key_encryption_result_ptr, get_string_length(key_encryption_result_ptr));
    
    web_sys::console::log_1(&format!("custom_encrypt_with_codec_keypair: key_encryption_result={}", key_encryption_result).into());
    
    // 创建包含加密数据和加密密钥的JSON对象
    let result_json = format!("{{\"encryptedData\":\"{}\",\"encryptedKey\":\"{}\",\"timestamp\":\"{}\"}}", encrypted_data, key_encryption_result, timestamp);
    
    // 返回结果
    string_to_ptr(&result_json)
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
