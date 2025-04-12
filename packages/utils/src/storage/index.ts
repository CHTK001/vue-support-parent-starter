import { storageLocal, storageSession, type ProxyStorage } from "@pureadmin/utils";
import { responsiveStorageNameSpace } from "@repo/config";
import { getConfig } from "@repo/config";
import * as CryptoJs from "../crypto";
// 导入IndexedDB存储
import { indexedDBProxy, asyncIndexedDB } from "./indexedDB";
const config = getConfig();

/**
 * 本地存储和session存储操作封装工具函数
 */
class CustomSessionStorageProxy implements ProxyStorage {
  getItem<T>(key: string): T {
    if (!value || key.startsWith(responsiveStorageNameSpace())) {
      var value = storageSession().getItem(key);
      return value as T;
    }
    if (config.StorageEncode) {
      try {
        value = JSON.parse(CryptoJs.default.AES.decrypt(value, config.StorageKey));
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  setItem<T>(key: string, value: T) {
    if (config.StorageEncode && !key.startsWith(responsiveStorageNameSpace())) {
      value = CryptoJs.default.AES.encrypt(JSON.stringify(value), config.StorageKey);
    }
    storageSession().setItem(key, value);
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
      return null;
    }
    if (key.startsWith(responsiveStorageNameSpace())) {
      return storageLocal().getItem(key);
    }

    const newKey = getConfig().SystemCode + key;
    var value = storageLocal().getItem(newKey);
    if (config.StorageEncode) {
      try {
        value = JSON.parse(CryptoJs.default.AES.decrypt(value, config.StorageKey));
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  setItem<T>(key: string, value: T) {
    if (!key) {
      return null;
    }
    if (key.startsWith(responsiveStorageNameSpace())) {
      return storageLocal().setItem(key, value);
    }
    const newKey = getConfig().SystemCode + key;
    if (config.StorageEncode && !newKey.startsWith(responsiveStorageNameSpace())) {
      value = CryptoJs.default.AES.encrypt(JSON.stringify(value), config.StorageKey);
    }
    storageLocal().setItem(newKey, value);
  }

  removeItem(key: string) {
    const newKey = getConfig().SystemCode + key;
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
