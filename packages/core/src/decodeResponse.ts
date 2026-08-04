/**
 * 响应解密——纯函数，无副作用，可独立测试。
 *
 * 从响应头中提取 x-ec / x-ck / x-ot，当携带合法加密标记时执行：
 * 1. 按 x-ot 冗余等级剔除密文前后噪声字节
 * 2. 用 x-ck（base64）作为 AES key 解密
 * 3. 尝试 JSON 解析，失败则保留为字符串
 */
import type { CryptoModule } from "./crypto/types";

/** 加密标记头：值为 "1" 表示请求体已加密 */
export const ENCRYPT_HEADER = "x-ec";
/** 随机 AES key 头（base64） */
export const KEY_HEADER = "x-ck";
/** 冗余等级头：值为 1/2/3，等级越高密文前后噪声越多 */
export const NOISE_LEVEL_HEADER = "x-ot";

/** 从请求头读取 base64 并转为 Uint8Array */
export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Uint8Array 转 base64 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 响应解密结果
 */
export interface DecodeResponseResult {
  /** 解密后的数据（JSON 解析后或原始字符串） */
  data: unknown;
  /** 是否执行了解密操作 */
  decoded: boolean;
}

/**
 * 加密响应头集合
 */
export interface EncryptedResponseHeaders {
  [ENCRYPT_HEADER]?: string;
  [KEY_HEADER]?: string;
  [NOISE_LEVEL_HEADER]?: string;
}

/**
 * 解码后端加密响应——纯函数，无副作用，可独立测试。
 *
 * 从响应头中提取 x-ec / x-ck / x-ot，当携带合法加密标记时执行：
 * 1. 按 x-ot 冗余等级剔除密文前后噪声字节
 * 2. 用 x-ck（base64）作为 AES key 解密
 * 3. 尝试 JSON 解析，失败则保留为字符串
 *
 * @param headers 响应头对象（取值应为字符串 | string[] | undefined）
 * @param data    原始响应体（Uint8Array 或 base64 字符串）
 * @param crypto  加密模块（需提供 aesDecrypt 方法）
 * @returns 解密结果 { data, decoded }
 */
export function decodeResponse(
  headers: EncryptedResponseHeaders,
  data: Uint8Array | string,
  crypto: Pick<CryptoModule, "aesDecrypt">,
): DecodeResponseResult {
  const encryptHeader = headers[ENCRYPT_HEADER];
  const keyHeader = headers[KEY_HEADER];

  if (encryptHeader !== "1" || !keyHeader || !data) {
    return { data: data, decoded: false };
  }

  let bytes: Uint8Array =
    typeof data === "string" ? base64ToBytes(data) : data;

  // 按 x-ot 冗余等级剔除密文前后噪声
  const noiseLevel = Number(headers[NOISE_LEVEL_HEADER] ?? 0);
  if (noiseLevel > 0) {
    bytes = bytes.slice(noiseLevel, bytes.length - noiseLevel);
  }

  const plain = crypto.aesDecrypt(bytes, base64ToBytes(keyHeader));
  let result: unknown;
  try {
    result = JSON.parse(new TextDecoder().decode(plain));
  } catch {
    result = new TextDecoder().decode(plain);
  }

  return { data: result, decoded: true };
}