/**
 * API 封装层（core）
 *
 * 集中封装登录 / 用户信息 / 刷新token / 验证码 / 默认配置 / 远程菜单等接口。
 * 调用方只需调函数，无需关心接口 URL（从 getConfig().url 读取）与实现细节。
 *
 * http 实例由 createApp 构建后通过 setApiHttp 注入（含加密/签名/401 拦截器）。
 */
import type { Http } from "@repo/utils";
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

/** 当前用户信息 */
export function getMe() {
  return getApiHttp().get(getConfig().url.me).then<ApiResult<LoginResult>>((r) => r.data);
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
    .then<ApiResult<SettingItem[]>>((r) => r.data);
}

/** 获取远程菜单 */
export function getMenu(params?: Record<string, unknown>) {
  const req = getApiHttp().get(getConfig().url.menu);
  if (params) {
    req.query(params);
  }
  return req.then<ApiResult<unknown[]>>((r) => r.data);
}

/**
 * 后端在线探测（HEAD 短超时，非阻塞）
 *
 * 用于初始化阶段判断后端是否可达，例如 openAuth=false 且未显式配置
 * message.query 时，先探测后端：在线则开启站内消息 HTTP 查询，否则跳过。
 * 服务器有响应（即使 4xx/5xx）视为可达；仅网络错误 / 超时才返回 false。
 */
export async function probeServer(timeoutMs = 5000): Promise<boolean> {
  try {
    await getApiHttp().head("/").timeout(timeoutMs).loading(false);
    return true;
  } catch (error) {
    return Boolean((error as { response?: unknown }).response);
  }
}

export * from "./stationMessage";
