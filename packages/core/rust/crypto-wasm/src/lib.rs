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
use serde::Serialize;
use sm3::Digest as Sm3Digest;
use sm4::Sm4;
use wasm_bindgen::prelude::*;

/// AES-128-CBC 加密器别名
type Aes128CbcEnc = CbcEncryptor<Aes128>;

/// AES-128-CBC 解密器别名
type Aes128CbcDec = CbcDecryptor<Aes128>;

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

/// AES 加密（CBC 模式，iv 缺省为 16 字节全零）
#[wasm_bindgen(js_name = "aesEncrypt")]
pub fn aes_encrypt(data: &[u8], key: &[u8], iv: Option<Vec<u8>>) -> Vec<u8> {
    let iv: &[u8] = iv.as_deref().unwrap_or(&DEFAULT_IV);
    Aes128CbcEnc::new_from_slices(key, iv)
        .expect("AES key 或 iv 长度不合法")
        .encrypt_padded_vec_mut::<Pkcs7>(data)
}

/// AES 解密（CBC 模式，iv 缺省为 16 字节全零）
#[wasm_bindgen(js_name = "aesDecrypt")]
pub fn aes_decrypt(data: &[u8], key: &[u8], iv: Option<Vec<u8>>) -> Vec<u8> {
    let iv: &[u8] = iv.as_deref().unwrap_or(&DEFAULT_IV);
    Aes128CbcDec::new_from_slices(key, iv)
        .expect("AES key 或 iv 长度不合法")
        .decrypt_padded_vec_mut::<Pkcs7>(data)
        .expect("AES 解密失败，数据可能被篡改或密钥错误")
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
