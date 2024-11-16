import { storageLocal, storageSession, type ProxyStorage } from "@pureadmin/utils";
import { responsiveStorageNameSpace } from "@repo/config";
import { getConfig } from "@repo/config";
import * as CryptoJs from "../crypto";
const config = getConfig();

/**
 * 本地存储和session存储操作封装工具函数
 */
class CustomSessionStorageProxy implements ProxyStorage {
  getItem<T>(key: string): T {
    var value = storageSession().getItem(key);
    if (!value || key.startsWith(responsiveStorageNameSpace())) {
      return value as T;
    }
    if (config.storageEncode) {
      try {
        value = JSON.parse(CryptoJs.default.AES.decrypt(value, config.storageKey));
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  setItem<T>(key: string, value: T) {
    if (config.storageEncode && !key.startsWith(responsiveStorageNameSpace())) {
      value = CryptoJs.default.AES.encrypt(JSON.stringify(value), config.storageKey);
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
    if (key.startsWith(responsiveStorageNameSpace())) {
      return storageLocal().getItem(key);
    }

    const newKey = getConfig().systemCode + key;
    var value = storageLocal().getItem(newKey);
    if (config.storageEncode) {
      try {
        value = JSON.parse(CryptoJs.default.AES.decrypt(value, config.storageKey));
      } catch (error) {
        return value as T;
      }
    }
    return value as T;
  }

  setItem<T>(key: string, value: T) {
    const newKey = getConfig().systemCode + key;
    if (config.storageEncode && !newKey.startsWith(responsiveStorageNameSpace())) {
      value = CryptoJs.default.AES.encrypt(JSON.stringify(value), config.storageKey);
    }
    storageLocal().setItem(newKey, value);
  }

  removeItem(key: string) {
    const newKey = getConfig().systemCode + key;
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
