/**
 * WebSocket 连接管理工具
 */

export interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onReconnect?: (attempt: number) => void;
  onMaxReconnectAttemptsReached?: () => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(options: WebSocketOptions) {
    this.options = {
      protocols: [],
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      heartbeatMessage: JSON.stringify({ type: 'ping' }),
      onOpen: () => {},
      onMessage: () => {},
      onError: () => {},
      onClose: () => {},
      onReconnect: () => {},
      onMaxReconnectAttemptsReached: () => {},
      ...options,
    };
  }

  /**
   * 连接WebSocket
   */
  connect(): void {
    try {
      this.ws = new WebSocket(this.options.url, this.options.protocols);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.handleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isManualClose = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
      return true;
    }
    return false;
  }

  /**
   * 发送JSON消息
   */
  sendJSON(data: any): boolean {
    return this.send(JSON.stringify(data));
  }

  /**
   * 获取连接状态
   */
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket连接已建立');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.options.onOpen(event);
    };

    this.ws.onmessage = (event) => {
      // 处理心跳响应
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          return; // 忽略心跳响应
        }
      } catch (e) {
        // 不是JSON格式，继续处理
      }
      
      this.options.onMessage(event);
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket错误:', event);
      this.options.onError(event);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket连接已关闭:', event.code, event.reason);
      this.clearTimers();
      this.options.onClose(event);
      
      if (!this.isManualClose) {
        this.handleReconnect();
      }
    };
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      this.options.onMaxReconnectAttemptsReached();
      return;
    }

    this.reconnectAttempts++;
    console.log(`尝试重连 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    this.options.onReconnect(this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send(this.options.heartbeatMessage);
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 清除定时器
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/**
 * 创建WebSocket连接
 */
export function createWebSocket(options: WebSocketOptions): WebSocketManager {
  return new WebSocketManager(options);
}

/**
 * 终端WebSocket连接
 */
export class TerminalWebSocket extends WebSocketManager {
  constructor(serverId: string | number, options: Partial<WebSocketOptions> = {}) {
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';
    const url = `${baseUrl}/ws/terminal/${serverId}`;
    
    super({
      url,
      heartbeatMessage: JSON.stringify({ type: 'ping', timestamp: Date.now() }),
      ...options,
    });
  }

  /**
   * 发送命令
   */
  sendCommand(command: string): boolean {
    return this.sendJSON({
      type: 'command',
      content: command,
      timestamp: Date.now(),
    });
  }

  /**
   * 发送控制信号
   */
  sendControl(signal: string): boolean {
    return this.sendJSON({
      type: 'control',
      signal,
      timestamp: Date.now(),
    });
  }
}

/**
 * 监控WebSocket连接
 */
export class MonitorWebSocket extends WebSocketManager {
  constructor(serverId: string | number, options: Partial<WebSocketOptions> = {}) {
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';
    const url = `${baseUrl}/ws/monitor/${serverId}`;
    
    super({
      url,
      heartbeatMessage: JSON.stringify({ type: 'ping', timestamp: Date.now() }),
      ...options,
    });
  }

  /**
   * 订阅指标
   */
  subscribeMetrics(metrics: string[]): boolean {
    return this.sendJSON({
      type: 'subscribe',
      metrics,
      timestamp: Date.now(),
    });
  }

  /**
   * 取消订阅指标
   */
  unsubscribeMetrics(metrics: string[]): boolean {
    return this.sendJSON({
      type: 'unsubscribe',
      metrics,
      timestamp: Date.now(),
    });
  }
}

/**
 * 日志WebSocket连接
 */
export class LogWebSocket extends WebSocketManager {
  constructor(serverId: string | number, options: Partial<WebSocketOptions> = {}) {
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';
    const url = `${baseUrl}/ws/logs/${serverId}`;
    
    super({
      url,
      heartbeatMessage: JSON.stringify({ type: 'ping', timestamp: Date.now() }),
      ...options,
    });
  }

  /**
   * 设置日志过滤器
   */
  setLogFilter(filter: {
    level?: string;
    source?: string;
    keyword?: string;
  }): boolean {
    return this.sendJSON({
      type: 'filter',
      filter,
      timestamp: Date.now(),
    });
  }

  /**
   * 开始实时日志
   */
  startRealTimeLog(): boolean {
    return this.sendJSON({
      type: 'start',
      timestamp: Date.now(),
    });
  }

  /**
   * 停止实时日志
   */
  stopRealTimeLog(): boolean {
    return this.sendJSON({
      type: 'stop',
      timestamp: Date.now(),
    });
  }
}

// 导出WebSocket状态常量
export const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type WSReadyState = typeof WS_READY_STATE[keyof typeof WS_READY_STATE];
