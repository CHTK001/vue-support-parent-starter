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
class CustomSessionStorageProxy {
  async setItem<T>(key: string, value: T): Promise<void> {
    const config = getConfig();
    let storageValue: any = value;
    if (config.StorageEncode && !key.startsWith(responsiveStorageNameSpace())) {
      // 使用异步方式处理存储值加密
      storageValue = await encryptStorageValue(JSON.stringify(value), key, config.SystemCode, config.StorageKey, config.StorageEncode);
    }
    storageSession().setItem(key, storageValue);
  }

  async getItem<T>(key: string): Promise<T> {
    if (!key || key.startsWith(responsiveStorageNameSpace())) {
      var value = storageSession().getItem(key);
      return value as T;
    }
    
    const config = getConfig();
    if (config.StorageEncode) {
      try {
        // 使用异步方式处理存储值解密
        const decryptedValue = await decryptStorageValue(value as string, key, config.SystemCode, config.StorageKey, config.StorageEncode);
        value = JSON.parse(decryptedValue);
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
 * 本地存储和session存储操作封装工具函数
 */
class CustomLocalStorageProxy {
  async setItem<T>(key: string, value: T): Promise<void> {
    if (!key) {
      return;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      storageLocal().setItem(key, value);
      return;
    }
    
    // 使用异步方式处理存储key加密
    const newKey = await encryptStorageKey(key, config.SystemCode);
    let storageValue: any = value;
    if (config.StorageEncode && !newKey.startsWith(responsiveStorageNameSpace())) {
      // 使用异步方式处理存储值加密
      storageValue = await encryptStorageValue(JSON.stringify(value), key, config.SystemCode, config.StorageKey, config.StorageEncode);
    }
    storageLocal().setItem(newKey, storageValue);
  }

  async getItem<T>(key: string): Promise<T> {
    if (!key) {
      return null as T;
    }
    
    const config = getConfig();
    if (key.startsWith(responsiveStorageNameSpace())) {
      return storageLocal().getItem(key) as T;
    }

    // 使用异步方式处理存储key加密
    const newKey = await encryptStorageKey(key, config.SystemCode);
    var value: any = storageLocal().getItem(newKey);
    if (config.StorageEncode) {
      try {
        // 使用异步方式处理存储值解密
        const decryptedValue = await decryptStorageValue(value as string, key, config.SystemCode, config.StorageKey, config.StorageEncode);
        value = JSON.parse(decryptedValue);
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  async removeItem(key: string) {
    const config = getConfig();
    // 使用异步方式处理存储key加密
    const newKey = await encryptStorageKey(key, config.SystemCode);
    storageLocal().removeItem(newKey);
  }

  clear() {
    storageLocal().clear();
  }
}

const local = new CustomLocalStorageProxy();
const session = new CustomSessionStorageProxy();
export const localStorageProxy = () => local;
export const sessionStorageProxy = () => session;

// 导出IndexedDB存储接口
export { indexedDBProxy, asyncIndexedDB };