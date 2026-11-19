import { getMpAppContext } from "@repo/app";
import { API_PREFIX, REQUEST_TIMEOUT } from "../config";

/**
 * 小程序端业务请求出口。
 *
 * <p>传输、Bearer 注入、query 拼装、401 处理、信封解包全部由 {@code @repo/app}
 * 装配的上下文承担（与 PC 端同一口径）；本文件只做两件事：
 * 拼 {@code API_PREFIX}（/v2）前缀、给请求一个统一超时。</p>
 */

/** 令牌读写统一走框架的 token 管理器，页面只调用这三个函数，不直接碰存储 key */
export function getToken(): string {
  return getMpAppContext().token.getAccessToken();
}

export function setToken(token: string): void {
  getMpAppContext().token.setTokens(token);
}

/** 登录用户信息与令牌同源存放（页面不直接碰存储 key） */
export function setUserInfo(userInfo: Record<string, unknown>): void {
  getMpAppContext().token.setUserInfo(userInfo);
}

export function clearToken(): void {
  getMpAppContext().token.clearTokens();
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
  /** query 参数（自动跳过 undefined/null/空串） */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** 401 时不自动跳登录（登录接口自身使用） */
  skipAuthRedirect?: boolean;
}

/** 统一请求出口：{@code API_PREFIX} 前缀在这里拼，成功码解包与失败抛错由框架完成 */
async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const ctx = getMpAppContext();
  return ctx.unwrap(
    await ctx.http.request<T>({
      url: `${API_PREFIX}${endpoint}`,
      timeout: REQUEST_TIMEOUT,
      ...options,
    }),
  );
}

export const http = {
  get<T = any>(endpoint: string, query?: RequestOptions["query"]): Promise<T> {
    return request<T>(endpoint, { method: "GET", query });
  },
  post<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, { method: "POST", data });
  },
  /** 登录等不想触发 401 跳转的请求 */
  postNoAuth<T = any>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, { method: "POST", data, skipAuthRedirect: true });
  },
};

/**
 * 列表响应归一：后端可能返回数组，也可能返回 {@code { items: [...] }}。
 * 三种列表接口（会话 / 消息 / 角色）共用这一处判断。
 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const items = (data as { items?: T[] } | null | undefined)?.items;
  return Array.isArray(items) ? items : [];
}
