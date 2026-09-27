/**
 * 视频资源中心统一请求层
 *
 * 后端统一返回 ReturnResult 信封 { code, data, msg }，成功码为 "00000"
 * （兼容 200 / 0）。异常时抛出真实错误信息，由视图层展示错误与重试，
 * 不做任何演示数据兜底。
 */

/** 接口基础路径（Vite 开发代理 → 视频服务） */
export const API_BASE = "/video/api";

/** 统一响应包装（后端 ReturnResult） */
interface ApiResponse<T> {
  code?: number | string;
  data?: T;
  msg?: string;
  message?: string;
}

/** 与 packages/core 保持一致的兼容成功码集合 */
const SUCCESS_CODES: Array<number | string> = ["00000", "200", 0, "0", "success", "ok"];

/**
 * 发起 GET 请求并解包 ReturnResult。
 *
 * @param path   相对 API_BASE 的路径
 * @param params 查询参数（空值自动忽略）
 * @returns 业务数据
 */
export async function apiRequest<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const qs = params
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  const res = await fetch(`${API_BASE}${path}${qs}`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`后端服务请求失败: ${res.status}，请确认视频服务已启动`);
  }
  const body = (await res.json()) as ApiResponse<T>;
  if (body && typeof body === "object" && "code" in body && body.code !== undefined) {
    if (!SUCCESS_CODES.includes(body.code)) {
      throw new Error(body.msg || body.message || `接口返回错误码: ${body.code}`);
    }
  }
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data;
  }
  return body as T;
}
