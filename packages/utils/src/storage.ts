/**
 * storage 工具 —— 封装 localStorage 与 sessionStorage
 *
 * 特性：
 * - 自动 JSON 序列化 / 反序列化
 * - 可选命名空间前缀，避免不同模块 key 冲突
 * - 可选过期时间（TTL，单位：毫秒；0 或未传 = 不过期）
 * - 同一套 API 操作 local / session 两种存储
 * - 加解密由 storage 内部处理：读 config.storage，encode 开启且 key 非空时自动加密，
 *   调用方无需感知（token / 菜单 / 布局等所有读写方自动走同一加密规则）
 */

import type { StorageLike, StorageOptions, StorageValue } from "./types";
import { getConfig } from "@repo/config";
import { encrypt as aesEncrypt, decrypt as aesDecrypt } from "./modules/aes";

/** 过期标记 */
const EXPIRES_KEY_SUFFIX = "__expires__";

export class StorageWrapper {
  private readonly prefix: string;
  private readonly noPrefixKeys: string[];
  private readonly userScopeKeys: string[];
  /** userId getter（运行时调用，避免循环依赖） */
  private readonly resolveUserId?: () => string;
  /** 显式传入的 encode 覆盖（优先级最高）；未传时实时从 config.storage.encode 读 */
  private readonly encodeOverride?: boolean;
  /** 显式注入的加解密函数（用于 wasm 等外部算法） */
  private readonly encodeFnOverride?: (plain: string) => string;
  private readonly decodeFnOverride?: (encrypted: string) => string;

  constructor(
    private readonly store: StorageLike,
    private readonly options: StorageOptions = {},
  ) {
    this.prefix = options.prefix ?? "";
    this.noPrefixKeys = options.noPrefixKeys ?? [];
    this.userScopeKeys = options.userScopeKeys ?? [];
    this.resolveUserId = options.resolveUserId;
    this.encodeOverride = options.encode;
    this.encodeFnOverride = options.encodeFn;
    this.decodeFnOverride = options.decodeFn;
  }

  /**
   * 实时读取加解密开关。
   * 优先级：显式 encodeOverride > config.storage.encode（每次实时读，响应 yaml/远程/热更新）
   * 这样 piniaStorage / tokenStorage / buildStorage 等实例无需重建，
   * yaml 里改了 encode 后下次 set/get 自动走新规则。
   */
  private get encode(): boolean {
    if (this.encodeOverride !== undefined) return this.encodeOverride;
    return getConfig()?.storage?.encode ?? false;
  }

  /**
   * 实时读取加密函数。
   * 显式注入优先；否则按当前 encode + config.storage.key 内部用 AES。
   * decode 同理（对称封装）。
   */
  private get encodeFn(): ((plain: string) => string) | undefined {
    if (this.encodeFnOverride) return this.encodeFnOverride;
    if (this.encode) {
      const key = getConfig()?.storage?.key;
      if (key) return (plain: string) => aesEncrypt(plain, key);
    }
    return undefined;
  }

  private get decodeFn(): ((encrypted: string) => string) | undefined {
    if (this.decodeFnOverride) return this.decodeFnOverride;
    if (this.encode) {
      const key = getConfig()?.storage?.key;
      if (key) return (encrypted: string) => aesDecrypt(encrypted, key);
    }
    return undefined;
  }

  /** 写入前编码（JSON 序列化 + 可选加密）；加密失败降级明文，防止写入异常导致系统崩溃 */
  private encodeValue(value: unknown): string {
    const json = JSON.stringify(value);
    if (this.encode && this.encodeFn) {
      try {
        return this.encodeFn(json);
      } catch {
        // 加密失败（密钥/算法异常等）：降级明文存储，保证功能可用
        return json;
      }
    }
    return json;
  }

  /**
   * 读取后解码（可选解密 + JSON 反序列化）
   * 解密失败自动降级：先按明文 JSON 尝试，仍失败返回原文串，防止系统崩溃。
   */
  private decodeValue(raw: string): unknown {
    if (this.encode && this.decodeFn) {
      try {
        return JSON.parse(this.decodeFn(raw));
      } catch {
        // 解密失败（旧明文数据 / 密钥变更 / 密文损坏）：尝试按明文 JSON 解析
        try {
          return JSON.parse(raw);
        } catch {
          // 两者均失败：返回原始字符串，交由调用方处理（get 外层 catch 返回默认值）
          return raw;
        }
      }
    }
    return JSON.parse(raw);
  }

  /**
   * 带前缀的完整 key
   *   - noPrefixKeys 列表内的 key：不加前缀（跨应用共享）
   *   - userScopeKeys 列表内的 key：自动注入当前 userId（按账号隔离）
   *   - 其余：${prefix}:${key}
   */
  private buildKey(key: string): string {
    if (this.noPrefixKeys.includes(key)) {
      return key;
    }
    if (this.userScopeKeys.includes(key) && this.resolveUserId) {
      const uid = this.resolveUserId();
      return this.prefix ? `${this.prefix}:${uid}:${key}` : `${uid}:${key}`;
    }
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  /** 是否为不添加前缀的 key */
  private isNoPrefixKey(key: string): boolean {
    return this.noPrefixKeys.includes(key);
  }

  /**
   * 写入（自动 JSON 序列化，可选加密，可选 TTL）
   * @returns 写入是否成功（异常时返回 false，如隐私模式）
   */
  set<T extends StorageValue>(key: string, value: T, expires?: number): boolean {
    try {
      const fullKey = this.buildKey(key);
      this.store.setItem(fullKey, this.encodeValue(value));
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
   * 读取（自动解密与 JSON 反序列化，已过期返回 null 并清除）
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

      return this.decodeValue(raw) as T;
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
      if (!storeKey) continue;
      if (storeKey.startsWith(prefix) || this.isNoPrefixKey(storeKey)) {
        keysToRemove.push(storeKey);
      }
    }
    keysToRemove.forEach((k) => this.store.removeItem(k));
  }

  /**
   * 清空用户级存储（登录跳转时调用）
   * 保留 noPrefixKeys（如 sys-fingerprint），删除所有带前缀的用户/应用级 key
   *
   * @param keepKeyFragments 需要保留的 key 片段（如 login.remember），
   *                         用于登录页刷新时不被清掉「记住账号密码」
   */
  clearUserStorage(keepKeyFragments: string[] = []): void {
    const prefix = this.prefix ? `${this.prefix}:` : "";
    for (let i = 0; i < this.store.length; i++) {
      const storeKey = this.store.key(i);
      if (!storeKey) continue;
      if (keepKeyFragments.some((fragment) => fragment && storeKey.includes(fragment))) {
        continue;
      }
      if (storeKey.startsWith(prefix)) {
        this.store.removeItem(storeKey);
        const expiresKey = storeKey + EXPIRES_KEY_SUFFIX;
        this.store.removeItem(expiresKey);
      }
    }
  }

  /** 当前命名空间下的业务 key 列表（不含内部过期元数据 key） */
  keys(): string[] {
    const prefix = this.prefix ? `${this.prefix}:` : "";
    const result: string[] = [];
    for (let i = 0; i < this.store.length; i++) {
      const storeKey = this.store.key(i);
      if (
        storeKey &&
        !storeKey.endsWith(EXPIRES_KEY_SUFFIX) &&
        (storeKey.startsWith(prefix) || this.isNoPrefixKey(storeKey))
      ) {
        result.push(storeKey.slice(prefix.length));
      }
    }
    return result;
  }

  /** StorageLike 兼容接口：加密读取（返回 JSON 字符串） */
  getItem(key: string): string | null {
    const val = this.get(key);
    return val === null ? null : JSON.stringify(val);
  }

  /** StorageLike 兼容接口：加密写入（接收 JSON 字符串） */
  setItem(key: string, value: string): void {
    try {
      this.set(key, JSON.parse(value));
    } catch {
      this.set(key, value);
    }
  }

  /** StorageLike 兼容接口：删除 */
  removeItem(key: string): void {
    this.remove(key);
  }

  /** StorageLike 兼容接口：按索引获取 key */
  key(index: number): string | null {
    const all = this.keys();
    return all[index] ?? null;
  }

  /** StorageLike 兼容接口：长度 */
  get length(): number {
    return this.keys().length;
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
