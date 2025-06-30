/**
 * 简化的 Guacamole 客户端
 * 直接使用 guacamole-common-js 原生功能，无需复杂封装
 */

import { getConfig } from '@repo/config';
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
        // 构建 WebSocket URL
        const wsUrl = this.buildWebSocketUrl();
        
        // 创建 Guacamole WebSocket 隧道
        this.tunnel = new Guacamole.WebSocketTunnel(wsUrl);
        
        // 创建 Guacamole 客户端
        this.client = new Guacamole.Client(this.tunnel);
        
        // 获取显示对象
        this.display = this.client.getDisplay();
        
        // 设置事件监听器
        this.client.onstatechange = (state: number) => {
          console.log('Guacamole 状态变化:', state);
          
          if (this.events.onStateChange) {
            this.events.onStateChange(state);
          }
          
          // 连接成功时设置输入处理器
          if (state === Guacamole.Client.CONNECTED) {
            this.setupInputHandlers();
            resolve();
          }
        };

        this.client.onerror = (error: any) => {
          console.error('Guacamole 客户端错误:', error);
          
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
        
        // 开始连接
        this.client.connect();
        
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
    
    // 构建连接参数
    const params = new URLSearchParams({
      serverId: this.config.serverId.toString(),
      host: this.config.host,
      port: this.config.port.toString(),
      protocol: this.config.protocol
    });
    
    if (this.config.username) params.set('username', this.config.username);
    if (this.config.password) params.set('password', this.config.password);
    if (this.config.resolution) params.set('resolution', this.config.resolution);
    if (this.config.colorDepth) params.set('colorDepth', this.config.colorDepth.toString());
    if (this.config.enableAudio !== undefined) params.set('enableAudio', this.config.enableAudio.toString());
    if (this.config.enableClipboard !== undefined) params.set('enableClipboard', this.config.enableClipboard.toString());

    return `${protocol}//${host}${path}?${params.toString()}`;
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
   * 绑定到 Canvas 元素
   */
  attachTo(canvas: HTMLCanvasElement) {
    if (this.display && canvas) {
      // 清空 canvas 内容
      canvas.innerHTML = '';
      
      // 将 Guacamole 显示元素添加到 canvas
      canvas.appendChild(this.display.getElement());
      
      // 设置样式
      const displayElement = this.display.getElement();
      displayElement.style.width = '100%';
      displayElement.style.height = '100%';
      displayElement.style.objectFit = 'contain';
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

export default SimpleGuacamoleClient;
