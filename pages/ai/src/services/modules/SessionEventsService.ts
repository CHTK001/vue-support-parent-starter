/**
 * 会话事件类型
 */
export type SessionEventType =
  | "connected"
  | "session_created"
  | "session_deleted"
  | "session_renamed"
  | "session_updated"
  | "stream_started"
  | "stream_finished"
  | "user_message_created"
  | "sub_agent_create"
  | "sub_agent_closed"
  | "todo_updated";

/**
 * 会话事件
 */
export interface SessionEvent {
  type: SessionEventType;
  userId: string;
  sessionId: string;
  timestamp: string;
  payload?: Record<string, any>;
  source?: string;
}

/**
 * 会话事件监听器
 */
type EventListener = (event: SessionEvent) => void;

/**
 * 用户级会话事件服务
 *
 * 通过 SSE 长连接接收后端推送的会话事件，替代轮询机制。
 * 支持自动重连、多监听器注册。
 *
 * 连接统一由 @/framework/context 的请求模块客户端建立（自带 Bearer 头与 X-Client-Id），
 * 不再直接使用 EventSourcePolyfill 手工拼鉴权头。
 */
import { createClient, httpAt } from "@/framework/context";
import type { HttpClient } from "@/framework/context";
import { getClientId } from "@/utils/clientId";
import type { SseClient } from "@repo/utils";

/** 首次重连间隔 */
const RECONNECT_INTERVAL = 3000;
/** 重连间隔上限（指数退避封顶，避免后端被打爆） */
const RECONNECT_MAX_INTERVAL = 60000;
/** 连续失败达到该次数后停止重连，等待下次 connect() 或页面刷新 */
const MAX_CONSECUTIVE_FAILURES = 12;

export class SessionEventsService {
  private eventSource: SseClient | null = null;
  private listeners: Map<SessionEventType | "*", Set<EventListener>> =
    new Map();
  private clientId: string;
  private http: HttpClient;
  /** 是否由调用方主动断开（主动断开后不再自动重连） */
  private disposed = true;
  private reconnectTimer: number | null = null;
  /** 连续失败次数，用于指数退避与熔断 */
  private consecutiveFailures = 0;
  /** 已熔断（连续失败超限），不再自动重连 */
  private tripped = false;

  constructor(private getBaseURL: () => string) {
    // 使用全局客户端标识（localStorage 持久化，刷新页面保持不变）
    this.clientId = getClientId();
    this.http = createClient(() =>
      httpAt(this.getBaseURL(), { "X-Client-Id": this.clientId }),
    );
  }

  /**
   * 生成客户端 ID（用于标识当前浏览器标签页）
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * 连接到事件流
   * 后端通过 token 解析 userId，前端无需传递
   */
  connect(): void {
    this.disposed = false;
    this.consecutiveFailures = 0;
    this.tripped = false;
    this.closeTransport();
    this.startConnection();
  }

  private startConnection(): void {
    const eventSource = this.http.sse<SessionEvent>("/events/sessions", {
      method: "GET",
      // 重连由本服务统一调度（后端正常关闭连接时也要恢复）
      reconnect: false,
      credentials: "same-origin",
      onOpen: () => {
        this.consecutiveFailures = 0;
        this.tripped = false;
        console.log("[SessionEvents] SSE 连接已建立");
      },
      onMessage: (event) => {
        const data = event.data as unknown;
        if (typeof data !== "object" || data === null) return;
        this.handleEvent(data as SessionEvent);
      },
      onError: (error) => {
        this.consecutiveFailures++;
        console.error(
          `[SessionEvents] SSE 连接错误 (第 ${this.consecutiveFailures} 次):`,
          error,
        );
        this.scheduleReconnect();
      },
      onClose: () => {
        this.scheduleReconnect();
      },
    });
    this.eventSource = eventSource;
  }

  /** 断开当前传输层（保留监听器） */
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

  private scheduleReconnect(): void {
    if (this.disposed || this.reconnectTimer !== null) return;
    // 连续失败超限：熔断，不再持续冲击后端（下次 connect() 会重置）
    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      if (!this.tripped) {
        this.tripped = true;
        console.warn(
          `[SessionEvents] SSE 连续失败 ${this.consecutiveFailures} 次，停止自动重连，` +
            `请检查后端服务或刷新页面`,
        );
      }
      return;
    }
    this.closeTransport();
    // 指数退避：3s → 6s → 12s → ... → 60s 封顶
    const delay = Math.min(
      RECONNECT_INTERVAL * Math.pow(2, Math.max(0, this.consecutiveFailures - 1)),
      RECONNECT_MAX_INTERVAL,
    );
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.disposed) this.startConnection();
    }, delay);
  }

  /**
   * 处理接收到的 SSE 事件
   */
  private handleEvent(event: SessionEvent): void {
    // 广播给所有注册的监听器
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `[SessionEvents] 监听器执行失败 (${event.type}):`,
            error,
          );
        }
      }
    }

    // 同时广播给通配符监听器（监听所有事件）
    const allListeners = this.listeners.get("*");
    if (allListeners) {
      for (const listener of allListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error("[SessionEvents] 通配符监听器执行失败:", error);
        }
      }
    }
  }

  /**
   * 注册事件监听器
   * @returns 取消订阅函数
   */
  on(eventType: SessionEventType | "*", listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // 返回取消订阅函数
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.disposed = true;
    this.closeTransport();
    this.listeners.clear();
  }
}
