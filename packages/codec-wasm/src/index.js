/**
 * WASM 加密模块桥接层
 * 提供 SM2/SM3/SM4/AES/MD5 等加密算法的 WASM 和 JS 双实现
 * @author CH
 * @version 3.0.0
 */
import smCrypto from "sm-crypto";
import CryptoJS from "crypto-js";
import init, * as wasmCodec from "../build/codec_wasm.js";

// ============ 模块状态 ============
let wasmLoaded = false;
let wasm = null;

// ============ 工具函数 ============
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ZERO_IV = CryptoJS.enc.Utf8.parse("\x00".repeat(16));

/** 获取 C 字符串长度 */
const strlen = (ptr) => {
  if (!ptr) return 0;
  const mem = new Uint8Array(wasm.memory.buffer);
  let len = 0;
  while (mem[ptr + len] !== 0 && len < 1000000) len++;
  return len;
};

/** 字符串写入 WASM */
const toWasm = (str) => {
  const bytes = encoder.encode(str);
  const ptr = wasm.alloc(bytes.length + 1);
  new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
  new Uint8Array(wasm.memory.buffer)[ptr + bytes.length] = 0;
  return { ptr, len: bytes.length };
};

/** 从 WASM 读取字符串 */
const fromWasm = (ptr) => {
  if (!ptr) return "";
  const len = strlen(ptr);
  return decoder.decode(new Uint8Array(wasm.memory.buffer, ptr, len));
};

/** 调用 WASM 函数（带 JS 降级） */
const call = (fn, fallback, ...args) => {
  if (wasmLoaded && wasm?.[fn]) {
    try {
      return wasm[fn](...args);
    } catch (e) {
      console.warn(`WASM ${fn} failed, falling back to JS:`, e);
    }
  }
  return fallback?.(...args);
};

/** 调用字符串参数的 WASM 函数 */
const callStr = (fn, args, fallback) => {
  if (!wasmLoaded) return fallback?.(...args);
  
  const func = wasm?.[fn];
  if (!func) return fallback?.(...args);
  
  try {
    const wasmArgs = args.flatMap(s => {
      const { ptr, len } = toWasm(String(s));
      return [ptr, len];
    });
    return fromWasm(func(...wasmArgs));
  } catch (e) {
    console.warn(`WASM ${fn} failed:`, e);
    return fallback?.(...args);
  }
};

// ============ 初始化 ============

/** 初始化 WASM 模块 */
export const initializeWasmModule = async () => {
  if (wasmLoaded) return wasm;
  
  try {
    const exports = await init(new URL("../build/codec_wasm_bg.wasm", import.meta.url));
    wasm = exports || wasmCodec;
    wasmLoaded = true;
    console.log("✅ WASM 模块加载成功");
    return wasm;
  } catch (e) {
    console.error("❌ WASM 模块加载失败:", e);
    wasmLoaded = false;
    return null;
  }
};

/** 检查 WASM 是否已加载 */
export const isWasmLoaded = () => wasmLoaded;

// ============ 哈希函数 ============

export const sm3Hash = (data) => callStr("sm3_hash", [data], d => smCrypto.sm3(d));
export const md5Hash = (data) => callStr("md5_hash", [data], d => CryptoJS.MD5(d).toString());
export const jsSm3Hash = (data) => smCrypto.sm3(data);
export const jsMd5Hash = (data) => CryptoJS.MD5(data).toString();

// ============ AES 加解密 ============

export const encryptAES = (data, key) => callStr("aes_encrypt", [data, key], jsEncryptAES);
export const decryptAES = (data, key) => callStr("aes_decrypt", [data, key], jsDecryptAES);

export const jsEncryptAES = (data, key) => {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.encrypt(data, keyUtf8, {
    iv: ZERO_IV, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
  }).toString();
};

export const jsDecryptAES = (data, key) => {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.decrypt(data, keyUtf8, {
    iv: ZERO_IV, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
  }).toString(CryptoJS.enc.Utf8);
};

// ============ SM4 加解密 ============

const toSm4Key = (key) => typeof key === "string" && key.length === 16 
  ? Array.from(key, c => c.charCodeAt(0)) : key;

export const encryptSM4 = (data, key) => callStr("sm4_encrypt", [data, key], jsSm4Encrypt);
export const decryptSM4 = (data, key) => callStr("sm4_decrypt", [data, key], jsSm4Decrypt);
export const jsSm4Encrypt = (data, key) => smCrypto.sm4.encrypt(data, toSm4Key(key));
export const jsSm4Decrypt = (data, key) => smCrypto.sm4.decrypt(data, toSm4Key(key));

// ============ SM2 加解密 ============

export const encryptSM2 = (data, pubKey) => 
  callStr("sm2_encrypt", [data, pubKey], (d, k) => smCrypto.sm2.doEncrypt(d, k, 1));

export const decryptSM2 = (data, privKey) => 
  callStr("sm2_decrypt", [data, privKey], (d, k) => smCrypto.sm2.doDecrypt(d, k, 1));

export const generateSm2KeyPair = () => {
  if (!wasmLoaded) throw new Error("WASM 未加载");
  return fromWasm(wasm.generate_sm2_key_pair());
};

// ============ 签名函数 ============

export const generateSign = (data, privateKey) => callStr("generate_sign", [data, privateKey]);
export const verifySign = (data, sig, pubKey) => {
  if (!wasmLoaded) return false;
  const d = toWasm(data), s = toWasm(sig), p = toWasm(pubKey);
  return wasm.verify_sign(d.ptr, d.len, s.ptr, s.len, p.ptr, p.len);
};

// ============ 工具函数 ============

export const generateNonce = () => {
  if (wasmLoaded && wasm?.generate_nonce) {
    try { return wasm.generate_nonce(); } catch {}
  }
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
};

export const getCurrentTimestamp = () => call("get_current_timestamp", Date.now);
export const add = (a, b) => call("add", () => a + b, a, b);

// ============ 存储加解密 ============

export const encryptStorageKey = (key, systemCode) => systemCode + key;
export const encryptStorageValue = (value, key, systemCode, storageKey, storageEncode) => 
  callStr("encrypt_storage_value", [value, key, systemCode, storageKey, storageEncode], () => value);
export const decryptStorageValue = (value, key, systemCode, storageKey, storageEncode) => 
  callStr("decrypt_storage_value", [value, key, systemCode, storageKey, storageEncode], () => value);

// ============ UU 系列函数 ============

/** UU1 - 响应解密 */
export function uu1(response) {
  if (!wasmLoaded || !wasm?.uu1_decrypt_response_object_with_arraybuffer) {
    return response;
  }
  
  const { data, headers } = response;
  if (!(data instanceof Blob)) return response;
  
  const contentType = headers?.["content-type"] || "";
  
  if (contentType.includes("application/octet-stream")) {
    return data.arrayBuffer().then(buffer => 
      wasm.uu1_decrypt_response_object_with_arraybuffer({ ...response, data: buffer })
    );
  }
  
  if (contentType.includes("application/json")) {
    return data.text().then(text => {
      try {
        return { ...response, data: JSON.parse(text) };
      } catch {
        return { ...response, data: text };
      }
    });
  }
  
  if (contentType.includes("text/")) {
    return data.text().then(text => ({ ...response, data: text }));
  }
  
  return response;
}

/** UU2 - 请求加密 */
export function uu2_wasm(request) {
  if (!wasmLoaded || !wasm?.uu2_process_request) return request;
  try {
    return wasm.uu2_process_request(request);
  } catch (e) {
    console.error("uu2_wasm 处理失败:", e);
    return request;
  }
}

/** UU3 - 固定密钥解密 */
export function uu3(encryptedData) {
  if (!wasmLoaded) throw new Error("WASM 未加载");
  const { ptr, len } = toWasm(encryptedData);
  return fromWasm(wasm.uu3_decrypt_simple(ptr, len));
}

/** UU4 - 响应解密 */
export function uu4(responseData) {
  if (!wasmLoaded) throw new Error("WASM 未加载");
  const d = toWasm(responseData.data);
  const u = toWasm(responseData.uuid || "");
  const t = toWasm(responseData.timestamp || "");
  return fromWasm(wasm.uu4_decrypt_response(d.ptr, d.len, u.ptr, u.len, t.ptr, t.len));
}

// 别名
export const uu1_wasm = uu1;
export const uu3_wasm = uu3;
export const uu4_wasm = uu4;

// ============ 全局挂载 ============

if (typeof window !== "undefined") {
  window.codecWasm = {
    initializeWasmModule, isWasmLoaded,
    // 哈希
    sm3Hash, md5Hash, jsSm3Hash, jsMd5Hash,
    // AES
    encryptAES, decryptAES, jsEncryptAES, jsDecryptAES,
    // SM4
    encryptSM4, decryptSM4, jsSm4Encrypt, jsSm4Decrypt,
    // SM2
    encryptSM2, decryptSM2, generateSm2KeyPair,
    // 签名
    generateSign, verifySign,
    // 工具
    generateNonce, getCurrentTimestamp, add,
    // 存储
    encryptStorageKey, encryptStorageValue, decryptStorageValue,
    // UU
    uu1, uu1_wasm, uu2_wasm, uu3, uu3_wasm, uu4, uu4_wasm,
  };
}

export default wasm;
