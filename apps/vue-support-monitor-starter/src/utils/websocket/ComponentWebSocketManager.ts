import { WebSocketMessageType, type ComponentRealtimeMessage, type ServerWebSocketMessage } from "@/api/server";

/**
 * 组件WebSocket管理器
 * 负责管理组件实时数据的WebSocket连接和消息处理
 * 复用服务器主页现有的WebSocket推送机制
 */
export class ComponentWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;
  private messageHandlers = new Map<string, Set<(data: any) => void>>();
  private componentSubscriptions = new Map<number, Set<string>>(); // componentId -> Set<expressionKeys>
  private serverComponentMapping = new Map<number, Set<number>>(); // serverId -> Set<componentIds>

  constructor(private wsUrl: string) {}

  /**
   * 连接WebSocket
   */
  async connect(): Promise<boolean> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return true;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log("组件WebSocket连接已建立");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();

        // 重新订阅之前的组件
        this.resubscribeComponents();
      };

      this.ws.onmessage = event => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log("组件WebSocket连接已关闭");
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = error => {
        console.error("组件WebSocket连接错误:", error);
        this.isConnecting = false;
      };

      return true;
    } catch (error) {
      console.error("创建WebSocket连接失败:", error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * 断开WebSocket连接
   */
  disconnect() {
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.componentSubscriptions.clear();
    this.messageHandlers.clear();
  }

  /**
   * 订阅组件实时数据
   */
  subscribeComponent(componentId: number, handler: (data: ComponentRealtimeMessage) => void) {
    // 添加消息处理器
    const handlerKey = `component_${componentId}`;
    if (!this.messageHandlers.has(handlerKey)) {
      this.messageHandlers.set(handlerKey, new Set());
    }
    this.messageHandlers.get(handlerKey)!.add(handler);

    // 记录订阅
    this.componentSubscriptions.add(componentId);

    // 发送订阅消息
    if (this.isConnected()) {
      this.sendSubscribeMessage(componentId);
    }
  }

  /**
   * 取消订阅组件实时数据
   */
  unsubscribeComponent(componentId: number, handler?: (data: ComponentRealtimeMessage) => void) {
    const handlerKey = `component_${componentId}`;

    if (handler) {
      // 移除特定处理器
      const handlers = this.messageHandlers.get(handlerKey);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(handlerKey);
          this.componentSubscriptions.delete(componentId);

          // 发送取消订阅消息
          if (this.isConnected()) {
            this.sendUnsubscribeMessage(componentId);
          }
        }
      }
    } else {
      // 移除所有处理器
      this.messageHandlers.delete(handlerKey);
      this.componentSubscriptions.delete(componentId);

      // 发送取消订阅消息
      if (this.isConnected()) {
        this.sendUnsubscribeMessage(componentId);
      }
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 处理WebSocket消息
   */
  private handleMessage(data: string) {
    try {
      const message: ServerWebSocketMessage = JSON.parse(data);

      switch (message.messageType) {
        case WebSocketMessageType.COMPONENT_REALTIME_DATA:
          this.handleComponentRealtimeData(message);
          break;
        case WebSocketMessageType.COMPONENT_DATA_UPDATE:
          this.handleComponentDataUpdate(message);
          break;
        default:
          console.log("收到未处理的WebSocket消息:", message);
      }
    } catch (error) {
      console.error("解析WebSocket消息失败:", error);
    }
  }

  /**
   * 处理组件实时数据消息
   */
  private handleComponentRealtimeData(message: ServerWebSocketMessage) {
    if (!message.data || !message.data.componentId) {
      return;
    }

    const componentId = message.data.componentId;
    const handlerKey = `component_${componentId}`;
    const handlers = this.messageHandlers.get(handlerKey);

    if (handlers) {
      const realtimeMessage: ComponentRealtimeMessage = {
        componentId,
        componentName: message.data.componentName,
        data: message.data.data,
        type: "realtime",
        timestamp: message.timestamp
      };

      handlers.forEach(handler => {
        try {
          handler(realtimeMessage);
        } catch (error) {
          console.error("处理组件实时数据失败:", error);
        }
      });
    }
  }

  /**
   * 处理组件数据更新消息
   */
  private handleComponentDataUpdate(message: ServerWebSocketMessage) {
    if (!message.data || !message.data.componentId) {
      return;
    }

    const componentId = message.data.componentId;
    const handlerKey = `component_${componentId}`;
    const handlers = this.messageHandlers.get(handlerKey);

    if (handlers) {
      const updateMessage: ComponentRealtimeMessage = {
        componentId,
        componentName: message.data.componentName,
        data: message.data.data,
        type: "update",
        timestamp: message.timestamp
      };

      handlers.forEach(handler => {
        try {
          handler(updateMessage);
        } catch (error) {
          console.error("处理组件数据更新失败:", error);
        }
      });
    }
  }

  /**
   * 发送订阅消息
   */
  private sendSubscribeMessage(componentId: number) {
    if (!this.isConnected()) return;

    const message = {
      messageType: WebSocketMessageType.COMPONENT_SUBSCRIBE,
      data: { componentId },
      timestamp: Date.now()
    };

    this.ws!.send(JSON.stringify(message));
    console.log(`发送组件订阅消息: componentId=${componentId}`);
  }

  /**
   * 发送取消订阅消息
   */
  private sendUnsubscribeMessage(componentId: number) {
    if (!this.isConnected()) return;

    const message = {
      messageType: WebSocketMessageType.COMPONENT_UNSUBSCRIBE,
      data: { componentId },
      timestamp: Date.now()
    };

    this.ws!.send(JSON.stringify(message));
    console.log(`发送组件取消订阅消息: componentId=${componentId}`);
  }

  /**
   * 重新订阅所有组件
   */
  private resubscribeComponents() {
    this.componentSubscriptions.forEach(componentId => {
      this.sendSubscribeMessage(componentId);
    });
  }

  /**
   * 安排重连
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("WebSocket重连次数已达上限，停止重连");
      return;
    }

    this.clearReconnectTimer();

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`尝试WebSocket重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// 创建全局实例
let globalWebSocketManager: ComponentWebSocketManager | null = null;

/**
 * 获取全局WebSocket管理器实例
 */
export function getComponentWebSocketManager(): ComponentWebSocketManager {
  if (!globalWebSocketManager) {
    // 从环境变量或配置中获取WebSocket URL
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";
    globalWebSocketManager = new ComponentWebSocketManager(wsUrl);
  }
  return globalWebSocketManager;
}

/**
 * 销毁全局WebSocket管理器
 */
export function destroyComponentWebSocketManager() {
  if (globalWebSocketManager) {
    globalWebSocketManager.disconnect();
    globalWebSocketManager = null;
  }
}
