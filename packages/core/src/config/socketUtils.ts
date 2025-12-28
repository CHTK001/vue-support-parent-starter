/**
 * Socket 公共工具函数
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

/**
 * Socket消息数据结构
 * 后端发送的数据格式
 */
export interface SocketMessageWrapper {
  data: string;
  encrypted: boolean;
  timestamp: string;
  uuid?: string;
  dataId?: string | number;
}

/**
 * 解析Socket消息数据
 * 处理后端发送的加密/非加密数据格式
 *
 * @param rawData 原始数据
 * @returns 解析后的数据对象
 */
export function parseSocketMessage(rawData: unknown): unknown {
  try {
    // 如果是空值或空字符串，直接返回
    if (rawData === null || rawData === undefined || rawData === "") {
      return rawData;
    }
    
    // 如果是字符串，先解析为对象
    const wrapper: SocketMessageWrapper =
      typeof rawData === "string" ? JSON.parse(rawData) : (rawData as SocketMessageWrapper);

    // 检查是否为新格式（包含 encrypted 字段）
    if (wrapper && typeof wrapper.encrypted === "boolean") {
      if (wrapper.encrypted) {
        // 加密数据，暂时返回原始数据（需要解密逻辑）
        console.warn("[SocketUtils] 收到加密数据，暂不支持前端解密");
        return wrapper;
      } else {
        // 非加密数据，解析 data 字段
        if (typeof wrapper.data === "string") {
          try {
            return JSON.parse(wrapper.data);
          } catch {
            return wrapper.data;
          }
        }
        return wrapper.data;
      }
    }

    // 兼容旧格式，直接返回
    return wrapper;
  } catch (error) {
    console.error("[SocketUtils] 解析Socket消息失败:", error);
    return rawData;
  }
}

/**
 * 构建带认证的URL
 *
 * @param baseUrl 基础URL
 * @param token 访问令牌
 * @param query 额外查询参数
 * @returns 完整URL
 */
export function buildAuthUrl(
  baseUrl: string,
  token?: string,
  query?: Record<string, string>
): string {
  const url = new URL(baseUrl);
  if (token) {
    url.searchParams.set("x-oauth-token", token);
  }
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

/**
 * 将HTTP URL转换为WebSocket URL
 *
 * @param httpUrl HTTP URL
 * @returns WebSocket URL
 */
export function toWebSocketUrl(httpUrl: string): string {
  return httpUrl.replace(/^http/, "ws");
}
