/**
 * Socket.IO 协议实现
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

import { ref } from "vue";
import { io, type Socket } from "socket.io-client";
import { getToken } from "../utils/auth";
import { normalizeSocketUrls, parseSocketMessage } from "./socketUtils";

/**
 * Socket.IO 配置
 */
export interface SocketIOConfig {
  urls: string[];
  context?: string;
  query?: Record<string, string>;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * 创建 Socket.IO 服务
 */
export function createSocketIOService(config: SocketIOConfig): SocketTemplate {
  const isConnected = ref(false);
  let socketInstance: Socket | null = null;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();
  const autoConnect = config.autoConnect ?? true;
  const normalizedUrls = normalizeSocketUrls(config.urls);

  const connect = () => {
    if (socketInstance?.connected) {
      console.warn("[Socket.IO] 已连接");
      return;
    }

    if (socketInstance) {
      socketInstance.connect();
      return;
    }

    const token = getToken();
    const url =
      normalizedUrls[Math.floor(Math.random() * normalizedUrls.length)];

    socketInstance = io(url, {
      path: config.context || "/socket.io",
      transports: ["websocket"],
      autoConnect,
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
      console.log("[Socket.IO] 连接成功");
    });

    socketInstance.on("disconnect", () => {
      isConnected.value = false;
      console.log("[Socket.IO] 断开连接");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket.IO] 连接错误:", error);
    });

    // message 事件分发（必须在 socketInstance 创建后注册）
    socketInstance.on("message", (raw: unknown) => {
      try {
        const msg = (typeof raw === "string" ? JSON.parse(raw) : raw) as WsMessage;
        if (!msg?.module || !msg?.event) return;
        const key = `${msg.module}_${msg.event}`;
        subscribeHandlers.get(key)?.forEach(h => { try { h(msg); } catch {} });
      } catch {}
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
    if (!socketInstance) {
      connect();
    }

    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
      return;
    }

    console.warn("[Socket.IO] 未连接，无法发送消息");
  };

  const close = () => {
    disconnect();
    eventListeners.clear();
  };

  const subscribeHandlers = new Map<string, Set<(msg: WsMessage) => void>>();

  const subscribe = (module: string, event: string, handler: (msg: WsMessage) => void): () => void => {
    const key = `${module}_${event}`;
    if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, new Set());
    subscribeHandlers.get(key)!.add(handler);
    return () => subscribeHandlers.get(key)?.delete(handler);
  };

  return {
    protocol: "socketio",
    get socket() { return socketInstance; },
    get isConnected() { return isConnected.value; },
    get connected() { return isConnected; },
    connect,
    disconnect,
    on,
    off,
    emit,
    close,
    subscribe,
  };
}
