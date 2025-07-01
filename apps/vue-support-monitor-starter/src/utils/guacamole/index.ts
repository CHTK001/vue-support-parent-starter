/**
 * Guacamole 客户端工具类
 * 直接使用 guacamole-common-js 原生功能，无需自定义逻辑
 */

import { getConfig } from '@repo/config';
import Guacamole from 'guacamole-common-js';

export interface GuacamoleConfig {
  /** 服务器ID */
  serverId: number;
  /** 连接协议 */
  protocol: 'rdp' | 'vnc' | 'ssh';
  /** 服务器主机 */
  host: string;
  /** 服务器端口 */
  port: number;
  /** 用户名 */
  username?: string;
  /** 密码 */
  security?: string;
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

  constructor(config: GuacamoleConfig, events: GuacamoleEvents = {}) {
    this.config = config;
    this.events = events;
  }

  /**
   * 连接到服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 构建 WebSocket URL
        const wsUrl = this.buildWebSocketUrl();

        // 创建 Guacamole WebSocket 隧道
        this.tunnel = new Guacamole.WebSocketTunnel(wsUrl);

        // 创建 Guacamole 客户端
        this.client = new Guacamole.Client(this.tunnel);

        // 获取显示对象
        this.display = this.client.getDisplay();

        // 创建鼠标和键盘处理器
        this.mouse = new Guacamole.Mouse(this.display.getElement());
        this.keyboard = new Guacamole.Keyboard(document);

        // 设置事件监听器
        this.setupEventHandlers(resolve, reject);
    // 构建连接参数
        const params = new URLSearchParams({
          serverId: this.config.serverId.toString(),
          host: this.config.host,
          port: this.config.port.toString(),
          protocol: this.config.protocol
        });

        if (this.config.security) params.set('security', this.config.security);
        if (this.config.resolution) params.set('resolution', this.config.resolution);
        if (this.config.colorDepth) params.set('colorDepth', this.config.colorDepth.toString());
        if (this.config.enableAudio !== undefined) params.set('enableAudio', this.config.enableAudio.toString());
        if (this.config.enableClipboard !== undefined) params.set('enableClipboard', this.config.enableClipboard.toString());
        if (this.config.enableCursor !== undefined) params.set('enableCursor', this.config.enableCursor.toString());
        if (this.config.viewMode) params.set('viewMode', this.config.viewMode);
        if (this.config.colorQuality) params.set('colorQuality', this.config.colorQuality);

        // 开始连接
        this.client.connect(params.toString());

      } catch (error) {
        console.error('Guacamole 连接失败:', error);
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
    const path = getConfig().BaseUrl + `/websocket/${this.config.protocol}`;

    return `${protocol}//${host}${path}`;
  }

  /**
   * 设置事件监听器
   */
  private setupEventHandlers(resolve: () => void, reject: (error: any) => void) {
    // 客户端状态变化
    this.client.onstatechange = (state: number) => {
      console.log('Guacamole 状态变化:', state);

      if (this.events.onStateChange) {
        this.events.onStateChange(state);
      }

      // 连接成功
      if (state === Guacamole.Client.CONNECTED) {
        resolve();
      }
    };

    // 错误处理
    this.client.onerror = (error: any) => {
      console.error('Guacamole 客户端错误:', error);

      if (this.events.onError) {
        this.events.onError(error);
      }

      reject(error);
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
    if (!this.display) return;

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
   * 获取连接中状态
   */
  isConnecting(): boolean {
    return this.client && this.client.currentState === Guacamole.Client.CONNECTING;
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
   * 发送文件
   */
  sendFile(file: File) {
    if (this.client && this.isConnected()) {
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
   * 销毁客户端
   */
  destroy() {
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
