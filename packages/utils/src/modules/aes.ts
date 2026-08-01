/**
 * AES 加解密工具（迁移自 koi/utils/aes.ts）
 */
import CryptoJS from "crypto-js";

/** 默认 AES 密钥 */
export const secretKey = {
  AES_PWD_SECRET_KEY: "KOIADMINyuxintao",
};

/** AES/ECB/Pkcs7 加密 */
export function encrypt(data: any, key: any) {
  const secret = CryptoJS.enc.Utf8.parse(key);
  const plain = CryptoJS.enc.Utf8.parse(data);
  const encrypted = CryptoJS.AES.encrypt(plain, secret, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

/** AES/ECB/Pkcs7 解密 */
export function decrypt(data: any, key: any) {
  const secret = CryptoJS.enc.Utf8.parse(key);
  const decrypted = CryptoJS.AES.decrypt(data, secret, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return CryptoJS.enc.Utf8.stringify(decrypted).toString();
}
