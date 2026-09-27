/**
 * 数据源模块私有请求客户端（@pages/datasource）
 *
 * 为什么不直接用 @repo/utils 的 http()：
 * 那个客户端不注入 Authorization、也不解包后端信封，直接拿来在已登录的控制台里发请求会 401，
 * 且拿到的还是信封而不是业务数据。这里按宿主 app 的 http.ts 同一套约定实现一份，
 * 保证共享包自洽：带 token、逐层解信封、401 走会话失效、错误文案直接可展示。
 *
 * @author CH
 * @since 4.0.0
 */
import { clearAllAuthData, getAccessToken } from "@repo/utils";
import { getConfig } from "@repo/config";

/** 后端成功业务码，与宿主 app 保持一致 */
const SUCCESS_CODES: unknown[] = ["00000", "200", 0, "0"];

/** 请求默认超时（毫秒），元数据接口要走实时库查询，不能无限等 */
const DEFAULT_TIMEOUT = 15000;

/** 业务错误：把后端的 code / msg 原样带出来，页面可直接展示 msg */
export class ApiError extends Error {
  /** 业务码 */
  readonly code?: string;
  /** HTTP 状态码 */
  readonly httpStatus?: number;
  /** 是否为会话失效 */
  readonly unauthorized: boolean;

  constructor(message: string, options: { code?: string; httpStatus?: number; unauthorized?: boolean } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.unauthorized = options.unauthorized ?? false;
  }
}

/** 后端返回信封 */
interface Envelope {
  code?: string | number;
  msg?: string;
  data?: unknown;
  ok?: boolean;
  success?: boolean;
  total?: number;
  pageNo?: number;
}

/** 会话失效回调，由宿主 app 注入（登录态清理 + 跳登录） */
let onUnauthorized: (() => void) | null = null;

/**
 * 注册会话失效回调。
 * @param handler 宿主提供的清理动作
 */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

/**
 * 取 API 基地址。
 *
 * 必须与宿主 app 的 http.ts 用同一口径：采集控制台的后端挂在 /collect/api 前缀下
 * （vite 代理也是按这个前缀 rewrite 的），这里若返回空串，请求会绕过代理直接打到
 * /v2/collect/datasource，dev 下 404、prod 下丢失 context-path。
 */
function base(): string {
  const configured = getConfig().http?.baseUrl;
  return (configured || "/collect/api").replace(/\/+$/, "");
}

/**
 * 把接口路径拼成最终 URL。
 *
 * <p>常规路径是<b>相对 API 基址</b>的（{@code /ms/datasource/list} → {@code /collect/api/ms/datasource/list}），
 * context-path 由基址统一带，调用方不要自己再拼一遍。</p>
 *
 * <p>但如果调用方传入的路径已经以基址开头，就直接使用、不再叠加：否则会拼出
 * {@code /collect/api/collect/api/ms/datasource/list} 这种双重前缀，后端对任意未知路径
 * 都返回「资源不存在」(404)，排查时很容易误判成接口没注册。</p>
 *
 * @param path 接口路径（相对基址，或已带基址的完整路径）
 * @return 最终请求 URL
 */
function resolve(path: string): string {
  const root = base();
  if (!path.startsWith(root + "/") && path !== root) {
    return root + path;
  }
  return path;
}

/** 丢掉 undefined / null / 空串，避免拼出 `?a=undefined` 这种脏查询 */
function clean(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  }
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

/** 是否为成功信封（有 code，或有 ok/success 标志） */
function isEnvelope(value: unknown): value is Envelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Envelope;
  if (candidate.code !== undefined) {
    return true;
  }
  return candidate.data !== undefined && (typeof candidate.ok === "boolean" || typeof candidate.success === "boolean");
}

/** 分页信封没有 code/ok/success，但仍有 data，直接取 data */
function isPageEnvelope(value: unknown): value is Envelope {
  return !!value && typeof value === "object" && !Array.isArray(value) && (value as Envelope).data !== undefined;
}

/**
 * 逐层解包信封，直到拿到真正数据。
 * 后端标准信封是 `{code:"00000",data,ok,success}`，分页信封是 `{pageNo,pageSize,total,data:[]}`。
 */
function peel(value: unknown, depth = 0): unknown {
  if (depth > 4 || !value || typeof value !== "object") {
    return value;
  }
  if (isEnvelope(value)) {
    const env = value as Envelope;
    if (env.code !== undefined && !SUCCESS_CODES.includes(env.code)) {
      throw new ApiError(env.msg || "请求失败", { code: String(env.code) });
    }
    if (env.ok === false || env.success === false) {
      throw new ApiError(env.msg || "请求失败", { code: env.code !== undefined ? String(env.code) : undefined });
    }
    return peel(env.data, depth + 1);
  }
  if (isPageEnvelope(value)) {
    return peel((value as Envelope).data, depth + 1);
  }
  return value;
}

/**
 * 发起请求并逐层解包信封，返回业务数据。
 *
 * @param method HTTP 方法
 * @param path 接口路径（相对 API 基地址）
 * @param body 请求体，仅在需要时传
 * @param params 查询参数，undefined / null / 空串会被丢弃
 * @return 解包后的业务数据
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  let response: Response;
  try {
    response = await fetch(withQuery(resolve(path), params ?? {}), { ...init, signal: controller.signal });
  } catch (error) {
    const aborted = (error as Error)?.name === "AbortError";
    throw new ApiError(aborted ? `请求超时（${DEFAULT_TIMEOUT / 1000}s）` : "无法连接采集服务，请确认后端已启动");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401) {
    clearAllAuthData();
    onUnauthorized?.();
    throw new ApiError("请先登录采集控制台", { code: "401", httpStatus: 401, unauthorized: true });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const env = (payload ?? {}) as Envelope;
    throw new ApiError(env.msg || `请求失败（HTTP ${response.status}）`, {
      code: env.code !== undefined ? String(env.code) : undefined,
      httpStatus: response.status,
    });
  }
  return peel(payload) as T;
}

/** GET 查询 */
export function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>("GET", url, undefined, params);
}

/** POST 提交 */
export function post<T>(url: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>("POST", url, body, params);
}

/** PUT 更新 */
export function put<T>(url: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>("PUT", url, body, params);
}

/** DELETE 删除 */
export function del<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>("DELETE", url, undefined, params);
}
