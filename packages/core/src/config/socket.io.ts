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
import type { SocketTemplate, SocketTemplateListenOptions } from "./socketTemplate";
import { parseSocketMessage } from "./socketUtils";

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

  const connect = () => {
    if (socketInstance?.connected) {
      console.warn("[Socket.IO] 已连接");
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
      console.log("[Socket.IO] 连接成功");
    });

    socketInstance.on("disconnect", () => {
      isConnected.value = false;
      console.log("[Socket.IO] 断开连接");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket.IO] 连接错误:", error);
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
      console.warn("[Socket.IO] 未连接，无法发送消息");
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
