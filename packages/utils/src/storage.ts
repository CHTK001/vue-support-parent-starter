/**
 * storage 工具 —— 封装 localStorage 与 sessionStorage
 *
 * 特性：
 * - 自动 JSON 序列化 / 反序列化
 * - 可选命名空间前缀，避免不同模块 key 冲突
 * - 可选过期时间（TTL，单位：毫秒；0 或未传 = 不过期）
 * - 同一套 API 操作 local / session 两种存储
 */

export interface StorageOptions {
  /** 命名空间前缀，默认 ""（不带前缀） */
  prefix?: string;
  /** 过期时间（毫秒），默认不过期 */
  expires?: number;
}

/** 写入存储的值类型 */
export type StorageValue = string | number | boolean | null | object;

/** 浏览器 Storage 的最小接口（便于测试 mock） */
export interface StorageLike {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
}

/** 过期标记 */
const EXPIRES_KEY_SUFFIX = "__expires__";

export class StorageWrapper {
  private readonly prefix: string;

  constructor(
    private readonly store: StorageLike,
    private readonly options: StorageOptions = {},
  ) {
    this.prefix = options.prefix ?? "";
  }

  /** 带前缀的完整 key */
  private buildKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  /**
   * 写入（自动 JSON 序列化，可选 TTL）
   * @returns 写入是否成功（异常时返回 false，如隐私模式）
   */
  set<T extends StorageValue>(key: string, value: T, expires?: number): boolean {
    try {
      const fullKey = this.buildKey(key);
      this.store.setItem(fullKey, JSON.stringify(value));
      const ttl = expires ?? this.options.expires;
      if (ttl) {
        this.store.setItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`, String(Date.now() + ttl));
      } else {
        this.store.removeItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取（自动 JSON 反序列化，已过期返回 null 并清除）
   * @param defaultValue 不存在、已过期或解析失败时返回的默认值
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    const fullKey = this.buildKey(key);
    try {
      const raw = this.store.getItem(fullKey);
      if (raw === null || raw === undefined) return defaultValue;

      // 过期检查
      const expiresAt = Number(this.store.getItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`));
      if (expiresAt && Date.now() > expiresAt) {
        this.remove(key);
        return defaultValue;
      }

      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  /** 删除 */
  remove(key: string): void {
    const fullKey = this.buildKey(key);
    this.store.removeItem(fullKey);
    this.store.removeItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`);
  }

  /** 是否存在（未过期才算存在） */
  has(key: string): boolean {
    const fullKey = this.buildKey(key);
    const raw = this.store.getItem(fullKey);
    if (raw === null || raw === undefined) return false;
    const expiresAt = Number(this.store.getItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`));
    return !(expiresAt && Date.now() > expiresAt);
  }

  /** 清空当前命名空间下的所有 key */
  clear(): void {
    const prefix = this.prefix ? `${this.prefix}:` : "";
    const keysToRemove: string[] = [];
    for (let i = 0; i < this.store.length; i++) {
      const storeKey = this.store.key(i);
      if (storeKey && storeKey.startsWith(prefix)) {
        keysToRemove.push(storeKey);
      }
    }
    keysToRemove.forEach((k) => this.store.removeItem(k));
  }

  /** 当前命名空间下的业务 key 列表（不含内部过期元数据 key） */
  keys(): string[] {
    const prefix = this.prefix ? `${this.prefix}:` : "";
    const result: string[] = [];
    for (let i = 0; i < this.store.length; i++) {
      const storeKey = this.store.key(i);
      if (
        storeKey &&
        storeKey.startsWith(prefix) &&
        !storeKey.endsWith(EXPIRES_KEY_SUFFIX)
      ) {
        result.push(storeKey.slice(prefix.length));
      }
    }
    return result;
  }
}

/** SSR/Node 环境下使用的空实现，避免模块加载时访问 window 崩溃 */
export const emptyStorage: StorageLike = {
  length: 0,
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  key: () => null,
};

/** 浏览器 localStorage（SSR/Node 下为安全的空实现） */
export const browserLocalStorage: StorageLike =
  typeof window !== "undefined" ? window.localStorage : emptyStorage;

/** 浏览器 sessionStorage（SSR/Node 下为安全的空实现） */
export const browserSessionStorage: StorageLike =
  typeof window !== "undefined" ? window.sessionStorage : emptyStorage;

/** localStorage 实例 */
export const localStore = new StorageWrapper(browserLocalStorage);

/** sessionStorage 实例 */
export const sessionStore = new StorageWrapper(browserSessionStorage);

/** 创建带命名空间 / 过期时间的独立实例 */
export function createStorage(
  store: StorageLike,
  options?: StorageOptions,
): StorageWrapper {
  return new StorageWrapper(store, options);
}
