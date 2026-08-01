/**
 * koi 缓存工具（基于 @repo/utils storage + @repo/config CACHE_PREFIX）
 *
 * 提供带 koi- 前缀的 localStorage / sessionStorage / cookie 便捷封装。
 */
import { CACHE_PREFIX } from "@repo/config";
import { browserLocalStorage, browserSessionStorage } from "@repo/utils";
import useUserStore from "@repo/pinia/modules/user";

/** 读取用户 token（从 pinia user store，见 @repo/pinia） */
export const getToken = () => {
  try {
    return useUserStore().getAccessToken() ?? "";
  } catch {
    return "";
  }
};

/** 带前缀 key */
const keyWithPrefix = (key: string) => CACHE_PREFIX + key;

/** sessionStorage 便捷封装 */
export const koiSessionStorage = {
  put(key: string, value: any) {
    browserSessionStorage.setItem(keyWithPrefix(key), value);
  },
  set(key: string, value: any) {
    browserSessionStorage.setItem(keyWithPrefix(key), value);
  },
  get(key: string) {
    return browserSessionStorage.getItem(keyWithPrefix(key));
  },
  remove(key: string) {
    browserSessionStorage.removeItem(keyWithPrefix(key));
  },
  clear() {
    window.sessionStorage.clear();
  },
  putJSON(key: string, jsonValue: any) {
    browserSessionStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue));
  },
  setJSON(key: string, jsonValue: any) {
    browserSessionStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue));
  },
  getJSON(key: string) {
    const raw = browserSessionStorage.getItem(keyWithPrefix(key));
    return JSON.parse(raw as string);
  },
};

/** localStorage 便捷封装 */
export const koiLocalStorage = {
  put(key: string, value: any) {
    browserLocalStorage.setItem(keyWithPrefix(key), value);
  },
  set(key: string, value: any) {
    browserLocalStorage.setItem(keyWithPrefix(key), value);
  },
  get(key: string) {
    return browserLocalStorage.getItem(keyWithPrefix(key));
  },
  remove(key: string) {
    browserLocalStorage.removeItem(keyWithPrefix(key));
  },
  clear() {
    window.localStorage.clear();
  },
  putJSON(key: string, jsonValue: any) {
    browserLocalStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue));
  },
  setJSON(key: string, jsonValue: any) {
    browserLocalStorage.setItem(keyWithPrefix(key), JSON.stringify(jsonValue));
  },
  getJSON(key: string) {
    const raw = browserLocalStorage.getItem(keyWithPrefix(key));
    return JSON.parse(raw as string);
  },
};

/** cookie 便捷封装（原生，无 js-cookie 依赖） */
export const koiCookie = {
  put(key: string, value: any) {
    document.cookie = `${keyWithPrefix(key)}=${encodeURIComponent(value)};path=/`;
  },
  set(key: string, value: any) {
    document.cookie = `${keyWithPrefix(key)}=${encodeURIComponent(value)};path=/`;
  },
  get(key: string) {
    const match = document.cookie.match(
      new RegExp("(^| )" + keyWithPrefix(key) + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[2]) : undefined;
  },
  remove(key: string) {
    document.cookie = `${keyWithPrefix(key)}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};
