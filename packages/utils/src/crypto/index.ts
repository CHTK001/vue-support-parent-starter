import * as CryptoJS from "crypto-js";

export interface AesConfig {
  iv?: string;
  mode?: string;
  padding?: string;
}

export function aesEncrypt(
  data: string,
  secretKey: string,
  config: AesConfig = {},
): string {
  return cryptoApi.AES.encrypt(data, secretKey, config);
}

export function aesDecrypt(
  cipher: string,
  secretKey: string,
  config: AesConfig = {},
): string {
  if (!cipher) {
    return "";
  }
  return cryptoApi.AES.decrypt(cipher, secretKey, config);
}

const cryptoApi = {
  md5(word: string) {
    return CryptoJS.MD5(word).toString();
  },
  //BASE64加解密
  BASE64: {
    encrypt(data) {
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
    },
    decrypt(cipher) {
      return CryptoJS.enc.Base64.parse(cipher).toString(CryptoJS.enc.Utf8);
    },
  },
  //AES加解密
  AES: {
    encrypt(
      data,
      secretKey,
      config: AesConfig = {},
    ) {
      if (secretKey.length % 8 != 0) {
        console.warn("[error]: 秘钥长度需为8的倍数，否则解密将会失败。");
      }
      const result = CryptoJS.AES.encrypt(
        data,
        CryptoJS.enc.Utf8.parse(secretKey),
        {
          iv: CryptoJS.enc.Utf8.parse(config.iv || ""),
          mode: CryptoJS.mode[config.mode || "ECB"],
          padding: CryptoJS.pad[config.padding || "Pkcs7"],
        },
      );
      return result.toString();
    },
    decrypt(
      cipher,
      secretKey,
      config: AesConfig = {},
    ) {
      const result = CryptoJS.AES.decrypt(
        cipher,
        CryptoJS.enc.Utf8.parse(secretKey),
        {
          iv: CryptoJS.enc.Utf8.parse(config.iv || ""),
          mode: CryptoJS.mode[config.mode || "ECB"],
          padding: CryptoJS.pad[config.padding || "Pkcs7"],
        },
      );
      return CryptoJS.enc.Utf8.stringify(result);
    },
  },
};

export default {
  ...cryptoApi,
};

/**
 * RSA-OAEP 加密（浏览器 Web Crypto API）
 * @param plaintext 明文字符串
 * @param publicKeyPem PEM 格式公钥（含 header/footer）
 * @returns Base64 编码的密文
 * @throws 若公钥格式无效或加密失败则抛出 Error
 */
export async function rsaEncrypt(
  plaintext: string,
  publicKeyPem: string,
): Promise<string> {
  // 1. PEM → ArrayBuffer：去除 header/footer 和换行，atob 解码
  const pemBody = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const binaryStr = atob(pemBody);
  const keyBuffer = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0)).buffer;

  // 2. 导入公钥
  const cryptoKey = await crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  // 3. 加密
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    cryptoKey,
    new TextEncoder().encode(plaintext),
  );

  // 4. ArrayBuffer → Base64
  const cipherArray = Array.from(new Uint8Array(cipherBuffer));
  return btoa(String.fromCharCode(...cipherArray));
}
