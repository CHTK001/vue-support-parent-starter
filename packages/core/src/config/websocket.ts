/**
 * WebSocket 协议实现
 * 原生 WebSocket 协议封装
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

import { ref } from "vue";
import { getToken } from "../utils/auth";
import type { SocketTemplate, SocketTemplateListenOptions } from "./socketTemplate";
import { parseSocketMessage, toWebSocketUrl } from "./socketUtils";

/**
 * WebSocket 配置
 */
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
  /** 协议（可选） */
  protocols?: string | string[];
}

/**
 * 创建 WebSocket 服务
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function createWebSocketService(config: WebSocketConfig): SocketTemplate {
  const isConnected = ref(false);
  let wsInstance: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectAttempts = 0;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();

  const triggerEvent = (event: string, data: unknown) => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] 事件处理错误 [${event}]:`, error);
        }
      });
    }
  };

  const startHeartbeat = () => {
    if (config.heartbeatInterval && config.heartbeatInterval > 0) {
      heartbeatTimer = setInterval(() => {
        if (wsInstance?.readyState === WebSocket.OPEN) {
          wsInstance.send(JSON.stringify({ event: "ping", timestamp: Date.now() }));
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
      console.warn("[WebSocket] 已连接");
      return;
    }

    try {
      const token = getToken();
      let baseUrl = config.urls[Math.floor(Math.random() * config.urls.length)];
      
      // 转换为 WebSocket URL
      baseUrl = toWebSocketUrl(baseUrl);
      
      // 添加路径
      if (config.path) {
        baseUrl = baseUrl.replace(/\/$/, "") + config.path;
      }

      const url = new URL(baseUrl);
      if (token?.accessToken) {
        url.searchParams.set("x-oauth-token", token.accessToken);
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
        console.log("[WebSocket] 连接成功");
        startHeartbeat();
        triggerEvent("connect", { connected: true });
      };

      wsInstance.onclose = (event) => {
        isConnected.value = false;
        stopHeartbeat();
        console.log("[WebSocket] 断开连接", event.code, event.reason);
        triggerEvent("disconnect", { connected: false, code: event.code, reason: event.reason });

        // 自动重连
        const maxAttempts = config.reconnectionAttempts ?? 3;
        if (config.reconnection !== false && reconnectAttempts < maxAttempts) {
          reconnectAttempts++;
          const delay = config.reconnectionDelay || 1000;
          console.log(`[WebSocket] 尝试重连 (${reconnectAttempts}/${maxAttempts})...`);
          setTimeout(() => {
            if (!isConnected.value) {
              connect();
            }
          }, delay * reconnectAttempts);
        }
      };

      wsInstance.onerror = (error) => {
        console.error("[WebSocket] 连接错误:", error);
        triggerEvent("error", error);
      };

      wsInstance.onmessage = (event) => {
        try {
          let message: { event?: string; data?: unknown };
          
          // 尝试解析JSON
          if (typeof event.data === "string") {
            try {
              message = JSON.parse(event.data);
            } catch {
              // 非JSON格式，直接作为message事件
              triggerEvent("message", event.data);
              return;
            }
          } else {
            // Blob 或 ArrayBuffer
            triggerEvent("message", event.data);
            return;
          }

          // 处理 pong 响应
          if (message.event === "pong") {
            return;
          }

          const eventName = message.event || "message";
          const data = parseSocketMessage(message.data !== undefined ? message.data : message);
          triggerEvent(eventName, data);
        } catch (error) {
          console.error("[WebSocket] 消息解析错误:", error);
        }
      };
    } catch (error) {
      console.error("[WebSocket] 创建连接失败:", error);
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
    options?: SocketTemplateListenOptions
  ) => {
    const wrappedCallback = (data: unknown) => {
      if (options?.dataId !== undefined) {
        const messageDataId = (data as Record<string, unknown>)?.dataId;
        if (String(messageDataId) !== String(options.dataId)) {
          return;
        }
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
        })
      );
    } else {
      console.warn("[WebSocket] 未连接，无法发送消息");
    }
  };

  const close = () => {
    disconnect();
    eventListeners.clear();
  };

  return {
    protocol: "websocket",
    get socket() {
      return wsInstance;
    },
    get isConnected() {
      return isConnected.value;
    },
    connect,
    disconnect,
    on,
    off,
    emit,
    close,
  };
}
