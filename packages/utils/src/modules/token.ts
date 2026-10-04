/**
 * token 统一读写（@repo/utils）
 *
 * accessToken / refreshToken / userInfo 都由框架写入框架 storage（StorageWrapper），
 * 本模块复用框架 storage 读写，供 SSE、HTTP、TokenManager 等使用，不依赖 core。
 *
 * 同时提供用户级缓存读写（菜单 / 布局），采用 cache-aside 策略：
 * 调用方先读缓存（getMenuCache / getLayoutCache），有就直接返回，
 * 没有再请求接口并写回（setMenuCache / setLayoutCache）。登出 / 强制重登时
 * 调用 clearAuthCache() 静默清除，避免跨账号串数据。
 */
import { getConfig, CACHE_PREFIX } from "@repo/config";
import { browserLocalStorage, createStorage } from "./../storage";
import type { StorageValue } from "./../types";

/** 用户信息存储 key（与 core/permission 的 USER_INFO_KEY 保持一致） */
export const USER_INFO_KEY = "userInfo";
/** 用户远程菜单缓存 key */
export const MENU_CACHE_KEY = "menu";
/** 用户布局缓存 key */
export const LAYOUT_CACHE_KEY = "layout";

/** 当前生效的 token storage（懒初始化，key 规则与写入方一致） */
let tokenStorage: ReturnType<typeof createStorage> | null = null;

/**
 * 解析当前登录 userId（未登录 / 解析失败 → "anonymous"）
 *
 * 与 config.getStorageKey 内部的 getCurrentUserId 实现一致，避免循环。
 */
function resolveUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    const data = getUserInfo() as { userId?: string | number; sysUserId?: string | number } | null;
    if (!data) return "anonymous";
    const id = data?.userId ?? data?.sysUserId;
    if (id === undefined || id === null || id === "") return "anonymous";
    return String(id);
  } catch {
    return "anonymous";
  }
}

/**
 * 构建与写入方一致的框架 storage 实例
 *
 * 使用 config.storage 的前缀与 noPrefixKeys 规则。
 * 加解密由 StorageWrapper 内部实时从 getConfig() 读取（见 storage.ts），
 * 无需在 setConfig 后重建实例。
 */
function getTokenStorage() {
  if (tokenStorage) return tokenStorage;
  const cfg = getConfig();
  const prefix = cfg.storage?.prefix || cfg.app?.systemCode || "system";
  tokenStorage = createStorage(browserLocalStorage, {
    prefix,
    noPrefixKeys: cfg.storage?.noPrefixKeys,
    userScopeKeys: cfg.storage?.userScopeKeys,
    resolveUserId,
  });
  return tokenStorage;
}

/**
 * 通用框架 storage（与 token / userInfo / 菜单写入方完全一致）
 *
 * 所有前端缓存读写都应使用本实例，禁止直接调用 localStorage：
 * 前缀 / noPrefixKeys / userScopeKeys / 加解密均实时从 getConfig() 获取，
 * 避免直接用 localStorage 造成加密、前缀、按账号隔离规则不统一。
 */
export function getFrameworkStorage() {
  return getTokenStorage();
}

/** accessToken 存储 key */
function accessKey(): string {
  const cfg = getConfig();
  return cfg.token?.accessTokenKey || "accessToken";
}

/** refreshToken 存储 key */
function refreshKey(): string {
  const cfg = getConfig();
  return cfg.token?.refreshTokenKey || "refreshToken";
}

/**
 * 代入令牌的 sessionStorage key。
 *
 * 刻意不走框架 storage（localStorage）：代入令牌是按标签页临时借用的身份，
 * 而框架 storage 是全标签共享的，写进去会覆盖管理员自己标签页里的登录态 ——
 * 管理员点一下「代入该学生」，自己的后台就在下一次请求时变成学生身份了。
 * sessionStorage 天然按标签页隔离，正好承载这种「只在本页生效」的凭据。
 */
const IMPERSONATE_TOKEN_KEY = "__impersonateAccessToken__";

/**
 * 写入代入令牌（仅本标签页生效）。
 *
 * @param token 管理员代入他人身份后拿到的临时令牌
 */
export function setImpersonateToken(token: string): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(IMPERSONATE_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

/**
 * 读取代入令牌。
 *
 * @returns 本标签页的代入令牌；没有则返回空串
 */
export function getImpersonateToken(): string {
  try {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(IMPERSONATE_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

/** 清除本标签页的代入令牌（退出代入 / 完整登出时调用） */
export function clearImpersonateToken(): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(IMPERSONATE_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 获取当前 accessToken
 *
 * 从框架 storage 读取（key = tokenConfig.accessTokenKey，默认 "accessToken"）。
 * 代入令牌优先：它只在本标签页存在，取到就说明本页正以被代入的身份工作。
 */
export function getAccessToken(): string {
  try {
    if (typeof window === "undefined") return "";
    const impersonate = getImpersonateToken();
    if (impersonate) return impersonate;
    const token = getTokenStorage().get<string>(accessKey()) ?? "";
    if (token) return token;
    return "";
  } catch {
    return "";
  }
}

/** 写入 accessToken（框架 storage） */
export function setAccessToken(token: string): void {
  try {
    if (typeof window === "undefined") return;
    getTokenStorage().set(accessKey(), token);
  } catch {
    /* ignore */
  }
}

/** 获取 refreshToken（框架 storage） */
export function getRefreshToken(): string {
  try {
    if (typeof window === "undefined") return "";
    // 代入令牌同样优先：否则代入页续期时会拿管理员的 refreshToken 换回管理员令牌，
    // 一次刷新就把「代入」静默变成了「本人」
    const impersonate = getImpersonateToken();
    if (impersonate) return impersonate;
    return getTokenStorage().get<string>(refreshKey()) ?? "";
  } catch {
    return "";
  }
}

/** 写入 refreshToken（框架 storage） */
export function setRefreshToken(token: string): void {
  try {
    if (typeof window === "undefined") return;
    getTokenStorage().set(refreshKey(), token);
  } catch {
    /* ignore */
  }
}

/**
 * 获取用户信息（框架 storage，key = "userInfo"）
 */
export function getUserInfo<T = Record<string, unknown>>(): T | null {
  try {
    if (typeof window === "undefined") return null;
    return getTokenStorage().get<T>(USER_INFO_KEY);
  } catch {
    return null;
  }
}

/** 写入用户信息（框架 storage，key = "userInfo"） */
export function setUserInfo(userInfo: StorageValue): void {
  try {
    if (typeof window === "undefined") return;
    getTokenStorage().set(USER_INFO_KEY, userInfo);
  } catch {
    /* ignore */
  }
}

// ==================== 用户级缓存（cache-aside：先读缓存，没有再请求并写回） ====================

/**
 * 写布局缓存，**返回是否真的写成功**。
 *
 * <p>{@link setLayoutCache} 的签名是 void，内部 {@code catch { /* ignore *\/ }}
 * 把 {@code StorageWrapper.set()} 的 boolean 丢掉了，调用方无法区分
 * 「写成功」与「配额满 / 隐私模式 / 存储被禁用」。home 的布局保存原先就吃了
 * 这个亏：写失败时界面照样提示「布局已保存」，用户刷新后布局全无，且无任何线索。
 *
 * <p>与 {@link setLayoutCache} 的区别仅在于把成功与否透出给调用方，
 * 两者写入的键与编码规则完全一致（同一个 tokenStorage）。</p>
 *
 * @param layout 要缓存的布局
 * @returns 写入是否成功
 */
export function writeLayoutCache(layout: StorageValue): boolean {
  try {
    if (typeof window === "undefined") return false;
    return getTokenStorage().set(LAYOUT_CACHE_KEY, layout);
  } catch {
    return false;
  }
}

/** 读取用户远程菜单缓存（按 userId 隔离，由 createStorage 内部 buildKey 自动注入） */
export function getMenuCache<T extends StorageValue = unknown[]>() {
  try {
    if (typeof window === "undefined") return null;
    return getTokenStorage().get<T>(MENU_CACHE_KEY);
  } catch {
    return null;
  }
}

/** 写入用户远程菜单缓存（拉取成功后调用） */
export function setMenuCache(menu: StorageValue): void {
  try {
    if (typeof window === "undefined") return;
    getTokenStorage().set(MENU_CACHE_KEY, menu);
  } catch {
    /* ignore */
  }
}

/** 读取用户布局缓存（按 userId 隔离） */
export function getLayoutCache<T extends StorageValue = Record<string, unknown>>() {
  try {
    if (typeof window === "undefined") return null;
    return getTokenStorage().get<T>(LAYOUT_CACHE_KEY);
  } catch {
    return null;
  }
}

/** 写入用户布局缓存（拉取成功后调用） */
export function setLayoutCache(layout: StorageValue): void {
  try {
    if (typeof window === "undefined") return;
    getTokenStorage().set(LAYOUT_CACHE_KEY, layout);
  } catch {
    /* ignore */
  }
}

/** 静默清除用户级缓存（登出 / 强制重登 / 切换账号时调用） */
export function clearAuthCache(): void {
  try {
    if (typeof window === "undefined") return;
    const storage = getTokenStorage();
    storage.remove(MENU_CACHE_KEY);
    storage.remove(LAYOUT_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** 清除令牌（accessToken / refreshToken / userInfo 全部移除） */
export function clearAuthToken(): void {
  try {
    if (typeof window === "undefined") return;
    // 代入令牌也要一并清掉，否则「登出」后本标签页仍以被代入身份继续可用
    clearImpersonateToken();
    const storage = getTokenStorage();
    storage.remove(accessKey());
    storage.remove(refreshKey());
    storage.remove(USER_INFO_KEY);
    // pinia user store 的持久化副本里也存着 token，不清掉守卫会凭它把用户弹回首页
    storage.remove(CACHE_PREFIX + "user");
  } catch {
    /* ignore */
  }
}

/** 完整登出清理：令牌 + 菜单缓存 + 布局缓存 */
export function clearAllAuthData(): void {
  clearAuthToken();
  clearAuthCache();
}

/**
 * 刷新清理：清菜单 / 布局 / 用户信息缓存，但保留 accessToken / refreshToken
 *
 * 供「路由缓存刷新」等场景调用：清空本地缓存后 reload，让守卫重新拉取远程菜单、
 * 布局设置与用户信息，而无需重新登录。
 */
export function clearAuthCacheKeepToken(): void {
  try {
    if (typeof window === "undefined") return;
    const storage = getTokenStorage();
    storage.remove(MENU_CACHE_KEY);
    storage.remove(LAYOUT_CACHE_KEY);
    storage.remove(USER_INFO_KEY);
  } catch {
    /* ignore */
  }
}
