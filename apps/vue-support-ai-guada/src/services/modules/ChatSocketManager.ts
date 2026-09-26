/**
 * 聊天 WebSocket 管理器（/ws/chat，多路复用单连接）。
 *
 * - 全应用复用一条 WS 连接，按 chatRequestId 路由 chat.frame / chat.error；
 * - ensureConnected 带快速超时：auto 模式据此判断是否降级到 SSE；
 * - 不新建传输栈：WS 实例由 @repo/core createSocketService 创建（复用框架鉴权/心跳/重连）。
 */
import { createSocketService } from "@repo/core";
import type { SocketTemplate } from "@repo/core";
import { getAccessToken } from "@repo/utils";

/** chat.frame 数据 */
export interface ChatFrameData {
  chatRequestId: string;
  type: "event" | "trace" | "done";
  payload?: any;
}

/** chat.error 数据 */
export interface ChatErrorData {
  chatRequestId?: string;
  message: string;
}

/** 路由处理器 */
interface RouteHandlers {
  frame: (d: ChatFrameData) => void;
  error: (d: ChatErrorData) => void;
}

class ChatSocketManager {
  private socket: SocketTemplate | null = null;

  private connecting: Promise<SocketTemplate> | null = null;

  private routes = new Map<string, RouteHandlers>();

  /** 建立（或复用）WS 连接，timeoutMs 内未打开则 reject */
  ensureConnected(timeoutMs = 2500): Promise<SocketTemplate> {
    if (this.socket?.isConnected) {
      return Promise.resolve(this.socket);
    }
    if (this.connecting) {
      return this.connecting;
    }

    const socket = this.build();
    this.socket = socket;
    this.connecting = new Promise<SocketTemplate>((resolve, reject) => {
      let settled = false;
      const fail = (reason: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          socket.close();
        } catch {
          /* ignore */
        }
        this.socket = null;
        this.connecting = null;
        reject(new Error(reason));
      };
      const timer = setTimeout(() => fail("websocket connect timeout"), timeoutMs);
      socket.on("connect", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(socket);
      });
      socket.on("error", () => fail("websocket connect error"));
      socket.connect();
    });
    return this.connecting;
  }

  /** 注册某请求的帧路由 */
  register(chatRequestId: string, handlers: RouteHandlers): void {
    this.routes.set(chatRequestId, handlers);
  }

  /** 移除路由 */
  unregister(chatRequestId: string): void {
    this.routes.delete(chatRequestId);
  }

  /** 发送 chat.start */
  emitStart(body: unknown): void {
    this.socket?.emit("chat.start", body);
  }

  /** 构建 WS 实例并绑定全局帧路由 */
  private build(): SocketTemplate {
    const origin = window.location.origin;
    const token = getAccessToken();
    const socket = createSocketService({
      protocol: "websocket",
      urls: [origin],
      path: "/ws/chat",
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      heartbeatInterval: 25000,
      query: token ? { "x-oauth-token": token } : undefined,
    });

    socket.on("chat.frame", (data) => {
      const d = data as ChatFrameData;
      const route = d?.chatRequestId ? this.routes.get(d.chatRequestId) : undefined;
      route?.frame(d);
    });
    socket.on("chat.error", (data) => {
      const d = data as ChatErrorData;
      const route = d?.chatRequestId ? this.routes.get(d.chatRequestId) : undefined;
      if (route) {
        route.error(d);
      }
    });
    return socket;
  }
}

export const chatSocketManager = new ChatSocketManager();
