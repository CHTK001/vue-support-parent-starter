/**
 * WASM 加密模块包装器
 * 提供 SM2/SM3/SM4/AES/MD5 等加密算法的 WASM 和 JS 双实现
 * @author CH
 * @version 2.0.0
 * @since 2025-12-03
 */
import smCrypto from "sm-crypto";
import CryptoJS from "crypto-js";
import init, * as wasmCodec from "../build/codec_wasm.js";

// 模块状态
let wasmLoaded = false;
let wasmModuleInstance = null;
let wasmMemory = null;
let allocFunction = null;

// 编解码工具
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// 错误消息常量
const ERR_WASM_NOT_LOADED = "WASM模块未加载，请先调用initializeWasmModule()";
const ERR_WASM_INSTANCE_UNAVAILABLE = "WASM模块实例不可用";

/**
 * 获取 WASM 内存对象
 */
const getWasmMemory = () => {
  if (wasmMemory) return wasmMemory;
  if (wasmCodec?.default?.memory) return wasmCodec.default.memory;
  if (wasmCodec?.memory) return wasmCodec.memory;
  throw new Error("WASM memory is not available");
};

/**
 * 将字符串写入 WASM 内存
 * @param {string} str - 要写入的字符串
 * @returns {{ ptr: number, len: number }} 指针和长度
 */
const stringToWasm = (str) => {
  if (!wasmModuleInstance) throw new Error(ERR_WASM_INSTANCE_UNAVAILABLE);
  
  const bytes = encoder.encode(str);
  let ptr;
  
  if (allocFunction) {
    ptr = allocFunction(bytes.length);
  } else if (typeof wasmModuleInstance.__new === "function") {
    ptr = wasmModuleInstance.__new(bytes.length, 1);
  } else {
    throw new Error("WASM模块未导出内存管理函数");
  }
  
  new Uint8Array(getWasmMemory().buffer, ptr, bytes.length).set(bytes);
  return { ptr, len: bytes.length };
};

/**
 * 从 WASM 内存读取字符串
 * @param {number} ptr - 内存指针
 * @returns {string} 读取的字符串
 */
const stringFromWasm = (ptr) => {
  if (ptr === 0) return "";
  
  // 尝试使用内置函数
  const getString = wasmModuleInstance?.__getString || wasmModuleInstance?.__getstr;
  if (getString) {
    try { return getString(ptr); } catch { /* 降级处理 */ }
  }
  
  // 手动从内存读取
  try {
    const memory = new Uint8Array(getWasmMemory().buffer);
    let end = ptr;
    const maxLen = ptr + 10000;
    while (end < memory.length && memory[end] !== 0 && end < maxLen) end++;
    return decoder.decode(memory.subarray(ptr, end));
  } catch (e) {
    console.error("读取WASM内存失败:", e);
    return "";
  }
};

/**
 * 通用 WASM 函数调用包装器
 * @param {string} funcName - WASM 函数名
 * @param {Function} jsFallback - JS 降级实现
 * @param {...any} args - 函数参数
 */
const callWasm = (funcName, jsFallback, ...args) => {
  if (!wasmLoaded || !wasmModuleInstance?.[funcName]) {
    return jsFallback?.(...args);
  }
  return wasmModuleInstance[funcName](...args);
};

/**
 * 调用需要字符串参数的 WASM 函数
 * @param {string} funcName - 函数名
 * @param {string[]} strArgs - 字符串参数数组
 * @param {Function} jsFallback - JS 降级函数
 */
const callWasmWithStrings = (funcName, strArgs, jsFallback) => {
  if (!wasmLoaded) {
    if (jsFallback) return jsFallback(...strArgs);
    throw new Error(ERR_WASM_NOT_LOADED);
  }
  
  const wasmFunc = wasmModuleInstance?.[funcName];
  if (!wasmFunc) {
    if (jsFallback) return jsFallback(...strArgs);
    throw new Error(`WASM模块未导出${funcName}函数`);
  }
  
  try {
    const wasmArgs = strArgs.flatMap(str => {
      const { ptr, len } = stringToWasm(str);
      return [ptr, len];
    });
    const resultPtr = wasmFunc(...wasmArgs);
    return stringFromWasm(resultPtr);
  } catch (e) {
    console.error(`WASM ${funcName} 调用失败:`, e);
    if (jsFallback) return jsFallback(...strArgs);
    throw e;
  }
};

/**
 * 异步加载 WASM 模块
 */
const loadWasmAsync = async () => {
  if (wasmLoaded) return wasmModuleInstance;

  try {
    const wasmExports = await init(new URL("../build/codec_wasm_bg.wasm", import.meta.url));
    wasmModuleInstance = wasmExports || wasmCodec;
    wasmLoaded = true;
    wasmMemory = wasmExports?.memory || wasmModuleInstance?.memory;
    allocFunction = typeof wasmModuleInstance?.alloc === "function" ? wasmModuleInstance.alloc : null;
    return wasmModuleInstance;
  } catch (e) {
    console.error("WASM模块加载失败:", e);
    wasmLoaded = false;
    wasmModuleInstance = null;
    return null;
  }
};

/**
 * 初始化 WASM 模块（应用启动时调用）
 */
export const initializeWasmModule = async () => {
  if (wasmLoaded) return wasmModuleInstance;
  try {
    return await loadWasmAsync();
  } catch (e) {
    console.error("WASM初始化降级:", e);
    return null;
  }
};

/** 检查 WASM 是否已加载 */
export const isWasmLoaded = () => wasmLoaded;

/** 获取当前时间戳 */
export const getCurrentTimestamp = () => callWasm("get_current_timestamp", Date.now);

/** 加法运算 */
export const add = (a, b) => callWasm("add", () => a + b, a, b);

/** 生成随机 Nonce */
const jsGenerateNonce = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const generateNonce = () => {
  if (!wasmLoaded) return jsGenerateNonce();
  
  if (wasmModuleInstance?.generate_nonce) {
    return wasmModuleInstance.generate_nonce();
  }
  if (wasmModuleInstance?.generateNonce) {
    try {
      return stringFromWasm(wasmModuleInstance.generateNonce());
    } catch { /* 降级 */ }
  }
  return jsGenerateNonce();
};

/** SM3 哈希 */
export const sm3Hash = (data) => callWasmWithStrings("sm3_hash", [data]);

/** MD5 哈希 */
export const md5Hash = (data) => callWasmWithStrings("md5_hash", [data]);

/** AES 加密 */
export const encryptAES = (data, key) => callWasmWithStrings("aes_encrypt", [data, key]);

/** AES 解密 */
export const decryptAES = (encryptedData, key) => callWasmWithStrings("aes_decrypt", [encryptedData, key]);

// 零 IV 常量
const ZERO_IV = CryptoJS.enc.Utf8.parse("\x00".repeat(16));

/** JS 版 AES 加密 */
export const jsEncryptAES = (data, key) => {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.encrypt(data, keyUtf8, {
    iv: ZERO_IV, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
  }).toString();
};

/** JS 版 AES 解密 */
export const jsDecryptAES = (encryptedData, key) => {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.decrypt(encryptedData, keyUtf8, {
    iv: ZERO_IV, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
  }).toString(CryptoJS.enc.Utf8);
};

/** JS 版 SM3 哈希 */
export const jsSm3Hash = (data) => smCrypto.sm3(data);

/** JS 版 MD5 哈希 */
export const jsMd5Hash = (data) => CryptoJS.MD5(data).toString();

/**
 * 处理 SM4 密钥（16字节字符串转字节数组）
 */
const processSm4Key = (key) => {
  if (typeof key === "string" && key.length === 16) {
    return Array.from(key, c => c.charCodeAt(0));
  }
  return key;
};

/** JS 版 SM4 加密 */
export const jsSm4Encrypt = (data, key) => {
  try {
    return smCrypto.sm4.encrypt(data, processSm4Key(key));
  } catch (e) {
    console.error("SM4加密失败:", e);
    throw e;
  }
};

/** JS 版 SM4 解密 */
export const jsSm4Decrypt = (encryptedData, key) => {
  try {
    return smCrypto.sm4.decrypt(encryptedData, processSm4Key(key));
  } catch (e) {
    console.error("SM4解密失败:", e);
    throw e;
  }
};

/** SM4 加密（WASM 优先，JS 降级） */
export const encryptSM4 = (data, key) => 
  callWasmWithStrings("sm4_encrypt", [data, key], (d, k) => smCrypto.sm4.encrypt(d, k));

/** SM4 解密（WASM 优先，JS 降级） */
export const decryptSM4 = (encryptedData, key) => 
  callWasmWithStrings("sm4_decrypt", [encryptedData, key], (d, k) => smCrypto.sm4.decrypt(d, k));

/** Storage Key 加密 */
export const encryptStorageKey = (key, systemCode) => systemCode + key;

/** Storage Value 加密 */
export const encryptStorageValue = (value, key, systemCode, storageKey, storageEncode) => {
  const funcName = wasmModuleInstance?.encrypt_storage_value ? "encrypt_storage_value" : "encryptStorageValue";
  return callWasmWithStrings(funcName, [value, key, systemCode, storageKey, storageEncode]);
};

/** Storage Value 解密 */
export const decryptStorageValue = (value, key, systemCode, storageKey, storageEncode) => {
  const funcName = wasmModuleInstance?.decrypt_storage_value ? "decrypt_storage_value" : "decryptStorageValue";
  return callWasmWithStrings(funcName, [value, key, systemCode, storageKey, storageEncode]);
};

/** SM2 加密（WASM 优先，JS 降级） */
export const encryptSM2 = (data, publicKey) => 
  callWasmWithStrings("sm2_encrypt", [data, publicKey], (d, k) => smCrypto.sm2.doEncrypt(d, k, 1));

/** SM2 解密（WASM 优先，JS 降级） */
export const decryptSM2 = (encryptedData, privateKey) => 
  callWasmWithStrings("sm2_decrypt", [encryptedData, privateKey], (d, k) => smCrypto.sm2.doDecrypt(d, k, 1));

/** 生成 SM2 密钥对 */
export const generateSm2KeyPair = () => {
  if (!wasmLoaded) throw new Error(ERR_WASM_NOT_LOADED);
  if (!wasmModuleInstance?.generate_sm2_key_pair) throw new Error("WASM模块未导出generate_sm2_key_pair函数");
  try {
    return stringFromWasm(wasmModuleInstance.generate_sm2_key_pair());
  } catch (e) {
    console.error("SM2密钥对生成失败:", e);
    throw e;
  }
};

// UU1 function - Response decryption (简化版本，只负责调用WASM）
export function uu1(response) {
  // 确保WASM模块已加载
  if (!wasmLoaded) {
    throw new Error("WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。");
  }

  // 检查WASM模块是否导出uu1_decrypt_response_object_with_arraybuffer函数
  if (wasmModuleInstance.uu1_decrypt_response_object_with_arraybuffer) {
    // 使用新函数处理ArrayBuffer
    try {
      // 检查response.data是否为Blob类型
      if (response.data instanceof Blob) {
        // 根据Content-Type判断如何处理Blob
        const contentType = response.headers && response.headers["content-type"];

        // 只有application/octet-stream类型的二进制数据才使用WASM处理
        if (contentType && contentType.includes("application/octet-stream")) {
          // 对于加密的二进制数据，先转换为ArrayBuffer再传递给WASM
          return response.data.arrayBuffer().then((buffer) => {
            // 创建新的响应对象，将ArrayBuffer数据放入data字段
            const newResponse = {
              ...response,
              data: buffer,
            };
            // 直接调用WASM函数处理整个响应对象
            return wasmModuleInstance.uu1_decrypt_response_object_with_arraybuffer(newResponse);
          });
        } else if (contentType && contentType.includes("application/json")) {
          // 对于JSON数据，转换为对象
          return response.data.text().then((text) => {
            let processedData;
            try {
              processedData = JSON.parse(text);
            } catch (e) {
              // 如果JSON解析失败，使用原始文本
              processedData = text;
            }

            // 创建新的响应对象
            const newResponse = {
              ...response,
              data: processedData,
            };

            // 直接返回处理后的响应，不调用WASM
            return newResponse;
          });
        } else if (contentType && contentType.includes("text/")) {
          // 对于文本数据，直接使用文本
          return response.data.text().then((text) => {
            // 创建新的响应对象
            const newResponse = {
              ...response,
              data: text,
            };

            // 直接返回处理后的响应，不调用WASM
            return newResponse;
          });
        } else {
          // 对于其他类型的Blob，直接返回原始响应
          return response;
        }
      } else {
        // 对于非Blob数据，直接返回原始响应对象，不调用WASM
        return response;
      }
    } catch (error) {
      console.error("处理响应数据失败:", error);
      throw error;
    }
  } else {
    return response;
  }
}

// UU1 WASM function - 保持向后兼容
export function uu1_wasm(response) {
  return uu1(response);
}

// UU2 WASM function - 修改为接收PureHttpRequestConfig对象
export function uu2_wasm(request) {
  // 确保WASM模块已加载
  if (!wasmLoaded) {
    throw new Error("WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。");
  }

  // 检查WASM模块是否导出uu2_process_request函数（新的处理函数）
  if (wasmModuleInstance.uu2_process_request) {
    try {
      // 直接调用WASM函数处理整个请求对象
      return wasmModuleInstance.uu2_process_request(request);
    } catch (error) {
      console.error("WASM uu2_wasm处理失败:", error);
      throw error;
    }
  }
  return request;
}

// UU3 function - Simple decryption with fixed key
export function uu3(encryptedData) {
  if (!wasmLoaded) {
    throw new Error("WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。");
  }

  if (wasmModuleInstance.uu3_decrypt_simple) {
    try {
      const encryptedDataObj = stringToWasm(encryptedData);

      const resultPtr = wasmModuleInstance.uu3_decrypt_simple(encryptedDataObj.ptr, encryptedDataObj.len);

      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error("WASM uu3 failed:", error);
      throw error;
    }
  } else {
    throw new Error("WASM模块未导出uu3_decrypt_simple函数");
  }
}

// UU3 WASM function - 保持向后兼容
export function uu3_wasm(encryptedData) {
  return uu3(encryptedData);
}

// UU4 function - Another response decryption
export function uu4(responseData, uuid, timestamp) {
  if (!wasmLoaded) {
    throw new Error("WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。");
  }

  if (wasmModuleInstance.uu4_decrypt_response) {
    try {
      const responseDataObj = stringToWasm(responseData.data);
      const uuidObj = stringToWasm(responseData.uuid);
      const timestampObj = stringToWasm(responseData.timestamp);

      const resultPtr = wasmModuleInstance.uu4_decrypt_response(responseDataObj.ptr, responseDataObj.len, uuidObj.ptr, uuidObj.len, timestampObj.ptr, timestampObj.len);

      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error("WASM uu4 failed:", error);
      throw error;
    }
  } else {
    throw new Error("WASM模块未导出uu4_decrypt_response函数");
  }
}

// UU4 WASM function - 保持向后兼容
export function uu4_wasm(responseData, uuid, timestamp) {
  return uu4(responseData, uuid, timestamp);
}

// SM2签名生成函数
export function generateSign(data, privateKey) {
  if (!wasmLoaded) {
    throw new Error("WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。");
  }

  // 使用wasmModuleInstance对象调用SM2签名生成函数
  if (wasmModuleInstance.generate_sign) {
    try {
      const dataObj = stringToWasm(data);
      const privateKeyObj = stringToWasm(privateKey);

      const resultPtr = wasmModuleInstance.generate_sign(dataObj.ptr, dataObj.len, privateKeyObj.ptr, privateKeyObj.len);

      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error("WASM generateSign failed:", error);
      throw error;
    }
  } else {
    throw new Error("WASM模块未导出generate_sign函数");
  }
}

// SM2签名验证函数
export function verifySign(data, signature, publicKey) {
  if (!wasmLoaded) {
    throw new Error("WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。");
  }

  // 使用wasmModuleInstance对象调用SM2签名验证函数
  if (wasmModuleInstance.verify_sign) {
    try {
      const dataObj = stringToWasm(data);
      const signatureObj = stringToWasm(signature);
      const publicKeyObj = stringToWasm(publicKey);

      const result = wasmModuleInstance.verify_sign(dataObj.ptr, dataObj.len, signatureObj.ptr, signatureObj.len, publicKeyObj.ptr, publicKeyObj.len);

      return result;
    } catch (error) {
      console.error("WASM verifySign failed:", error);
      throw error;
    }
  } else {
    throw new Error("WASM模块未导出verify_sign函数");
  }
}

// 挂载WASM模块到window对象上，方便全局调用
if (typeof window !== "undefined") {
  window.codecWasm = {
    isWasmLoaded,
    getCurrentTimestamp,
    add,
    generateNonce,
    sm3Hash,
    md5Hash,
    encryptAES,
    decryptAES,
    encryptSM2,
    decryptSM2,
    generateSm2KeyPair,
    encryptSM4,
    decryptSM4,
    encryptStorageKey,
    encryptStorageValue,
    decryptStorageValue,
    jsEncryptAES,
    jsDecryptAES,
    jsSm3Hash,
    jsMd5Hash,
    jsSm4Encrypt,
    jsSm4Decrypt,
    uu1,
    uu1_wasm,
    uu2_wasm,
    uu3,
    uu3_wasm,
    uu4,
    uu4_wasm,
    generateSign,
    verifySign,
  };
}

export default wasmModuleInstance;
