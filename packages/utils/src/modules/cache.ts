/**
 * 通用缓存工具（@repo/utils）
 *
 * 带前缀的 localStorage / sessionStorage / cookie 便捷封装，供各主题/应用复用。
 */
import { browserLocalStorage, browserSessionStorage } from "./../storage";

/** 创建带前缀的存储封装 */
export function createPrefixedStore(prefix: string) {
  const keyWithPrefix = (key: string) => prefix + key;
  return {
    /** sessionStorage */
    session: {
      put: (key: string, value: any) => browserSessionStorage.setItem(keyWithPrefix(key), value),
      set: (key: string, value: any) => browserSessionStorage.setItem(keyWithPrefix(key), value),
      get: (key: string) => browserSessionStorage.getItem(keyWithPrefix(key)),
      remove: (key: string) => browserSessionStorage.removeItem(keyWithPrefix(key)),
      clear: () => window.sessionStorage.clear(),
      putJSON: (key: string, jsonValue: any) =>
        browserSessionStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue)),
      setJSON: (key: string, jsonValue: any) =>
        browserSessionStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue)),
      getJSON: (key: string) => JSON.parse(browserSessionStorage.getItem(keyWithPrefix(key)) as string),
    },
    /** localStorage */
    local: {
      put: (key: string, value: any) => browserLocalStorage.setItem(keyWithPrefix(key), value),
      set: (key: string, value: any) => browserLocalStorage.setItem(keyWithPrefix(key), value),
      get: (key: string) => browserLocalStorage.getItem(keyWithPrefix(key)),
      remove: (key: string) => browserLocalStorage.removeItem(keyWithPrefix(key)),
      clear: () => window.localStorage.clear(),
      putJSON: (key: string, jsonValue: any) =>
        browserLocalStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue)),
      setJSON: (key: string, jsonValue: any) =>
        browserLocalStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue)),
      getJSON: (key: string) => JSON.parse(browserLocalStorage.getItem(keyWithPrefix(key)) as string),
    },
    /** cookie */
    cookie: {
      put: (key: string, value: any) => {
        document.cookie = `${keyWithPrefix(key)}=${encodeURIComponent(value)};path=/`;
      },
      set: (key: string, value: any) => {
        document.cookie = `${keyWithPrefix(key)}=${encodeURIComponent(value)};path=/`;
      },
      get: (key: string) => {
        const match = document.cookie.match(new RegExp("(^| )" + keyWithPrefix(key) + "=([^;]*)"));
        return match ? decodeURIComponent(match[2]) : undefined;
      },
      remove: (key: string) => {
        document.cookie = `${keyWithPrefix(key)}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    },
  };
}

/** 清空整个 sessionStorage */
export function clearSessionStorage(): void {
  window.sessionStorage.clear();
}

/** 清空整个 localStorage */
export function clearLocalStorage(): void {
  window.localStorage.clear();
}
