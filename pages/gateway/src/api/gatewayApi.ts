/**
 * 网关 API 封装
 *
 * 调用 utils-support-gateway-server-starter 提供的 REST API。
 * 走 /api 前缀（由 vite dev server 代理到 8080）。
 * 使用 @repo/utils 的 http 工具类（链式 API）。
 */
import { http } from "@repo/utils";
import type { AuthResponse, ProtocolInfo } from "./types";

/**
 * 鉴权请求体类型
 */
export interface AuthPayload {
  mode: "key" | "custom";
  key?: string;
  protocol?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
}

/**
 * 统一错误格式
 */
export class AuthError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * 第二步：调用 server 鉴权端点
 *
 * @param payload 连接模式与参数（key 模式或 custom 模式）
 * @returns tunnelId + wsUrl + protocol + host + port
 * @throws AuthError 当 HTTP 401/500 时抛出
 */
export async function authenticate(payload: AuthPayload): Promise<AuthResponse> {
  try {
    const response = await http.post("/api/connections/authenticate").data(payload).timeout(15000);
    const body = response.data as { status?: number; code?: number; msg?: string; data?: AuthResponse };
    if (body.status !== undefined && body.status !== 0 && body.status !== 200) {
      throw new AuthError(body.msg ?? `鉴权失败: status=${body.status}`, body.status);
    }
    if (!body.data) {
      throw new AuthError("鉴权响应缺少 data 字段", 500);
    }
    return body.data;
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      throw e;
    }
    const status = typeof (e as { response?: { status?: number } })?.response?.status === "number"
      ? (e as { response: { status: number } }).response.status
      : 0;
    const msg = e instanceof Error ? e.message : String(e);
    throw new AuthError(`鉴权请求失败: ${msg}`, status);
  }
}

/**
 * 列出预配置的 key（key 模式下拉框用）
 *
 * @returns key 字符串列表
 */
export async function listKeys(): Promise<string[]> {
  try {
    const response = await http.get("/api/connections/keys").loading(false);
    const body = response.data as { data?: string[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

/**
 * 列出可用协议（SPI 扫描结果）
 *
 * @returns 协议名列表
 */
export async function listProtocols(): Promise<ProtocolInfo[]> {
  try {
    const response = await http.get("/api/connections/list").loading(false);
    const body = response.data as { data?: ProtocolInfo[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

/**
 * 上报当前 metrics 给 server（暂未实现，留接口）
 */
export async function reportMetrics(payload: Record<string, unknown>): Promise<void> {
  try {
    await http.post("/api/connections/metrics").data(payload).loading(false);
  } catch {
    // 静默失败 — metrics 是非关键路径
  }
}