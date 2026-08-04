/**
 * RSocket 协议实现
 *
 * 基于 rsocket-core + rsocket-websocket-client，提供统一的 SocketTemplate 接口。
 * RSocket 是面向请求/响应的二进制协议，这里做如下映射：
 *   - emit(event, data)      → fireAndForget（带 route 元数据）
 *   - subscribe(module,event)→ requestStream（route = `${module}.${event}`，服务端持续推送）
 *   - on(event, cb)          → 连接状态事件（connect / error / close）
 *
 * 用法：
 *   const rs = createRSocketService({ urls: [...], path: "/rsocket" });
 *   rs.on("message", (data) => ...);
 *   rs.subscribe("JVM", "JVM_INFO", (msg) => ...);
 */
import { ref } from "vue";
import { RSocketClient, type ReactiveSocket } from "rsocket-core";
import RSocketWebSocketClient from "rsocket-websocket-client";
import {
  getSocketToken,
  matchesSocketListenOptions,
  toWebSocketUrl,
} from "./socketUtils";
import type {
  SocketTemplate,
  SocketTemplateListenOptions,
  WsMessage,
} from "./socketTemplate";

/** RSocket 配置 */
export interface RSocketConfig {
  /** RSocket 服务器地址列表 */
  urls: string[];
  /** RSocket WebSocket 路径（默认 /rsocket） */
  path?: string;
  /** 查询参数 */
  query?: Record<string, string>;
  /** 自动重连，默认 true */
  reconnection?: boolean;
  /** 重连尝试次数，默认 3 */
  reconnectionAttempts?: number;
  /** 重连延迟（毫秒），默认 1000 */
  reconnectionDelay?: number;
}

/** JSON 序列化器（data/metadata 均按 JSON 处理） */
const JsonSerializers = {
  data: {
    deserialize: (data: string | Uint8Array): unknown => {
      const text =
        typeof data === "string" ? data : new TextDecoder().decode(data);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    },
    serialize: (value: unknown): Uint8Array =>
      new TextEncoder().encode(JSON.stringify(value)),
  },
  metadata: {
    deserialize: (metadata: string | Uint8Array): unknown => {
      const text =
        typeof metadata === "string"
          ? metadata
          : new TextDecoder().decode(metadata);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    },
    serialize: (value: unknown): Uint8Array =>
      new TextEncoder().encode(JSON.stringify(value)),
  },
};

/** 拼接 route 元数据（简单起见：直接用 JSON，服务端按约定解析） */
function buildRouteMetadata(route: string): string {
  return JSON.stringify({ route });
}

/**
 * 创建 RSocket 服务
 *
 * @param config RSocket 配置
 * @returns SocketTemplate 实例
 */
export function createRSocketService(config: RSocketConfig): SocketTemplate {
  const isConnected = ref(false);
  let client: RSocketClient | null = null;
  let socket: ReactiveSocket | null = null;
  let reconnectAttempts = 0;
  let manualClose = false;
  const eventListeners = new Map<string, Set<(data: unknown) => void>>();
  const subscribeHandlers = new Map<string, Set<(msg: WsMessage) => void>>();
  const streamSubscriptions: Array<{ cancel: () => void }> = [];

  const buildUrl = (): string => {
    const token = getSocketToken();
    let baseUrl = config.urls[Math.floor(Math.random() * config.urls.length)];
    baseUrl = toWebSocketUrl(baseUrl);

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
    return url.toString();
  };

  const triggerEvent = (event: string, data: unknown) => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[RSocket] 事件处理错误 [${event}]:`, error);
        }
      });
    }
  };

  const connect = () => {
    if (socket || manualClose) return;

    try {
      const url = buildUrl();
      const transport = new RSocketWebSocketClient({
        url,
        wsCreator: (u) => new WebSocket(u),
      });

      client = new RSocketClient({
        serializers: JsonSerializers,
        setup: {
          dataMimeType: "application/json",
          metadataMimeType: "application/json",
          keepAlive: 60000,
          lifetime: 180000,
        },
        transport,
        errorHandler: (error) => {
          console.error("[RSocket] 连接错误:", error);
        },
      });

      client.connect().subscribe({
        onComplete: (rsocket) => {
          socket = rsocket;
          isConnected.value = true;
          reconnectAttempts = 0;
          triggerEvent("connect", { connected: true });
        },
        onError: (error) => {
          console.error("[RSocket] 连接失败:", error);
          isConnected.value = false;
          triggerEvent("error", error);
          scheduleReconnect();
        },
      });
    } catch (error) {
      console.error("[RSocket] 创建连接失败:", error);
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (manualClose || !config.reconnection) return;
    const maxAttempts = config.reconnectionAttempts ?? 3;
    if (reconnectAttempts >= maxAttempts) return;
    reconnectAttempts++;
    const delay = config.reconnectionDelay ?? 1000;
    setTimeout(() => {
      if (!isConnected.value && !manualClose) {
        connect();
      }
    }, delay * reconnectAttempts);
  };

  /** 按 module + event 发起 requestStream 订阅 */
  const subscribeStream = (key: string) => {
    if (!socket) return;
    const route = buildRouteMetadata(key);
    socket
      .requestStream({ data: {}, metadata: route })
      .subscribe({
        onNext: (payload) => {
          const raw = payload.data as unknown;
          const msg = (
            typeof raw === "string" ? JSON.parse(raw) : raw
          ) as WsMessage;
          if (!msg?.module || !msg?.event) return;
          const subKey = `${msg.module}_${msg.event}`;
          subscribeHandlers.get(subKey)?.forEach((h) => {
            try {
              h(msg);
            } catch {
              /* 忽略单个订阅者异常 */
            }
          });
        },
        onComplete: () => {
          /* 流结束（不主动重连） */
        },
        onError: (error) => {
          console.error(`[RSocket] requestStream 错误 [${key}]:`, error);
        },
      });
  };

  const disconnect = () => {
    manualClose = false;
    streamSubscriptions.splice(0).forEach((sub) => sub.cancel());
    if (socket) {
      socket.close();
      socket = null;
    }
    if (client) {
      client.close();
      client = null;
    }
    isConnected.value = false;
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
    if (!socket) {
      console.warn("[RSocket] 未连接，无法发送消息");
      return;
    }
    const route = buildRouteMetadata(event);
    socket.fireAndForget({ data, metadata: route });
  };

  const close = () => {
    manualClose = true;
    disconnect();
    eventListeners.clear();
  };

  const subscribe = (
    module: string,
    event: string,
    handler: (msg: WsMessage) => void,
  ): (() => void) => {
    const key = `${module}_${event}`;
    if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, new Set());
    subscribeHandlers.get(key)!.add(handler);

    // 已连接时立即发起流订阅；连接后由 connect 回调统一补订阅
    if (socket) {
      subscribeStream(key);
    }
    return () => subscribeHandlers.get(key)?.delete(handler);
  };

  return {
    protocol: "rsocket",
    get socket() {
      return socket;
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
