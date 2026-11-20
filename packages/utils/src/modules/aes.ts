/**
 * AES 加解密工具（迁移自 koi/utils/aes.ts）
 *
 * <p>2026-11-20 起加密实现经 cryptoBridge 走 wasm（aesEcbEncrypt 与
 * CryptoJS AES/ECB/Pkcs7 逐字节一致）；桥未安装时（单测/极端时序）回退
 * CryptoJS 兼容路径并告警一次。接口签名保持不变，调用方无感知。</p>
 */
import CryptoJS from "crypto-js";
import { getWasmCryptoBridge, warnBridgeMissing } from "./cryptoBridge";

/** 默认 AES 密钥 */
export const secretKey = {
  AES_PWD_SECRET_KEY: "KOIADMINyuxintao",
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** AES/ECB/Pkcs7 加密（返回 base64） */
export function encrypt(data: any, key: any) {
  const keyStr = String(key);
  const plainStr = String(data ?? "");
  const bridge = getWasmCryptoBridge();
  if (bridge) {
    const cipher = bridge.aesEcbEncrypt(
      new TextEncoder().encode(plainStr),
      new TextEncoder().encode(keyStr),
    );
    return bytesToBase64(cipher);
  }
  warnBridgeMissing("aes.encrypt");
  const secret = CryptoJS.enc.Utf8.parse(keyStr);
  const plain = CryptoJS.enc.Utf8.parse(plainStr);
  const encrypted = CryptoJS.AES.encrypt(plain, secret, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

/** AES/ECB/Pkcs7 解密（输入 base64；解不开时返回空串） */
export function decrypt(data: any, key: any) {
  const keyStr = String(key);
  const cipherStr = String(data ?? "");
  const bridge = getWasmCryptoBridge();
  if (bridge) {
    if (!cipherStr) return "";
    try {
      const plain = bridge.aesEcbDecrypt(
        base64ToBytes(cipherStr),
        new TextEncoder().encode(keyStr),
      );
      return new TextDecoder().decode(plain);
    } catch {
      return "";
    }
  }
  warnBridgeMissing("aes.decrypt");
  const secret = CryptoJS.enc.Utf8.parse(keyStr);
  const decrypted = CryptoJS.AES.decrypt(cipherStr, secret, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return CryptoJS.enc.Utf8.stringify(decrypted).toString();
}
