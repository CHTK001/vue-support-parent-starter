/**
 * 创建 SSE 客户端
 *
 * 基于 @microsoft/fetch-event-source，封装为客户端。
 * 支持自动重连、自动解析 JSON data。
 *   const client = createSseClient('/api/chat/stream', { onMessage: (e) => console.log(e.data) })
 *   client.close()
 */
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { SseClient, SseClientOptions, SseEvent } from "../types";
import { getAccessToken } from "../modules/token";
import { getConfig } from "@repo/config";

/**
 * 为相对路径补齐统一 API 前缀（与 http.ts 的 baseUrl 策略一致），
 * 绝对地址（http(s):// 或 //）原样返回。
 */
function resolveSseUrl(url: string): string {
  const u = (url ?? "").trim();
  if (!u || /^([a-z][a-z0-9+.-]*:)?\/\//i.test(u)) return u;
  const base = getConfig().http.baseUrl ?? "";
  if (!base) return u;
  return `${base.replace(/\/+$/, "")}/${u.replace(/^\/+/, "")}`;
}

/** 默认 JSON 解析 */
export const defaultParse = <T = unknown>(raw: string): T => {
  if (raw === "" || raw === "[DONE]") return raw as unknown as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
};

/** 将鉴权 token 拼入 URL query（与 socket 的 x-oauth-token 约定一致） */
function injectAuthQuery(url: string, token: string): string {
  if (!token) return url;
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.href : undefined);
    parsed.searchParams.set("x-oauth-token", token);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function createSseClient<T = unknown>(
  url: string,
  options: SseClientOptions<T> = {},
): SseClient {
  const {
    method = "POST",
    headers = {},
    body,
    credentials = "include",
    auth = true,
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 2000,
    parseData = defaultParse<T>,
    onMessage,
    onOpen,
    onError,
    onClose,
  } = options;

  const controller = new AbortController();
  let attempts = 0;
  let closed = false;

  /** 组装请求头：auth 开启时自动注入 Authorization: Bearer <token> */
  const buildHeaders = (): Record<string, string> => {
    const result: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...headers,
    };
    if (auth) {
      const token = typeof auth === "string" ? auth : getAccessToken();
      if (token) {
        result.Authorization = `Bearer ${token}`;
      }
    }
    return result;
  };

  const start = () => {
    if (closed) return;
    // auth 开启时把 token 同时拼到 query（与 socket 的 x-oauth-token 约定一致）
    const authToken = auth ? (typeof auth === "string" ? auth : getAccessToken()) : "";
    const requestUrl = injectAuthQuery(resolveSseUrl(url), authToken);

    void fetchEventSource(requestUrl, {
      method,
      headers: buildHeaders(),
      credentials,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      openWhenHidden: true,
      onopen: async (response) => {
        if (
          response.ok &&
          response.headers.get("content-type")?.includes("text/event-stream")
        ) {
          attempts = 0;
          onOpen?.();
          return;
        }
        // 401/403 不再永久放弃：登录瞬间令牌可能正在轮换（旧 accessToken 已失效、
        // 新 token 尚未写回 storage），首连会撞上瞬时 403。把它当普通失败抛给
        // onerror 的重连逻辑（计入 maxReconnectAttempts），令牌稳定后连接自愈；
        // 真正长期无权限的调用方也会因重试次数耗尽而停下（默认 5 次）。
        throw new Error(`SSE 连接失败: ${response.status}`);
      },
      onmessage: (msg) => {
        // 仅心跳注释（如 `: keep-alive`）时该事件没有 data 字段。
        // 底层 parser 遇到空行会无条件派发事件，若原样透传，
        // parseData("") 会得到空字符串并把调用方状态清空，故此处丢弃。
        if (msg.data === undefined || msg.data === null || msg.data === "") {
          return;
        }
        const data = parseData(msg.data);
        onMessage?.({
          event: msg.event || "message",
          data,
          id: msg.id,
          retry: msg.retry,
        } as SseEvent<T>);
      },
      onerror: (err): number | void => {
        onError?.(err);
        attempts++;
        if (attempts > maxReconnectAttempts || !reconnect) {
          throw err;
        }
        // 返回 Promise resolve 后会自动重连
        return new Promise<void>((resolve) => {
          setTimeout(resolve, reconnectInterval);
        }) as unknown as number;
      },
      onclose: () => {
        onClose?.();
      },
    }).catch((err) => {
      onError?.(err);
    });
  };

  start();

  return {
    close: () => {
      closed = true;
      controller.abort();
    },
  };
}
