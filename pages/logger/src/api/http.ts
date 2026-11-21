/**
 * 日志控制台轻量 HTTP 客户端（自包含，不依赖 @repo/core 鉴权框架）。
 *
 * - 统一 base：/v2/logger（dev 由 vite 代理转发到 LOGGER_API_TARGET）；
 * - 响应信封：{ code, message, data }，code === 0 视为成功，直接返回 data；
 * - 失败统一 ElMessage 轻提示（同文案 2 秒节流，避免并发失败刷屏），
 *   异常继续抛给调用方（调用方无需重复弹错，静默 catch 即可）。
 */
import { ElMessage } from "element-plus";

const BASE = "/v2/logger";

/**
 * 宿主注入的令牌提供器。
 *
 * 独立运行（pages/logger 自起）时不注入 → 请求不带凭据，行为与旧版一致；
 * 被宿主应用（monitor 等，后端开了 OAuth）嵌挂时由宿主在入口注入
 * （如 monitor 壳传 @repo/utils 的 getAccessToken）：REST 走 Authorization 头，
 * SSE（EventSource 无法自定义请求头）走 withLoggerToken 的查询参数。
 */
let tokenProvider: (() => string | null | undefined) | null = null;

/** 注入 / 清除（传 null）令牌提供器，由宿主应用入口调用 */
export function setLoggerTokenProvider(provider: (() => string | null | undefined) | null): void {
  tokenProvider = provider;
}

/** 后端 OAuthServerFilter 的查询参数令牌名（取 token 顺序：自定义头 → Bearer → 查询参数 → Cookie） */
export const LOGGER_TOKEN_PARAM = "x-oauth-token";

/** 为 EventSource 等「带不了请求头」的场景拼接查询参数令牌；无令牌时原样返回 */
export function withLoggerToken(url: string): string {
  const token = tokenProvider?.();
  if (!token) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${LOGGER_TOKEN_PARAM}=${encodeURIComponent(token)}`;
}

interface Envelope<T> {
  code?: number | string;
  message?: string;
  data?: T;
  success?: boolean;
}

let lastToastText = "";
let lastToastAt = 0;
function toastError(text: string): void {
  const now = Date.now();
  if (text === lastToastText && now - lastToastAt < 2000) return;
  lastToastText = text;
  lastToastAt = now;
  ElMessage.error(text);
}

/** 查询参数序列化：数组转逗号分隔（对应后端 level 多值口径），空值跳过 */
function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(
  path: string,
  options: { method?: string; params?: Record<string, unknown>; body?: unknown } = {},
): Promise<T> {
  const { method = "GET", params, body } = options;
  const headers: Record<string, string> = {};
  const token = tokenProvider?.();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    toastError("网络异常：日志服务不可达");
    throw cause;
  }
  if (!response.ok) {
    toastError(`日志服务请求失败（HTTP ${response.status}）`);
    throw new Error(`logger http ${response.status}`);
  }
  let payload: Envelope<T>;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch (cause) {
    toastError("日志服务返回了无法解析的数据");
    throw cause;
  }
  const ok = payload?.code === 0 || payload?.code === "0" || payload?.success === true;
  if (!ok) {
    toastError(payload?.message || "日志服务返回错误");
    throw new Error(payload?.message || "logger api error");
  }
  return payload.data as T;
}

export const loggerHttp = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return request<T>(path, { params });
  },
  del<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return request<T>(path, { method: "DELETE", params });
  },
};
