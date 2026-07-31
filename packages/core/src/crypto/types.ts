/**
 * Rust wasm 加密模块统一接口
 *
 * 由 core 下的 Rust 工程（rust/crypto-wasm）编译为 wasm 后提供实现，
 * 覆盖 aes / sm2 / sm3 / sm4 四类算法。
 */

/** 密钥对（SM2） */
export interface Sm2KeyPair {
  publicKey: string;
  privateKey: string;
}

/** 加密模块接口 */
export interface CryptoModule {
  /** AES 加密 */
  aesEncrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): Uint8Array;
  /** AES 解密 */
  aesDecrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): Uint8Array;
  /** SM2 生成密钥对 */
  sm2GenerateKeyPair(): Sm2KeyPair;
  /** SM2 加密（公钥，hex 字符串） */
  sm2Encrypt(publicKey: string, data: Uint8Array): Uint8Array;
  /** SM2 解密（私钥，hex 字符串） */
  sm2Decrypt(privateKey: string, data: Uint8Array): Uint8Array;
  /** SM3 摘要（返回 hex 字符串） */
  sm3(data: Uint8Array): string;
  /** SM4 加密 */
  sm4Encrypt(data: Uint8Array, key: Uint8Array): Uint8Array;
  /** SM4 解密 */
  sm4Decrypt(data: Uint8Array, key: Uint8Array): Uint8Array;
}

/** wasm-bindgen 产物期望暴露的初始化入口 */
export interface CryptoWasmInit {
  /** 异步初始化（wasm-bindgen 的 init 函数） */
  init?(input?: WebAssembly.Module | Response | BufferSource | Uint8Array): Promise<void>;
  /** 同步初始化 */
  initSync?(input?: WebAssembly.Module | Response | BufferSource | Uint8Array): void;
}
