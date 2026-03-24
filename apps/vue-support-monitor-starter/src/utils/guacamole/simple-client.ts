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

  // 显示设置
  width?: number;
  height?: number;
  resolution?: string;
  colorDepth?: number;
  dpi?: number;

  // 功能设置
  enableAudio?: boolean;
  enableClipboard?: boolean;
  enableCursor?: boolean;
  readOnly?: boolean;

  // 安全设置
  security?: string;
  ignoreCert?: boolean;
  domain?: string;

  // 性能设置
  enableWallpaper?: boolean;
  enableTheming?: boolean;
  enableFontSmoothing?: boolean;
  enableFullWindowDrag?: boolean;
  enableDesktopComposition?: boolean;
  enableMenuAnimations?: boolean;

  // 连接设置
  connectTimeout?: number;
  heartbeatInterval?: number;
  autoRetry?: boolean;
  maxRetryAttempts?: number;
  retryInterval?: number;

  // RDP特定设置
  serverLayout?: string;
  enablePrinting?: boolean;
  enableDrive?: boolean;

  // VNC特定设置
  swapRedBlue?: boolean;
  encodings?: string;
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

  // 心跳相关
  private heartbeatTimer: number | null = null;
  private heartbeatInterval: number = 30000; // 默认30秒
  private lastHeartbeatTime: number = 0;
  private heartbeatTimeoutTimer: number | null = null;
  private heartbeatTimeout: number = 60000; // 心跳超时时间，默认60秒

  constructor(config: SimpleGuacamoleConfig, events: SimpleGuacamoleEvents = {}) {
    this.config = config;
    this.events = events;

    // 初始化心跳间隔
    if (config.heartbeatInterval) {
      this.heartbeatInterval = config.heartbeatInterval;
    }

    // 设置心跳超时时间为心跳间隔的2倍
    this.heartbeatTimeout = this.heartbeatInterval * 2;
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

          // 连接成功时设置输入处理器和启动心跳
          if (state === Guacamole.Client.CONNECTED) {
            console.log('Guacamole 连接成功，设置输入处理器');
            this.setupInputHandlers();
            this.startHeartbeat();
            this.isConnecting = false;
            resolve();
          } else if (state === Guacamole.Client.DISCONNECTED) {
            console.log('Guacamole 连接断开');
            this.stopHeartbeat();
            this.isConnecting = false;
            // 只有在非销毁状态下才视为错误
            if (!this.isDestroyed) {
              reject(new Error('连接断开'));
            }
          } else if (state < 0) {
            console.error('Guacamole 客户端错误状态:', state);
            this.stopHeartbeat();
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

    // 只传递serverId，其他参数通过Guacamole的connect方法传递
    const params = new URLSearchParams();
    params.append('serverId', this.config.serverId.toString());

    const url = `${protocol}//${host}${path}?${params.toString()}`;
    console.log('构建WebSocket URL:', url);
    return url;
  }

  /**
   * 更新配置并重连
   */
  async updateConfig(newConfig: Partial<SimpleGuacamoleConfig>): Promise<void> {
    // 检查是否有参数变更
    const hasChanges = this.hasConfigChanges(newConfig);

    if (!hasChanges) {
      console.log('配置无变更，跳过重连');
      return;
    }

    console.log('检测到配置变更，准备重连...', newConfig);

    // 更新配置
    this.config = { ...this.config, ...newConfig };

    // 如果当前已连接，先断开连接
    if (this.client && this.client.currentState === Guacamole.Client.CONNECTED) {
      console.log('断开现有连接...');
      this.disconnect();

      // 等待一小段时间确保连接完全断开
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 重新连接
    console.log('使用新配置重新连接...');
    return this.connect();
  }

  /**
   * 检查配置是否有变更
   */
  private hasConfigChanges(newConfig: Partial<SimpleGuacamoleConfig>): boolean {
    const importantKeys: (keyof SimpleGuacamoleConfig)[] = [
      'width', 'height', 'resolution', 'colorDepth', 'dpi',
      'enableAudio', 'enableClipboard', 'enableCursor', 'readOnly',
      'security', 'ignoreCert', 'domain',
      'enableWallpaper', 'enableTheming', 'enableFontSmoothing',
      'enableFullWindowDrag', 'enableDesktopComposition', 'enableMenuAnimations',
      'connectTimeout', 'heartbeatInterval', 'autoRetry', 'maxRetryAttempts', 'retryInterval',
      'serverLayout', 'enablePrinting', 'enableDrive',
      'swapRedBlue', 'encodings'
    ];

    for (const key of importantKeys) {
      if (newConfig[key] !== undefined && newConfig[key] !== this.config[key]) {
        console.log(`配置变更检测: ${key} 从 ${this.config[key]} 变更为 ${newConfig[key]}`);
        return true;
      }
    }

    return false;
  }

  /**
   * 获取当前配置的哈希值（用于变更检测）
   */
  private getConfigHash(): string {
    const configStr = JSON.stringify({
      width: this.config.width,
      height: this.config.height,
      resolution: this.config.resolution,
      colorDepth: this.config.colorDepth,
      dpi: this.config.dpi,
      enableAudio: this.config.enableAudio,
      enableClipboard: this.config.enableClipboard,
      enableCursor: this.config.enableCursor,
      readOnly: this.config.readOnly,
      security: this.config.security,
      ignoreCert: this.config.ignoreCert,
      domain: this.config.domain,
      heartbeatInterval: this.config.heartbeatInterval,
      serverLayout: this.config.serverLayout,
      enablePrinting: this.config.enablePrinting,
      enableDrive: this.config.enableDrive,
      swapRedBlue: this.config.swapRedBlue,
      encodings: this.config.encodings
    });

    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < configStr.length; i++) {
      const char = configStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
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

    // 停止心跳
    this.stopHeartbeat();

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
   * 启动心跳
   */
  private startHeartbeat(): void {
    // 如果心跳间隔为0或负数，则不启动心跳
    if (this.heartbeatInterval <= 0) {
      console.log('心跳间隔为0，跳过心跳启动');
      return;
    }

    console.log(`启动心跳，间隔: ${this.heartbeatInterval}ms`);

    // 清除现有的心跳定时器
    this.stopHeartbeat();

    // 设置心跳定时器
    this.heartbeatTimer = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);

    // 记录心跳启动时间
    this.lastHeartbeatTime = Date.now();
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      console.log('停止心跳');
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * 发送心跳
   */
  private sendHeartbeat(): void {
    if (!this.isConnected()) {
      console.log('连接已断开，停止发送心跳');
      this.stopHeartbeat();
      return;
    }

    try {
      // 发送心跳指令
      if (this.client) {
        // 使用Guacamole的nop指令作为心跳
        this.client.sendMessage('nop');
        console.log('发送心跳');

        // 更新最后心跳时间
        this.lastHeartbeatTime = Date.now();

        // 设置心跳超时检测
        this.setHeartbeatTimeout();
      }
    } catch (error) {
      console.error('发送心跳失败:', error);
      // 心跳发送失败，可能连接有问题，尝试重连
      this.handleHeartbeatFailure();
    }
  }

  /**
   * 设置心跳超时检测
   */
  private setHeartbeatTimeout(): void {
    // 清除现有的超时定时器
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }

    // 设置新的超时定时器
    this.heartbeatTimeoutTimer = window.setTimeout(() => {
      console.warn('心跳超时，连接可能已断开');
      this.handleHeartbeatTimeout();
    }, this.heartbeatTimeout);
  }

  /**
   * 处理心跳超时
   */
  private handleHeartbeatTimeout(): void {
    console.error('心跳超时，尝试重连');

    // 停止心跳
    this.stopHeartbeat();

    // 如果启用了自动重连，则尝试重连
    if (this.config.autoRetry !== false) {
      this.handleConnectionError(new Error('心跳超时'), () => {}, () => {});
    }
  }

  /**
   * 处理心跳失败
   */
  private handleHeartbeatFailure(): void {
    console.error('心跳发送失败');

    // 停止心跳
    this.stopHeartbeat();

    // 如果启用了自动重连，则尝试重连
    if (this.config.autoRetry !== false) {
      this.handleConnectionError(new Error('心跳发送失败'), () => {}, () => {});
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
