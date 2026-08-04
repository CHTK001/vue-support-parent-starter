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
  /** AES 变种加密（自定义流程，仅内部 storage 使用，防破解） */
  aesVariantEncrypt(data: Uint8Array, secret: Uint8Array): Uint8Array;
  /** AES 变种解密 */
  aesVariantDecrypt(data: Uint8Array, secret: Uint8Array): Uint8Array;
  /** SM2 生成密钥对 */
  sm2GenerateKeyPair(): Sm2KeyPair;
  /** SM2 加密（公钥，hex 字符串） */
  sm2Encrypt(publicKey: string, data: Uint8Array): Uint8Array;
  /** SM2 解密（私钥，hex 字符串） */
  sm2Decrypt(privateKey: string, data: Uint8Array): Uint8Array;
  /** SM3 摘要（返回 hex 字符串） */
  sm3(data: Uint8Array): string;
  /** MD5 摘要（返回 hex 字符串，x-sign 签名用，与后端 NonceUtils 一致） */
  md5(data: Uint8Array): string;
  /** SM4 加密 */
  sm4Encrypt(data: Uint8Array, key: Uint8Array): Uint8Array;
  /** SM4 解密 */
  sm4Decrypt(data: Uint8Array, key: Uint8Array): Uint8Array;

  // ── 以下为 HTTP 加密编排下沉方法，将算法逻辑从 TS 迁移至 wasm ──

  /**
   * 生成 anti-replay nonce（128 字符，混合时间戳+随机熵，与后端 NonceUtils 对齐）
   * 替代 TS 侧的 generateNonce()
   */
  generateNonce(): string;

  /**
   * x-sign 签名：拼接 nonce+fingerprint+timestamp+paramsMd5+secret 后计算 MD5
   * 替代 TS 侧的 sortParams + collectParams + md5 拼接
   *
   * @param sortedParams  排序后的 query+body 参数字符串（TS 侧 collectParams + sortParams）
   * @param nonce         anti-replay nonce
   * @param fingerprint   设备指纹
   * @param timestamp     当前时间戳字符串
   * @param signSecret    签名密钥
   * @returns x-sign hex 字符串
   */
  signRequest(
    sortedParams: string,
    nonce: string,
    fingerprint: string,
    timestamp: string,
    signSecret: string,
  ): string;

  /**
   * 加密请求体：生成随机 AES key → AES-128-CBC 加密 → 返回密文 + base64 key
   * 替代 TS 侧的 randomKey + serializeBody + aesEncrypt + bytesToBase64
   *
   * @param jsonStr JSON 明文字符串
   * @returns { cipher: Uint8Array, keyB64: string }
   */
  encryptBody(jsonStr: string): { cipher: Uint8Array; keyB64: string };

  /**
   * 解密响应体：base64 解码 key → 剔除 x-ot 噪声 → AES-128-CBC 解密 → JSON 解析
   * 替代 TS 侧的 base64ToBytes + slice + aesDecrypt + TextDecoder + JSON.parse
   *
   * @param data       原始密文（Uint8Array，已剔除噪声前）
   * @param keyB64     base64 编码的 AES key（来自 x-ck 头）
   * @param noiseLevel x-ot 冗余等级（0 表示无噪声）
   * @returns { plainText: string, isJson: boolean }
   */
  decodeBody(
    data: Uint8Array,
    keyB64: string,
    noiseLevel: number,
  ): { plainText: string; isJson: boolean };
}

/** wasm-bindgen 产物期望暴露的初始化入口 */
export interface CryptoWasmInit {
  /** 异步初始化（wasm-bindgen 的 init 函数，支持 URL 字符串 / Response / 模块或 { module_or_path } 对象） */
  init?(
    input?:
      | string
      | URL
      | Response
      | WebAssembly.Module
      | BufferSource
      | Uint8Array
      | { module_or_path?: string | URL | Response | BufferSource | WebAssembly.Module | Uint8Array },
  ): Promise<void>;
  /** 同步初始化 */
  initSync?(input?: WebAssembly.Module | Response | BufferSource | Uint8Array): void;
}
