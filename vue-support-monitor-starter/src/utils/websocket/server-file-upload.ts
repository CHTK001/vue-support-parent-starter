import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

// WebSocket连接状态
export enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR'
}

// 消息类型
export enum MessageType {
  UPLOAD_PROGRESS = 'UPLOAD_PROGRESS',
  UPLOAD_STATUS_CHANGE = 'UPLOAD_STATUS_CHANGE',
  UPLOAD_STARTED = 'UPLOAD_STARTED',
  UPLOAD_COMPLETED = 'UPLOAD_COMPLETED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  UPLOAD_CANCELLED = 'UPLOAD_CANCELLED',
  QUEUE_STATUS = 'QUEUE_STATUS',
  SERVER_STATUS = 'SERVER_STATUS',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  ERROR_NOTIFICATION = 'ERROR_NOTIFICATION'
}

// WebSocket消息格式
export interface WebSocketMessage {
  type: MessageType;
  taskId?: number;
  serverId?: number;
  data: any;
  timestamp: number;
}

// 上传进度数据
export interface UploadProgressData {
  taskId: number;
  progress: number;
  speed: number;
  transferredBytes: number;
  totalBytes: number;
  remainingTime?: number;
  status: string;
}

// 服务器文件上传WebSocket服务
class ServerFileUploadWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private heartbeatInterval = 30000;

  // 响应式状态
  public status = ref<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  public isConnected = ref(false);
  public lastError = ref<string>('');
  public messageCount = ref(0);

  // 事件监听器
  private listeners = reactive<Record<string, Array<(data: any) => void>>>({});

  // 订阅信息
  private subscriptions = reactive<{
    tasks: Set<number>;
    servers: Set<number>;
    systemAlerts: boolean;
  }>({
    tasks: new Set(),
    servers: new Set(),
    systemAlerts: false
  });

  constructor(private baseUrl: string = '') {
    // 如果没有提供baseUrl，使用当前域名
    if (!this.baseUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.baseUrl = `${protocol}//${window.location.host}`;
    }
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.status.value = WebSocketStatus.CONNECTING;
        
        const wsUrl = `${this.baseUrl}/ws/server/file-upload`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.status.value = WebSocketStatus.CONNECTED;
          this.isConnected.value = true;
          this.reconnectAttempts = 0;
          this.lastError.value = '';
          
          // 启动心跳
          this.startHeartbeat();
          
          // 重新订阅之前的内容
          this.resubscribe();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭', event);
          this.status.value = WebSocketStatus.DISCONNECTED;
          this.isConnected.value = false;
          this.stopHeartbeat();
          
          // 如果不是主动关闭，尝试重连
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket连接错误', error);
          this.status.value = WebSocketStatus.ERROR;
          this.lastError.value = 'WebSocket连接错误';
          reject(error);
        };

      } catch (error) {
        console.error('创建WebSocket连接失败', error);
        this.status.value = WebSocketStatus.ERROR;
        this.lastError.value = '创建WebSocket连接失败';
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, '主动断开连接');
      this.ws = null;
    }
    
    this.status.value = WebSocketStatus.DISCONNECTED;
    this.isConnected.value = false;
  }

  /**
   * 发送消息
   */
  private send(message: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败', error);
      return false;
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      this.messageCount.value++;
      
      // 触发对应类型的监听器
      const typeListeners = this.listeners[message.type];
      if (typeListeners) {
        typeListeners.forEach(listener => {
          try {
            listener(message.data);
          } catch (error) {
            console.error('执行WebSocket消息监听器失败', error);
          }
        });
      }

      // 触发通用监听器
      const allListeners = this.listeners['*'];
      if (allListeners) {
        allListeners.forEach(listener => {
          try {
            listener(message);
          } catch (error) {
            console.error('执行WebSocket通用监听器失败', error);
          }
        });
      }

    } catch (error) {
      console.error('解析WebSocket消息失败', error);
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限');
      ElMessage.error('WebSocket连接失败，请刷新页面重试');
      return;
    }

    this.reconnectAttempts++;
    console.log(`尝试第${this.reconnectAttempts}次重连...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // 重连失败，继续尝试
        this.attemptReconnect();
      });
    }, this.reconnectInterval);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'PING', timestamp: Date.now() });
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 重新订阅
   */
  private resubscribe(): void {
    // 重新订阅任务进度
    this.subscriptions.tasks.forEach(taskId => {
      this.subscribeTaskProgress(taskId);
    });

    // 重新订阅服务器状态
    this.subscriptions.servers.forEach(serverId => {
      this.subscribeServerStatus(serverId);
    });

    // 重新订阅系统告警
    if (this.subscriptions.systemAlerts) {
      this.subscribeSystemAlerts();
    }
  }

  /**
   * 添加事件监听器
   */
  on(type: MessageType | '*', listener: (data: any) => void): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  /**
   * 移除事件监听器
   */
  off(type: MessageType | '*', listener: (data: any) => void): void {
    const typeListeners = this.listeners[type];
    if (typeListeners) {
      const index = typeListeners.indexOf(listener);
      if (index > -1) {
        typeListeners.splice(index, 1);
      }
    }
  }

  /**
   * 订阅任务进度
   */
  subscribeTaskProgress(taskId: number): void {
    this.subscriptions.tasks.add(taskId);
    this.send({
      type: 'SUBSCRIBE_TASK_PROGRESS',
      taskId,
      timestamp: Date.now()
    });
  }

  /**
   * 取消订阅任务进度
   */
  unsubscribeTaskProgress(taskId: number): void {
    this.subscriptions.tasks.delete(taskId);
    this.send({
      type: 'UNSUBSCRIBE_TASK_PROGRESS',
      taskId,
      timestamp: Date.now()
    });
  }

  /**
   * 订阅服务器状态
   */
  subscribeServerStatus(serverId: number): void {
    this.subscriptions.servers.add(serverId);
    this.send({
      type: 'SUBSCRIBE_SERVER_STATUS',
      serverId,
      timestamp: Date.now()
    });
  }

  /**
   * 取消订阅服务器状态
   */
  unsubscribeServerStatus(serverId: number): void {
    this.subscriptions.servers.delete(serverId);
    this.send({
      type: 'UNSUBSCRIBE_SERVER_STATUS',
      serverId,
      timestamp: Date.now()
    });
  }

  /**
   * 订阅系统告警
   */
  subscribeSystemAlerts(): void {
    this.subscriptions.systemAlerts = true;
    this.send({
      type: 'SUBSCRIBE_SYSTEM_ALERTS',
      timestamp: Date.now()
    });
  }

  /**
   * 取消订阅系统告警
   */
  unsubscribeSystemAlerts(): void {
    this.subscriptions.systemAlerts = false;
    this.send({
      type: 'UNSUBSCRIBE_SYSTEM_ALERTS',
      timestamp: Date.now()
    });
  }

  /**
   * 获取连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status.value;
  }

  /**
   * 获取订阅信息
   */
  getSubscriptions() {
    return {
      tasks: Array.from(this.subscriptions.tasks),
      servers: Array.from(this.subscriptions.servers),
      systemAlerts: this.subscriptions.systemAlerts
    };
  }
}

// 创建全局实例
export const serverFileUploadWS = new ServerFileUploadWebSocketService();

// 导出类型和服务
export { ServerFileUploadWebSocketService };
export type { WebSocketMessage, UploadProgressData };
