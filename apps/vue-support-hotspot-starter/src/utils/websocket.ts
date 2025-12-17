/**
 * 全局 WebSocket 服务
 * 提供统一的 WebSocket 连接管理，所有页面可共享使用
 */
import { reactive, ref } from "vue";

export interface WsMessage {
  module: string;
  event: string;
  data: any;
  timestamp: number;
}

export type MessageHandler = (message: WsMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;

  public connected = ref(false);
  public messages = reactive<WsMessage[]>([]);

  /**
   * 连接 WebSocket
   */
  async connect(url?: string) {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    // 动态获取 WebSocket 端口
    let wsUrl = url;
    if (!wsUrl) {
      try {
        const agentPath = (window as any).agentPath || "/agent";
        const response = await fetch(`${agentPath}/websocket-config`);
        const config = await response.json();
        if (config.port) {
          // 使用当前页面的 host
          const host = window.location.hostname || "127.0.0.1";
          wsUrl = `ws://${host}:${config.port}`;
        }
      } catch (e) {
        console.warn("[获取 WebSocket 配置失败]", e);
      }
      // 回退默认值
      wsUrl = wsUrl || `ws://${window.location.hostname || "127.0.0.1"}:${(window as any).websocketPort || 28954}`;
    }

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("[WebSocket] 连接成功:", wsUrl);
        this.connected.value = true;
        this.isConnecting = false;
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.socket.onclose = () => {
        console.log("[WebSocket] 连接关闭");
        this.connected.value = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        this.scheduleReconnect(wsUrl);
      };

      this.socket.onerror = (error) => {
        console.error("[WebSocket] 连接错误:", error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error("[WebSocket] 创建连接失败:", error);
      this.isConnecting = false;
      this.scheduleReconnect(wsUrl);
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent) {
    try {
      // 处理 Blob 类型消息
      if (event.data instanceof Blob) {
        event.data.text().then((text: string) => {
          this.processMessage(text);
        });
      } else {
        this.processMessage(event.data);
      }
    } catch (error) {
      console.error("[WebSocket] 处理消息失败:", error);
    }
  }

  /**
   * 处理消息内容
   */
  private processMessage(text: string) {
    // 心跳响应
    if (text === "pong") {
      return;
    }

    try {
      const message: WsMessage = JSON.parse(text);
      
      // 保存消息（限制数量）
      this.messages.unshift(message);
      if (this.messages.length > 1000) {
        this.messages.pop();
      }

      // 触发事件处理器
      const eventKey = `${message.module}_${message.event}`;
      const handlers = this.handlers.get(eventKey);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (e) {
            console.error("[WebSocket] 处理器执行失败:", e);
          }
        });
      }

      // 触发通用处理器
      const allHandlers = this.handlers.get("*");
      if (allHandlers) {
        allHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (e) {
            console.error("[WebSocket] 通用处理器执行失败:", e);
          }
        });
      }
    } catch (error) {
      // 非 JSON 消息忽略
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send("ping");
      }
    }, 30000);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(url: string) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      console.log("[WebSocket] 尝试重连...");
      this.connect(url);
    }, 5000);
  }

  /**
   * 订阅消息
   * @param module 模块名称
   * @param event 事件名称
   * @param handler 处理函数
   * @returns 取消订阅函数
   */
  subscribe(module: string, event: string, handler: MessageHandler): () => void {
    const eventKey = `${module}_${event}`;
    if (!this.handlers.has(eventKey)) {
      this.handlers.set(eventKey, new Set());
    }
    this.handlers.get(eventKey)!.add(handler);

    return () => {
      const handlers = this.handlers.get(eventKey);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * 订阅所有消息
   * @param handler 处理函数
   * @returns 取消订阅函数
   */
  subscribeAll(handler: MessageHandler): () => void {
    if (!this.handlers.has("*")) {
      this.handlers.set("*", new Set());
    }
    this.handlers.get("*")!.add(handler);

    return () => {
      const handlers = this.handlers.get("*");
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * 获取指定事件的历史消息
   */
  getMessages(module: string, event: string): WsMessage[] {
    return this.messages.filter(m => m.module === module && m.event === event);
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected.value = false;
  }
}

// 导出单例
export const wsService = new WebSocketService();

// Vue 插件
export const WebSocketPlugin = {
  install(app: any) {
    app.config.globalProperties.$ws = wsService;
    app.provide("wsService", wsService);
  }
};
