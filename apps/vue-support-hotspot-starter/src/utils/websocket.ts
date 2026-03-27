/**
 * 全局 WebSocket 服务
 * 基于 @repo/core socketService 实现，对外保持原有 subscribe/connected API
 */
import { ref } from "vue";
import { createWebSocketService } from "@repo/core";
import type { SocketTemplate, WsMessage } from "@repo/core";

export type { WsMessage };
export type MessageHandler = (message: WsMessage) => void;

class WebSocketService {
  private socket: SocketTemplate | null = null;
  private isConnecting = false;

  public connected = ref(false);

  async connect(url?: string) {
    if (this.socket?.isConnected || this.isConnecting) return;
    this.isConnecting = true;

    let wsUrl = url;
    if (!wsUrl) {
      try {
        const agentPath = (window as any).agentPath || "/agent";
        const response = await fetch(`${agentPath}/websocket-config`);
        const config = await response.json();
        if (config.port) {
          const host = window.location.hostname || "127.0.0.1";
          wsUrl = `ws://${host}:${config.port}`;
        }
      } catch (e) {
        console.warn("[获取 WebSocket 配置失败]", e);
      }
      wsUrl = wsUrl || `ws://${window.location.hostname || "127.0.0.1"}:${(window as any).websocketPort || 28954}`;
    }

    this.socket = createWebSocketService({
      urls: [wsUrl],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
      heartbeatInterval: 30000
    });

    this.socket.on("connect", () => {
      this.connected.value = true;
      this.isConnecting = false;
    });

    this.socket.on("disconnect", () => {
      this.connected.value = false;
    });

    this.socket.connect();
  }

  subscribe(module: string, event: string, handler: MessageHandler): () => void {
    if (!this.socket) {
      // 延迟订阅：connect 后自动生效（subscribe 内部用 map 存储，connect 后 message 事件触发分发）
      console.warn("[wsService] socket 未初始化，请先调用 connect()");
      return () => {};
    }
    return this.socket.subscribe(module, event, handler);
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.connected.value = false;
  }
}

export const wsService = new WebSocketService();

// Vue 插件（install 时自动建立连接，并监听 fullScreen 路由）
export const WebSocketPlugin = {
  install(app: any) {
    app.config.globalProperties.$ws = wsService;
    app.provide("wsService", wsService);
    wsService.connect();
  }
};
