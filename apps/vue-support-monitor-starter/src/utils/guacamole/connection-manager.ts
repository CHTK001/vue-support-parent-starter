/**
 * Guacamole 连接管理器
 * 管理多个 Guacamole 连接的生命周期
 */

import { ref, reactive } from 'vue';
import { GuacamoleClient } from './index';
import type { 
  GuacamoleConnectionConfigType,
  GuacamoleConnectionState,
  GuacamoleStatistics,
  GuacamoleDisplayInfo
} from './types';
import { GuacamoleConnectionStates } from './types';

export interface ConnectionManagerEvents {
  onStateChange?: (serverId: number, state: GuacamoleConnectionState) => void;
  onStatistics?: (serverId: number, stats: GuacamoleStatistics) => void;
  onError?: (serverId: number, error: any) => void;
  onClipboard?: (serverId: number, data: string) => void;
  onFile?: (serverId: number, filename: string, data: ArrayBuffer) => void;
}

export class GuacamoleConnectionManager {
  private connections = new Map<number, GuacamoleClient>();
  private connectionStates = reactive(new Map<number, GuacamoleConnectionState>());
  private connectionStats = reactive(new Map<number, GuacamoleStatistics>());
  private events: ConnectionManagerEvents;
  private statsInterval: number | null = null;

  constructor(events: ConnectionManagerEvents = {}) {
    this.events = events;
    this.startStatsMonitoring();
  }

  /**
   * 创建连接
   */
  async createConnection(config: GuacamoleConnectionConfigType): Promise<GuacamoleClient> {
    const serverId = config.serverId;
    
    // 如果已存在连接，先断开
    if (this.connections.has(serverId)) {
      await this.disconnect(serverId);
    }

    // 初始化连接状态
    this.initializeConnectionState(serverId);

    // 创建 Guacamole 客户端
    const client = new GuacamoleClient(config, {
      onStateChange: (state: number) => {
        this.updateConnectionState(serverId, state);
      },
      onError: (error: any) => {
        this.handleConnectionError(serverId, error);
      },
      onClipboard: (stream: any, mimetype: string) => {
        this.handleClipboard(serverId, stream, mimetype);
      },
      onFile: (stream: any, mimetype: string, filename: string) => {
        this.handleFile(serverId, stream, mimetype, filename);
      }
    });

    this.connections.set(serverId, client);
    return client;
  }

  /**
   * 连接到服务器
   */
  async connect(serverId: number): Promise<void> {
    const client = this.connections.get(serverId);
    if (!client) {
      throw new Error(`连接不存在: ${serverId}`);
    }

    try {
      this.updateConnectionState(serverId, GuacamoleConnectionStates.CONNECTING);
      await client.connect();
    } catch (error) {
      this.handleConnectionError(serverId, error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(serverId: number): Promise<void> {
    const client = this.connections.get(serverId);
    if (client) {
      try {
        this.updateConnectionState(serverId, GuacamoleConnectionStates.DISCONNECTING);
        client.disconnect();
        client.destroy();
      } catch (error) {
        console.error(`断开连接失败: ${serverId}`, error);
      } finally {
        this.connections.delete(serverId);
        this.connectionStates.delete(serverId);
        this.connectionStats.delete(serverId);
      }
    }
  }

  /**
   * 获取连接
   */
  getConnection(serverId: number): GuacamoleClient | undefined {
    return this.connections.get(serverId);
  }

  /**
   * 获取连接状态
   */
  getConnectionState(serverId: number): GuacamoleConnectionState | undefined {
    return this.connectionStates.get(serverId);
  }

  /**
   * 获取连接统计
   */
  getConnectionStats(serverId: number): GuacamoleStatistics | undefined {
    return this.connectionStats.get(serverId);
  }

  /**
   * 获取所有连接
   */
  getAllConnections(): Map<number, GuacamoleClient> {
    return new Map(this.connections);
  }

  /**
   * 获取所有连接状态
   */
  getAllConnectionStates(): Map<number, GuacamoleConnectionState> {
    return new Map(this.connectionStates);
  }

  /**
   * 检查连接是否存在
   */
  hasConnection(serverId: number): boolean {
    return this.connections.has(serverId);
  }

  /**
   * 检查连接是否已连接
   */
  isConnected(serverId: number): boolean {
    const client = this.connections.get(serverId);
    return client ? client.isConnected() : false;
  }

  /**
   * 发送剪贴板数据
   */
  sendClipboard(serverId: number, data: string): void {
    const client = this.connections.get(serverId);
    if (client && client.isConnected()) {
      client.sendClipboard(data);
    }
  }

  /**
   * 发送文件
   */
  sendFile(serverId: number, file: File): void {
    const client = this.connections.get(serverId);
    if (client && client.isConnected()) {
      client.sendFile(file);
    }
  }

  /**
   * 截图
   */
  screenshot(serverId: number): string | null {
    const client = this.connections.get(serverId);
    if (client && client.isConnected()) {
      return client.screenshot();
    }
    return null;
  }

  /**
   * 设置显示缩放
   */
  setScale(serverId: number, scale: number): void {
    const client = this.connections.get(serverId);
    if (client) {
      client.setScale(scale);
    }
  }

  /**
   * 获取显示信息
   */
  getDisplayInfo(serverId: number): GuacamoleDisplayInfo | null {
    const client = this.connections.get(serverId);
    if (client) {
      const resolution = client.getResolution();
      if (resolution) {
        return {
          width: resolution.width,
          height: resolution.height,
          scale: 1.0, // 默认缩放
          fullscreen: false
        };
      }
    }
    return null;
  }

  /**
   * 断开所有连接
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(serverId => 
      this.disconnect(serverId)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopStatsMonitoring();
    this.disconnectAll();
  }

  /**
   * 初始化连接状态
   */
  private initializeConnectionState(serverId: number): void {
    this.connectionStates.set(serverId, {
      state: GuacamoleConnectionStates.IDLE,
      stateText: 'IDLE',
      connected: false,
      connecting: false,
      duration: 0
    });

    this.connectionStats.set(serverId, {
      bytesReceived: 0,
      bytesSent: 0,
      latency: 0,
      frameRate: 0,
      lastActivity: Date.now()
    });
  }

  /**
   * 更新连接状态
   */
  private updateConnectionState(serverId: number, state: number): void {
    const currentState = this.connectionStates.get(serverId);
    if (!currentState) return;

    const stateText = this.getStateText(state);
    const connected = state === GuacamoleConnectionStates.CONNECTED;
    const connecting = state === GuacamoleConnectionStates.CONNECTING;

    const newState: GuacamoleConnectionState = {
      ...currentState,
      state,
      stateText,
      connected,
      connecting,
      startTime: connecting ? Date.now() : currentState.startTime,
      error: undefined
    };

    this.connectionStates.set(serverId, newState);

    if (this.events.onStateChange) {
      this.events.onStateChange(serverId, newState);
    }
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(serverId: number, error: any): void {
    const currentState = this.connectionStates.get(serverId);
    if (currentState) {
      const newState: GuacamoleConnectionState = {
        ...currentState,
        state: GuacamoleConnectionStates.DISCONNECTED,
        stateText: 'ERROR',
        connected: false,
        connecting: false,
        error: error.message || String(error)
      };
      this.connectionStates.set(serverId, newState);
    }

    if (this.events.onError) {
      this.events.onError(serverId, error);
    }
  }

  /**
   * 处理剪贴板事件
   */
  private handleClipboard(serverId: number, stream: any, mimetype: string): void {
    // 读取剪贴板数据
    let data = '';
    stream.onblob = (blob: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        data += reader.result;
      };
      reader.readAsText(blob);
    };

    stream.onend = () => {
      if (this.events.onClipboard) {
        this.events.onClipboard(serverId, data);
      }
    };
  }

  /**
   * 处理文件事件
   */
  private handleFile(serverId: number, stream: any, mimetype: string, filename: string): void {
    const chunks: ArrayBuffer[] = [];
    
    stream.onblob = (blob: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        chunks.push(reader.result as ArrayBuffer);
      };
      reader.readAsArrayBuffer(blob);
    };

    stream.onend = () => {
      // 合并所有数据块
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const result = new ArrayBuffer(totalLength);
      const view = new Uint8Array(result);
      let offset = 0;
      
      for (const chunk of chunks) {
        view.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      if (this.events.onFile) {
        this.events.onFile(serverId, filename, result);
      }
    };
  }

  /**
   * 获取状态文本
   */
  private getStateText(state: number): string {
    switch (state) {
      case GuacamoleConnectionStates.IDLE: return 'IDLE';
      case GuacamoleConnectionStates.CONNECTING: return 'CONNECTING';
      case GuacamoleConnectionStates.WAITING: return 'WAITING';
      case GuacamoleConnectionStates.CONNECTED: return 'CONNECTED';
      case GuacamoleConnectionStates.DISCONNECTING: return 'DISCONNECTING';
      case GuacamoleConnectionStates.DISCONNECTED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }

  /**
   * 开始统计监控
   */
  private startStatsMonitoring(): void {
    this.statsInterval = window.setInterval(() => {
      this.updateStatistics();
    }, 1000);
  }

  /**
   * 停止统计监控
   */
  private stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(): void {
    for (const [serverId, client] of this.connections) {
      if (client.isConnected()) {
        const currentStats = this.connectionStats.get(serverId);
        if (currentStats) {
          // 更新连接持续时间
          const state = this.connectionStates.get(serverId);
          if (state && state.startTime) {
            state.duration = Date.now() - state.startTime;
          }

          // 更新统计信息
          const newStats: GuacamoleStatistics = {
            ...currentStats,
            lastActivity: Date.now()
          };

          this.connectionStats.set(serverId, newStats);

          if (this.events.onStatistics) {
            this.events.onStatistics(serverId, newStats);
          }
        }
      }
    }
  }
}

// 创建全局连接管理器实例
export const guacamoleConnectionManager = new GuacamoleConnectionManager();
