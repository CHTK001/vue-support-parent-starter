import {
  storageLocal,
  storageSession,
  type ProxyStorage
} from "@pureadmin/utils";

import { getConfig } from "@/config";
import * as CryptoJs from "@/utils/crypto";

/**
 * 本地存储和session存储操作封装工具函数
 */
class CustomSessionStorageProxy implements ProxyStorage {
  getItem<T>(key: string): T {
    return storageSession().getItem(key);
  }

  setItem<T>(key: string, value: T) {
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
    const config = getConfig();
    var value = storageLocal().getItem(key);
    if (!value) {
      return value as T;
    }
    if (config.storageEncode) {
      try {
        value = JSON.parse(
          CryptoJs.default.AES.decrypt(value, config.storageKey)
        );
      } catch (error) {}
    }
    return value as T;
  }

  setItem<T>(key: string, value: T) {
    const config = getConfig();
    if (config.storageEncode) {
      value = CryptoJs.default.AES.encrypt(
        JSON.stringify(value),
        config.storageKey
      );
    }
    storageLocal().setItem(key, value);
  }

  removeItem(key: string) {
    storageLocal().removeItem(key);
  }

  clear() {
    storageLocal().clear();
  }
}

const local = new CustomLocalStorageProxy();
const session = new CustomSessionStorageProxy();
export const localStorageProxy = () => local;
export const sessionStorageProxy = () => session;
