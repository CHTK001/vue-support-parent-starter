/**
 * 统一 Socket 服务
 * 根据配置自动选择 Socket.IO 或 RSocket 协议
 * 对外提供统一的 API 接口，实现无缝切换
 *
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */

import { inject, provide, ref, type Ref } from "vue";
import { getToken } from "../utils/auth";
import type {
  SocketTemplate,
  SocketTemplateListenOptions,
} from "./socketTemplate";
import { SocketTemplateKey } from "./socketTemplate";
import { parseSocketMessage } from "./socket";
import { io } from "socket.io-client";

/**
 * 协议类型
 */
export type ProtocolType = "socketio" | "rsocket";

/**
 * Socket 服务配置
 */
export interface SocketServiceConfig {
  /**
   * 协议类型，默认 socketio
   */
  protocol?: ProtocolType;

  /**
   * 服务器地址列表
   */
  urls: string[];

  /**
   * 上下文路径（Socket.IO 专用）
   */
  context?: string;

  /**
   * 查询参数
   */
  query?: Record<string, string>;

  /**
   * 自动连接，默认 true
   */
  autoConnect?: boolean;

  /**
   * 自动重连，默认 true
   */
  reconnection?: boolean;

  /**
   * 重连尝试次数，默认 3
   */
  reconnectionAttempts?: number;

  /**
   * 重连延迟（毫秒），默认 1000
   */
  reconnectionDelay?: number;

  /**
   * 心跳间隔（毫秒），RSocket 专用，默认 30000
   */
  keepAlive?: number;

  /**
   * 心跳超时（毫秒），RSocket 专用，默认 120000
   */
  lifetime?: number;
}

/**
 * 全局 Socket 服务实例
 */
let globalSocketService: SocketTemplate | null = null;

/**
 * 当前协议类型
 */
let currentProtocol: ProtocolType = "socketio";

/**
 * 创建 Socket.IO 服务
 */
function createSocketIOService(config: SocketServiceConfig): SocketTemplate {
  const isConnected = ref(false);
  let socketInstance: ReturnType<typeof io> | null = null;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();

  const connect = () => {
    if (socketInstance?.connected) {
      console.warn("[SocketService] Socket.IO 已连接");
      return;
    }

    const token = getToken();
    const url = config.urls[Math.floor(Math.random() * config.urls.length)];

    socketInstance = io(url, {
      path: config.context || "/socket.io",
      transports: ["websocket"],
      autoConnect: config.autoConnect ?? true,
      reconnection: config.reconnection ?? true,
      reconnectionAttempts: config.reconnectionAttempts ?? 3,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
      query: {
        "x-oauth-token": token?.accessToken || "",
        ...config.query,
      },
    });

    socketInstance.on("connect", () => {
      isConnected.value = true;
      console.log("[SocketService] Socket.IO 连接成功");
    });

    socketInstance.on("disconnect", () => {
      isConnected.value = false;
      console.log("[SocketService] Socket.IO 断开连接");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[SocketService] Socket.IO 连接错误:", error);
    });
  };

  const disconnect = () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      isConnected.value = false;
    }
  };

  const on = (
    event: string,
    callback: (data: unknown) => void,
    options?: SocketTemplateListenOptions
  ) => {
    if (!socketInstance) return;

    const wrappedCallback = (rawData: unknown) => {
      const data = parseSocketMessage(rawData);
      if (options?.dataId !== undefined) {
        const messageDataId = (data as Record<string, unknown>)?.dataId;
        if (String(messageDataId) !== String(options.dataId)) {
          return;
        }
      }
      callback(data);
    };

    socketInstance.on(event, wrappedCallback);

    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(wrappedCallback);
  };

  const off = (event: string) => {
    if (socketInstance) {
      socketInstance.off(event);
    }
    eventListeners.delete(event);
  };

  const emit = (event: string, data?: unknown) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
    } else {
      console.warn("[SocketService] Socket.IO 未连接，无法发送消息");
    }
  };

  const close = () => {
    disconnect();
    eventListeners.clear();
  };

  return {
    protocol: "socketio",
    get socket() {
      return socketInstance;
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

/**
 * 创建 RSocket 服务
 */
function createRSocketService(config: SocketServiceConfig): SocketTemplate {
  const isConnected = ref(false);
  let wsInstance: WebSocket | null = null;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();

  const connect = () => {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      console.warn("[SocketService] RSocket 已连接");
      return;
    }

    try {
      const token = getToken();
      const baseUrl = config.urls[0].replace(/^http/, "ws");
      const url = new URL(baseUrl);
      if (token?.accessToken) {
        url.searchParams.set("x-oauth-token", token.accessToken);
      }

      wsInstance = new WebSocket(url.toString());

      wsInstance.onopen = () => {
        isConnected.value = true;
        console.log("[SocketService] RSocket 连接成功");
        triggerEvent("connect", { connected: true });
      };

      wsInstance.onclose = () => {
        isConnected.value = false;
        console.log("[SocketService] RSocket 断开连接");
        triggerEvent("disconnect", { connected: false });

        // 自动重连
        if (config.reconnection !== false) {
          setTimeout(() => {
            if (!isConnected.value) {
              console.log("[SocketService] RSocket 尝试重连...");
              connect();
            }
          }, config.reconnectionDelay || 1000);
        }
      };

      wsInstance.onerror = (error) => {
        console.error("[SocketService] RSocket 连接错误:", error);
        triggerEvent("error", error);
      };

      wsInstance.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const eventName = message.event || "message";
          const data = parseSocketMessage(message.data || message);
          triggerEvent(eventName, data);
        } catch (error) {
          console.error("[SocketService] RSocket 消息解析错误:", error);
        }
      };
    } catch (error) {
      console.error("[SocketService] RSocket 创建连接失败:", error);
    }
  };

  const triggerEvent = (event: string, data: unknown) => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `[SocketService] RSocket 事件处理错误 [${event}]:`,
            error
          );
        }
      });
    }
  };

  const disconnect = () => {
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
      console.warn("[SocketService] RSocket 未连接，无法发送消息");
    }
  };

  const close = () => {
    disconnect();
    eventListeners.clear();
  };

  return {
    protocol: "rsocket",
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

/**
 * 创建 Socket 服务
 * 根据协议类型自动选择实现
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function createSocketService(
  config: SocketServiceConfig
): SocketTemplate {
  const protocol = config.protocol || "socketio";
  currentProtocol = protocol;

  console.log(`[SocketService] 创建 ${protocol.toUpperCase()} 服务`);

  if (protocol === "rsocket") {
    return createRSocketService(config);
  }

  return createSocketIOService(config);
}

/**
 * 初始化全局 Socket 服务
 * 根据配置自动选择协议
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function initGlobalSocketService(
  config: SocketServiceConfig
): SocketTemplate {
  // 关闭旧连接
  if (globalSocketService) {
    globalSocketService.close();
  }

  globalSocketService = createSocketService(config);
  provide(SocketTemplateKey, globalSocketService);

  return globalSocketService;
}

/**
 * 获取全局 Socket 服务
 */
export function getGlobalSocketService(): SocketTemplate | null {
  return globalSocketService;
}

/**
 * 使用全局 Socket 服务（Vue 组合式 API）
 */
export function useSocketService(): SocketTemplate | null {
  // 优先从 inject 获取
  const injected = inject(SocketTemplateKey, null);
  if (injected) {
    return injected;
  }

  // 回退到全局实例
  return globalSocketService;
}

/**
 * 获取当前协议类型
 */
export function getCurrentProtocol(): ProtocolType {
  return currentProtocol;
}

/**
 * 关闭全局 Socket 服务
 */
export function closeGlobalSocketService(): void {
  if (globalSocketService) {
    globalSocketService.close();
    globalSocketService = null;
  }
}
