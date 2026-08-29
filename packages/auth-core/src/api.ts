/**
 * 认证 API 封装（auth-core）
 *
 * 纯 TypeScript、无框架依赖，基于最小 http 抽象（AuthHttp）实现
 * Spring 契约 /v2/user/login|logout|me|refresh-token 四类接口调用。
 *
 * 各端（Vue / React）只需把自身封装好的 http 客户端适配成 AuthHttp 即可复用，
 * 无需关心认证接口的 URL 与调用细节。
 */
import type { AuthEndpoints, LoginParams, LoginResult } from "./types";

/**
 * 最小 http 抽象接口
 *
 * 仅抽象认证需要的三种方法：post / get / delete，均返回 Promise<unknown>，
 * 由调用方把具体请求库（axios / fetch 等）适配进来。
 */
export interface AuthHttp {
  /** 发起 POST 请求；body 为可选请求体 */
  post(url: string, body?: unknown): Promise<unknown>;
  /** 发起 GET 请求 */
  get(url: string): Promise<unknown>;
  /** 发起 DELETE 请求；body 为可选请求体 */
  delete(url: string, body?: unknown): Promise<unknown>;
}

/**
 * 认证 API 实例的对外接口
 */
export interface AuthApi {
  /** 登录：调用 /v2/user/login */
  login(params: LoginParams): Promise<LoginResult | undefined>;
  /** 登出：调用 /v2/user/logout */
  logout(body?: unknown): Promise<unknown>;
  /** 获取当前用户信息：调用 /v2/user/me */
  me(): Promise<LoginResult | undefined>;
  /** 刷新令牌：调用 /v2/user/refresh-token */
  refreshToken(body?: unknown): Promise<LoginResult | undefined>;
}

/** 默认认证接口地址（相对路径，baseUrl 由使用方在 http 层注入） */
const DEFAULT_ENDPOINTS: AuthEndpoints = {
  login: "/v2/user/login",
  logout: "/v2/user/logout",
  me: "/v2/user/me",
  refreshToken: "/v2/user/refresh-token",
};

/**
 * 从任意响应中提取 data 字段
 *
 * 兼容形如 { data: LoginResult } 的通用包裹结构，也兼容直接返回 LoginResult 的结构。
 *
 * @param res 原始响应
 * @returns 提取出的数据；无法提取时返回 undefined
 */
function extractData<T>(res: unknown): T | undefined {
  if (res && typeof res === "object") {
    const record = res as Record<string, unknown>;
    // 存在 data 字段时优先取 data，否则整体作为结果
    if (Object.prototype.hasOwnProperty.call(record, "data")) {
      return record.data as T;
    }
    return res as T;
  }
  return undefined;
}

/**
 * 创建认证 API 实例
 *
 * @param http 底层 http 客户端（post / get / delete）
 * @param endpoints 接口地址集合；缺省时使用 /v2/user/* 默认路径
 * @returns 认证 API 实例
 */
export function createAuthApi(
  http: AuthHttp,
  endpoints: Partial<AuthEndpoints> = {},
): AuthApi {
  /** 合并后的完整接口地址 */
  const urls: AuthEndpoints = { ...DEFAULT_ENDPOINTS, ...endpoints };

  return {
    async login(params: LoginParams): Promise<LoginResult | undefined> {
      const res = await http.post(urls.login, params);
      return extractData<LoginResult>(res);
    },

    async logout(body?: unknown): Promise<unknown> {
      return http.delete(urls.logout, body);
    },

    async me(): Promise<LoginResult | undefined> {
      const res = await http.get(urls.me);
      return extractData<LoginResult>(res);
    },

    async refreshToken(body?: unknown): Promise<LoginResult | undefined> {
      const res = await http.post(urls.refreshToken, body);
      return extractData<LoginResult>(res);
    },
  };
}
