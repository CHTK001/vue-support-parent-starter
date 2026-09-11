/**
 * WebSocket 协议实现
 * 原生 WebSocket 协议封装，含心跳保活与自动重连
 *
 * 用法：
 *   const ws = createWebSocketService({ urls: [...], path: "/ws" });
 *   ws.on("message", (data) => ...);
 */
import { ref } from "vue";
import { log } from "@repo/utils";
import {
  getSocketToken,
  matchesSocketListenOptions,
  parseSocketMessage,
  toWebSocketUrl,
} from "./socketUtils";
import { createUrlSelector } from "./urlSelector";
import type {
  SocketTemplate,
  SocketTemplateListenOptions,
  WsMessage,
} from "./socketTemplate";

/** WebSocket 配置 */
export interface WebSocketConfig {
  /** 服务器地址列表 */
  urls: string[];
  /** WebSocket 路径 */
  path?: string;
  /** 查询参数 */
  query?: Record<string, string>;
  /** 自动重连，默认 true */
  reconnection?: boolean;
  /** 重连尝试次数，默认 3 */
  reconnectionAttempts?: number;
  /** 重连延迟（毫秒），默认 1000 */
  reconnectionDelay?: number;
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatInterval?: number;
  /** 子协议（可选） */
  protocols?: string | string[];
  /** 失败地址黑名单缓存时长（毫秒），默认 60_000 */
  blacklistTtlMs?: number;
}

/**
 * 创建 WebSocket 服务
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function createWebSocketService(
  config: WebSocketConfig,
): SocketTemplate {
  const isConnected = ref(false);
  let wsInstance: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectAttempts = 0;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();
  /** 多地址负载均衡 / 失败降级选择器 */
  const selector = createUrlSelector({
    urls: config.urls,
    blacklistTtlMs: config.blacklistTtlMs,
  });

  const triggerEvent = (event: string, data: unknown) => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          log.error(`[WebSocket] 事件处理错误 [${event}]:`, error);
        }
      });
    }
  };

  const startHeartbeat = () => {
    if (config.heartbeatInterval && config.heartbeatInterval > 0) {
      heartbeatTimer = setInterval(() => {
        if (wsInstance?.readyState === WebSocket.OPEN) {
          wsInstance.send(
            JSON.stringify({ event: "ping", timestamp: Date.now() }),
          );
        }
      }, config.heartbeatInterval);
    }
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const connect = () => {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const token = getSocketToken();
      const baseUrlRaw = selector.next();
      if (!baseUrlRaw) {
        log.warn(`[WebSocket] 无可用的连接地址`);
        return;
      }
      let baseUrl = toWebSocketUrl(baseUrlRaw);

      if (config.path) {
        baseUrl = baseUrl.replace(/\/$/, "") + config.path;
      }

      const url = new URL(baseUrl);
      if (token) {
        url.searchParams.set("x-oauth-token", token);
      }
      if (config.query) {
        Object.entries(config.query).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      wsInstance = config.protocols
        ? new WebSocket(url.toString(), config.protocols)
        : new WebSocket(url.toString());

      wsInstance.onopen = () => {
        isConnected.value = true;
        reconnectAttempts = 0;
        // 连接成功：恢复该地址健康状态
        selector.markSuccess(baseUrlRaw);
        startHeartbeat();
        triggerEvent("connect", { connected: true });
      };

      wsInstance.onclose = (event) => {
        isConnected.value = false;
        stopHeartbeat();
        triggerEvent("disconnect", {
          connected: false,
          code: event.code,
          reason: event.reason,
        });

        // 非正常关闭视为地址故障：降级该地址并尝试下一地址
        if (wsInstance?.readyState !== WebSocket.CLOSED || event.code !== 1000) {
          selector.markFailure(baseUrlRaw);
        }

        const maxAttempts = config.reconnectionAttempts ?? 3;
        if (config.reconnection !== false && reconnectAttempts < maxAttempts) {
          reconnectAttempts++;
          const delay = config.reconnectionDelay || 1000;
          setTimeout(() => {
            if (!isConnected.value) {
              connect();
            }
          }, delay * reconnectAttempts);
        }
      };

      wsInstance.onerror = (error) => {
        log.error(`[WebSocket] 连接错误 ${baseUrlRaw}:`, error);
        triggerEvent("error", error);
      };

      wsInstance.onmessage = (event) => {
        try {
          if (typeof event.data !== "string") {
            triggerEvent("message", event.data);
            return;
          }

          let message: { event?: string; data?: unknown };
          try {
            message = JSON.parse(event.data);
          } catch {
            triggerEvent("message", event.data);
            return;
          }

          if (message.event === "pong") {
            return;
          }

          const eventName = message.event || "message";
          const data = parseSocketMessage(
            message.data !== undefined ? message.data : message,
          );
          triggerEvent(eventName, data);
        } catch (error) {
          log.error(`[WebSocket] 消息解析错误:`, error);
        }
      };
    } catch (error) {
      log.error(`[WebSocket] 创建连接失败:`, error);
    }
  };

  const disconnect = () => {
    stopHeartbeat();
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
      isConnected.value = false;
    }
  };

  const on = (
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions,
  ) => {
    const wrappedCallback = (data: unknown) => {
      if (!matchesSocketListenOptions(data, options)) {
        return;
      }
      callback(data);
    };

    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(wrappedCallback);
  };

  const off = (event: string) => {
    eventListeners.delete(event);
  };

  const emit = (event: string, data?: unknown) => {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.send(
        JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      );
    } else {
      log.warn(`[WebSocket] 未连接，无法发送消息`);
    }
  };

  const close = () => {
    disconnect();
    eventListeners.clear();
  };

  const subscribeHandlers = new Map<string, Set<(msg: WsMessage) => void>>();

  const subscribe = (
    module: string,
    event: string,
    handler: (msg: WsMessage) => void,
  ): (() => void) => {
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

  return {
    protocol: "websocket",
    get socket() {
      return wsInstance;
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
