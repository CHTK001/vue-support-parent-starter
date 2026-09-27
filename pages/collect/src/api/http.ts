/**
 * 采集调度一体化控制台的传输层。
 *
 * 传输层用自包含的 fetch 客户端，不走 @repo/utils 的 http()（要自己剥信封、拼 query），
 * 但登录态完全交给框架：请求头带框架存的 accessToken（Authorization: Bearer），
 * 收到 401 就清掉本地令牌并跳框架登录页，本层不自带登录界面、也不弹自己的提示。
 *
 * 后端契约要点（详见 .tmp/collect-rest-api.md）：
 * 1. 单层信封 {code:"00000",data,ok,success}；采集分页再包一层，真实路径 data.data
 *    → {pageNo,pageSize,totalPages,total,data:[]}，内层 code 是 int 0；
 * 2. 未登录时受保护接口返回 HTTP 401 + 裸 {code:"401",msg}，据此判定令牌失效；
 * 3. 登录失败是 HTTP 200 + 业务码，只能看 code 判成败；
 * 4. copy/stop/clean/delete 等 POST/DELETE 用 query 参数而非 body。
 */
import { getConfig } from "@repo/config";
import { getRouter } from "@repo/core";
import { clearAllAuthData, getAccessToken } from "@repo/utils";

const SUCCESS_CODES: unknown[] = ["00000", "200", 0, "0"];

/** 接口错误，携带业务码与 HTTP 状态，供页面统一提示 */
export class ConsoleError extends Error {
  readonly code?: string;
  readonly httpStatus?: number;
  readonly unauthorized: boolean;

  constructor(message: string, options: { code?: string; httpStatus?: number; unauthorized?: boolean } = {}) {
    super(message);
    this.name = "ConsoleError";
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.unauthorized = options.unauthorized === true;
  }
}

interface Envelope {
  code?: string | number;
  msg?: string;
  data?: unknown;
  ok?: boolean;
  success?: boolean;
}

/** 看起来像统一信封：有 code，或带 ok/success 标记且有 data */
function isEnvelope(value: Record<string, unknown>): boolean {
  if (value.code !== undefined) {
    return true;
  }
  return value.data !== undefined && (typeof value.ok === "boolean" || typeof value.success === "boolean");
}

/**
 * 逐层剥掉统一信封（含分页的双层包装），遇到非信封即停。
 * 分页对象 {pageNo,pageSize,total,data:[]} 没有 code/ok/success，因此不会被误剥。
 */
function peel(value: unknown, depth: number): unknown {
  if (depth >= 3 || value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const env = value as Envelope;
  if (!isEnvelope(env as Record<string, unknown>)) {
    return value;
  }
  if (env.ok === false || env.success === false) {
    throw new ConsoleError(env.msg || "请求失败", { code: String(env.code ?? "") });
  }
  if (env.code !== undefined && !SUCCESS_CODES.includes(env.code)) {
    throw new ConsoleError(env.msg || "请求失败", { code: String(env.code) });
  }
  return peel(env.data, depth + 1);
}

/**
 * 令牌失效：清掉框架登录态并回框架登录页，语义与 httpCrypto 的 axios 分支一致。
 *
 * 并发请求会同时收到 401，先比对当前路由再跳，避免重复导航。
 */
function handleSessionExpired(): void {
  const loginPath = getConfig().route?.loginPath || "/login";
  const router = getRouter();
  clearAllAuthData();
  if (router.currentRoute.value.path !== loginPath) {
    void router.replace(loginPath);
  }
}

/** 接口基址：dev 由 vite 代理到 18190，生产为同源反代前缀 */
function base(): string {
  return (getConfig().http?.baseUrl || "/collect/api").replace(/\/+$/, "");
}

/** 去掉空值，避免把 undefined 序列化成 "undefined" 查询参数 */
function clean(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  });
  return out;
}

function withQuery(url: string, params: Record<string, unknown>): string {
  const entries = Object.entries(clean(params));
  if (!entries.length) {
    return url;
  }
  const search = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return `${url}${url.includes("?") ? "&" : "?"}${search}`;
}

/**
 * 发起请求并逐层解包信封，返回业务数据。
 *
 * HTTP 401 触发会话失效回调；其余非 2xx 取响应体的 msg 作提示文案，
 * 后端在 400/409 下都会给中文 message，可直接展示给用户。
 */
async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  };
  const token = getAccessToken();
  if (token) {
    (init.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json;charset=UTF-8";
    init.body = JSON.stringify(body);
  }
  let response: Response;
  try {
    response = await fetch(withQuery(base() + path, params ?? {}), init);
  } catch {
    throw new ConsoleError("无法连接采集服务，请确认后端已启动");
  }
  if (response.status === 401) {
    handleSessionExpired();
    throw new ConsoleError("请先登录采集控制台", { code: "401", httpStatus: 401, unauthorized: true });
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const env = (payload ?? {}) as Envelope;
    throw new ConsoleError(env.msg || `请求失败（HTTP ${response.status}）`, {
      code: env.code !== undefined ? String(env.code) : undefined,
      httpStatus: response.status,
    });
  }
  try {
    return peel(payload, 0) as T;
  } catch (error) {
    if (error instanceof ConsoleError) {
      throw error;
    }
    throw new ConsoleError(String((error as Error)?.message || error));
  }
}

export const get = <T>(url: string, params?: Record<string, unknown>) => request<T>("GET", url, undefined, params);

export const post = <T>(url: string, body?: unknown, params?: Record<string, unknown>) =>
  request<T>("POST", url, body, params);

export const put = <T>(url: string, body?: unknown, params?: Record<string, unknown>) =>
  request<T>("PUT", url, body, params);

export const del = <T>(url: string, params?: Record<string, unknown>) => request<T>("DELETE", url, undefined, params);
