/**
 * @pages/room —— P2P 房间信令 WebSocket 客户端
 *
 * <p>实现 ZestSend 房间协议的端点接入层：
 * <ul>
 *   <li>连接：{@code /ws}（复用 {@code @repo/core} 的鉴权 URL 拼装与令牌获取）</li>
 *   <li>上行：hello（加入房间）/ signal（WebRTC offer/answer/candidate）/
 *   heartbeat（续期）/ leave（离开）</li>
 *   <li>下行：welcome / negotiate / peer-ready / peer-left / peer-disconnected /
 *   peer-reconnected / replaced / left / pong / signal / error</li>
 * </ul>
 *
 * <p>传输层（连接是否活）与房间状态（welcome/peer-ready/peer-left）分离：传输层状态由
 * {@link RoomSocket.connectionState} 承载，房间状态由业务层（store）解析下行信令后设定。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { ref } from "vue";
import { log } from "@repo/utils";
import { getSocketToken, toWebSocketUrl } from "@repo/core";
import type { RoomMessageEnvelope, RoomSignalEnvelope, RoomStatus } from "../types/room";

/** 心跳间隔（毫秒），与后端 {@code plugin.websocket.heartbeatInterval} 对齐 */
const DEFAULT_HEARTBEAT_INTERVAL = 25_000;

/** 默认重连次数 */
const DEFAULT_RECONNECT_ATTEMPTS = 5;

/** 默认重连延迟（毫秒） */
const DEFAULT_RECONNECT_DELAY = 1000;

/** 端点路径 */
const WS_PATH = "/ws";

/** 消息处理函数 */
export type RoomMessageHandler = (msg: RoomMessageEnvelope) => void;

/** 状态变化回调 */
export type RoomStatusHandler = (status: RoomStatus, code?: number, reason?: string) => void;

/** 传输层连接状态 */
export enum ConnectionState {
  /** 未连接 */
  IDLE = "idle",
  /** 连接中 */
  CONNECTING = "connecting",
  /** 已连接 */
  OPEN = "open",
  /** 已断开 */
  CLOSED = "closed",
}

/**
 * 房间信令客户端
 */
export class RoomSocket {
  /** 当前连接状态（传输层） */
  public connectionState = ref<ConnectionState>(ConnectionState.IDLE);

  /** 是否已关闭（面向外部的标记） */
  public closed = false;

  /** 是否需要重连（leave 后的手动重连 / 断线续接） */
  private needReconnect = false;

  /** 连接中的 WebSocket 实例 */
  private ws?: WebSocket;

  /** 消息监听器列表（按 type 分发） */
  private handlers = new Map<string, Set<RoomMessageHandler>>();

  /** 通配监听器（收未注册类型的消息） */
  private wildcard = new Set<RoomMessageHandler>();

  /** 心跳定时器 */
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  /** 状态守护：心跳失败 / 长时间无 pong 则重连 */
  private statusGuard?: ReturnType<typeof setInterval>;

  /** 已尝试的重连次数 */
  private reconnectAttempts = 0;

  /** 最大重连次数 */
  private maxReconnectAttempts = DEFAULT_RECONNECT_ATTEMPTS;

  /** 最后收到 pong 的时间 */
  private lastPongAt = Date.now();

  constructor(
    private baseUrl: string = new URL(window.location.href).origin,
    private heartbeatInterval: number = DEFAULT_HEARTBEAT_INTERVAL,
    private reconnectMax: number = DEFAULT_RECONNECT_ATTEMPTS,
    private reconnectDelay: number = DEFAULT_RECONNECT_DELAY,
  ) {
    this.maxReconnectAttempts = reconnectMax;
  }

  /* ==================== 连接管理 ==================== */

  /** 建立连接（不自动重连，连接断开后由心跳/重连机制续接） */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    this.connectionState.value = ConnectionState.CONNECTING;
    this.reconnectAttempts = 0;
    this.closed = false;
    this.needReconnect = false;

    try {
      const token = getSocketToken();
      const baseUrl = toWebSocketUrl(this.baseUrl);
      const wsUrl = new URL(baseUrl);
      if (token) {
        wsUrl.searchParams.set("x-oauth-token", token);
      }
      wsUrl.searchParams.set("path", WS_PATH);

      this.ws = new WebSocket(wsUrl.toString());

      this.ws.onopen = () => {
        this.connectionState.value = ConnectionState.OPEN;
        this.reconnectAttempts = 0;
        this.lastPongAt = Date.now();
        this.startHeartbeat();
        this.startStatusGuard();
      };

      this.ws.onmessage = (event) => {
        this.onMessage(event.data);
      };

      this.ws.onclose = (event) => {
        this.onClose(event);
      };

      this.ws.onerror = () => {
        log.error("[Room] WebSocket 错误");
      };
    } catch (e) {
      log.error(`[Room] 连接失败:`, e);
      this.connectionState.value = ConnectionState.CLOSED;
    }
  }

  /** 断开连接（不再重连） */
  disconnect(): void {
    this.needReconnect = false;
    this.stopHeartbeat();
    this.stopStatusGuard();
    this.closed = true;
    try {
      this.ws?.close();
      this.ws = undefined;
    } catch {
      /* ignore */
    }
    this.connectionState.value = ConnectionState.CLOSED;
  }

  /* ==================== 信令收发 ==================== */

  /** 给服务器发信 */
  send(signal: RoomSignalEnvelope): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(signal));
    } else {
      log.warn(`[Room] 未连接，无法发送信令: ${signal.type}`);
    }
  }

  /** 加入房间（创建房间或续接旧连接） */
  joinRoom(roomId?: string, resumeToken?: string): void {
    this.send({
      type: "hello",
      roomId,
      resumeToken,
      epoch: 0,
    });
  }

  /** 离开房间 */
  leaveRoom(reason = "user"): void {
    this.send({ type: "leave", reason });
    this.disconnect();
  }

  /** 转发 WebRTC 信号给对端 */
  signal(payload: string): void {
    this.send({ type: "signal", payload });
  }

  /** 心跳续期 */
  heartbeat(): void {
    this.send({ type: "heartbeat" });
  }

  /** 关闭后自动重连（leave 不触发；断线续接时由业务层调用） */
  reconnect(): void {
    this.needReconnect = true;
    this.disconnect();
    setTimeout(() => {
      if (this.closed) {
        return;
      }
      this.connect();
      this.joinRoom();
    }, this.reconnectDelay);
  }

  /* ==================== 监听 ==================== */

  /** 监听某个类型的信令（如 "welcome"） */
  on(type: string, handler: RoomMessageHandler): () => void {
    const handlers = this.handlers.get(type) ?? new Set();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    return () => this.handlers.get(type)?.delete(handler);
  }

  /** 通配监听 */
  onWildcard(type: string, handler: RoomMessageHandler): () => void {
    this.wildcard.add(handler);
    return () => this.wildcard.delete(handler);
  }

  /* ==================== 内部 ==================== */

  /** 收到原始消息 */
  private onMessage(raw: string): void {
    let msg: RoomMessageEnvelope;
    try {
      msg = JSON.parse(raw) as RoomMessageEnvelope;
    } catch {
      log.error(`[Room] 解析消息失败: ${raw}`);
      return;
    }
    if (!msg?.type) {
      log.warn(`[Room] 无 type 的消息，忽略: ${raw}`);
      return;
    }

    if (msg.type === "pong") {
      this.lastPongAt = Date.now();
    }

    for (const handler of this.handlers.get(msg.type) ?? []) {
      try {
        handler(msg);
      } catch (e) {
        log.error(`[Room] 处理信令失败 [${msg.type}]:`, e);
      }
    }
    for (const handler of this.wildcard) {
      try {
        handler(msg);
      } catch (e) {
        log.error(`[Room] 通配信令处理失败 [${msg.type}]:`, e);
      }
    }
  }

  /** 连接关闭 */
  private onClose(event: CloseEvent): void {
    log.warn(`[Room] 连接关闭: code=${event.code} reason=${event.reason}`);
    this.stopHeartbeat();
    this.stopStatusGuard();
    this.connectionState.value = ConnectionState.CLOSED;

    if (this.closed) {
      return;
    }

    // 不是主动 leave 的关闭，尝试重连
    if (this.needReconnect) {
      this.reconnect();
    }
  }

  /** 心跳保活 */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (this.heartbeatInterval <= 0) {
      return;
    }
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.heartbeat();
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /** 状态守护（心跳失败 / 长时间无 pong 则重连） */
  private startStatusGuard(): void {
    this.stopStatusGuard();
    this.statusGuard = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        return;
      }
      // 连续两个周期没收到 pong → 触发重连
      if (this.lastPongAt && Date.now() - this.lastPongAt > this.heartbeatInterval * 2) {
        log.warn("[Room] 长时间未收到 pong，重连");
        this.reconnect();
      }
    }, this.heartbeatInterval);
  }

  private stopStatusGuard(): void {
    if (this.statusGuard) {
      clearInterval(this.statusGuard);
      this.statusGuard = undefined;
    }
  }
}

/** 模块单例 */
export const roomSocket = new RoomSocket();
