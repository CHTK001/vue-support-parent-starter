/**
 * SSE (Server-Sent Events) 协议实现
 * 基于 @microsoft/fetch-event-source，提供统一的 SocketTemplate 接口
 *
 * 注意：SSE 为单向通信（服务端→客户端），emit 仅打印警告。
 *
 * 用法：
 *   const sse = createSseService({ urls: [...], path: "/sse/connect" });
 *   sse.on("message", (data) => ...);
 */
import { ref } from "vue";
import { log } from "@repo/utils";
import {
  fetchEventSource,
  EventStreamContentType,
} from "@microsoft/fetch-event-source";
import {
  buildAuthUrl,
  getSocketToken,
  matchesSocketListenOptions,
  parseSocketMessage,
} from "./socketUtils";
import { createUrlSelector } from "./urlSelector";
import type {
  SocketTemplate,
  SocketTemplateListenOptions,
  WsMessage,
} from "./socketTemplate";

/** SSE 配置接口 */
export interface SseConfig {
  /** SSE 服务器地址列表 */
  urls: string[];
  /** SSE 路径 */
  path?: string;
  /** 查询参数 */
  query?: Record<string, string>;
  /** 客户端ID（可选） */
  clientId?: string;
  /** 是否携带凭证 */
  withCredentials?: boolean;
  /**
   * 连接方法，默认 POST。
   *
   * <p>POST 可把 token 放请求头（`x-oauth-token` / `Authorization`），
   * 不把令牌写进 URL；仅在对接只认 GET 的旧服务时才显式改回 GET。</p>
   */
  method?: "GET" | "POST";
  /** POST 请求体（可选，SSE 建连一般不需要） */
  body?: string;
  /**
   * 自动连接，默认 true。
   *
   * <p>与 Socket.IO 对齐：创建服务即建连；但只有拿到 token 时才自动连，
   * 避免登录页在未登录状态先打一条 401。没有 token 的公开 SSE 仍可通过
   * {@link SocketTemplate.subscribe} 懒连接。</p>
   */
  autoConnect?: boolean;
  /** 自动重连，默认 true */
  reconnection?: boolean;
  /** 重连延迟（毫秒），默认 3000 */
  reconnectionDelay?: number;
  /** 最大重连次数，默认 5 */
  reconnectionAttempts?: number;
  /** 失败地址黑名单缓存时长（毫秒），默认 60_000 */
  blacklistTtlMs?: number;
}

/**
 * 创建 SSE 服务
 *
 * @param config SSE 配置
 * @returns SocketTemplate 实例
 */
export function createSseService(config: SseConfig): SocketTemplate {
  let abortController: AbortController | null = null;
  const isConnected = ref(false);
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  let reconnectAttempts = 0;
  const maxReconnectAttempts = config.reconnectionAttempts ?? 5;
  /** 连接方法：默认 POST，token 走请求头而不是 URL */
  const method = config.method ?? "POST";
  /** 多地址负载均衡 / 失败降级选择器 */
  const selector = createUrlSelector({
    urls: config.urls,
    blacklistTtlMs: config.blacklistTtlMs,
  });

  const buildUrl = (): { url: string; baseUrlRaw: string } => {
    const token = getSocketToken();
    const baseUrlRaw = selector.next();
    if (!baseUrlRaw) return { url: "", baseUrlRaw: "" };
    let baseUrl = baseUrlRaw;

    if (config.path) {
      baseUrl = baseUrl.replace(/\/$/, "") + config.path;
    }

    const queryParams: Record<string, string> = { ...config.query };
    if (config.clientId) {
      queryParams.clientId = config.clientId;
    }

    // GET 只能把令牌放 query（兼容只认 query 的旧服务）；
    // POST 放请求头，URL 里不出现令牌。
    return {
      url: buildAuthUrl(baseUrl, method === "GET" ? token : undefined, queryParams),
      baseUrlRaw,
    };
  };

  const connect = () => {
    if (abortController) {
      log.warn("[SSE] 已连接，请先断开连接");
      return;
    }

    reconnectAttempts = 0;
    abortController = new AbortController();
    const { url, baseUrlRaw } = buildUrl();
    if (!url) {
      log.warn("[SSE] 无可用的连接地址");
      abortController = null;
      return;
    }
    const token = getSocketToken();
    const headers: Record<string, string> = { Accept: "text/event-stream" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers["x-oauth-token"] = token;
    }
    if (config.body) {
      headers["Content-Type"] = "application/json";
    }

    fetchEventSource(url, {
      method,
      headers,
      ...(config.body ? { body: config.body } : {}),
      signal: abortController.signal,
      openWhenHidden: true, // 保持后台连接

      async onopen(response) {
        if (
          response.ok &&
          response.headers.get("content-type")?.includes(EventStreamContentType)
        ) {
          isConnected.value = true;
          reconnectAttempts = 0;
          // 连接成功：恢复该地址健康状态
          selector.markSuccess(baseUrlRaw);
          triggerListeners("connect", { connected: true });
        } else {
          // 连接失败：降级该地址
          selector.markFailure(baseUrlRaw);
          throw new Error(
            `[SSE] 连接失败: ${response.status} ${response.statusText}`,
          );
        }
      },

      onmessage(event) {
        const eventName = event.event || "message";
        const data = parseSocketMessage(event.data);

        if (eventName === "connected") {
          // 连接确认事件，仅打日志
        }

        triggerListeners(eventName, data);
      },

      onerror(error) {
        log.error(`[SSE] 连接错误`, error);
        isConnected.value = false;
        triggerListeners("error", error);

        if (
          config.reconnection !== false &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          reconnectAttempts++;
          const delay = config.reconnectionDelay ?? 3000;
          // fetchEventSource 会自动重试，这里抛出错误表示需要重连
          throw error;
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          abortController?.abort();
          abortController = null;
        }
      },

      onclose() {
        isConnected.value = false;
        triggerListeners("close", { closed: true });
      },
    }).catch((error) => {
      if (error.name !== "AbortError") {
        log.error(`[SSE] fetchEventSource 错误:`, error);
      }
    });
  };

  const disconnect = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isConnected.value = false;
      reconnectAttempts = maxReconnectAttempts; // 阻止自动重连
    }
  };

  const triggerListeners = (event: string, data: unknown) => {
    const eventListeners = listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          log.error(`[SSE] 事件处理错误: ${event}`, e);
        }
      });
    }
  };

  const on = (
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions,
  ) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    const wrappedCallback = (data: unknown) => {
      if (!matchesSocketListenOptions(data, options)) {
        return;
      }
      callback(data);
    };

    listeners.get(event)?.add(wrappedCallback);
  };

  const off = (event: string) => {
    listeners.delete(event);
  };

  const emit = (_event: string, _data?: unknown) => {
    log.warn(
        "[SSE] SSE 是单向通信协议，不支持客户端发送消息。如需双向通信，请使用 WebSocket 或 Socket.IO。",
    );
  };

  const close = () => {
    disconnect();
    listeners.clear();
  };

  const subscribeHandlers = new Map<string, Set<(msg: WsMessage) => void>>();

  const subscribe = (
    module: string,
    event: string,
    handler: (msg: WsMessage) => void,
  ): (() => void) => {
    // 懒连接：首次订阅时再建连，避免登录页/无订阅页面空占一条 SSE。
    if (!abortController) {
      connect();
    }
    const key = `${module}_${event}`;
    if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, new Set());
    subscribeHandlers.get(key)!.add(handler);
    return () => subscribeHandlers.get(key)?.delete(handler);
  };

  // 监听底层 message 事件，按 module+event 分发
  on("message", (raw: unknown) => {
    try {
      const msg = (
        typeof raw === "string" ? JSON.parse(raw) : raw
      ) as WsMessage;
      if (!msg?.module || !msg?.event) return;
      const key = `${msg.module}_${msg.event}`;
      subscribeHandlers.get(key)?.forEach((h) => {
        try {
          h(msg);
        } catch {
          /* 忽略单个订阅者异常 */
        }
      });
    } catch {
      /* 忽略解析异常 */
    }
  });

  // 自动连接：有 token 才自动建连（登录页不先打 401）；无 token 的公开 SSE
  // 会在首次 subscribe 时懒连接。
  if (config.autoConnect !== false && getSocketToken()) {
    connect();
  }

  return {
    protocol: "sse",
    get socket() {
      return abortController;
    },
    get isConnected() {
      return isConnected.value;
    },
    get connected() {
      return isConnected;
    },
    connect,
    disconnect,
    on,
    off,
    emit,
    close,
    subscribe,
  };
}
