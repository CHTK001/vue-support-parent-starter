/**
 * 请求体编解码（对齐后端 ApiRequestDecodeRegister / Codec / AesCodec 协议）
 *
 * 后端 `plugin.api.decode` 开启后，`ApiRequestDecodeBodyAdvice` 对携带
 * `access-control-origin-key` 头的请求体做解密：
 *  - codecType 含 "aes" → `AesCodec`：aesKey = SHA-256(key)（32 字节，AES-256），
 *    iv = SHA-256(key) 前 16 字节，AES/CBC/PKCS5Padding 解密，线上载荷为 hex 字符串；
 *  - 其余（sm4/des）→ `Codec` 仅做 hex 编解码（无真实加密）。
 *
 * 载荷形态（后端 `extractEncryptedPayload`）：不以 `{` / `[` 开头的原始 body 文本
 * 即视为密文，故前端直接发送 hex 字符串即可，无需 `{"data": "..."}` 包装。
 *
 * 为何不用 wasm 的 aesEncrypt：wasm 侧 AES 仅支持 16 字节密钥（AES-128，
 * 24/32 字节密钥会 panic），与后端 AES-256 口径不符；CryptoJS 已在
 * `@repo/utils`（storage 加密同款依赖），显式 key/IV + PKCS7 输出与
 * Java AES/CBC/PKCS5Padding 逐字节一致（已用 Node 标准实现交叉验证）。
 */
import CryptoJS from "crypto-js";

/** SHA-256 摘要（hex，与 Java MessageDigest SHA-256 一致；不依赖 crypto.subtle，非安全上下文可用） */
export function sha256Hex(input: string): string {
  return CryptoJS.SHA256(input).toString();
}

/** 编解码配置（与后端 plugin.api.decode.codec-type / codec-request-key 对齐） */
export interface RequestCodecOptions {
  /** 编解码类型：含 aes 走 AES-256-CBC，其余（sm4/des）为纯 hex */
  type: string;
  /** 编解码密钥（后端 codec-request-key） */
  key: string;
}

/**
 * 按后端协议编码请求体，返回线上传输的 hex 字符串。
 *
 * @param plaintext JSON 明文字符串
 * @param options  编解码配置
 * @returns hex 编码的载荷（后端 decodeHex 的输入）
 */
export function encodeRequestBody(plaintext: string, options: RequestCodecOptions): string {
  const isAes = (options.type ?? "").toLowerCase().includes("aes");
  if (!isAes) {
    // sm4/des：后端 Codec 对该类型仅做 hex 编解码
    return CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(plaintext));
  }
  // aes：与后端 AesCodec 完全一致 —— key/IV 均由 SHA-256(key) 派生
  const digest = sha256Hex(options.key);
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plaintext), CryptoJS.enc.Hex.parse(digest), {
    mode: CryptoJS.mode.CBC,
    iv: CryptoJS.enc.Hex.parse(digest.slice(0, 32)),
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext.toString();
}
