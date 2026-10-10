/**
 * 工作目录实时监听服务
 * 通过 SSE 连接监听指定会话的工作目录文件变化
 *
 * 连接统一由 @/framework/context 的请求模块客户端建立（自带 Bearer 头与 X-Client-Id），
 * 不再直接使用 EventSourcePolyfill 手工拼鉴权头。
 */

import { createClient, httpAt } from "@/framework/context";
import type { HttpClient } from "@/framework/context";
import { getClientId } from "@/utils/clientId";
import type { SseClient } from "@repo/utils";

/** 后端主动断开或网络中断后的重连间隔 */
const RECONNECT_INTERVAL = 3000;

/**
 * 请求模块抛出的 SSE 失败状态码（文案形如「SSE 连接失败: 404」）
 */
const SSE_STATUS_PATTERN = /失败: (\d{3})$/;

/**
 * 是否为永久失败：后端接口不存在时重连没有意义（401/403 由框架拦截器处理）
 */
function isPermanentFailure(error: unknown): boolean {
  const matched = SSE_STATUS_PATTERN.exec(String((error as Error)?.message ?? ""));
  if (!matched) {
    return false;
  }
  const status = Number(matched[1]);
  return status === 404 || status === 405 || status === 410;
}

/**
 * 工作目录文件变化事件
 */
export interface FileChangeEvent {
  type: "add" | "change" | "unlink" | "addDir" | "unlinkDir" | "heartbeat";
  path: string;
  sessionId: string;
  timestamp: number;
}

export class WorkspaceWatcherService {
  private eventSource: SseClient | null = null;
  private listeners: Set<(event: FileChangeEvent) => void> = new Set();
  private currentSessionId: string | null = null;
  private currentClientId: string;
  private http: HttpClient;
  private disposed = true;
  private reconnectTimer: number | null = null;

  constructor(private getBaseURL: () => string) {
    // 使用页面级客户端标识，同一页面内的 SSE 和普通请求保持一致
    this.currentClientId = getClientId();
    this.http = createClient(() =>
      httpAt(this.getBaseURL(), { "X-Client-Id": this.currentClientId }),
    );
  }

  /**
   * 获取当前客户端 ID
   */
  getClientId(): string {
    return this.currentClientId;
  }

  /**
   * 连接到指定会话的工作目录事件流（SSE）
   */
  connect(sessionId: string, onConnected?: () => void): void {
    // 如果已连接同一会话，不做任何操作
    if (this.currentSessionId === sessionId && this.eventSource) {
      return;
    }

    // 断开现有连接
    this.disconnect();

    this.currentSessionId = sessionId;
    this.disposed = false;
    this.startConnection(sessionId, onConnected);
  }

  private startConnection(sessionId: string, onConnected?: () => void): void {
    const eventSource = this.http.sse<FileChangeEvent>(
      `/sessions/${sessionId}/workspace/events`,
      {
        method: "GET",
        // 重连由本服务统一调度（后端正常关闭连接时也要恢复）
        reconnect: false,
        credentials: "same-origin",
        onOpen: () => {
          if (this.eventSource !== eventSource) {
            return;
          }
          console.log("[WorkspaceWatcher] SSE 连接已建立");
          onConnected?.();
        },
        onMessage: (event) => {
          if (this.eventSource !== eventSource) {
            return;
          }
          const data = event.data as unknown;
          if (typeof data !== "object" || data === null) return;
          const change = data as FileChangeEvent;
          if (change.sessionId && change.sessionId !== this.currentSessionId) {
            return;
          }
          this.notifyListeners(change);
        },
        onError: (error) => {
          if (this.eventSource !== eventSource) {
            return;
          }
          if (isPermanentFailure(error)) {
            console.warn(
              "[WorkspaceWatcher] 事件流不可用，停止重连:",
              (error as Error)?.message ?? error,
            );
            this.disposed = true;
            this.closeTransport();
            return;
          }
          console.error("[WorkspaceWatcher] SSE 连接错误:", error);
          this.scheduleReconnect(sessionId, onConnected);
        },
        onClose: () => {
          if (this.eventSource !== eventSource) {
            return;
          }
          this.scheduleReconnect(sessionId, onConnected);
        },
      },
    );
    this.eventSource = eventSource;
  }

  private scheduleReconnect(sessionId: string, onConnected?: () => void): void {
    if (this.disposed || this.reconnectTimer !== null) return;
    this.closeTransport();
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.disposed && this.currentSessionId === sessionId) {
        this.startConnection(sessionId, onConnected);
      }
    }, RECONNECT_INTERVAL);
  }

  /** 关闭当前传输层（保留会话与监听器） */
  private closeTransport(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * 断开工作目录监听连接
   */
  disconnect(): void {
    this.disposed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.currentSessionId = null;
  }

  /**
   * 注册文件变化监听器
   */
  onChange(callback: (event: FileChangeEvent) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 获取当前工作目录监听的会话ID
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(event: FileChangeEvent): void {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("[WorkspaceWatcher] 监听器执行失败:", error);
      }
    });
  }
}
