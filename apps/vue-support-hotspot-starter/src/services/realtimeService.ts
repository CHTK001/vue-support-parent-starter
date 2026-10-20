/**
 * realtimeService.ts —— WebSocket + SSE 双通道实时通信服务
 *
 * 使用原生浏览器 API，不依赖 @repo/core 内部路径。
 * WebSocket：告警实时推送、配置变更
 * SSE：stats 快照
 *
 * @since 4.1.0
 */
import { ref, type Ref } from "vue";

/** 实时事件类型 */
export type RealtimeEventType =
  | "stats"
  | "alert"
  | "log"
  | "config_change"
  | "deployment"
  | "error";

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: unknown;
  ts: number;
}

export type RealtimeEventHandler = (event: RealtimeEvent) => void;

/** 事件处理器容器 */
class EventBus {
  private handlers = new Map<RealtimeEventType, Set<RealtimeEventHandler>>();
  private globalHandlers = new Set<RealtimeEventHandler>();

  on(type: RealtimeEventType, handler: RealtimeEventHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  onAll(handler: RealtimeEventHandler) {
    this.globalHandlers.add(handler);
  }

  off(type: RealtimeEventType, handler: RealtimeEventHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  offAll(handler: RealtimeEventHandler) {
    this.globalHandlers.delete(handler);
  }

  emit(event: RealtimeEvent) {
    this.handlers.get(event.type)?.forEach((h) => {
      try { h(event); } catch { /* 忽略 */ }
    });
    this.globalHandlers.forEach((h) => {
      try { h(event); } catch { /* 忽略 */ }
    });
  }
}

class RealtimeService {
  private bus = new EventBus();
  private ws: WebSocket | null = null;
  private es: EventSource | null = null;
  private wsTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 3000;
  private reconnectAttempts = 0;
  private wsUrl = "";

  public readonly connected: Ref<boolean> = ref(false);
  public readonly wsConnected: Ref<boolean> = ref(false);
  public readonly reconnectAttemptsRef = ref(0);

  constructor() {
    this.connect();
  }

  private getWsUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/apm`;
  }

  private getSseUrl(): string {
    return `${window.location.origin}/api/apm/stream?intervalMs=3000`;
  }

  private connect() {
    this.connectWs();
    this.connectSse();
  }

  /** WebSocket 连接（告警推送、配置变更） */
  private connectWs() {
    try {
      this.wsUrl = this.getWsUrl();
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.wsConnected.value = true;
        this.connected.value = true;
        this.reconnectAttempts = 0;
        this.reconnectAttemptsRef.value = 0;
        this.startHeartbeat();
        this.bus.emit({ type: "stats", data: { connected: true }, ts: Date.now() });
      };

      this.ws.onclose = (e) => {
        this.wsConnected.value = false;
        this.stopHeartbeat();
        if (e.code !== 1000 && this.reconnectAttempts < 10) {
          this.reconnectAttempts++;
          this.reconnectAttemptsRef.value = this.reconnectAttempts;
          setTimeout(() => this.connectWs(), this.reconnectDelay * Math.min(this.reconnectAttempts, 3));
        }
      };

      this.ws.onerror = () => {
        this.reconnectAttempts++;
        this.reconnectAttemptsRef.value = this.reconnectAttempts;
      };

      this.ws.onmessage = (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(ev.data as string) as { event?: string; data?: unknown };
          if (!msg.event || msg.event === "pong") return;
          const type = msg.event as RealtimeEventType;
          this.bus.emit({ type, data: msg.data ?? msg, ts: Date.now() });
        } catch { /* 忽略解析错误 */ }
      };
    } catch { /* WebSocket 不可用 */ }
  }

  /** SSE 连接（stats 快照） */
  private connectSse() {
    try {
      const url = this.getSseUrl();
      this.es = new EventSource(url);

      this.es.onopen = () => {
        this.connected.value = true;
      };

      this.es.addEventListener("stats", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data as string);
          this.bus.emit({ type: "stats", data, ts: Date.now() });
        } catch { /* 忽略 */ }
      });

      this.es.addEventListener("log", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data as string);
          this.bus.emit({ type: "log", data, ts: Date.now() });
        } catch { /* 忽略 */ }
      });

      this.es.addEventListener("alert", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data as string);
          this.bus.emit({ type: "alert", data, ts: Date.now() });
        } catch { /* 忽略 */ }
      });

      this.es.onerror = () => {
        // EventSource 会自动重连，这里只需记录
      };
    } catch { /* SSE 不可用 */ }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.wsTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: "ping", timestamp: Date.now() }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.wsTimer) {
      clearInterval(this.wsTimer);
      this.wsTimer = null;
    }
  }

  /** 发送消息到服务端 */
  send(event: string, data?: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data, timestamp: Date.now() }));
    }
  }

  /** 订阅事件 */
  on(type: RealtimeEventType, handler: RealtimeEventHandler) {
    this.bus.on(type, handler);
  }

  /** 全局订阅 */
  onAll(handler: RealtimeEventHandler) {
    this.bus.onAll(handler);
  }

  /** 取消订阅 */
  off(type: RealtimeEventType, handler: RealtimeEventHandler) {
    this.bus.off(type, handler);
  }

  offAll(handler: RealtimeEventHandler) {
    this.bus.offAll(handler);
  }

  /** 断开连接 */
  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.es?.close();
    this.ws = null;
    this.es = null;
    this.connected.value = false;
    this.wsConnected.value = false;
  }
}

/** 单例 */
export const realtimeService = new RealtimeService();
