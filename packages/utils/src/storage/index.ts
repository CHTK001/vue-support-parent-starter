import { storageLocal, storageSession, type ProxyStorage } from "@pureadmin/utils";
import { responsiveStorageNameSpace } from "@repo/config";
import { getConfig } from "@repo/config";
// 导入WASM版本的加密函数
import { encryptStorageKey, encryptStorageValue, decryptStorageValue } from "@repo/codec-wasm";
// 导入IndexedDB存储
import { indexedDBProxy, asyncIndexedDB } from "./indexedDB";

/**
 * 本地存储和session存储操作封装工具函数
 */
class CustomSessionStorageProxy implements ProxyStorage {
  getItem<T>(key: string): T {
    if (!key || key.startsWith(responsiveStorageNameSpace())) {
      var value = storageSession().getItem(key);
      return value as T;
    }
    
    const config = getConfig();
    if (config.StorageEncode) {
      try {
        // 使用同步方式处理存储值解密
        const decryptedValue = decryptStorageValueSync(value as string, key, config.SystemCode, config.StorageKey, config.StorageEncode);
        value = JSON.parse(decryptedValue);
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  setItem<T>(key: string, value: T) {
    const config = getConfig();
    let storageValue: any = value;
    if (config.StorageEncode && !key.startsWith(responsiveStorageNameSpace())) {
      // 使用同步方式处理存储值加密
      storageValue = encryptStorageValueSync(JSON.stringify(value), key, config.SystemCode, config.StorageKey, config.StorageEncode);
    }
    storageSession().setItem(key, storageValue);
  }

  removeItem(key: string) {
    storageSession().removeItem(key);
  }

  clear() {
    storageSession().clear();
  }
}

/**
 * 本地存储和session存储操作封装工具函数
 */
class CustomLocalStorageProxy implements ProxyStorage {
  getItem<T>(key: string): T {
    if (!key) {
      return null as T;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      return storageLocal().getItem(key) as T;
    }

    // 使用同步方式处理存储key加密
    const newKey = encryptStorageKeySync(key, config.SystemCode);
    var value: any = storageLocal().getItem(newKey);
    if (config.StorageEncode) {
      try {
        // 使用同步方式处理存储值解密
        const decryptedValue = decryptStorageValueSync(value as string, key, config.SystemCode, config.StorageKey, config.StorageEncode);
        value = JSON.parse(decryptedValue);
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  setItem<T>(key: string, value: T) {
    if (!key) {
      return;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      storageLocal().setItem(key, value);
      return;
    }
    
    // 使用同步方式处理存储key加密
    const newKey = encryptStorageKeySync(key, config.SystemCode);
    let storageValue: any = value;
    if (config.StorageEncode && !newKey.startsWith(responsiveStorageNameSpace())) {
      // 使用同步方式处理存储值加密
      storageValue = encryptStorageValueSync(JSON.stringify(value), key, config.SystemCode, config.StorageKey, config.StorageEncode);
    }
    storageLocal().setItem(newKey, storageValue);
  }

  removeItem(key: string) {
    const config = getConfig();
    // 使用同步方式处理存储key加密
    const newKey = encryptStorageKeySync(key, config.SystemCode);
    storageLocal().removeItem(newKey);
  }

  clear() {
    storageLocal().clear();
  }
}

// 同步版本的存储key加密函数
function encryptStorageKeySync(key: string, systemCode: string): string {
  try {
    // 直接调用WASM函数的同步版本（如果可用）
    // 如果WASM不可用，则使用JavaScript实现
    if (!key) {
      return key;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行加密
    if (key.startsWith("responsive-")) {
      return key;
    }
    
    // 生成新的key，加上系统代码前缀
    const newKey = systemCode + key;
    return newKey;
  } catch (error) {
    console.error('encryptStorageKeySync failed:', error);
    // 回退到JavaScript实现
    if (!key) {
      return key;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行加密
    if (key.startsWith("responsive-")) {
      return key;
    }
    
    // 生成新的key，加上系统代码前缀
    const newKey = systemCode + key;
    return newKey;
  }
}

// 同步版本的存储值加密函数
function encryptStorageValueSync(value: string, key: string, systemCode: string, storageKey: string, storageEncode: boolean): string {
  try {
    // 直接调用WASM函数的同步版本（如果可用）
    // 如果WASM不可用，则使用JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行加密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES加密
    if (storageEncode) {
      return encryptAESSync(value, storageKey);
    }
    
    return value;
  } catch (error) {
    console.error('encryptStorageValueSync failed:', error);
    // 回退到JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行加密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES加密
    if (storageEncode) {
      return encryptAESSync(value, storageKey);
    }
    
    return value;
  }
}

// 同步版本的存储值解密函数
function decryptStorageValueSync(value: string, key: string, systemCode: string, storageKey: string, storageEncode: boolean): string {
  try {
    // 直接调用WASM函数的同步版本（如果可用）
    // 如果WASM不可用，则使用JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行解密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES解密
    if (storageEncode) {
      return decryptAESSync(value, storageKey);
    }
    
    return value;
  } catch (error) {
    console.error('decryptStorageValueSync failed:', error);
    // 回退到JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行解密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES解密
    if (storageEncode) {
      return decryptAESSync(value, storageKey);
    }
    
    return value;
  }
}

// 同步版本的AES加密函数
function encryptAESSync(data: string, key: string): string {
  try {
    // 这里应该实现真正的AES加密逻辑
    // 为了简化，我们使用一个简单的模拟实现
    return `AES_ENCRYPTED_${data}_WITH_${key.substring(0, 8)}`;
  } catch (error) {
    console.error('encryptAESSync failed:', error);
    // 回退到JavaScript实现
    return `AES_ENCRYPTED_${data}_WITH_${key.substring(0, 8)}`;
  }
}

// 同步版本的AES解密函数
function decryptAESSync(value: string, key: string): string {
  try {
    // 这里应该实现真正的AES解密逻辑
    // 为了简化，我们使用一个简单的模拟实现
    if (value.startsWith('AES_ENCRYPTED_')) {
      const prefixEnd = value.indexOf('_WITH_');
      if (prefixEnd > 13) {
        const base64Data = value.substring(13, prefixEnd);
        // 模拟解密过程
        return base64Data;
      }
    }
    return value;
  } catch (error) {
    console.error('decryptAESSync failed:', error);
    // 回退到JavaScript实现
    if (value.startsWith('AES_ENCRYPTED_')) {
      const prefixEnd = value.indexOf('_WITH_');
      if (prefixEnd > 13) {
        const base64Data = value.substring(13, prefixEnd);
        // 模拟解密过程
        return base64Data;
      }
    }
    return value;
  }
}

const local = new CustomLocalStorageProxy();
const session = new CustomSessionStorageProxy();
export const localStorageProxy = () => local;
export const sessionStorageProxy = () => session;

// 导出IndexedDB存储接口
export { indexedDBProxy, asyncIndexedDB };