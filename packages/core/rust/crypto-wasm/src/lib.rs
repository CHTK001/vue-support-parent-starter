//! crypto-wasm —— core 的加密 wasm 模块
//!
//! 与 `packages/core/src/crypto/types.ts` 的 `CryptoModule` 接口一一对应。
//! 构建产物（crypto-wasm.js + crypto-wasm_bg.wasm）应放置到应用 public 的
//! `/wasm/` 目录下，由 `loadCrypto` 动态加载。
//!
//! 构建命令（需安装 wasm-pack）：
//!   wasm-pack build --target web --out-dir ../../../../public/wasm

use wasm_bindgen::prelude::*;

/// AES 加密（CBC 模式，iv 缺省为 16 字节全零）
#[wasm_bindgen]
pub fn aes_encrypt(data: &[u8], key: &[u8], iv: Option<&[u8]>) -> Vec<u8> {
    todo!("接入 aes + cbc crate 实现")
}

/// AES 解密（CBC 模式）
#[wasm_bindgen]
pub fn aes_decrypt(data: &[u8], key: &[u8], iv: Option<&[u8]>) -> Vec<u8> {
    todo!("接入 aes + cbc crate 实现")
}

/// SM2 密钥对（返回 { publicKey, privateKey } 的 hex 字符串）
#[wasm_bindgen]
pub fn sm2_generate_key_pair() -> JsValue {
    todo!("接入 sm2 crate 实现")
}

/// SM2 加密（公钥 hex，C1C3C2 格式）
#[wasm_bindgen]
pub fn sm2_encrypt(public_key: &str, data: &[u8]) -> Vec<u8> {
    todo!("接入 sm2 crate 实现")
}

/// SM2 解密（私钥 hex）
#[wasm_bindgen]
pub fn sm2_decrypt(private_key: &str, data: &[u8]) -> Vec<u8> {
    todo!("接入 sm2 crate 实现")
}

/// SM3 摘要（返回 hex 字符串）
#[wasm_bindgen]
pub fn sm3(data: &[u8]) -> String {
    todo!("接入 sm3 crate 实现")
}

/// SM4 加密（ECB 模式）
#[wasm_bindgen]
pub fn sm4_encrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
    todo!("接入 sm4 crate 实现")
}

/// SM4 解密（ECB 模式）
#[wasm_bindgen]
pub fn sm4_decrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
    todo!("接入 sm4 crate 实现")
}
