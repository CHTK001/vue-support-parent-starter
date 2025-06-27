/**
 * Guacamole 客户端工具类
 * 基于 guacamole-common-js 实现
 */

import Guacamole from 'guacamole-common-js';

export interface GuacamoleConfig {
  /** WebSocket 连接 */
  websocket?: WebSocket;
  /** 服务器ID */
  serverId?: number;
  /** 连接协议 */
  protocol: 'rdp' | 'vnc' | 'ssh';
  /** 服务器主机 */
  host: string;
  /** 服务器端口 */
  port: number;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** 分辨率 */
  resolution?: string;
  /** 颜色深度 */
  colorDepth?: number;
  /** 启用音频 */
  enableAudio?: boolean;
  /** 启用剪贴板 */
  enableClipboard?: boolean;
  /** 启用光标 */
  enableCursor?: boolean;
  /** 视图模式 */
  viewMode?: string;
  /** 颜色质量 */
  colorQuality?: string;
}

export interface GuacamoleEvents {
  /** 连接状态变化 */
  onStateChange?: (state: number) => void;
  /** 错误事件 */
  onError?: (error: any) => void;
  /** 名称变化 */
  onName?: (name: string) => void;
  /** 剪贴板事件 */
  onClipboard?: (stream: any, mimetype: string) => void;
  /** 文件接收 */
  onFile?: (stream: any, mimetype: string, filename: string) => void;
  /** 管道事件 */
  onPipe?: (stream: any, mimetype: string, name: string) => void;
  /** 同步事件 */
  onSync?: (timestamp: number) => void;
}

export class GuacamoleClient {
  private client: any;
  private tunnel: any;
  private display: any;
  private mouse: any;
  private keyboard: any;
  private config: GuacamoleConfig;
  private events: GuacamoleEvents;
  private canvas: HTMLCanvasElement | null = null;
  private connected = false;
  private connecting = false;

  constructor(config: GuacamoleConfig, events: GuacamoleEvents = {}) {
    this.config = config;
    this.events = events;
    this.initializeClient();
  }

  /**
   * 初始化 Guacamole 客户端
   */
  private initializeClient() {
    try {
      // 创建自定义WebSocket连接，而不是使用Guacamole的WebSocketTunnel
      this.initializeWebSocket();
    } catch (error) {
      console.error('初始化 Guacamole 客户端失败:', error);
      throw error;
    }
  }

  /**
   * 初始化WebSocket连接
   */
  private initializeWebSocket() {
    const wsUrl = this.getWebSocketUrl();
    console.log('连接WebSocket:', wsUrl);

    this.tunnel = new WebSocket(wsUrl);

    this.tunnel.onopen = () => {
      console.log('WebSocket连接已建立');
      this.connected = true;
      this.connecting = false;

      // 发送连接请求
      this.sendConnectRequest();

      if (this.events.onStateChange) {
        this.events.onStateChange(1); // CONNECTED状态
      }
    };

    this.tunnel.onmessage = (event) => {
      this.handleWebSocketMessage(event);
    };

    this.tunnel.onclose = () => {
      console.log('WebSocket连接已关闭');
      this.connected = false;
      this.connecting = false;

      if (this.events.onStateChange) {
        this.events.onStateChange(0); // DISCONNECTED状态
      }
    };

    this.tunnel.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
      this.connected = false;
      this.connecting = false;

      if (this.events.onError) {
        this.events.onError(error);
      }
    };
  }

  /**
   * 发送连接请求
   */
  private sendConnectRequest() {
    const connectData = {
      action: 'connect',
      serverId: this.config.serverId,
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      protocol: this.config.protocol
    };

    // 添加协议特定参数
    if (this.config.protocol === 'rdp') {
      Object.assign(connectData, {
        resolution: this.config.resolution || '1920x1080',
        colorDepth: this.config.colorDepth || 32,
        enableAudio: this.config.enableAudio !== false
      });
    } else if (this.config.protocol === 'vnc') {
      Object.assign(connectData, {
        viewMode: this.config.viewMode || 'fit',
        colorQuality: this.config.colorQuality || 'high',
        enableCursor: this.config.enableCursor !== false
      });
    }

    if (this.config.enableClipboard !== undefined) {
      Object.assign(connectData, { enableClipboard: this.config.enableClipboard });
    }

    this.sendMessage(connectData);
  }

  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      console.log('收到WebSocket消息:', data);

      switch (data.type) {
        case 'connect-result':
          this.handleConnectResult(data);
          break;
        case 'rdp-data':
        case 'vnc-data':
          this.handleDisplayData(data);
          break;
        case 'error':
          this.handleError(data);
          break;
        default:
          console.log('未处理的消息类型:', data.type);
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  }

  /**
   * 获取 WebSocket URL
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const path = `/websocket/${this.config.protocol}`;

    return `${protocol}//${host}${path}`;
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers() {
    // 客户端状态变化
    this.client.onstatechange = (state: number) => {
      console.log('Guacamole 状态变化:', state);
      this.connected = state === Guacamole.Client.CONNECTED;
      this.connecting = state === Guacamole.Client.CONNECTING;
      
      if (this.events.onStateChange) {
        this.events.onStateChange(state);
      }
    };

    // 错误处理
    this.client.onerror = (error: any) => {
      console.error('Guacamole 客户端错误:', error);
      this.connected = false;
      this.connecting = false;
      
      if (this.events.onError) {
        this.events.onError(error);
      }
    };

    // 名称变化
    this.client.onname = (name: string) => {
      console.log('Guacamole 名称变化:', name);
      if (this.events.onName) {
        this.events.onName(name);
      }
    };

    // 剪贴板事件
    this.client.onclipboard = (stream: any, mimetype: string) => {
      if (this.events.onClipboard) {
        this.events.onClipboard(stream, mimetype);
      }
    };

    // 文件接收
    this.client.onfile = (stream: any, mimetype: string, filename: string) => {
      if (this.events.onFile) {
        this.events.onFile(stream, mimetype, filename);
      }
    };

    // 管道事件
    this.client.onpipe = (stream: any, mimetype: string, name: string) => {
      if (this.events.onPipe) {
        this.events.onPipe(stream, mimetype, name);
      }
    };

    // 同步事件
    this.client.onsync = (timestamp: number) => {
      if (this.events.onSync) {
        this.events.onSync(timestamp);
      }
    };

    this.setupInputHandlers();
  }

  /**
   * 设置输入处理器
   */
  private setupInputHandlers() {
    // 鼠标事件处理
    this.mouse.onmousedown = 
    this.mouse.onmouseup = 
    this.mouse.onmousemove = (mouseState: any) => {
      this.client.sendMouseState(mouseState);
    };

    // 键盘事件处理
    this.keyboard.onkeydown = (keysym: number) => {
      this.client.sendKeyEvent(1, keysym);
    };

    this.keyboard.onkeyup = (keysym: number) => {
      this.client.sendKeyEvent(0, keysym);
    };
  }

  /**
   * 连接到服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected || this.connecting) {
        resolve();
        return;
      }

      this.connecting = true;

      // 设置连接超时
      const timeout = setTimeout(() => {
        if (this.connecting) {
          this.connecting = false;
          reject(new Error('连接超时'));
        }
      }, 30000); // 30秒超时

      // 监听连接状态
      const checkConnection = () => {
        if (this.connected) {
          clearTimeout(timeout);
          resolve();
        }
      };

      // 设置临时事件监听
      const originalOnError = this.events.onError;
      this.events.onError = (error) => {
        clearTimeout(timeout);
        this.connecting = false;
        this.events.onError = originalOnError; // 恢复原始错误处理
        reject(error);
      };

      try {
        // 开始WebSocket连接
        this.initializeWebSocket();

        // 定期检查连接状态
        const checkInterval = setInterval(() => {
          if (this.connected) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            this.events.onError = originalOnError; // 恢复原始错误处理
            resolve();
          }
        }, 100);
      } catch (error) {
        clearTimeout(timeout);
        this.connecting = false;
        this.events.onError = originalOnError;
        reject(error);
      }
    });
  }



  /**
   * 绑定到 Canvas 元素
   */
  attachTo(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    if (this.display && canvas) {
      canvas.appendChild(this.display.getElement());
      
      // 设置 canvas 样式
      const displayElement = this.display.getElement();
      displayElement.style.width = '100%';
      displayElement.style.height = '100%';
      displayElement.style.objectFit = 'contain';
    }
  }

  /**
   * 发送剪贴板数据
   */
  sendClipboard(data: string, mimetype = 'text/plain') {
    if (this.client && this.connected) {
      const stream = this.client.createClipboardStream(mimetype);
      const writer = new Guacamole.StringWriter(stream);
      writer.sendText(data);
      writer.sendEnd();
    }
  }

  /**
   * 发送文件
   */
  sendFile(file: File) {
    if (this.client && this.connected) {
      const stream = this.client.createFileStream(file.type, file.name);
      const reader = new FileReader();
      
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const writer = new Guacamole.ArrayBufferWriter(stream);
        writer.sendData(arrayBuffer);
        writer.sendEnd();
      };
      
      reader.readAsArrayBuffer(file);
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取连接中状态
   */
  isConnecting(): boolean {
    return this.connecting;
  }

  /**
   * 获取显示分辨率
   */
  getResolution(): { width: number; height: number } | null {
    if (this.display) {
      const element = this.display.getElement();
      return {
        width: element.width || 0,
        height: element.height || 0
      };
    }
    return null;
  }

  /**
   * 设置显示缩放
   */
  setScale(scale: number) {
    if (this.display) {
      this.display.scale(scale);
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
   * 处理连接结果
   */
  private handleConnectResult(data: any) {
    if (data.success) {
      console.log('连接成功:', data.message);
      this.connected = true;
      this.connecting = false;
    } else {
      console.error('连接失败:', data.message);
      this.connected = false;
      this.connecting = false;

      if (this.events.onError) {
        this.events.onError(new Error(data.message));
      }
    }
  }

  /**
   * 处理显示数据
   */
  private handleDisplayData(data: any) {
    if (this.canvas && data.data) {
      // 这里应该处理图像数据并渲染到canvas
      // 具体实现取决于后端发送的数据格式
      console.log('收到显示数据:', data.data);
    }
  }

  /**
   * 处理错误
   */
  private handleError(data: any) {
    console.error('服务器错误:', data.message);
    if (this.events.onError) {
      this.events.onError(new Error(data.message));
    }
  }

  /**
   * 发送消息到WebSocket
   */
  private sendMessage(data: any) {
    if (this.tunnel && this.tunnel.readyState === WebSocket.OPEN) {
      this.tunnel.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('断开 Guacamole 连接');

    this.connected = false;
    this.connecting = false;

    if (this.tunnel && this.tunnel.readyState === WebSocket.OPEN) {
      this.sendMessage({ action: 'disconnect' });
      this.tunnel.close();
    }
  }

  /**
   * 销毁客户端
   */
  destroy() {
    this.disconnect();
    
    if (this.mouse) {
      // 清理鼠标事件
      this.mouse.onmousedown = null;
      this.mouse.onmouseup = null;
      this.mouse.onmousemove = null;
    }
    
    if (this.keyboard) {
      // 清理键盘事件
      this.keyboard.onkeydown = null;
      this.keyboard.onkeyup = null;
    }
    
    this.client = null;
    this.tunnel = null;
    this.display = null;
    this.mouse = null;
    this.keyboard = null;
    this.canvas = null;
  }
}

// 导出 Guacamole 常量
export const GuacamoleStates = {
  IDLE: Guacamole.Client.IDLE,
  CONNECTING: Guacamole.Client.CONNECTING,
  WAITING: Guacamole.Client.WAITING,
  CONNECTED: Guacamole.Client.CONNECTED,
  DISCONNECTING: Guacamole.Client.DISCONNECTING,
  DISCONNECTED: Guacamole.Client.DISCONNECTED
};

export default GuacamoleClient;
