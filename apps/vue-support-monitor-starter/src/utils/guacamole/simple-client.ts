/**
 * 简化的 Guacamole 客户端
 * 直接使用 guacamole-common-js 原生功能，无需复杂封装
 */

import Guacamole from 'guacamole-common-js';

export interface SimpleGuacamoleConfig {
  serverId: number;
  protocol: 'rdp' | 'vnc' | 'ssh';
  host: string;
  port: number;
  username?: string;
  password?: string;
  resolution?: string;
  colorDepth?: number;
  enableAudio?: boolean;
  enableClipboard?: boolean;
}

export interface SimpleGuacamoleEvents {
  onStateChange?: (state: number) => void;
  onError?: (error: any) => void;
  onName?: (name: string) => void;
  onClipboard?: (stream: any, mimetype: string) => void;
}

/**
 * 简化的 Guacamole 客户端
 * 直接使用 guacamole-common-js，无需自定义逻辑
 */
export class SimpleGuacamoleClient {
  private client: any = null;
  private tunnel: any = null;
  private display: any = null;
  private mouse: any = null;
  private keyboard: any = null;
  private config: SimpleGuacamoleConfig;
  private events: SimpleGuacamoleEvents;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 2000; // 2秒
  private isDestroyed: boolean = false;
  private isConnecting: boolean = false;

  constructor(config: SimpleGuacamoleConfig, events: SimpleGuacamoleEvents = {}) {
    this.config = config;
    this.events = events;
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 如果已经销毁，不允许连接
        if (this.isDestroyed) {
          reject(new Error('客户端已销毁'));
          return;
        }

        // 防止重复连接
        if (this.isConnecting) {
          reject(new Error('正在连接中，请勿重复连接'));
          return;
        }

        // 如果已经连接，直接返回成功
        if (this.client && this.client.currentState === Guacamole.Client.CONNECTED) {
          resolve();
          return;
        }

        this.isConnecting = true;

        // 构建 WebSocket URL
        const wsUrl = this.buildWebSocketUrl();
        console.log('开始连接 Guacamole WebSocket:', wsUrl);

        // 创建 Guacamole WebSocket 隧道
        this.tunnel = new Guacamole.WebSocketTunnel(wsUrl);

        // 添加隧道事件监听
        this.tunnel.onerror = (error: any) => {
          console.error('WebSocket 隧道错误:', error);
          // 不立即处理错误，等待状态变化
        };

        this.tunnel.onstatechange = (state: number) => {
          console.log('WebSocket 隧道状态变化:', state);

          // 隧道连接成功时重置重连计数
          if (state === 1) { // OPEN 状态
            this.reconnectAttempts = 0;
            console.log('WebSocket 隧道连接成功');
          } else if (state === 3) { // CLOSED 状态
            console.log('WebSocket 隧道连接关闭');
            if (!this.isDestroyed) {
              this.handleConnectionError(new Error('隧道连接关闭'), resolve, reject);
            }
          }
        };

        // 创建 Guacamole 客户端
        this.client = new Guacamole.Client(this.tunnel);

        // 获取显示对象
        this.display = this.client.getDisplay();

        // 设置事件监听器
        this.client.onstatechange = (state: number) => {
          console.log('Guacamole 客户端状态变化:', state, this.getStateText(state));

          if (this.events.onStateChange) {
            this.events.onStateChange(state);
          }

          // 连接成功时设置输入处理器
          if (state === Guacamole.Client.CONNECTED) {
            console.log('Guacamole 连接成功，设置输入处理器');
            this.setupInputHandlers();
            this.isConnecting = false;
            resolve();
          } else if (state === Guacamole.Client.DISCONNECTED) {
            console.log('Guacamole 连接断开');
            this.isConnecting = false;
            // 只有在非销毁状态下才视为错误
            if (!this.isDestroyed) {
              reject(new Error('连接断开'));
            }
          } else if (state < 0) {
            console.error('Guacamole 客户端错误状态:', state);
            this.isConnecting = false;
            reject(new Error(`客户端错误: ${state}`));
          }
        };

        this.client.onerror = (error: any) => {
          console.error('Guacamole 客户端错误:', error);
          this.isConnecting = false;

          if (this.events.onError) {
            this.events.onError(error);
          }

          reject(error);
        };

        this.client.onname = (name: string) => {
          console.log('Guacamole 名称变化:', name);
          if (this.events.onName) {
            this.events.onName(name);
          }
        };

        this.client.onclipboard = (stream: any, mimetype: string) => {
          if (this.events.onClipboard) {
            this.events.onClipboard(stream, mimetype);
          }
        };
         // 后端只需要serverId参数，其他参数通过服务器配置获取
        const params = new URLSearchParams({
          serverId: this.config.serverId.toString()
        });

        // 设置连接超时
        const connectionTimeout = setTimeout(() => {
          if (!this.isDestroyed && this.client && this.client.currentState !== Guacamole.Client.CONNECTED) {
            console.error('Guacamole 连接超时');
            this.disconnect();
            reject(new Error('连接超时'));
          }
        }, 30000); // 30秒超时

        // 开始连接
        this.client.connect(params.toString());

        // 连接成功后清除超时
        const originalResolve = resolve;
        resolve = () => {
          clearTimeout(connectionTimeout);
          originalResolve();
        };

        // 连接失败后清除超时
        const originalReject = reject;
        reject = (error: any) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          originalReject(error);
        };

      } catch (error) {
        console.error('Guacamole 连接失败:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 构建 WebSocket URL
   */
  private buildWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    // 使用环境变量中的API基础路径
    const baseUrl = import.meta.env.VITE_APP_API_BASE_URL || '/monitor/api';
    const path = baseUrl + `/websocket/${this.config.protocol}`;

    const url = `${protocol}//${host}${path}`;
    console.log('构建WebSocket URL:', url);
    return url;
  }

  /**
   * 设置输入处理器
   */
  private setupInputHandlers() {
    if (!this.display) return;
    
    // 创建鼠标和键盘处理器
    this.mouse = new Guacamole.Mouse(this.display.getElement());
    this.keyboard = new Guacamole.Keyboard(document);
    
    // 鼠标事件处理
    this.mouse.onmousedown = 
    this.mouse.onmouseup = 
    this.mouse.onmousemove = (mouseState: any) => {
      if (this.client) {
        this.client.sendMouseState(mouseState);
      }
    };

    // 键盘事件处理
    this.keyboard.onkeydown = (keysym: number) => {
      if (this.client) {
        this.client.sendKeyEvent(1, keysym);
      }
    };

    this.keyboard.onkeyup = (keysym: number) => {
      if (this.client) {
        this.client.sendKeyEvent(0, keysym);
      }
    };
  }

  /**
   * 获取状态文本
   */
  private getStateText(state: number): string {
    switch (state) {
      case Guacamole.Client.IDLE: return 'IDLE';
      case Guacamole.Client.CONNECTING: return 'CONNECTING';
      case Guacamole.Client.WAITING: return 'WAITING';
      case Guacamole.Client.CONNECTED: return 'CONNECTED';
      case Guacamole.Client.DISCONNECTING: return 'DISCONNECTING';
      case Guacamole.Client.DISCONNECTED: return 'DISCONNECTED';
      default: return `UNKNOWN(${state})`;
    }
  }

  /**
   * 绑定到容器元素
   */
  attachTo(container: HTMLElement) {
    if (this.display && container) {
      // 清空容器内容
      container.innerHTML = '';

      // 将 Guacamole 显示元素添加到容器
      container.appendChild(this.display.getElement());

      // 设置样式
      const displayElement = this.display.getElement();
      displayElement.style.width = '100%';
      displayElement.style.height = '100%';
      displayElement.style.objectFit = 'contain';

      // 设置容器样式
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('断开 Guacamole 连接');
    this.isConnecting = false;

    if (this.client) {
      this.client.disconnect();
    }

    if (this.tunnel) {
      this.tunnel.disconnect();
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.client && this.client.currentState === Guacamole.Client.CONNECTED;
  }

  /**
   * 发送剪贴板数据
   */
  sendClipboard(data: string, mimetype = 'text/plain') {
    if (this.client && this.isConnected()) {
      const stream = this.client.createClipboardStream(mimetype);
      const writer = new Guacamole.StringWriter(stream);
      writer.sendText(data);
      writer.sendEnd();
    }
  }

  /**
   * 截图
   */
  screenshot(): string | null {
    if (this.display) {
      const canvas = this.display.getElement();
      return canvas.toDataURL('image/png');
    }
    return null;
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(error: any, resolve: (value: void) => void, reject: (reason: any) => void) {
    console.error('WebSocket 连接错误:', error);

    if (this.isDestroyed) {
      reject(error);
      return;
    }

    // 如果还有重连机会
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        if (!this.isDestroyed) {
          this.connect().then(resolve).catch(reject);
        }
      }, this.reconnectDelay);
    } else {
      // 重连次数用完，触发错误回调
      if (this.events.onError) {
        this.events.onError(error);
      }
      reject(error);
    }
  }

  /**
   * 销毁客户端
   */
  destroy() {
    this.isDestroyed = true;
    this.disconnect();

    if (this.mouse) {
      this.mouse.onmousedown = null;
      this.mouse.onmouseup = null;
      this.mouse.onmousemove = null;
    }

    if (this.keyboard) {
      this.keyboard.onkeydown = null;
      this.keyboard.onkeyup = null;
    }

    this.client = null;
    this.tunnel = null;
    this.display = null;
    this.mouse = null;
    this.keyboard = null;
  }
}

// 导出 Guacamole 常量
export const GuacamoleStates = {
  IDLE: Guacamole.Client.IDLE || 0,
  CONNECTING: Guacamole.Client.CONNECTING || 1,
  WAITING: Guacamole.Client.WAITING || 2,
  CONNECTED: Guacamole.Client.CONNECTED || 4,
  DISCONNECTING: Guacamole.Client.DISCONNECTING || 8,
  DISCONNECTED: Guacamole.Client.DISCONNECTED || 16
};

export default SimpleGuacamoleClient;
