/**
 * Guacamole 客户端工具类
 * 基于 guacamole-common-js 实现
 */

import Guacamole from 'guacamole-common-js';

export interface GuacamoleClientConfig {
  width?: number;
  height?: number;
  dpi?: number;
  audioMimetypes?: string[];
  videoMimetypes?: string[];
  imageMimetypes?: string[];
}

/**
 * Guacamole 客户端管理器
 */
export class GuacamoleClientManager {
  private client: any = null;
  private display: any = null;
  private mouse: any = null;
  private keyboard: any = null;
  private canvas: HTMLCanvasElement;
  private tunnel: any = null;

  // 事件回调
  private onStateChange?: (state: number) => void;
  private onError?: (error: any) => void;
  private onClipboard?: (data: string) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * 连接到 Guacamole 服务器
   */
  connect(websocketUrl: string, config: GuacamoleClientConfig = {}) {
    try {
      // 创建 WebSocket 隧道
      this.tunnel = new Guacamole.WebSocketTunnel(websocketUrl);

      // 创建 Guacamole 客户端
      this.client = new Guacamole.Client(this.tunnel);

      // 获取显示对象
      this.display = this.client.getDisplay();

      // 将显示附加到 Canvas
      this.canvas.appendChild(this.display.getElement());

      // 设置显示尺寸
      if (config.width && config.height) {
        this.display.resize(config.width, config.height);
      }

      // 创建鼠标和键盘处理器
      this.setupInputHandlers();

      // 设置事件监听器
      this.setupEventListeners();

      // 连接客户端
      this.client.connect();

      console.log('Guacamole 客户端连接已启动');

    } catch (error) {
      console.error('Guacamole 客户端连接失败:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * 设置输入处理器
   */
  private setupInputHandlers() {
    if (!this.client || !this.display) return;

    // 创建鼠标处理器
    this.mouse = new Guacamole.Mouse(this.display.getElement());

    // 鼠标事件处理
    this.mouse.onmousedown =
    this.mouse.onmouseup =
    this.mouse.onmousemove = (mouseState: any) => {
      this.client.sendMouseState(mouseState);
    };

    // 创建键盘处理器
    this.keyboard = new Guacamole.Keyboard(document);

    // 键盘事件处理
    this.keyboard.onkeydown = (keysym: number) => {
      this.client.sendKeyEvent(1, keysym);
    };

    this.keyboard.onkeyup = (keysym: number) => {
      this.client.sendKeyEvent(0, keysym);
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    if (!this.client) return;

    // 状态变化事件
    this.client.onstatechange = (state: number) => {
      console.log('Guacamole 客户端状态变化:', state);
      if (this.onStateChange) {
        this.onStateChange(state);
      }
    };

    // 错误事件
    this.client.onerror = (error: any) => {
      console.error('Guacamole 客户端错误:', error);
      if (this.onError) {
        this.onError(error);
      }
    };

    // 剪贴板事件
    this.client.onclipboard = (stream: any, mimetype: string) => {
      if (mimetype === 'text/plain') {
        const reader = new Guacamole.StringReader(stream);
        reader.ontext = (text: string) => {
          if (this.onClipboard) {
            this.onClipboard(text);
          }
        };
      }
    };

    // 名称变化事件
    this.client.onname = (name: string) => {
      console.log('Guacamole 连接名称:', name);
    };

    // 同步事件
    this.client.onsync = (timestamp: number) => {
      // 发送同步响应
      this.client.sendSync(timestamp);
    };
  }

  /**
   * 断开连接
   */
  disconnect() {
    try {
      if (this.client) {
        this.client.disconnect();
      }

      if (this.tunnel) {
        this.tunnel.disconnect();
      }

      // 清理输入处理器
      if (this.mouse) {
        this.mouse.onmousedown = null;
        this.mouse.onmouseup = null;
        this.mouse.onmousemove = null;
      }

      if (this.keyboard) {
        this.keyboard.onkeydown = null;
        this.keyboard.onkeyup = null;
      }

      // 清理显示
      if (this.display && this.canvas.contains(this.display.getElement())) {
        this.canvas.removeChild(this.display.getElement());
      }

      console.log('Guacamole 客户端已断开连接');

    } catch (error) {
      console.error('断开 Guacamole 客户端连接失败:', error);
    }
  }

  /**
   * 发送剪贴板数据
   */
  sendClipboard(data: string) {
    if (!this.client) return;

    try {
      const stream = this.client.createClipboardStream('text/plain');
      const writer = new Guacamole.StringWriter(stream);
      writer.sendText(data);
      writer.sendEnd();

      console.log('剪贴板数据已发送:', data);
    } catch (error) {
      console.error('发送剪贴板数据失败:', error);
    }
  }

  /**
   * 调整显示尺寸
   */
  resize(width: number, height: number) {
    if (!this.display) return;

    try {
      this.display.resize(width, height);
      console.log(`显示尺寸已调整为: ${width}x${height}`);
    } catch (error) {
      console.error('调整显示尺寸失败:', error);
    }
  }

  /**
   * 获取连接状态
   */
  getState(): number {
    return this.client ? this.client.getState() : -1;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.getState() === 3; // CONNECTED state
  }

  /**
   * 设置事件回调
   */
  setOnStateChange(callback: (state: number) => void) {
    this.onStateChange = callback;
  }

  setOnError(callback: (error: any) => void) {
    this.onError = callback;
  }

  setOnClipboard(callback: (data: string) => void) {
    this.onClipboard = callback;
  }

  /**
   * 获取显示元素
   */
  getDisplayElement(): HTMLElement | null {
    return this.display ? this.display.getElement() : null;
  }

  /**
   * 发送文件
   */
  sendFile(file: File) {
    if (!this.client) return;

    try {
      const stream = this.client.createFileStream(file.type, file.name);
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          const writer = new Guacamole.ArrayBufferWriter(stream);
          writer.sendData(reader.result);
          writer.sendEnd();
        }
      };

      reader.readAsArrayBuffer(file);
      console.log('文件发送已启动:', file.name);

    } catch (error) {
      console.error('发送文件失败:', error);
    }
  }

  /**
   * 截图
   */
  takeScreenshot(): string | null {
    if (!this.display) return null;

    try {
      const canvas = this.display.getDefaultLayer().getCanvas();
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('截图失败:', error);
      return null;
    }
  }
}

/**
 * Guacamole 客户端状态常量
 */
export const GuacamoleState = {
  IDLE: 0,
  CONNECTING: 1,
  WAITING: 2,
  CONNECTED: 3,
  DISCONNECTING: 4,
  DISCONNECTED: 5
} as const;

/**
 * 获取状态描述
 */
export function getStateDescription(state: number): string {
  switch (state) {
    case GuacamoleState.IDLE: return '空闲';
    case GuacamoleState.CONNECTING: return '连接中';
    case GuacamoleState.WAITING: return '等待中';
    case GuacamoleState.CONNECTED: return '已连接';
    case GuacamoleState.DISCONNECTING: return '断开中';
    case GuacamoleState.DISCONNECTED: return '已断开';
    default: return '未知状态';
  }
}

/**
 * 创建 WebSocket URL
 */
export function createWebSocketUrl(baseUrl: string, protocol: 'rdp' | 'vnc', serverId: string | number): string {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  // 如果 baseUrl 是相对路径，构建完整的 WebSocket URL
  if (baseUrl.startsWith('/')) {
    return `${wsProtocol}//${host}${baseUrl}?serverId=${serverId}&protocol=${protocol}`;
  }

  return `${baseUrl}?serverId=${serverId}&protocol=${protocol}`;
}

/**
 * 默认的 Guacamole 客户端配置
 */
export const defaultGuacamoleConfig: GuacamoleClientConfig = {
  width: 1024,
  height: 768,
  dpi: 96,
  audioMimetypes: ['audio/L16', 'audio/L8'],
  videoMimetypes: ['video/mp4', 'video/webm'],
  imageMimetypes: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * 工具函数：等待客户端连接
 */
export function waitForConnection(client: GuacamoleClientManager, timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkConnection = () => {
      if (client.isConnected()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('连接超时'));
      } else {
        setTimeout(checkConnection, 100);
      }
    };

    checkConnection();
  });
}

/**
 * 工具函数：处理文件拖放
 */
export function setupFileDrop(element: HTMLElement, client: GuacamoleClientManager) {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  element.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        client.sendFile(files[i]);
      }
    }
  });
}

/**
 * 工具函数：自动调整显示尺寸
 */
export function autoResizeDisplay(client: GuacamoleClientManager, container: HTMLElement) {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      client.resize(Math.floor(width), Math.floor(height));
    }
  });

  resizeObserver.observe(container);

  return () => {
    resizeObserver.disconnect();
  };
}
