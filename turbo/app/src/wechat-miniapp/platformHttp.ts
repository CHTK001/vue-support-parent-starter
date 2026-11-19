/**
 * @repo/app/wechat-miniapp —— 小程序 HTTP 适配
 *
 * <p>用 {@code uni.request} 实现与 {@code @repo/utils Http} 同语义的客户端：
 * 统一 baseUrl、Bearer Token 注入、query 拼装、业务信封返回、超时、401 回调。
 * 返回原始 {@code MpResult}（{code, msg, data}），由 {@code unwrap} 解包。</p>
 *
 * <p>与 PC 的差异只在传输层（uni.request vs axios）；对外的形态只有一个
 * {@code request(options)}，不提供 get/post 等语法糖——各端只经这一条出口发请求。</p>
 */
import type { MpHttp, MpRequestConfig, MpRequestOptions, MpResult } from "./types";
import { getUniRuntime } from "./uni";
import { joinUrl } from "./url";

/** 默认请求超时（毫秒） */
const DEFAULT_TIMEOUT = 15000;

/** uni.request 的成功回调结果（最小面） */
interface UniResponse {
  statusCode: number;
  data: unknown;
}

/** 请求失败错误：带 HTTP 状态码与业务码，便于页面区分提示 */
export class MpHttpError extends Error {
  status?: number;
  code?: string | number;

  constructor(message: string, status?: number, code?: string | number) {
    super(message);
    this.name = "MpHttpError";
    this.status = status;
    this.code = code;
  }
}

/** uni.request 的 Promise 封装（回调形式，兼容各版本 promisify 行为差异） */
function uniRequest(options: Record<string, unknown>): Promise<UniResponse> {
  return new Promise<UniResponse>((resolve, reject) => {
    getUniRuntime().request({
      ...options,
      success: (res: UniResponse) => resolve(res),
      fail: (error: { errMsg?: string }) =>
        reject(new MpHttpError(error?.errMsg || "网络请求失败")),
    });
  });
}

/** 拼装 query（跳过 undefined / null / 空串） */
function buildQuery(query?: MpRequestOptions["query"]): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/** HTTP 适配器依赖 */
export interface MpHttpDeps {
  /** 后端地址（如 http://127.0.0.1:8787） */
  baseUrl: string;
  /** 取当前 accessToken */
  getAccessToken: () => string;
  /** 401 回调（token 失效） */
  onUnauthorized?: () => void | Promise<void>;
  /** 全局请求配置 */
  config?: MpRequestConfig;
}

/** 创建小程序 HTTP 客户端 */
export function createMpHttp(deps: MpHttpDeps): MpHttp {
  const { baseUrl, getAccessToken, onUnauthorized, config = {} } = deps;

  return {
    async request<T = unknown>(options: MpRequestOptions): Promise<MpResult<T>> {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(config.headers ?? {}),
        ...(options.header ?? {}),
      };
      // 默认注入 Bearer；显式 auth=false 时跳过（如登录接口）
      if (options.auth !== false) {
        const token = getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const res = await uniRequest({
        url: joinUrl(baseUrl, options.url) + buildQuery(options.query),
        method: options.method ?? "GET",
        data: options.data,
        header: headers,
        timeout: options.timeout ?? config.timeout ?? DEFAULT_TIMEOUT,
        dataType: "json",
      });

      // HTTP 401：交给宿主跳登录（登录 / 刷新等 skipAuthRedirect 请求自行处理）
      if (res.statusCode === 401) {
        if (!options.skipAuthRedirect) {
          try {
            await onUnauthorized?.();
          } catch {
            // 回调异常不覆盖原始错误
          }
        }
        throw new MpHttpError("登录已过期，请重新登录", 401);
      }

      const body = res.data as MpResult<T> | string | undefined;
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const msg =
          (typeof body === "object" && body !== null && body.msg) ||
          `请求失败（HTTP ${res.statusCode}）`;
        throw new MpHttpError(msg, res.statusCode);
      }
      if (body && typeof body === "object" && ("code" in body || "data" in body)) {
        return body as MpResult<T>;
      }
      // 非信封响应（文件流 / 纯文本）：包一层 data，交由调用方判断
      return { code: String(res.statusCode), data: body as T };
    },
  };
}
