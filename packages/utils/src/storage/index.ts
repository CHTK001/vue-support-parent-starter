import { storageLocal, storageSession, type ProxyStorage } from "@pureadmin/utils";
import { responsiveStorageNameSpace } from "@repo/config";
import { getConfig } from "@repo/config";
// 导入WASM版本的加密函数
import { encryptStorageKey, encryptStorageValue, decryptStorageValue } from "@repo/codec-wasm";
// 导入IndexedDB存储
import { indexedDBProxy, asyncIndexedDB } from "./indexedDB";

/**
 * 本地存储和session存储操作封装工具函数（同步版本）
 * 注意：同步版本不支持加密功能，如需加密请使用异步版本
 */
class SyncSessionStorageProxy {
  setItem<T>(key: string, value: T): void {
    const config = getConfig();
    let storageValue: any = value;
    if (config.StorageEncode && !key.startsWith(responsiveStorageNameSpace())) {
      try {
        // 同步方式处理存储值加密（简化处理，不使用WASM加密）
        storageValue = JSON.stringify(value);
      } catch (error) {
        console.error("存储值序列化失败:", error);
      }
    }
    storageSession().setItem(key, storageValue);
  }

  getItem<T>(key: string): T {
    if (!key || key.startsWith(responsiveStorageNameSpace())) {
      const value = storageSession().getItem(key);
      return value as T;
    }
    
    const config = getConfig();
    const value = storageSession().getItem(key);
    if (config.StorageEncode) {
      try {
        // 同步方式处理存储值解密（简化处理，不使用WASM解密）
        return JSON.parse(value as string) as T;
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  removeItem(key: string) {
    storageSession().removeItem(key);
  }

  clear() {
    storageSession().clear();
  }
}

/**
 * 本地存储和session存储操作封装工具函数（同步版本）
 * 注意：同步版本不支持加密功能，如需加密请使用异步版本
 */
class SyncLocalStorageProxy {
  setItem<T>(key: string, value: T): void {
    if (!key) {
      return;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      storageLocal().setItem(key, value);
      return;
    }
    
    // 同步方式处理存储
    let storageValue: any = value;
    if (config.StorageEncode && !key.startsWith(responsiveStorageNameSpace())) {
      try {
        // 同步方式处理存储值加密（简化处理，不使用WASM加密）
        storageValue = JSON.stringify(value);
      } catch (error) {
        console.error("存储值序列化失败:", error);
      }
    }
    storageLocal().setItem(key, storageValue);
  }

  getItem<T>(key: string): T {
    if (!key) {
      return null as T;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      return storageLocal().getItem(key) as T;
    }

    const value = storageLocal().getItem(key);
    if (config.StorageEncode) {
      try {
        // 同步方式处理存储值解密（简化处理，不使用WASM解密）
        return JSON.parse(value as string) as T;
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  removeItem(key: string) {
    const config = getConfig();
    storageLocal().removeItem(key);
  }

  clear() {
    storageLocal().clear();
  }
}

/**
 * 本地存储和session存储操作封装工具函数（异步版本，支持加密）
 * 使用WASM进行数据加密和解密，提供更高的安全性
 */
class CustomSessionStorageProxy {
  setItem<T>(key: string, value: T): void {
    if (!key) {
      return;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      storageSession().setItem(key, value);
      return;
    }
    
    // 使用同步方式处理存储
    let storageValue: any = value;
    if (config.StorageEncode && !key.startsWith(responsiveStorageNameSpace())) {
      try {
        // 使用同步方式处理存储值加密
        storageValue = encryptStorageValue(JSON.stringify(value), key, config.SystemCode, config.StorageKey, config.StorageEncode);
      } catch (error) {
        console.error("存储值加密失败:", error);
        storageValue = JSON.stringify(value);
      }
    }
    storageSession().setItem(key, storageValue);
  }

  getItem<T>(key: string): T {
    if (!key || key.startsWith(responsiveStorageNameSpace())) {
      const value = storageSession().getItem(key);
      return value as T;
    }
    
    const config = getConfig();
    const value = storageSession().getItem(key);
    if (config.StorageEncode) {
      try {
        // 使用同步方式处理存储值解密
        const decryptedValue = decryptStorageValue(value as string, key, config.SystemCode, config.StorageKey, config.StorageEncode);
        return JSON.parse(decryptedValue) as T;
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  removeItem(key: string) {
    storageSession().removeItem(key);
  }

  clear() {
    storageSession().clear();
  }
}

/**
 * 本地存储和session存储操作封装工具函数（异步版本，支持加密）
 * 使用WASM进行数据加密和解密，提供更高的安全性
 */
class CustomLocalStorageProxy {
  setItem<T>(key: string, value: T): void {
    if (!key) {
      return;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      storageLocal().setItem(key, value);
      return;
    }
    
    // 使用同步方式处理存储key加密
    const newKey = encryptStorageKey(key, config.SystemCode);
    
    let storageValue: any = value;
    if (config.StorageEncode) {
      try {
        // 使用同步方式处理存储值加密
        storageValue = encryptStorageValue(JSON.stringify(value), key, config.SystemCode, config.StorageKey, config.StorageEncode);
      } catch (error) {
        console.error("存储值加密失败:", error);
        storageValue = JSON.stringify(value);
      }
    }
    storageLocal().setItem(newKey, storageValue);
  }

  getItem<T>(key: string): T {
    if (!key) {
      return null as T;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      return storageLocal().getItem(key) as T;
    }

    // 使用同步方式处理存储key加密
    let newKey: string;
    try {
      newKey = encryptStorageKey(key, config.SystemCode);
    } catch (error) {
      console.error("存储key加密失败:", error);
      newKey = key;
    }
    
    const value = storageLocal().getItem(newKey);
    if (config.StorageEncode) {
      try {
        // 使用同步方式处理存储值解密
        const decryptedValue = decryptStorageValue(value as string, key, config.SystemCode, config.StorageKey, config.StorageEncode);
        return JSON.parse(decryptedValue) as T;
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  removeItem(key: string) {
    if (!key) {
      return;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      storageLocal().removeItem(key);
      return;
    }
    
    // 使用同步方式处理存储key加密
    const newKey = encryptStorageKey(key, config.SystemCode);
    storageLocal().removeItem(newKey);
  }

  clear() {
    storageLocal().clear();
  }
}

const local = new CustomLocalStorageProxy();
const session = new CustomSessionStorageProxy();
const syncLocal = new SyncLocalStorageProxy();
const syncSession = new SyncSessionStorageProxy();

/**
 * 异步本地存储代理，支持数据加密
 * 返回Promise，需要使用await或.then()处理
 * @example
 * // 存储数据
 * await localStorageProxy().setItem('key', 'value');
 * // 读取数据
 * const value = await localStorageProxy().getItem('key');
 */
export const localStorageProxy = () => local;

/**
 * 异步会话存储代理，支持数据加密
 * 返回Promise，需要使用await或.then()处理
 * @example
 * // 存储数据
 * await sessionStorageProxy().setItem('key', 'value');
 * // 读取数据
 * const value = await sessionStorageProxy().getItem('key');
 */
export const sessionStorageProxy = () => session;

/**
 * 同步本地存储代理，不支持数据加密
 * 直接返回值，无需使用await
 * @example
 * // 存储数据
 * syncLocalStorageProxy().setItem('key', 'value');
 * // 读取数据
 * const value = syncLocalStorageProxy().getItem('key');
 */
export const syncLocalStorageProxy = () => syncLocal;

/**
 * 同步会话存储代理，不支持数据加密
 * 直接返回值，无需使用await
 * @example
 * // 存储数据
 * syncSessionStorageProxy().setItem('key', 'value');
 * // 读取数据
 * const value = syncSessionStorageProxy().getItem('key');
 */
export const syncSessionStorageProxy = () => syncSession;

// 导出IndexedDB存储接口
export { indexedDBProxy, asyncIndexedDB };