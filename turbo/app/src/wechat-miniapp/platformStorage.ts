/**
 * @repo/app/wechat-miniapp —— 小程序存储适配
 *
 * <p>把 uni storage 包装成与 {@code @repo/utils StorageWrapper} 同语义的实例：
 * 命名空间前缀、JSON 序列化、TTL 过期。不提供加密与按用户隔离——小程序存储
 * 本身已按小程序沙箱隔离，加密需要额外 crypto 依赖（包体代价高），本端用不到。</p>
 *
 * <p><b>为什么不直接 import {@code @repo/utils} 的 StorageWrapper：</b>
 * 其主入口连带 axios / dexie / worker 等浏览器依赖，微信小程序无法运行。</p>
 */
import type { MpStorage, MpStorageLike, MpStorageOptions } from "./types";
import { createUniStorageLike, getUniRuntime } from "./uni";

/** 过期标记后缀（与 @repo/utils StorageWrapper 一致） */
const EXPIRES_KEY_SUFFIX = "__expires__";

/**
 * 创建小程序存储实例。
 *
 * @param store   底层存储后端；缺省为 uni storage（延迟到首次读写才取运行时）
 * @param options 命名空间配置
 */
export function createMpStorage(
  store?: MpStorageLike,
  options: MpStorageOptions = {},
): MpStorage {
  const prefix = options.prefix ?? "";

  /** 底层后端（首次访问时创建，避免模块加载期就要求 uni 已就绪） */
  let backend: MpStorageLike | null = store ?? null;
  const backendOf = (): MpStorageLike => {
    if (!backend) backend = createUniStorageLike();
    return backend;
  };

  const buildKey = (key: string): string => (prefix ? `${prefix}:${key}` : key);

  return {
    get<T = unknown>(key: string, defaultValue?: T): T | undefined {
      const fullKey = buildKey(key);
      const store0 = backendOf();
      const expiresRaw = store0.getItem(fullKey + EXPIRES_KEY_SUFFIX);
      if (expiresRaw) {
        const expires = Number(expiresRaw);
        if (Number.isFinite(expires) && expires > 0 && Date.now() > expires) {
          store0.removeItem(fullKey);
          store0.removeItem(fullKey + EXPIRES_KEY_SUFFIX);
          return defaultValue;
        }
      }
      const raw = store0.getItem(fullKey);
      if (raw === null) return defaultValue;
      try {
        const value = JSON.parse(raw) as T;
        return value === undefined || value === null ? defaultValue : value;
      } catch {
        return defaultValue;
      }
    },

    set(key: string, value: unknown, expires?: number): void {
      const fullKey = buildKey(key);
      const store0 = backendOf();
      try {
        store0.setItem(fullKey, JSON.stringify(value));
        if (expires && expires > 0) {
          store0.setItem(fullKey + EXPIRES_KEY_SUFFIX, String(Date.now() + expires));
        } else {
          store0.removeItem(fullKey + EXPIRES_KEY_SUFFIX);
        }
      } catch {
        // 存储配额异常（小程序单 key / 总量限制）：静默失败，不阻塞主流程
      }
    },

    remove(key: string): void {
      const fullKey = buildKey(key);
      const store0 = backendOf();
      store0.removeItem(fullKey);
      store0.removeItem(fullKey + EXPIRES_KEY_SUFFIX);
    },

    clear(): void {
      const store0 = backendOf();
      if (store0.clear) {
        store0.clear();
        return;
      }
      // 无 clear 能力时按前缀逐条删除（兼容自定义后端）
      try {
        const info = getUniRuntime().getStorageInfoSync?.();
        const keys = Array.isArray(info?.keys) ? info!.keys! : [];
        for (const key of keys) {
          if (!prefix || key.startsWith(prefix)) store0.removeItem(key);
        }
      } catch {
        // 忽略
      }
    },
  };
}
