/**
 * SSE 事件类型
 */
export interface SseEvent<T = unknown> {
  /** 事件类型 */
  event: string;
  /** 数据 */
  data: T;
  /** 事件 ID */
  id?: string;
  /** 重试间隔（ms） */
  retry?: number;
}

/**
 * SSE 客户端选项
 */
export interface SseClientOptions<T = unknown> {
  /** 请求方法 */
  method?: "GET" | "POST";
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体（POST） */
  body?: unknown;
  /** 凭证 */
  credentials?: "include" | "same-origin" | "omit";
  /** 是否开启自动重连 */
  reconnect?: boolean;
  /** 重连最大次数（默认 5） */
  maxReconnectAttempts?: number;
  /** 重连间隔（ms，默认 2000） */
  reconnectInterval?: number;
  /** 解析 data 字段（默认 JSON.parse） */
  parseData?: (raw: string) => T;
  /** 收到消息 */
  onMessage?: (event: SseEvent<T>) => void;
  /** 打开连接 */
  onOpen?: () => void;
  /** 错误 */
  onError?: (err: unknown) => void;
  /** 关闭 */
  onClose?: () => void;
}

/**
 * SSE 客户端实例
 */
export interface SseClient {
  /** 关闭连接 */
  close: () => void;
}

/**
 * 默认 JSON 解析
 */
export const defaultParse = <T = unknown>(raw: string): T => {
  if (raw === "" || raw === "[DONE]") return raw as unknown as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
};
