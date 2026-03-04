/**
 * JS 版本存储加解密实现
 */

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
  
  const shifted = str.split('').map(char => {
    return String.fromCharCode(char.charCodeAt(0) + offset);
  }).join('');
  
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
    const encoded = str.substring(3);
    const shifted = atob(encoded);
    
    let offset = 0;
    for (let i = 0; i < key.length; i++) {
      offset = (offset + key.charCodeAt(i)) % 256;
    }
    if (offset === 0) offset = 13;
    
    return shifted.split('').map(char => {
      return String.fromCharCode(char.charCodeAt(0) - offset);
    }).join('');
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
export const encryptStorageValue = (value, key, systemCode, storageKey, storageEncode) => {
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
export const decryptStorageValue = (value, key, systemCode, storageKey, storageEncode) => {
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

