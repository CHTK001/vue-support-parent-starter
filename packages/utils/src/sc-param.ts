import { encryptAES, decryptAES } from "@repo/codec-wasm";

export interface ServerCredential {
  serverType: "SSH" | "WINRM" | "LOCAL";
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  connectTimeout?: number;
}

/**
 * 将 ServerCredential 加盐加密为 _sc URL 参数值
 * 加盐方式：salt + JSON.stringify(credential)
 * @param credential 服务器凭证
 * @param salt 来自 import.meta.env.VITE_SC_SALT
 */
export const encodeScParam = (
  credential: ServerCredential,
  salt: string,
): string => {
  const plaintext = salt + JSON.stringify(credential);
  return encryptAES(plaintext, salt);
};

/**
 * 解密 _sc URL 参数值为 ServerCredential
 * @param scValue encodeURIComponent 解码后的加密字符串
 * @param salt 来自 import.meta.env.VITE_SC_SALT
 * @returns ServerCredential 或 null（解密/解析失败时）
 */
export const decodeScParam = (
  scValue: string,
  salt: string,
): ServerCredential | null => {
  try {
    const decrypted = decryptAES(scValue, salt);
    if (!decrypted || !decrypted.startsWith(salt)) return null;
    const json = decrypted.slice(salt.length);
    return JSON.parse(json) as ServerCredential;
  } catch {
    return null;
  }
};
