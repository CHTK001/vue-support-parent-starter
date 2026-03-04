/**
 * JS 版本加密算法实现
 *
 */
import smCrypto from "sm-crypto";
import CryptoJS from "crypto-js";

const ZERO_IV = CryptoJS.enc.Utf8.parse("\x00".repeat(16));

// ============ 哈希函数 ============

/**
 * SM3 哈希
 * @param {string} data 待哈希数据
 * @returns {string} 哈希值
 */
export const sm3Hash = (data) => smCrypto.sm3(data);

/**
 * MD5 哈希
 * @param {string} data 待哈希数据
 * @returns {string} 哈希值
 */
export const md5Hash = (data) => CryptoJS.MD5(data).toString();

// ============ AES 加解密 ============

/**
 * AES 加密
 * @param {string} data 待加密数据
 * @param {string} key 密钥
 * @returns {string} 加密后的数据
 */
export const encryptAES = (data, key) => {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.encrypt(data, keyUtf8, {
    iv: ZERO_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
};

/**
 * AES 解密
 * @param {string} data 待解密数据
 * @param {string} key 密钥
 * @returns {string} 解密后的数据
 */
export const decryptAES = (data, key) => {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.decrypt(data, keyUtf8, {
    iv: ZERO_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8);
};

// ============ SM4 加解密 ============

/**
 * 转换 SM4 密钥格式
 * @param {string|Array<number>} key 密钥
 * @returns {Array<number>} 密钥数组
 */
const toSm4Key = (key) =>
  typeof key === "string" && key.length === 16
    ? Array.from(key, (c) => c.charCodeAt(0))
    : key;

/**
 * SM4 加密
 * @param {string} data 待加密数据
 * @param {string|Array<number>} key 密钥
 * @returns {string} 加密后的数据
 */
export const encryptSM4 = (data, key) =>
  smCrypto.sm4.encrypt(data, toSm4Key(key));

/**
 * SM4 解密
 * @param {string} data 待解密数据
 * @param {string|Array<number>} key 密钥
 * @returns {string} 解密后的数据
 */
export const decryptSM4 = (data, key) =>
  smCrypto.sm4.decrypt(data, toSm4Key(key));

// ============ SM2 加解密 ============

/**
 * SM2 加密
 * @param {string} data 待加密数据
 * @param {string} pubKey 公钥
 * @returns {string} 加密后的数据
 */
export const encryptSM2 = (data, pubKey) =>
  smCrypto.sm2.doEncrypt(data, pubKey, 1);

/**
 * SM2 解密
 * @param {string} data 待解密数据
 * @param {string} privKey 私钥
 * @returns {string} 解密后的数据
 */
export const decryptSM2 = (data, privKey) =>
  smCrypto.sm2.doDecrypt(data, privKey, 1);

/**
 * 生成 SM2 密钥对
 * @returns {object} 密钥对 {privateKey, publicKey}
 */
export const generateSm2KeyPair = () => smCrypto.sm2.generateKeyPairHex();

// ============ 签名函数 ============

/**
 * 生成签名
 * @param {string} data 待签名数据
 * @param {string} privateKey 私钥
 * @returns {string} 签名
 */
export const generateSign = (data, privateKey) =>
  smCrypto.sm2.doSignature(data, privateKey);

/**
 * 验证签名
 * @param {string} data 原始数据
 * @param {string} sig 签名
 * @param {string} pubKey 公钥
 * @returns {boolean} 验证结果
 */
export const verifySign = (data, sig, pubKey) =>
  smCrypto.sm2.doVerifySignature(data, sig, pubKey);

// ============ 工具函数 ============

/**
 * 生成随机字符串（32位）
 * @returns {string} 32位随机字符串
 */
export const generateNonce = () => {
  // 生成32位随机字符串
  let nonce = "";
  while (nonce.length < 32) {
    nonce += Math.random().toString(36).slice(2);
  }
  return nonce.slice(0, 32);
};

/**
 * 获取当前时间戳
 * @returns {number} 时间戳
 */
export const getCurrentTimestamp = () => Date.now();

/**
 * 加法运算
 * @param {number} a 第一个数
 * @param {number} b 第二个数
 * @returns {number} 和
 */
export const add = (a, b) => a + b;

// ============ UU 系列函数 ============

/**
 * UU1 - 响应解密（JS 版本，仅处理 Blob，不解密）
 * @param {object} response 响应对象
 * @returns {Promise<object>} 处理后的响应
 */
export async function uu1(response) {
  const { data, headers } = response;
  if (!(data instanceof Blob)) return response;

  const contentType = headers?.["content-type"] || "";

  if (contentType.includes("application/json")) {
    const text = await data.text();
    try {
      return { ...response, data: JSON.parse(text) };
    } catch {
      return { ...response, data: text };
    }
  }

  if (contentType.includes("text/")) {
    const text = await data.text();
    return { ...response, data: text };
  }

  return response;
}

/**
 * UU2 - 请求处理（JS 版本，直接透传）
 * @param {object} request 请求对象
 * @returns {object} 请求对象
 */
export function uu2_wasm(request) {
  return request;
}

/**
 * UU3 - 解密（JS 版本，直接返回原值）
 * @param {string} encryptedData 加密数据
 * @returns {string} 原数据
 */
export function uu3(encryptedData) {
  return encryptedData;
}

/**
 * UU4 - 响应处理（JS 版本，直接返回原数据）
 * @param {object} responseData 响应数据
 * @returns {any} 原数据
 */
export function uu4(responseData) {
  return responseData?.data || responseData;
}

// ============ 存储加解密函数 ============

/**
 * 字符偏移加密
 * @param {string} str 原始字符串
 * @param {string} key 密钥
 * @returns {string} 加密后的字符串
 */
const shiftEncrypt = (str, key) => {
  if (!str || !key) return str;

  let offset = 0;
  for (let i = 0; i < key.length; i++) {
    offset = (offset + key.charCodeAt(i)) % 256;
  }
  if (offset === 0) offset = 13;

  const shifted = str
    .split("")
    .map((char) => {
      return String.fromCharCode(char.charCodeAt(0) + offset);
    })
    .join("");

  try {
    return "XXJS:" + btoa(shifted);
  } catch {
    return str;
  }
};

/**
 * 字符偏移解密
 * @param {string} str 加密字符串
 * @param {string} key 密钥
 * @returns {string} 解密后的字符串
 */
const shiftDecrypt = (str, key) => {
  if (!str || !key) return str;

  if (!str.startsWith("XXJS:")) {
    return str;
  }

  try {
    // "XXJS:" 前缀长度为 5，去掉前缀后再做 base64 解码
    const encoded = str.substring(5);
    const shifted = atob(encoded);

    let offset = 0;
    for (let i = 0; i < key.length; i++) {
      offset = (offset + key.charCodeAt(i)) % 256;
    }
    if (offset === 0) offset = 13;

    return shifted
      .split("")
      .map((char) => {
        return String.fromCharCode(char.charCodeAt(0) - offset);
      })
      .join("");
  } catch (e) {
    console.error("[codec-wasm][存储解密] 解密失败:", e);
    return str;
  }
};

/**
 * 加密存储值（JS 版本，与 WASM 版本方法签名一致）
 * @param {any} value 待加密的值
 * @param {string} key 密钥
 * @param {string} systemCode 系统代码
 * @param {string} storageKey 存储密钥
 * @param {string} storageEncode 是否启用编码
 * @returns {string} 加密后的值
 */
export const encryptStorageValue = (
  value,
  key,
  systemCode,
  storageKey,
  storageEncode,
) => {
  const safeValue = value ?? "";
  const safeKey = key ?? "";
  const safeSystemCode = systemCode ?? "";
  const safeStorageKey = storageKey ?? "";
  const encodeFlag = String(storageEncode ?? "");

  if (!encodeFlag || encodeFlag === "false" || !safeStorageKey) {
    return safeValue;
  }

  try {
    return shiftEncrypt(safeValue, safeStorageKey);
  } catch (e) {
    console.error("[codec-wasm][存储加密] 加密失败:", e);
    return safeValue;
  }
};

/**
 * 解密存储值（JS 版本，与 WASM 版本方法签名一致）
 * @param {any} value 待解密的值
 * @param {string} key 密钥
 * @param {string} systemCode 系统代码
 * @param {string} storageKey 存储密钥
 * @param {string} storageEncode 是否启用编码
 * @returns {string} 解密后的值
 */
export const decryptStorageValue = (
  value,
  key,
  systemCode,
  storageKey,
  storageEncode,
) => {
  const safeValue = value ?? "";
  const safeKey = key ?? "";
  const safeSystemCode = systemCode ?? "";
  const safeStorageKey = storageKey ?? "";
  const encodeFlag = String(storageEncode ?? "");

  if (!encodeFlag || encodeFlag === "false" || !safeStorageKey) {
    return safeValue;
  }

  try {
    return shiftDecrypt(safeValue, safeStorageKey);
  } catch (e) {
    console.error("[codec-wasm][存储解密] 解密失败:", e);
    return safeValue;
  }
};

/**
 * @deprecated 使用 encryptStorageValue 代替
 */
export const jsEncryptStorageValue = (value, storageKey) => {
  return encryptStorageValue(value, "", "", storageKey, "true");
};

/**
 * @deprecated 使用 decryptStorageValue 代替
 */
export const jsDecryptStorageValue = (value, storageKey) => {
  return decryptStorageValue(value, "", "", storageKey, "true");
};
