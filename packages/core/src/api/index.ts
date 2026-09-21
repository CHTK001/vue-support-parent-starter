/**
 * API 封装层（core）
 *
 * 集中封装登录 / 用户信息 / 刷新token / 验证码 / 默认配置 / 远程菜单等接口。
 * 调用方只需调函数，无需关心接口 URL（从 getConfig().url 读取）与实现细节。
 *
 * http 实例由 createApp 构建后通过 setApiHttp 注入（含加密/签名/401 拦截器）。
 */
import type { Http } from "@repo/utils";
import { createHttp } from "@repo/utils";
import { getMenuCache, setMenuCache, getLayoutCache, setLayoutCache } from "@repo/utils";
import { getConfig } from "@repo/config";

/** http 单例（由 createApp 注入） */
let httpInstance: Http | null = null;

/** 注入 http 实例（createApp 构建后调用） */
export function setApiHttp(http: Http): void {
  httpInstance = http;
}

/** 获取 http 实例；未注入时抛错 */
export function getApiHttp(): Http {
  if (!httpInstance) {
    throw new Error("[api] http 未注入，请先调用 setApiHttp()");
  }
  return httpInstance;
}

/**
 * http() —— getApiHttp() 的简写别名，业务侧可写 http().get(url)。
 * 主入口为 getApiHttp()，http() 仅为书写便利，两者行为完全一致。
 */
export function http(): Http {
  return getApiHttp();
}

/**
 * 创建业务模块自己的 Http 客户端（如 device / spider 等独立后端）。
 *
 * 复用框架注入的 axios 实例（保留加密/签名/401/重试拦截器），
 * 仅替换 baseUrl；url 按 normalizeUrl 规则在 http.ts 统一拼接。
 *
 * baseUrl 来自配置：app.yaml 的 httpConfig.moduleBaseUrl[moduleName]，
 * 未配置时回退 httpConfig.baseUrl。调用前需 getApiHttp() 已注入（createApp 之后）。
 */
export function createModuleHttp(moduleName: string): Http {
  const { moduleBaseUrl, baseUrl } = getConfig().http;
  const resolved = moduleBaseUrl?.[moduleName] ?? baseUrl;
  return createHttp({ baseUrl: resolved, instance: getApiHttp().getInstance() });
}

/** 通用返回结构 */
export interface ApiResult<T = unknown> {
  status?: number;
  code?: number;
  msg?: string;
  data?: T;
}

/** 登录返回结构 */
export interface LoginResult {
  userInfo?: Record<string, unknown>;
  accessToken?: string;
  refreshToken?: string;
  expires?: number;
  isRemembered?: boolean;
  roles?: string[];
  perms?: string[];
  avatar?: string;
  username?: string;
  nickname?: string;
  [key: string]: unknown;
}

/** 验证码返回结构 */
export interface CaptchaResult {
  verifyCodeKey?: string;
  verifyCodeBase64?: string;
  verifyCodeUlid?: string;
  [key: string]: unknown;
}

/** 系统配置项（默认配置接口返回） */
export interface SettingItem {
  sysSettingId?: number;
  sysSettingName?: string;
  sysSettingValue?: string;
  sysSettingGroup?: string;
  [key: string]: unknown;
}

/** 登录 */
export function login(data: Record<string, unknown>) {
  return getApiHttp().post(getConfig().url.login).data(data).then<ApiResult<LoginResult>>((r) => r.data);
}

/** 登出 */
export function logout(data?: Record<string, unknown>) {
  return getApiHttp().delete(getConfig().url.logout).data(data ?? {}).then<ApiResult<LoginResult>>((r) => r.data);
}

/** 当前用户信息（loading=false 时不触发顶部进度条，供头像框等静默刷新使用） */
export function getMe(loading = true) {
  return getApiHttp()
    .get(getConfig().url.me)
    .loading(loading)
    .then<ApiResult<LoginResult>>((r) => r.data);
}

/** 刷新 token */
export function refreshToken(data?: Record<string, unknown>) {
  return getApiHttp().post(getConfig().url.refreshToken).data(data ?? {}).then<ApiResult<LoginResult>>((r) => r.data);
}

/** 获取验证码 */
export function getCaptcha() {
  return getApiHttp().get(getConfig().url.captcha).then<ApiResult<CaptchaResult>>((r) => r.data);
}

/** 获取默认配置（登录页/首页拉取后端配置合并到 getConfig） */
export function getDefaultSetting() {
  return getApiHttp()
    .get(getConfig().url.setting)
    .timeout(3000)
    .retry(false)
    .then<ApiResult<SettingItem[]>>((r) => r.data);
}

/**
 * 获取远程菜单（cache-aside + 并发去重）
 *
 * 策略：
 *   1. 先读 storage 缓存（getMenuCache），有直接返回，避免刷新 / 重复进入反复请求；
 *   2. 缓存未命中且已有「进行中请求」时复用同一 Promise，避免登录/导航并发触发时
 *      在缓存写回前重复请求 /v2/user/menu；
 *   3. 请求成功且返回数组时写回缓存。
 * 登出 / 强制重登时由 clearAuthCache() 静默清除缓存，下次登录重新拉取。
 */
let menuRequestPromise: Promise<ApiResult<unknown[]>> | null = null;

export function getMenu(params?: Record<string, unknown>): Promise<ApiResult<unknown[]>> {
  const cached = getMenuCache();
  if (cached) {
    return Promise.resolve({ data: cached });
  }
  if (menuRequestPromise) {
    return menuRequestPromise;
  }
  menuRequestPromise = (async () => {
    try {
      const req = getApiHttp().get(getConfig().url.menu);
      if (params) {
        req.query(params);
      }
      const res = await req.then<ApiResult<unknown[]>>((r) => r.data);
      // 仅成功响应才缓存菜单；登录前（未带 token）的 403 响应 data 可能为空数组，
      // 若不排除会缓存空菜单导致登录后无法重新拉取
      const ok = (res as unknown as { success?: boolean; ok?: boolean })?.success;
      if (ok !== false && Array.isArray(res?.data)) {
        setMenuCache(res.data);
      }
      return res;
    } catch (e) {
      // 请求失败（如未登录 403 时 axios reject）必须重置 promise，
      // 否则登录后 getMenu() 会复用失败的请求导致菜单始终拉取不到
      menuRequestPromise = null;
      throw e;
    }
  })();
  return menuRequestPromise;
}

/** 用户布局结构（对应后端 UserLayout） */
export interface UserLayoutData {
  grid?: string;
  layout?: string;
  theme?: string;
  color?: string;
  component?: string;
  preference?: string;
  [key: string]: unknown;
}

/**
 * 把 UserLayoutData 归一化为本地缓存形状（{ widgets, grid }）。
 *
 * 后端接口返回的是 UserLayoutData（layout 为 JSON 字符串），
 * 而 useHomeLayout 读取缓存时使用 normalize() 期望 { widgets, grid } 结构，
 * 若直接把 UserLayoutData 原样写入缓存，刷新后布局会被解析为空 → 组件丢失。
 *
 * 供 @repo/core 内部（getLayout / saveLayout 写回缓存）与
 * @repo/theme 的 useHomeLayout（fromUserLayout 解析）共用，避免重复的 JSON.parse。
 */
export function toLayoutCacheShape(
  data: UserLayoutData | null | undefined,
): Record<string, unknown> | null {
  if (!data) return null;
  if (typeof data.layout === "string" && data.layout.trim()) {
    try {
      const parsed = JSON.parse(data.layout) as Record<string, unknown>;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * 获取当前用户布局（cache-aside：先读 storage 缓存，没有再请求并写回）
 */
export async function getLayout() {
  const cached = getLayoutCache();
  if (cached) {
    return { data: cached };
  }
  const res = await getApiHttp()
    .get(getConfig().url.layout)
    .then<ApiResult<UserLayoutData>>((r) => r.data);
  if (res?.data) {
    const shape = toLayoutCacheShape(res.data);
    if (shape) {
      setLayoutCache(shape as never);
    }
  }
  return res;
}

/** 保存当前用户布局（成功后同步写回缓存） */
export function saveLayout(data: UserLayoutData) {
  return getApiHttp()
    .put(getConfig().url.layout)
    .data(data)
    .then<ApiResult<UserLayoutData>>((r) => {
      if (r?.data) {
        const shape = toLayoutCacheShape(r.data);
        if (shape) {
          setLayoutCache(shape as never);
        }
      }
      return r;
    });
}

export * from "./stationMessage";
export * from "./backendProbe";
export * from "./weather";
export * from "./typhoon";
