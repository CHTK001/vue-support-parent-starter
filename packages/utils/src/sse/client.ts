/**
 * 创建 SSE 客户端
 *
 * 基于 @microsoft/fetch-event-source，封装为客户端。
 * 支持自动重连、自动解析 JSON data。
 *   const client = createSseClient('/api/chat/stream', { onMessage: (e) => console.log(e.data) })
 *   client.close()
 */
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { defaultParse, type SseClient, type SseClientOptions, type SseEvent } from "./types";

export type { SseClient, SseClientOptions, SseEvent };

export function createSseClient<T = unknown>(
  url: string,
  options: SseClientOptions<T> = {},
): SseClient {
  const {
    method = "POST",
    headers = {},
    body,
    credentials = "include",
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

  const start = () => {
    if (closed) return;
    void fetchEventSource(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...headers,
      },
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
        if (response.status === 401 || response.status === 403) {
          onError?.(new Error(`SSE 鉴权失败: ${response.status}`));
          closed = true;
          controller.abort();
          return;
        }
        throw new Error(`SSE 连接失败: ${response.status}`);
      },
      onmessage: (msg) => {
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
