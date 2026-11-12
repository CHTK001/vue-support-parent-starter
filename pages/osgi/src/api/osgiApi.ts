/**
 * OSGi 插件管理接口。
 *
 * 端点由 spring-support-osgi-starter 提供，路径挂在后端的 `/osgi/**` 下，
 * 响应会经过统一 ReturnResult 信封，这里在传输层剥壳后返回业务数据。
 *
 * 认证与采集侧一致：带框架 accessToken，401 清登录态并回登录页。
 */
import { getConfig } from "@repo/config";
import { getRouter } from "@repo/core";
import { clearAllAuthData, getAccessToken } from "@repo/utils";
import type { OsgiAction, OsgiBundle } from "../types/osgi";

/** OSGi 接口错误，携带 HTTP 状态供页面区分「未开启端点」与业务失败 */
export class OsgiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "OsgiError";
    this.status = status;
  }
}

/**
 * 接口基址：与采集侧同口径。
 *
 * 显式 undefined/null 才回退 `/collect/api`，空串表示同源根路径。
 */
function base(): string {
  const configured = getConfig().http?.baseUrl;
  return (configured === undefined || configured === null ? "/collect/api" : configured).replace(/\/+$/, "");
}

/** 统一请求头：登录态交给框架，不在这里维护第二份令牌 */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** 令牌失效时清态并回登录页，语义与采集侧传输层一致 */
function handleSessionExpired(): void {
  const loginPath = getConfig().route?.loginPath || "/login";
  const router = getRouter();
  clearAllAuthData();
  if (router.currentRoute.value.path !== loginPath) {
    void router.replace(loginPath);
  }
}

/**
 * 把非 2xx 响应转成可展示的错误。
 *
 * @param response 响应
 * @return 错误对象
 */
async function toError(response: Response): Promise<OsgiError> {
  const payload = (await response.json().catch(() => null)) as
    | { msg?: string; message?: string; error?: string }
    | null;
  const message = payload?.msg || payload?.message || payload?.error || `请求失败（HTTP ${response.status}）`;
  return new OsgiError(message, response.status);
}

/** 统一响应信封（后端 ResponseAdvice 会把原始返回值再包一层） */
interface Envelope {
  code?: string | number;
  msg?: string;
  data?: unknown;
  ok?: boolean;
  success?: boolean;
}

/** 成功业务码 */
const SUCCESS_CODES: unknown[] = ["00000", "200", 0, "0"];

/**
 * 剥掉统一响应信封，返回业务数据。
 *
 * 后端控制器虽然直接返回 List/Map，但 ResponseAdvice 会统一包成
 * `{code,msg,data,ok,success}`；前端不能假设拿到的是原始数组。
 *
 * @param value 响应体
 * @return 业务数据
 */
function unwrap(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const env = value as Envelope;
  const enveloped = env.code !== undefined || env.ok !== undefined || env.success !== undefined;
  if (!enveloped) {
    return value;
  }
  if (env.ok === false || env.success === false) {
    throw new OsgiError(env.msg || "请求失败");
  }
  if (env.code !== undefined && !SUCCESS_CODES.includes(env.code)) {
    throw new OsgiError(env.msg || "请求失败");
  }
  return env.data;
}

/**
 * 发 JSON 请求。
 *
 * @param method HTTP 方法
 * @param path   相对路径
 * @return 解析后的响应体
 */
async function request<T>(method: string, path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(base() + path, { method, headers: authHeaders(), credentials: "same-origin" });
  } catch {
    throw new OsgiError("无法连接后端服务，请确认已启动");
  }
  if (response.status === 401) {
    handleSessionExpired();
    throw new OsgiError("请先登录", 401);
  }
  if (!response.ok) {
    throw await toError(response);
  }
  return unwrap(await response.json()) as T;
}

/**
 * 上传 jar（multipart），由后端落盘后安装/升级。
 *
 * @param path 接口路径
 * @param file 插件 jar
 * @return 操作结果
 */
async function upload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  let response: Response;
  try {
    // 不手动设置 Content-Type：交给浏览器带 boundary
    response = await fetch(base() + path, {
      method: "POST",
      headers: authHeaders(),
      credentials: "same-origin",
      body: form,
    });
  } catch {
    throw new OsgiError("上传失败，无法连接后端服务");
  }
  if (response.status === 401) {
    handleSessionExpired();
    throw new OsgiError("请先登录", 401);
  }
  if (!response.ok) {
    throw await toError(response);
  }
  return unwrap(await response.json()) as T;
}

/** 全部已安装 bundle */
export const listBundles = () => request<OsgiBundle[]>("GET", "/osgi/bundles");

/**
 * 安装插件：同位置的已有 bundle 会自动转成原地升级。
 *
 * @param file  插件 jar
 * @param start 安装后是否立即启动
 */
export const installBundle = (file: File, start = true) =>
  upload<OsgiBundle>(`/osgi/bundles/install?start=${start}`, file);

/**
 * 升级插件：按符号名原地更新。
 *
 * @param symbolicName bundle 符号名
 * @param file         新版本 jar
 */
export const updateBundle = (symbolicName: string, file: File) =>
  upload<OsgiBundle>(`/osgi/bundles/${encodeURIComponent(symbolicName)}/update`, file);

/** 启动 bundle */
export const startBundle = (symbolicName: string) =>
  request<OsgiBundle>("POST", `/osgi/bundles/${encodeURIComponent(symbolicName)}/start`);

/** 停止 bundle */
export const stopBundle = (symbolicName: string) =>
  request<OsgiBundle>("POST", `/osgi/bundles/${encodeURIComponent(symbolicName)}/stop`);

/** 卸载 bundle */
export const uninstallBundle = (symbolicName: string) =>
  request<OsgiAction>("POST", `/osgi/bundles/${encodeURIComponent(symbolicName)}/uninstall`);

/**
 * 下载 bundle 对应的本地 jar。
 *
 * @param symbolicName bundle 符号名
 */
export async function downloadBundle(symbolicName: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(base() + `/osgi/bundles/${encodeURIComponent(symbolicName)}/download`, {
      headers: authHeaders(),
      credentials: "same-origin",
    });
  } catch {
    throw new OsgiError("下载失败，无法连接后端服务");
  }
  if (response.status === 401) {
    handleSessionExpired();
    throw new OsgiError("请先登录", 401);
  }
  if (!response.ok) {
    throw await toError(response);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${symbolicName}.jar`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
