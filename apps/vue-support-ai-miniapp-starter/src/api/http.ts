import { getMpAppContext, MpHttpError } from "@repo/app";
import { REQUEST_TIMEOUT } from "../config";

/**
 * 小程序端业务请求出口。
 *
 * <p>传输、Bearer 注入、query 拼装、401 处理、信封解包全部由 {@code @repo/app}
 * 装配的上下文承担（与 PC 端同一口径）；本文件只做两件事：
 * 拼 {@code /v2} 前缀、把框架错误转成页面认识的 {@link ApiError}。</p>
 */
export class ApiError extends Error {
  status?: number;
  code?: string | number;

  constructor(message: string, status?: number, code?: string | number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * 令牌读写统一走 {@code @repo/app} 装配的 token 管理器，与 PC 端同一套语义。
 * 页面/接口层只调用这三个函数，不直接碰存储 key。
 */
export function getToken(): string {
  try {
    return getMpAppContext().token.getAccessToken();
  } catch {
    return "";
  }
}

export function setToken(token: string): void {
  getMpAppContext().token.setTokens(token);
}

export function clearToken(): void {
  try {
    getMpAppContext().token.clearTokens();
  } catch {
    // 上下文未就绪（极端场景）时忽略
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
  /** query 参数（自动跳过 undefined/null/空串） */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** 401 时不自动跳登录（登录接口自身使用） */
  skipAuthRedirect?: boolean;
}

/**
 * 统一请求出口。
 *
 * <p>{@code /v2} 前缀在这里拼；成功码 '00000' 的解包由框架 {@code unwrap} 完成，
 * 失败抛出携带 msg 的 {@link ApiError}。</p>
 */
export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", data, query, skipAuthRedirect } = options;
  const ctx = getMpAppContext();
  try {
    const result = await ctx.http.request<T>({
      url: `/v2${endpoint}`,
      method,
      data,
      query,
      timeout: REQUEST_TIMEOUT,
      skipAuthRedirect,
    });
    return ctx.unwrap(result);
  } catch (error) {
    if (error instanceof MpHttpError) {
      throw new ApiError(error.message, error.status, error.code);
    }
    throw error;
  }
}

export const http = {
  get<T = any>(endpoint: string, query?: RequestOptions["query"]): Promise<T> {
    return request<T>(endpoint, { method: "GET", query });
  },
  post<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, { method: "POST", data });
  },
  put<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, { method: "PUT", data });
  },
  del<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, { method: "DELETE", data });
  },
  /** 登录等不想触发 401 跳转的请求 */
  postNoAuth<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, { method: "POST", data, skipAuthRedirect: true });
  },
};
