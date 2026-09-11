/**
 * Socket.IO 协议实现
 * 基于 socket.io-client，支持自动连接/重连与统一消息解析
 *
 * 用法：
 *   const io = createSocketIOService({ urls: [...], context: "/socket.io" });
 *   io.on("message", (data) => ...);
 */
import { ref } from "vue";
import { io, type Socket } from "socket.io-client";
import { log } from "@repo/utils";
import {
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

/** Socket.IO 配置 */
export interface SocketIOConfig {
  urls: string[];
  context?: string;
  query?: Record<string, string>;
  transports?: string[];
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  /** 失败地址黑名单缓存时长（毫秒），默认 60_000 */
  blacklistTtlMs?: number;
}

/**
 * 创建 Socket.IO 服务
 *
 * @param config 配置
 * @returns SocketTemplate 实例
 */
export function createSocketIOService(config: SocketIOConfig): SocketTemplate {
  const isConnected = ref(false);
  let socketInstance: Socket | null = null;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();
  const autoConnect = config.autoConnect ?? true;
  /** 多地址负载均衡 / 失败降级选择器 */
  const selector = createUrlSelector({
    urls: config.urls,
    blacklistTtlMs: config.blacklistTtlMs,
  });
  const transports =
    config.transports && config.transports.length > 0
      ? config.transports
      : ["websocket"];

  const connect = () => {
    if (socketInstance?.connected) {
      return;
    }

    if (socketInstance) {
      socketInstance.connect();
      return;
    }

    const token = getSocketToken();
    const url = selector.next();
    if (!url) {
      log.warn("[Socket.IO] 无可用的连接地址");
      return;
    }

    socketInstance = io(url, {
      path: config.context || "/socket.io",
      transports,
      autoConnect,
      reconnection: config.reconnection ?? true,
      reconnectionAttempts: config.reconnectionAttempts ?? 3,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
      query: {
        "x-oauth-token": token || "",
        ...config.query,
      },
    });

    socketInstance.on("connect", () => {
      isConnected.value = true;
      // 连接成功：恢复该地址健康状态
      selector.markSuccess(url);
    });

    socketInstance.on("disconnect", () => {
      isConnected.value = false;
    });

    socketInstance.on("connect_error", (error) => {
      log.error(`[Socket.IO] 连接错误 ${url}:`, error);
      // 连接失败：降级该地址（进入黑名单），后续重连走其他地址
      selector.markFailure(url);
      // 主动 tear-down 并重建，让后续 connect() 选取下一个健康地址
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        isConnected.value = false;
      }
    });

    // message 事件分发（必须在 socketInstance 创建后注册）
    socketInstance.on("message", (raw: unknown) => {
      try {
        const parsed = parseSocketMessage(raw);
        const msg = (
          typeof parsed === "string" ? JSON.parse(parsed) : parsed
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

    if (!autoConnect) {
      socketInstance.connect();
    }
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
    options?: SocketTemplateListenOptions,
  ) => {
    if (!socketInstance) {
      connect();
    }

    if (!socketInstance) return;

    const wrappedCallback = (rawData: unknown) => {
      const data = parseSocketMessage(rawData);
      if (!matchesSocketListenOptions(data, options, rawData)) {
        return;
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
    if (!socketInstance) {
      connect();
    }

    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
      return;
    }

    log.warn("[Socket.IO] 未连接，无法发送消息");
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
    if (!socketInstance) {
      connect();
    }
    const key = `${module}_${event}`;
    if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, new Set());
    subscribeHandlers.get(key)!.add(handler);
    return () => subscribeHandlers.get(key)?.delete(handler);
  };

  return {
    protocol: "socketio",
    get socket() {
      return socketInstance;
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
