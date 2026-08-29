/**
 * 令牌管理器（auth-core）
 *
 * 纯 TypeScript、无框架依赖的会话存储工具，负责 accessToken / refreshToken /
 * userInfo 的读写与清理。存储介质（localStorage / cookie / 内存等）由使用方
 * 通过 storage 参数注入，因此 Vue / React / Node 均可复用。
 *
 * 用法：
 *   const token = createTokenManager(storage, "auth");
 *   token.setSession(loginResult);
 *   token.getAccessToken();
 *   token.clearSession();
 */
import type { LoginResult, UserInfo } from "./types";

/**
 * 通用存储接口
 *
 * 抽象最小存储能力：读取（get）、写入（set）、删除（remove）。
 * 由调用方基于 localStorage / sessionStorage / cookie / 内存等实现。
 */
export interface KeyValueStorage {
  /** 读取指定 key 的原始值；不存在时返回 null */
  get(key: string): string | null;
  /** 写入指定 key 的原始值 */
  set(key: string, value: string): void;
  /** 删除指定 key */
  remove(key: string): void;
}

/** 令牌管理器实例的对外接口 */
export interface TokenManager {
  /** 获取 accessToken；未登录返回空字符串 */
  getAccessToken(): string;
  /** 获取 refreshToken；未登录返回空字符串 */
  getRefreshToken(): string;
  /** 获取用户信息；未登录返回 null */
  getUserInfo(): UserInfo | null;
  /** 写入会话（登录 / 刷新成功后调用，可整体写入 LoginResult） */
  setSession(result: Partial<LoginResult>): void;
  /** 清除会话（登出 / 会话失效时调用） */
  clearSession(): void;
  /** 是否已认证（存在 accessToken 即视为已登录） */
  isAuthenticated(): boolean;
}

/**
 * 创建令牌管理器
 *
 * @param storage 底层存储实现（get / set / remove）
 * @param keyPrefix key 前缀命名空间，避免多模块 / 多应用互相污染
 * @returns 令牌管理器实例
 */
export function createTokenManager(
  storage: KeyValueStorage,
  keyPrefix: string,
): TokenManager {
  /** 拼接带命名空间的存储 key */
  const key = (name: string): string => `${keyPrefix}.${name}`;

  /** accessToken 存储 key */
  const ACCESS_KEY = key("accessToken");
  /** refreshToken 存储 key */
  const REFRESH_KEY = key("refreshToken");
  /** userInfo 存储 key */
  const USERINFO_KEY = key("userInfo");

  return {
    getAccessToken(): string {
      return storage.get(ACCESS_KEY) ?? "";
    },

    getRefreshToken(): string {
      return storage.get(REFRESH_KEY) ?? "";
    },

    getUserInfo(): UserInfo | null {
      const raw = storage.get(USERINFO_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as UserInfo;
      } catch {
        // 解析失败时视为无效数据，静默返回 null
        return null;
      }
    },

    setSession(result: Partial<LoginResult>): void {
      if (result.accessToken !== undefined) {
        storage.set(ACCESS_KEY, result.accessToken);
      }
      if (result.refreshToken !== undefined) {
        storage.set(REFRESH_KEY, result.refreshToken);
      }
      if (result.userInfo !== undefined) {
        storage.set(USERINFO_KEY, JSON.stringify(result.userInfo));
      }
    },

    clearSession(): void {
      storage.remove(ACCESS_KEY);
      storage.remove(REFRESH_KEY);
      storage.remove(USERINFO_KEY);
    },

    isAuthenticated(): boolean {
      return Boolean(this.getAccessToken());
    },
  };
}
