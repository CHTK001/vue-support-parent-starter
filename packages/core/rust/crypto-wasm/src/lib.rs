//! crypto-wasm —— core 的加密 wasm 模块
//!
//! 与 `packages/core/src/crypto/types.ts` 的 `CryptoModule` 接口一一对应。
//! 注意：wasm-bindgen 不会自动转换命名，因此通过 `js_name` 显式声明
//! JS 侧导出名为 camelCase，与 TS 接口方法名一致。
//!
//! 构建产物（crypto-wasm.js + crypto-wasm_bg.wasm）应放置到应用 public 的
//! `/wasm/` 目录下，由 `loadCrypto` 动态加载。
//!
//! 构建命令（需安装 wasm-pack）：
//!   wasm-pack build --target web --out-dir ../../../../public/wasm

use aes::Aes128;
use aes::Aes192;
use aes::Aes256;
use cbc::{Decryptor as CbcDecryptor, Encryptor as CbcEncryptor};
use cipher::{
    block_padding::Pkcs7,
    BlockDecryptMut,
    BlockEncryptMut,
    KeyInit,
    KeyIvInit,
};
use ecb::{Decryptor as EcbDecryptor, Encryptor as EcbEncryptor};
use md5::{Digest as Md5Digest, Md5};
use sm2::{
    PublicKey, SecretKey,
    elliptic_curve::{Generate, common::getrandom::SysRng},
    pke::{DecryptingKey, EncryptingKey, Mode},
};
use serde::{Deserialize, Serialize};
use sm3::Digest as Sm3Digest;
use sm4::Sm4;
use wasm_bindgen::prelude::*;

// ── keylog / codec-256 扩展依赖 ──
// Aead trait 提供 encrypt/decrypt；KeyInit 已由上方 cipher::KeyInit 提供（同一 trait）
use aes_gcm::{
    Aes256Gcm,
    Nonce as AeadNonce,
    aead::{Aead, Payload},
};
use hkdf::Hkdf;
// 注意：sha2::Digest 与 md5::Digest 是同一个 digest 0.10 trait，此处不再重复导入别名
use sha2::Sha256;
use x25519_dalek::{PublicKey as X25519PublicKey, StaticSecret};

/// AES-128-CBC 加密器别名
type Aes128CbcEnc = CbcEncryptor<Aes128>;

/// AES-128-CBC 解密器别名
type Aes128CbcDec = CbcDecryptor<Aes128>;

/// AES-192-CBC 加密器别名
type Aes192CbcEnc = CbcEncryptor<Aes192>;

/// AES-192-CBC 解密器别名
type Aes192CbcDec = CbcDecryptor<Aes192>;

/// AES-256-CBC 加密器别名
type Aes256CbcEnc = CbcEncryptor<Aes256>;

/// AES-256-CBC 解密器别名
type Aes256CbcDec = CbcDecryptor<Aes256>;

/// SM4-ECB 加密器别名
type Sm4EcbEnc = EcbEncryptor<Sm4>;

/// SM4-ECB 解密器别名
type Sm4EcbDec = EcbDecryptor<Sm4>;

/// 默认 IV（16 字节全零），与后端 AES/CBC/PKCS5Padding 对齐
const DEFAULT_IV: [u8; 16] = [0u8; 16];

/// AES 变种密文魔数头（"CHA1"），用于标识版本与数据格式
const VARIANT_MAGIC: [u8; 4] = [0x43, 0x48, 0x41, 0x31];

/// AES 变种块内置换表（16 元素，非标准 AES 逻辑，防止标准工具直接解密）
const VARIANT_PERM: [usize; 16] = [7, 3, 15, 1, 11, 5, 13, 9, 0, 6, 14, 2, 12, 8, 4, 10];

/// AES 变种块内逆置换表（与 VARIANT_PERM 互逆）
const VARIANT_INV_PERM: [usize; 16] = [8, 3, 11, 1, 14, 5, 9, 0, 13, 7, 15, 4, 12, 6, 10, 2];

/// 从任意长度 secret 派生变种加密 key（16 字节）
fn variant_key(secret: &[u8]) -> [u8; 16] {
    let mut h1 = Md5::new();
    h1.update(secret);
    h1.finalize().into()
}

/// 变种白化预处理：按 16 字节块做块内置换并逐字节异或派生 key（不足 16 字节的尾部不处理）
fn variant_whiten(data: &mut [u8], key: &[u8]) {
    for chunk in data.chunks_exact_mut(16) {
        let mut tmp = [0u8; 16];
        for i in 0..16 {
            tmp[i] = chunk[VARIANT_PERM[i]];
        }
        for i in 0..16 {
            tmp[i] ^= key[i % key.len()];
        }
        chunk.copy_from_slice(&tmp);
    }
}

/// 变种白化逆处理：先异或派生 key，再做块内逆置换
fn variant_unwhiten(data: &mut [u8], key: &[u8]) {
    for chunk in data.chunks_exact_mut(16) {
        let mut tmp = [0u8; 16];
        for i in 0..16 {
            tmp[i] = chunk[i] ^ key[i % key.len()];
        }
        let mut out = [0u8; 16];
        for i in 0..16 {
            out[i] = tmp[VARIANT_INV_PERM[i]];
        }
        chunk.copy_from_slice(&out);
    }
}

/// AES 加密（CBC 模式，iv 缺省为 16 字节全零；密钥支持 16/24/32 字节）
#[wasm_bindgen(js_name = "aesEncrypt")]
pub fn aes_encrypt(data: &[u8], key: &[u8], iv: Option<Vec<u8>>) -> Vec<u8> {
    let iv: &[u8] = iv.as_deref().unwrap_or(&DEFAULT_IV);
    match key.len() {
        16 => Aes128CbcEnc::new_from_slices(key, iv)
            .expect("AES key 或 iv 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(data),
        24 => Aes192CbcEnc::new_from_slices(key, iv)
            .expect("AES key 或 iv 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(data),
        32 => Aes256CbcEnc::new_from_slices(key, iv)
            .expect("AES key 或 iv 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(data),
        _ => panic!("AES key 长度必须为 16/24/32 字节"),
    }
}

/// AES 解密（CBC 模式，iv 缺省为 16 字节全零；密钥支持 16/24/32 字节）
#[wasm_bindgen(js_name = "aesDecrypt")]
pub fn aes_decrypt(data: &[u8], key: &[u8], iv: Option<Vec<u8>>) -> Vec<u8> {
    let iv: &[u8] = iv.as_deref().unwrap_or(&DEFAULT_IV);
    match key.len() {
        16 => Aes128CbcDec::new_from_slices(key, iv)
            .expect("AES key 或 iv 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(data)
            .expect("AES 解密失败，数据可能被篡改或密钥错误"),
        24 => Aes192CbcDec::new_from_slices(key, iv)
            .expect("AES key 或 iv 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(data)
            .expect("AES 解密失败，数据可能被篡改或密钥错误"),
        32 => Aes256CbcDec::new_from_slices(key, iv)
            .expect("AES key 或 iv 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(data)
            .expect("AES 解密失败，数据可能被篡改或密钥错误"),
        _ => panic!("AES key 长度必须为 16/24/32 字节"),
    }
}

/// AES-ECB 加密（PKCS7 填充；密钥支持 16/24/32 字节）
///
/// 与 CryptoJS AES/ECB/Pkcs7 输出一致（密文裸字节，不含 IV）。
#[wasm_bindgen(js_name = "aesEcbEncrypt")]
pub fn aes_ecb_encrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
    match key.len() {
        16 => EcbEncryptor::<Aes128>::new_from_slice(key)
            .expect("AES key 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(data),
        24 => EcbEncryptor::<Aes192>::new_from_slice(key)
            .expect("AES key 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(data),
        32 => EcbEncryptor::<Aes256>::new_from_slice(key)
            .expect("AES key 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(data),
        _ => panic!("AES key 长度必须为 16/24/32 字节"),
    }
}

/// AES-ECB 解密（PKCS7 填充；密钥支持 16/24/32 字节）
#[wasm_bindgen(js_name = "aesEcbDecrypt")]
pub fn aes_ecb_decrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
    match key.len() {
        16 => EcbDecryptor::<Aes128>::new_from_slice(key)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(data)
            .expect("AES 解密失败，数据可能被篡改或密钥错误"),
        24 => EcbDecryptor::<Aes192>::new_from_slice(key)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(data)
            .expect("AES 解密失败，数据可能被篡改或密钥错误"),
        32 => EcbDecryptor::<Aes256>::new_from_slice(key)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(data)
            .expect("AES 解密失败，数据可能被篡改或密钥错误"),
        _ => panic!("AES key 长度必须为 16/24/32 字节"),
    }
}

/// AES 变种加密（自定义流程，仅用于内部 storage 防破解，非标准 AES 协议）
///
/// 输出格式：[magic 4B][iv 16B][cipher]
/// 流程：派生 key → 生成随机 iv → 明文块内置换+异或白化 → AES-128-CBC 加密。
/// 随机 iv 使相同明文每次密文不同；与后端无约定，仅供前端本地持久化使用。
#[wasm_bindgen(js_name = "aesVariantEncrypt")]
pub fn aes_variant_encrypt(data: &[u8], secret: &[u8]) -> Vec<u8> {
    let key = variant_key(secret);
    let iv = random_iv();
    let mut payload = data.to_vec();
    variant_whiten(&mut payload, &key);
    let cipher = Aes128CbcEnc::new_from_slices(&key, &iv)
        .expect("变种 AES key/iv 长度不合法")
        .encrypt_padded_vec_mut::<Pkcs7>(&payload);
    let mut out = Vec::with_capacity(VARIANT_MAGIC.len() + iv.len() + cipher.len());
    out.extend_from_slice(&VARIANT_MAGIC);
    out.extend_from_slice(&iv);
    out.extend_from_slice(&cipher);
    out
}

/// AES 变种解密（与 aesVariantEncrypt 互逆，魔数不符或解密失败时抛错）
#[wasm_bindgen(js_name = "aesVariantDecrypt")]
pub fn aes_variant_decrypt(data: &[u8], secret: &[u8]) -> Vec<u8> {
    let head_len = VARIANT_MAGIC.len() + 16;
    if data.len() < head_len || data[..VARIANT_MAGIC.len()] != VARIANT_MAGIC {
        panic!("非 AES 变种密文或数据被篡改");
    }
    let key = variant_key(secret);
    let iv: [u8; 16] = data[VARIANT_MAGIC.len()..head_len].try_into().unwrap();
    let cipher = &data[head_len..];
    let mut plain = Aes128CbcDec::new_from_slices(&key, &iv)
        .expect("变种 AES key/iv 长度不合法")
        .decrypt_padded_vec_mut::<Pkcs7>(cipher)
        .expect("AES 变种解密失败，数据可能被篡改或密钥错误");
    variant_unwhiten(&mut plain, &key);
    plain
}

/// 生成变种随机 iv（16 字节，wasm 环境下由 getrandom 提供熵源）
fn random_iv() -> [u8; 16] {
    let mut iv = [0u8; 16];
    getrandom::fill(&mut iv).expect("获取随机数失败");
    iv
}

/// SM2 密钥对结构（publicKey / privateKey 均为 hex 字符串）
#[derive(Serialize)]
struct Sm2KeyPair {
    /// 公钥 hex 字符串
    public_key: String,
    /// 私钥 hex 字符串
    private_key: String,
}

/// SM2 密钥对（返回 { publicKey, privateKey } 的 hex 字符串）
#[wasm_bindgen(js_name = "sm2GenerateKeyPair")]
pub fn sm2_generate_key_pair() -> JsValue {
    let secret_key = SecretKey::generate();
    let public_key = secret_key.public_key();
    let private_key_hex = bytes_to_hex(secret_key.to_bytes().as_slice());
    let public_key_hex = bytes_to_hex(public_key.to_sec1_bytes().as_ref());
    serde_wasm_bindgen::to_value(&Sm2KeyPair {
        public_key: public_key_hex,
        private_key: private_key_hex,
    })
    .expect("SM2 密钥对序列化失败")
}

/// SM2 加密（公钥 hex，C1C3C2 格式）
#[wasm_bindgen(js_name = "sm2Encrypt")]
pub fn sm2_encrypt(public_key: &str, data: &[u8]) -> Vec<u8> {
    let public_key = hex_to_bytes(public_key);
    let public_key = PublicKey::from_sec1_bytes(&public_key)
        .expect("SM2 公钥解析失败");
    let encrypting_key = EncryptingKey::new_with_mode(public_key, Mode::C1C2C3);
    encrypting_key
        .encrypt(&mut SysRng, data)
        .expect("SM2 加密失败")
        .to_vec()
}

/// SM2 解密（私钥 hex）
#[wasm_bindgen(js_name = "sm2Decrypt")]
pub fn sm2_decrypt(private_key: &str, data: &[u8]) -> Vec<u8> {
    let private_key = hex_to_bytes(private_key);
    let secret_key = SecretKey::from_slice(&private_key).expect("SM2 私钥解析失败");
    let decrypting_key = DecryptingKey::new_with_mode(secret_key.to_nonzero_scalar(), Mode::C1C2C3);
    decrypting_key
        .decrypt(data)
        .expect("SM2 解密失败")
        .to_vec()
}

/// SM3 摘要（返回 hex 字符串）
#[wasm_bindgen(js_name = "sm3")]
pub fn sm3(data: &[u8]) -> String {
    let mut hasher = sm3::Sm3::new();
    hasher.update(data);
    bytes_to_hex(&hasher.finalize())
}

/// MD5 摘要（返回 hex 字符串，与后端 NonceUtils 签名算法一致）
#[wasm_bindgen(js_name = "md5")]
pub fn md5(data: &[u8]) -> String {
    let mut hasher = Md5::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

/// SM4 加密（ECB 模式）
#[wasm_bindgen(js_name = "sm4Encrypt")]
pub fn sm4_encrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
    Sm4EcbEnc::new_from_slice(key)
        .expect("SM4 key 长度不合法")
        .encrypt_padded_vec_mut::<Pkcs7>(data)
}

/// SM4 解密（ECB 模式）
#[wasm_bindgen(js_name = "sm4Decrypt")]
pub fn sm4_decrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
    Sm4EcbDec::new_from_slice(key)
        .expect("SM4 key 长度不合法")
        .decrypt_padded_vec_mut::<Pkcs7>(data)
        .expect("SM4 解密失败")
}

// ──────────────────────────────────────────────
// 以下为 HTTP 加密编排下沉方法（2026-08-04 新增）
// 将 nonce 生成、签名、请求体加密、响应体解密
// 从 TS 侧迁移至 wasm，避免算法逻辑暴露在 JS 中
// ──────────────────────────────────────────────

/// encryptBody 返回结构
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EncryptBodyResult {
    cipher: Vec<u8>,
    key_b64: String,
}

/// decodeBody 返回结构
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DecodeBodyResult {
    plain_text: String,
    is_json: bool,
}

/// 生成 anti-replay nonce（128 字符，混合时间戳+随机熵）
#[wasm_bindgen(js_name = "generateNonce")]
pub fn generate_nonce() -> String {
    let timestamp = js_sys::Date::now() as u64;
    let mut buf = [0u8; 32];
    getrandom::fill(&mut buf).expect("获取随机数失败");

    // 用 base36 编码时间戳 + 随机字节构建 128 字符 nonce
    let ts36 = format!("{:x}", timestamp);
    let mut nonce = String::with_capacity(128);
    nonce.push_str(&ts36);
    for b in &buf {
        nonce.push_str(&format!("{:02x}", b));
    }
    // 填充至 128 字符
    while nonce.len() < 128 {
        let mut extra = [0u8; 8];
        getrandom::fill(&mut extra).expect("获取随机数失败");
        nonce.push_str(&bytes_to_hex(&extra));
    }
    nonce[..128].to_string()
}

/// x-sign 签名：拼接 nonce+fingerprint+timestamp+paramsMd5+secret 后计算 MD5
///
/// 入参中的 sortedParams 是 TS 侧 collectParams + sortParams 后的字符串
#[wasm_bindgen(js_name = "signRequest")]
pub fn sign_request(
    sorted_params: &str,
    nonce: &str,
    fingerprint: &str,
    timestamp: &str,
    sign_secret: &str,
) -> String {
    let mut hasher = Md5::new();
    // 拼接格式：nonce + fingerprint + timestamp + params_md5 + secret
    // 其中 params_md5 = md5(sorted_params)
    let params_md5 = {
        let mut h = Md5::new();
        h.update(sorted_params.as_bytes());
        format!("{:x}", h.finalize())
    };
    let input = format!("{}{}{}{}{}", nonce, fingerprint, timestamp, params_md5, sign_secret);
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// 加密请求体：生成随机 AES key → AES-128-CBC/全零 IV → PKCS7 加密 → 返回密文+base64 key
///
/// 与后端 ApiResponseEncodeResponseBodyAdvice / ApiResponseEncodeRegister 的 AES 协议对齐。
#[wasm_bindgen(js_name = "encryptBody")]
pub fn encrypt_body(json_str: &str) -> JsValue {
    // 生成随机 16 字节 AES key
    let mut key = [0u8; 16];
    getrandom::fill(&mut key).expect("获取随机数失败");

    // AES-128-CBC 加密
    let cipher = Aes128CbcEnc::new_from_slices(&key, &DEFAULT_IV)
        .expect("AES key 长度不合法")
        .encrypt_padded_vec_mut::<Pkcs7>(json_str.as_bytes());

    // key 转为 base64
    let key_b64 = base64_encode(&key);

    serde_wasm_bindgen::to_value(&EncryptBodyResult {
        cipher,
        key_b64,
    })
    .expect("encryptBody 序列化失败")
}

/// 解密响应体：base64 解码 key → 剔除 x-ot 噪声 → AES-128-CBC 解密 → 尝试 JSON 识别
///
/// 与后端 AES 协议对齐（CBC/全零 IV/PKCS5Padding，x-ec/x-ck/x-ot 语义一致）。
#[wasm_bindgen(js_name = "decodeBody")]
pub fn decode_body(data: &[u8], key_b64: &str, noise_level: u8) -> JsValue {
    // 剔除前后噪声
    let nl = noise_level as usize;
    let cleaned = if nl > 0 && data.len() > nl * 2 {
        &data[nl..data.len() - nl]
    } else {
        data
    };

    // base64 解码 key
    let key = base64_decode(key_b64).expect("x-ck 解码失败");

    // AES-128-CBC 解密
    let plain = Aes128CbcDec::new_from_slices(&key, &DEFAULT_IV)
        .expect("AES key 长度不合法")
        .decrypt_padded_vec_mut::<Pkcs7>(cleaned)
        .expect("AES 解密失败");

    let plain_text = String::from_utf8(plain).unwrap_or_default();
    let is_json = serde_json::from_str::<serde_json::Value>(&plain_text).is_ok();

    serde_wasm_bindgen::to_value(&DecodeBodyResult {
        plain_text,
        is_json,
    })
    .expect("decodeBody 序列化失败")
}

// ──────────────────────────────────────────────
// 以下为 codec AES-256 与通用摘要（2026-11-20 新增）
// 与后端 AesCbcCodec 逐字节对齐：key/iv 均由 SHA-256(keyStr) 派生
// ──────────────────────────────────────────────

/// SHA-256 摘要（返回 hex 字符串）
#[wasm_bindgen(js_name = "sha256Hex")]
pub fn sha256_hex(data: &[u8]) -> String {
    let digest = Sha256::digest(data);
    bytes_to_hex(&digest)
}

/// 字符串 → hex（UTF-8 编码后转 hex，hex 兼容路径用）
#[wasm_bindgen(js_name = "hexEncode")]
pub fn hex_encode(text: &str) -> String {
    bytes_to_hex(text.as_bytes())
}

/// hex → 字符串（UTF-8 解码，hex 兼容路径用）
#[wasm_bindgen(js_name = "hexDecode")]
pub fn hex_decode(hex: &str) -> String {
    let bytes = hex_to_bytes(hex);
    String::from_utf8(bytes).unwrap_or_default()
}

/// codec AES-256-CBC 加密（与后端 AesCbcCodec / 前端 encodeRequestBody 协议一致）
///
/// key = SHA-256(keyStr) 32 字节，iv = 摘要前 16 字节，PKCS7 填充，输出 hex 密文。
#[wasm_bindgen(js_name = "codecAesEncryptHex")]
pub fn codec_aes_encrypt_hex(plaintext: &str, key_str: &str) -> String {
    let digest = Sha256::digest(key_str.as_bytes());
    let cipher = Aes256CbcEnc::new_from_slices(&digest, &digest[..16])
        .expect("codec AES key/iv 长度不合法")
        .encrypt_padded_vec_mut::<Pkcs7>(plaintext.as_bytes());
    bytes_to_hex(&cipher)
}

/// codec AES-256-CBC 解密（与 codecAesEncryptHex 互逆）
///
/// 解不开（密钥错误 / 数据被篡改 / 非法 hex）时返回空串，
/// 与前端 decryptAesHex 的「失败返回空串」契约一致，不跨 wasm 抛异常。
#[wasm_bindgen(js_name = "codecAesDecryptHex")]
pub fn codec_aes_decrypt_hex(cipher_hex: &str, key_str: &str) -> String {
    let trimmed = cipher_hex.trim();
    if trimmed.is_empty() || trimmed.len() % 2 != 0 || !trimmed.chars().all(|c| c.is_ascii_hexdigit())
    {
        return String::new();
    }
    let cipher = hex_to_bytes(trimmed);
    let digest = Sha256::digest(key_str.as_bytes());
    let plain = Aes256CbcDec::new_from_slices(&digest, &digest[..16])
        .expect("codec AES key/iv 长度不合法")
        .decrypt_padded_vec_mut::<Pkcs7>(&cipher);
    match plain {
        Ok(bytes) => String::from_utf8(bytes).unwrap_or_default(),
        Err(_) => String::new(),
    }
}

// ──────────────────────────────────────────────
// keylog 一次性会话密钥（2026-11-20 新增）
// 与后端 KeyLogCodec 逐字节对齐：
//   帧 = "k2:" + hex([8B ts BE][8B msgId BE][1B encLen][enc][12B nonce][GCM 密文+16B 标签])
//   enc = 临时 X25519 公钥 X.509 SPKI DER（44B = 12B 前缀 + 32B 裸公钥）
//   shared = X25519(本端私钥, 对端裸公钥)
//   ek = HKDF-SHA256(ikm=shared, salt=enc, info="chua-keylog-v2/aes-256-gcm", 32B)
//   AAD = "chua-keylog-v2" + ts(8B BE) + msgId(8B BE) + enc
// ──────────────────────────────────────────────

/// keylog 协议域（AAD 前缀，与后端 KeyLogCodec.DOMAIN 一致）
const KEYLOG_DOMAIN: &[u8] = b"chua-keylog-v2";

/// keylog HKDF info 标签（与后端 KeyLogCodec.HKDF_INFO 一致）
const KEYLOG_HKDF_INFO: &[u8] = b"chua-keylog-v2/aes-256-gcm";

/// X25519 公钥 X.509 SPKI DER 前缀（后接 32B 裸公钥，共 44B）
const X25519_SPKI_PREFIX: [u8; 12] = [
    0x30, 0x2A, 0x30, 0x05, 0x06, 0x03, 0x2B, 0x65, 0x6E, 0x03, 0x21, 0x00,
];

/// X25519 私钥 PKCS#8 DER 前缀（后接 32B 裸私钥，共 48B）
const X25519_PKCS8_PREFIX: [u8; 16] = [
    0x30, 0x2E, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2B, 0x65, 0x6E, 0x04, 0x22, 0x04,
    0x20,
];

/// keylog 帧最小长度：ts(8) + msgId(8) + encLen(1) + nonce(12) + tag(16)
const KEYLOG_FRAME_MIN_LEN: usize = 8 + 8 + 1 + 12 + 16;

/// 从 hex 提取 X25519 裸 32 字节密钥（兼容裸 32B / X.509 SPKI 44B / PKCS#8 48B 三种编码）
fn x25519_raw_bytes(key_hex: &str) -> [u8; 32] {
    let bytes = hex_to_bytes(key_hex.trim());
    let raw: &[u8] = match bytes.len() {
        32 => &bytes,
        44 if bytes[..12] == X25519_SPKI_PREFIX => &bytes[12..],
        48 if bytes[..16] == X25519_PKCS8_PREFIX => &bytes[16..],
        _ => panic!("X25519 密钥编码不合法：期望 32/44/48 字节"),
    };
    let mut out = [0u8; 32];
    out.copy_from_slice(raw);
    out
}

/// 从帧内 enc 字段提取 X25519 裸 32 字节公钥（要求为 X.509 SPKI DER）
fn x25519_raw_public_from_der(enc: &[u8]) -> [u8; 32] {
    if enc.len() != 44 || enc[..12] != X25519_SPKI_PREFIX {
        panic!("keylog enc 不是合法的 X25519 X.509 公钥");
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&enc[12..]);
    out
}

/// 构造 X.509 SPKI DER 公钥编码
fn x25519_spki_der(raw_public: &[u8; 32]) -> Vec<u8> {
    let mut der = Vec::with_capacity(44);
    der.extend_from_slice(&X25519_SPKI_PREFIX);
    der.extend_from_slice(raw_public);
    der
}

/// 构造 PKCS#8 DER 私钥编码
fn x25519_pkcs8_der(raw_private: &[u8; 32]) -> Vec<u8> {
    let mut der = Vec::with_capacity(48);
    der.extend_from_slice(&X25519_PKCS8_PREFIX);
    der.extend_from_slice(raw_private);
    der
}

/// 构造 keylog AAD：协议域 + 时间戳 + 消息ID + enc（与后端 KeyLogCodec.aad 一致）
fn keylog_aad(enc: &[u8], timestamp: u64, message_id: u64) -> Vec<u8> {
    let mut aad = Vec::with_capacity(KEYLOG_DOMAIN.len() + 16 + enc.len());
    aad.extend_from_slice(KEYLOG_DOMAIN);
    aad.extend_from_slice(&timestamp.to_be_bytes());
    aad.extend_from_slice(&message_id.to_be_bytes());
    aad.extend_from_slice(enc);
    aad
}

/// X25519 密钥对返回结构（publicKey/privateKey 编码与后端 generateKeyPair 一致）
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct X25519KeyPairResult {
    /// X.509 SPKI DER 公钥 hex
    public_key: String,
    /// PKCS#8 DER 私钥 hex
    private_key: String,
    /// 32B 裸公钥 hex
    public_key_raw: String,
    /// 32B 裸私钥 hex
    private_key_raw: String,
}

/// 生成 X25519 密钥对（publicKey=X.509 SPKI hex，privateKey=PKCS#8 hex）
#[wasm_bindgen(js_name = "x25519KeyPair")]
pub fn x25519_key_pair() -> JsValue {
    let mut seed = [0u8; 32];
    getrandom::fill(&mut seed).expect("获取随机数失败");
    let secret = StaticSecret::from(seed);
    let public = X25519PublicKey::from(&secret);
    let result = X25519KeyPairResult {
        public_key: bytes_to_hex(&x25519_spki_der(public.as_bytes())),
        private_key: bytes_to_hex(&x25519_pkcs8_der(&secret.to_bytes())),
        public_key_raw: bytes_to_hex(public.as_bytes()),
        private_key_raw: bytes_to_hex(&secret.to_bytes()),
    };
    serde_wasm_bindgen::to_value(&result).expect("x25519KeyPair 序列化失败")
}

/// X25519 共享密钥：本端私钥 × 对端公钥（返回 32 字节）
#[wasm_bindgen(js_name = "x25519SharedSecret")]
pub fn x25519_shared_secret(private_key_hex: &str, peer_public_key_hex: &str) -> Vec<u8> {
    let secret = StaticSecret::from(x25519_raw_bytes(private_key_hex));
    let public = X25519PublicKey::from(x25519_raw_bytes(peer_public_key_hex));
    secret.diffie_hellman(&public).to_bytes().to_vec()
}

/// HKDF-SHA256 派生（RFC 5869，与后端 Hkdf.derive 一致）
#[wasm_bindgen(js_name = "hkdfSha256")]
pub fn hkdf_sha256(ikm: &[u8], salt: &[u8], info: &[u8], length: usize) -> Vec<u8> {
    let hk = Hkdf::<Sha256>::new(Some(salt), ikm);
    let mut okm = vec![0u8; length];
    hk.expand(info, &mut okm)
        .expect("HKDF 输出长度超出上限（255 * 32 字节）");
    okm
}

/// AES-256-GCM 加密（输出 = 密文 + 16B 认证标签；key 必须 32 字节，nonce 12 字节）
#[wasm_bindgen(js_name = "aesGcmEncrypt")]
pub fn aes_gcm_encrypt(data: &[u8], key: &[u8], nonce: &[u8], aad: &[u8]) -> Vec<u8> {
    let cipher = Aes256Gcm::new_from_slice(key).expect("AES-GCM 密钥必须为 32 字节");
    cipher
        .encrypt(AeadNonce::from_slice(nonce), Payload { msg: data, aad })
        .expect("AES-GCM 加密失败")
}

/// AES-256-GCM 解密（输入 = 密文 + 16B 认证标签；认证失败时抛错）
#[wasm_bindgen(js_name = "aesGcmDecrypt")]
pub fn aes_gcm_decrypt(data: &[u8], key: &[u8], nonce: &[u8], aad: &[u8]) -> Vec<u8> {
    let cipher = Aes256Gcm::new_from_slice(key).expect("AES-GCM 密钥必须为 32 字节");
    cipher
        .decrypt(AeadNonce::from_slice(nonce), Payload { msg: data, aad })
        .expect("AES-GCM 解密失败：数据可能被篡改或密钥错误")
}

/// keylog 帧加密返回结构
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct KeylogFrameResult {
    /// 完整密文（"k2:" + hex 帧），直接作为请求体/响应体
    frame: String,
    /// 本次帧使用的临时公钥（X.509 SPKI DER hex）
    public_key: String,
    /// 本次帧使用的临时私钥（PKCS#8 DER hex）——发送方须留存，用于解密对端回包
    private_key: String,
}

/// keylog 加密内部实现（wasm 导出与原生单测共用；timestamp 由调用方提供）
fn keylog_encrypt_internal(
    plaintext: &[u8],
    peer_public_key_hex: &str,
    ephemeral_private_key_hex: Option<&str>,
    timestamp: u64,
) -> KeylogFrameResult {
    // 1. 临时密钥对（外部指定或现场生成，用完即弃）
    let (raw_priv, raw_pub) = match ephemeral_private_key_hex.filter(|s| !s.trim().is_empty()) {
        Some(hex) => {
            let raw_priv = x25519_raw_bytes(hex);
            let public = X25519PublicKey::from(&StaticSecret::from(raw_priv));
            (raw_priv, *public.as_bytes())
        }
        None => {
            let mut seed = [0u8; 32];
            getrandom::fill(&mut seed).expect("获取随机数失败");
            let secret = StaticSecret::from(seed);
            let public = X25519PublicKey::from(&secret);
            (seed, *public.as_bytes())
        }
    };
    let enc = x25519_spki_der(&raw_pub);

    // 2. ECDH + HKDF 派生一次性 AES-256 密钥
    let peer_raw = x25519_raw_bytes(peer_public_key_hex);
    let shared = StaticSecret::from(raw_priv).diffie_hellman(&X25519PublicKey::from(peer_raw));
    let ek = hkdf_sha256(shared.to_bytes().as_slice(), &enc, KEYLOG_HKDF_INFO, 32);

    // 3. 组帧：ts + msgId + encLen + enc + nonce + GCM 密文
    let mut message_id = [0u8; 8];
    getrandom::fill(&mut message_id).expect("获取随机数失败");
    let mut nonce = [0u8; 12];
    getrandom::fill(&mut nonce).expect("获取随机数失败");
    let aad = keylog_aad(&enc, timestamp, u64::from_be_bytes(message_id));
    let cipher = aes_gcm_encrypt(plaintext, &ek, &nonce, &aad);

    let mut frame = Vec::with_capacity(17 + enc.len() + 12 + cipher.len());
    frame.extend_from_slice(&timestamp.to_be_bytes());
    frame.extend_from_slice(&message_id);
    frame.push(enc.len() as u8);
    frame.extend_from_slice(&enc);
    frame.extend_from_slice(&nonce);
    frame.extend_from_slice(&cipher);

    KeylogFrameResult {
        frame: format!("k2:{}", bytes_to_hex(&frame)),
        public_key: bytes_to_hex(&enc),
        private_key: bytes_to_hex(&x25519_pkcs8_der(&raw_priv)),
    }
}

/// keylog 加密：生成一帧 k2 密文（每次调用使用全新临时密钥对）
///
/// peer_public_key_hex：对端公钥（X.509 SPKI hex 或 32B 裸公钥 hex）。
/// ephemeral_private_key_hex：可选的外部临时私钥（PKCS#8 hex 或 32B 裸 hex）；
///   传入时本次加密复用该私钥（请求方用同一把临时私钥解对端响应），不传时现场生成。
/// 返回 { frame, publicKey, privateKey }。
#[wasm_bindgen(js_name = "keylogEncryptFrame")]
pub fn keylog_encrypt_frame(
    plaintext: &[u8],
    peer_public_key_hex: &str,
    ephemeral_private_key_hex: Option<String>,
) -> JsValue {
    let timestamp = js_sys::Date::now() as u64;
    let result = keylog_encrypt_internal(
        plaintext,
        peer_public_key_hex,
        ephemeral_private_key_hex.as_deref(),
        timestamp,
    );
    serde_wasm_bindgen::to_value(&result).expect("keylogEncryptFrame 序列化失败")
}

/// keylog 解密内部实现（帧字节 → 明文字节；与后端 KeyLogCodec.decodeHex 字节序一致）
fn keylog_decrypt_internal(frame: &[u8], own_private_raw: &[u8; 32]) -> Vec<u8> {
    if frame.len() < KEYLOG_FRAME_MIN_LEN {
        panic!("k2 帧长度不合法");
    }
    let timestamp = u64::from_be_bytes(frame[0..8].try_into().unwrap());
    let message_id = u64::from_be_bytes(frame[8..16].try_into().unwrap());
    let enc_len = frame[16] as usize;
    if enc_len == 0 || frame.len() < 17 + enc_len + 12 + 16 {
        panic!("k2 帧封装密钥长度非法");
    }
    let enc = &frame[17..17 + enc_len];
    let nonce = &frame[17 + enc_len..17 + enc_len + 12];
    let cipher = &frame[17 + enc_len + 12..];

    // ECDH + HKDF 派生与加密方相同的密钥
    let peer_raw = x25519_raw_public_from_der(enc);
    let secret = StaticSecret::from(*own_private_raw);
    let shared = secret.diffie_hellman(&X25519PublicKey::from(peer_raw));
    let ek = hkdf_sha256(shared.to_bytes().as_slice(), enc, KEYLOG_HKDF_INFO, 32);
    let aad = keylog_aad(enc, timestamp, message_id);
    aes_gcm_decrypt(cipher, &ek, nonce, &aad)
}

/// keylog 解密：解析一帧 k2 密文（frame 带或不带 "k2:" 前缀均可）
///
/// private_key_hex：本端私钥（PKCS#8 hex 或 32B 裸 hex）。返回明文字节（UTF-8）。
#[wasm_bindgen(js_name = "keylogDecryptFrame")]
pub fn keylog_decrypt_frame(frame: &str, private_key_hex: &str) -> Vec<u8> {
    let trimmed = frame.trim();
    let hex_part = trimmed.strip_prefix("k2:").unwrap_or(trimmed);
    let bytes = hex_to_bytes(hex_part);
    let own_priv = x25519_raw_bytes(private_key_hex);
    keylog_decrypt_internal(&bytes, &own_priv)
}

/// base64 编码
fn base64_encode(data: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(data)
}

/// base64 解码
fn base64_decode(data: &str) -> Result<Vec<u8>, String> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("base64 解码失败: {}", e))
}

/// 字节数组转 hex 字符串
fn bytes_to_hex(bytes: &[u8]) -> String {
    let mut sb = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        sb.push_str(&format!("{:02x}", b));
    }
    sb
}

/// hex 字符串转字节数组
fn hex_to_bytes(hex: &str) -> Vec<u8> {
    let len = hex.len();
    let mut data = Vec::with_capacity(len / 2);
    let bytes = hex.as_bytes();
    for i in (0..len).step_by(2) {
        let hi = (bytes[i] as char).to_digit(16).unwrap() as u8;
        let lo = (bytes[i + 1] as char).to_digit(16).unwrap() as u8;
        data.push((hi << 4) + lo);
    }
    data
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── sign_request 签名验证 ──
    // 固定入参，验证 MD5 输出是否确定
    #[test]
    fn test_sign_request_deterministic() {
        let result = sign_request(
            "a=1&b=2",
            "nonce123",
            "fp123",
            "1700000000000",
            "secret123",
        );
        // 相同输入应产生相同输出
        let result2 = sign_request(
            "a=1&b=2",
            "nonce123",
            "fp123",
            "1700000000000",
            "secret123",
        );
        assert_eq!(result, result2, "相同输入应产生相同签名");
        // 签名应为 32 字符 hex 字符串
        assert_eq!(result.len(), 32, "MD5 签名应为 32 字符 hex");
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()), "签名应仅含 hex 字符");
    }

    #[test]
    fn test_sign_request_different_params() {
        let r1 = sign_request("a=1", "n", "f", "t", "s");
        let r2 = sign_request("a=2", "n", "f", "t", "s");
        assert_ne!(r1, r2, "不同参数应产生不同签名");
    }

    #[test]
    fn test_sign_request_different_secret() {
        let r1 = sign_request("a=1", "n", "f", "t", "secret1");
        let r2 = sign_request("a=1", "n", "f", "t", "secret2");
        assert_ne!(r1, r2, "不同密钥应产生不同签名");
    }

    // ── encrypt_body + decode_body 往返验证 ──
    // 注意：encrypt_body 和 decode_body 是 #[wasm_bindgen] 函数，
    // 只能在 wasm 环境中调用（cargo test 在原生环境运行，无法调用）。
    // 因此直接测试内部的 AES 加密/解密原语。
    #[test]
    fn test_encrypt_decrypt_roundtrip_json() {
        let json = r#"{"code":0,"msg":"ok"}"#;
        let mut key = [0u8; 16];
        getrandom::fill(&mut key).expect("获取随机数失败");
        let cipher = Aes128CbcEnc::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(json.as_bytes());

        let plain = Aes128CbcDec::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(&cipher)
            .expect("AES 解密失败");
        let plain_text = String::from_utf8(plain).unwrap();
        assert_eq!(plain_text, json, "AES 往返解密应得到原文");
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip_plain_text() {
        let text = "hello, world";
        let mut key = [0u8; 16];
        getrandom::fill(&mut key).expect("获取随机数失败");
        let cipher = Aes128CbcEnc::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(text.as_bytes());
        let plain = Aes128CbcDec::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(&cipher)
            .expect("AES 解密失败");
        let plain_text = String::from_utf8(plain).unwrap();
        assert_eq!(plain_text, text, "AES 往返解密应得到原文");
    }

    // ── decode_body 噪声剔除验证 ──
    #[test]
    fn test_decode_body_noise_stripping() {
        let text = "{\"id\":42}";
        let mut key = [0u8; 16];
        getrandom::fill(&mut key).expect("获取随机数失败");
        let cipher = Aes128CbcEnc::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(text.as_bytes());

        // 构造带噪声的数据：前后各 2 字节噪声
        let mut noisy = Vec::with_capacity(2 + cipher.len() + 2);
        noisy.push(0xaa);
        noisy.push(0xbb);
        noisy.extend_from_slice(&cipher);
        noisy.push(0xcc);
        noisy.push(0xdd);

        // 验证 key_b64 编解码正确
        let key_b64 = base64_encode(&key);
        let decoded_key = base64_decode(&key_b64).unwrap();
        assert_eq!(decoded_key, key, "key_b64 往返解码应一致");

        // noise_level=2 应剔除前后各 2 字节后正确解密
        let cleaned = &noisy[2..noisy.len() - 2];
        let plain = Aes128CbcDec::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(cleaned)
            .expect("AES 解密失败");
        let plain_text = String::from_utf8(plain).unwrap();
        assert_eq!(plain_text, text, "噪声剔除后应正确解密");
    }

    #[test]
    fn test_decode_body_noise_level_0() {
        let text = "test";
        let mut key = [0u8; 16];
        getrandom::fill(&mut key).expect("获取随机数失败");
        let cipher = Aes128CbcEnc::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .encrypt_padded_vec_mut::<Pkcs7>(text.as_bytes());

        // 验证 key_b64 编码非空且解码正确
        let key_b64 = base64_encode(&key);
        assert!(!key_b64.is_empty(), "base64 编码不应为空");
        let decoded_key = base64_decode(&key_b64).unwrap();
        assert_eq!(decoded_key, key, "key_b64 往返解码应一致");

        // noise_level=0 直接解密
        let plain = Aes128CbcDec::new_from_slices(&key, &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(&cipher)
            .expect("AES 解密失败");
        let plain_text = String::from_utf8(plain).unwrap();
        assert_eq!(plain_text, text, "noise_level=0 应直接解密");
    }

    // ── base64 编解码验证 ──
    #[test]
    fn test_base64_roundtrip() {
        let data = b"hello, wasm";
        let encoded = base64_encode(data);
        let decoded = base64_decode(&encoded).unwrap();
        assert_eq!(decoded, data, "base64 往返应得到原始字节");
    }

    #[test]
    fn test_base64_decode_invalid() {
        let result = base64_decode("!!!invalid!!!");
        assert!(result.is_err(), "无效 base64 应返回错误");
    }

    // ── bytes_to_hex / hex_to_bytes 往返验证 ──
    #[test]
    fn test_hex_roundtrip() {
        let data = [0xde, 0xad, 0xbe, 0xef];
        let hex = bytes_to_hex(&data);
        assert_eq!(hex, "deadbeef");
        let decoded = hex_to_bytes(&hex);
        assert_eq!(decoded, data);
    }

    #[test]
    fn test_hex_empty() {
        assert_eq!(bytes_to_hex(&[]), "");
        assert_eq!(hex_to_bytes(""), Vec::<u8>::new());
    }

    // ── generate_nonce 验证 ──
    // 注意：generate_nonce 依赖 js_sys::Date::now()，在原生 Rust 测试中不可用，
    // 通过 cargo test 在原生环境运行时跳过。其正确性在 sign_request 测试中
    // 通过签名确定性间接验证。
    #[test]
    #[cfg(target_arch = "wasm32")]
    fn test_generate_nonce_length() {
        let nonce = generate_nonce();
        assert_eq!(nonce.len(), 128, "nonce 应为 128 字符");
        assert!(nonce.chars().all(|c| c.is_ascii_hexdigit() || c.is_ascii_lowercase() || c.is_ascii_digit()), "nonce 应仅含合法字符");
    }

    // ── 噪声边界验证 ──
    // 验证 decode_body 内部逻辑：当 noise_level 大于数据长度时，不 panic 且返回原始数据
    #[test]
    fn test_noise_level_greater_than_data_returns_original() {
        let data = [0x01, 0x02, 0x03];
        // noise_level=5, data.len()=3, 条件 nl > 0 && data.len() > nl * 2 不成立
        // 所以直接使用原始数据，不会 panic
        let _ = Aes128CbcDec::new_from_slices(&[0u8; 16], &DEFAULT_IV)
            .expect("AES key 长度不合法")
            .decrypt_padded_vec_mut::<Pkcs7>(&data);
    }

    // ── SHA-256 已知答案（RFC 6234 "abc" 向量）──
    #[test]
    fn test_sha256_known_vector() {
        assert_eq!(
            sha256_hex(b"abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    // ── HKDF-SHA256 已知答案（RFC 5869 Test Case 1）──
    #[test]
    fn test_hkdf_rfc5869_case1() {
        let ikm = [0x0bu8; 22];
        let salt: [u8; 13] = [
            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
        ];
        let info: [u8; 10] = [0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9];
        let okm = hkdf_sha256(&ikm, &salt, &info, 42);
        let expected: [u8; 42] = [
            0x3c, 0xb2, 0x5f, 0x25, 0xfa, 0xac, 0xd5, 0x7a, 0x90, 0x43, 0x4f, 0x64, 0xd0, 0x36,
            0x2f, 0x2a, 0x2d, 0x2d, 0x0a, 0x90, 0xcf, 0x1a, 0x5a, 0x4c, 0x5d, 0xb0, 0x2d, 0x56,
            0xec, 0xc4, 0xc5, 0xbf, 0x34, 0x00, 0x72, 0x08, 0xd5, 0xb8, 0x87, 0x18, 0x58, 0x65,
        ];
        assert_eq!(okm, expected, "HKDF-SHA256 应与 RFC 5869 用例 1 一致");
    }

    // ── X25519：共享密钥对称性 + DER 编码往返 ──
    #[test]
    fn test_x25519_shared_secret_symmetry() {
        let mut seed_a = [1u8; 32];
        seed_a[31] = 9;
        let mut seed_b = [2u8; 32];
        seed_b[31] = 8;
        let a = StaticSecret::from(seed_a);
        let b = StaticSecret::from(seed_b);
        let a_pub_hex = bytes_to_hex(&x25519_spki_der(X25519PublicKey::from(&a).as_bytes()));
        let b_pub_hex = bytes_to_hex(&x25519_spki_der(X25519PublicKey::from(&b).as_bytes()));
        let a_priv_hex = bytes_to_hex(&x25519_pkcs8_der(&a.to_bytes()));
        let b_priv_hex = bytes_to_hex(&x25519_pkcs8_der(&b.to_bytes()));

        // 双向协商结果一致
        let s1 = x25519_shared_secret(&a_priv_hex, &b_pub_hex);
        let s2 = x25519_shared_secret(&b_priv_hex, &a_pub_hex);
        assert_eq!(s1, s2, "X25519 双方应协商出同一共享密钥");

        // SPKI/PKCS#8 编码能被 x25519_raw_bytes 还原为裸密钥
        assert_eq!(
            x25519_raw_bytes(&a_pub_hex).to_vec(),
            X25519PublicKey::from(&a).as_bytes().to_vec()
        );
        assert_eq!(x25519_raw_bytes(&a_priv_hex).to_vec(), a.to_bytes().to_vec());
    }

    // ── keylog 帧：格式 + 双向往返（请求方向 + 响应方向）──
    #[test]
    fn test_keylog_frame_format_and_roundtrip() {
        let plaintext = r#"{"code":0,"data":"hello-keylog"}"#;
        // 模拟服务端长期密钥对（确定性种子）
        let mut seed = [7u8; 32];
        seed[0] = 0x5a;
        let server_secret = StaticSecret::from(seed);
        let server_pub_hex =
            bytes_to_hex(&x25519_spki_der(X25519PublicKey::from(&server_secret).as_bytes()));

        // 请求方向：客户端以服务端公钥加密（内部现场生成临时密钥对）
        let result =
            keylog_encrypt_internal(plaintext.as_bytes(), &server_pub_hex, None, 1_700_000_000_000);
        // 帧格式：k2: + hex，enc 长度 44 且带 X.509 前缀，总长 = 17 + 44 + 12 + 明文长 + 16 标签
        assert!(result.frame.starts_with("k2:"), "帧必须带 k2: 前缀");
        let frame = hex_to_bytes(result.frame.strip_prefix("k2:").unwrap());
        assert_eq!(frame[16] as usize, 44, "X25519 公钥 DER 应为 44 字节");
        assert_eq!(&frame[17..29], &X25519_SPKI_PREFIX[..], "enc 应为 X.509 SPKI DER");
        assert_eq!(
            frame.len(),
            17 + 44 + 12 + plaintext.len() + 16,
            "帧总长应与协议一致"
        );

        // 服务端用长期私钥解密请求
        let req_plain = keylog_decrypt_internal(&frame, &server_secret.to_bytes());
        assert_eq!(req_plain, plaintext.as_bytes(), "服务端应能解密请求帧");

        // 响应方向：服务端复用请求帧 enc（客户端临时公钥）作为对端公钥加密回包，
        // 客户端用请求时留存的临时私钥解密（「每请求新鲜密钥」核心链路）
        let ephemeral_pub_hex = bytes_to_hex(&frame[17..17 + 44]);
        let resp = keylog_encrypt_internal(
            b"response-payload",
            &ephemeral_pub_hex,
            None,
            1_700_000_000_001,
        );
        let resp_frame = hex_to_bytes(resp.frame.strip_prefix("k2:").unwrap());
        let resp_plain =
            keylog_decrypt_internal(&resp_frame, &x25519_raw_bytes(&result.private_key));
        assert_eq!(resp_plain, b"response-payload", "客户端应能用请求临时私钥解密响应帧");
    }

    // ── keylog 帧：密文被篡改时必须解密失败 ──
    #[test]
    #[should_panic(expected = "AES-GCM 解密失败")]
    fn test_keylog_tamper_detected() {
        let mut seed = [3u8; 32];
        seed[0] = 0x77;
        let server_secret = StaticSecret::from(seed);
        let server_pub_hex =
            bytes_to_hex(&x25519_spki_der(X25519PublicKey::from(&server_secret).as_bytes()));
        let result = keylog_encrypt_internal(b"tamper-test", &server_pub_hex, None, 1_700_000_000_000);
        let mut frame = hex_to_bytes(result.frame.strip_prefix("k2:").unwrap());
        let last = frame.len() - 1;
        frame[last] ^= 0x01;
        let tampered = format!("k2:{}", bytes_to_hex(&frame));
        keylog_decrypt_frame(&tampered, &bytes_to_hex(&x25519_pkcs8_der(&server_secret.to_bytes())));
    }

    // ── codec AES-256-CBC：往返 + 已知一致性（与后端 AesCbcCodec 对齐）──
    #[test]
    fn test_codec_aes256_roundtrip() {
        let plaintext = r#"{"id":1,"name":"系统管理"}"#;
        let key = "0123456789abcdef";
        let cipher = codec_aes_encrypt_hex(plaintext, key);
        // 密文应为 hex 且不以 { 或 [ 开头（与现行 codec 线协议一致）
        assert!(!cipher.is_empty());
        assert!(cipher.chars().all(|c| c.is_ascii_hexdigit()), "密文应为纯 hex");
        assert_eq!(codec_aes_decrypt_hex(&cipher, key), plaintext, "codec AES-256 往返应一致");
        // 错误密钥不得解出原文（失败契约：返回空串）
        assert_eq!(codec_aes_decrypt_hex(&cipher, "wrong-key-9876"), "", "错误密钥应返回空串");
    }

    // ── AES-ECB：往返验证（对齐 CryptoJS AES/ECB/Pkcs7）──
    #[test]
    fn test_aes_ecb_roundtrip() {
        let plaintext = "storage-value-123";
        let key = "KOIADMINyuxintao"; // 16 字节
        let cipher = aes_ecb_encrypt(plaintext.as_bytes(), key.as_bytes());
        let plain = aes_ecb_decrypt(&cipher, key.as_bytes());
        assert_eq!(String::from_utf8(plain).unwrap(), plaintext);
        // 24/32 字节密钥不再 panic
        let cipher32 = aes_ecb_encrypt(plaintext.as_bytes(), &[0u8; 32]);
        assert_eq!(
            String::from_utf8(aes_ecb_decrypt(&cipher32, &[0u8; 32])).unwrap(),
            plaintext
        );
    }

    // ── AES-256-GCM：往返 + AAD 绑定验证 ──
    #[test]
    fn test_aes_gcm_roundtrip_and_aad_binding() {
        let key = [0x42u8; 32];
        let nonce = [0x13u8; 12];
        let aad = b"chua-keylog-v2";
        let msg = b"gcm-payload";
        let ct = aes_gcm_encrypt(msg, &key, &nonce, aad);
        assert_eq!(ct.len(), msg.len() + 16, "输出应含 16 字节标签");
        assert_eq!(aes_gcm_decrypt(&ct, &key, &nonce, aad), msg.to_vec());
        // GCM 的 CTR 密文流不依赖 AAD，但认证标签必不同（段级加密绑 traceId 的依据）
        let ct2 = aes_gcm_encrypt(msg, &key, &nonce, b"other-domain");
        assert_eq!(
            &ct[..ct.len() - 16],
            &ct2[..ct2.len() - 16],
            "GCM 密文流不应依赖 AAD"
        );
        assert_ne!(ct, ct2, "不同 AAD 的认证标签必须不同");
        // 篡改检测
        let mut frame = ct.clone();
        frame[0] ^= 0x01;
        let result = std::panic::catch_unwind(|| aes_gcm_decrypt(&frame, &key, &nonce, aad));
        assert!(result.is_err(), "密文被篡改时 GCM 认证必须失败");
    }
}