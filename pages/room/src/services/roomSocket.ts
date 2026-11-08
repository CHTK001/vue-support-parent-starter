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

/**
 * 把「监听全部网卡」的绑定地址换成浏览器真正能连的主机。
 *
 * <p>节点 serverUrl 用绑定地址拼成 {@code ws://0.0.0.0:18083/}，而 {@code 0.0.0.0}
 * 只是服务端的写法，浏览器发起握手会直接失败。页面既然能打开，就说明当前
 * 主机名可达，用它替换即可。</p>
 *
 * @param url 节点地址
 * @returns 可直连的地址（不含通配主机时原样返回）
 */
function normalizeHost(url: string): string {
  const pageHost = window.location.hostname || "127.0.0.1";
  const replacement = pageHost.includes(":") ? `[${pageHost}]` : pageHost;
  return url.replace(/\/\/(0\.0\.0\.0|\[::\]|::)(?=[:/]|$)/, `//${replacement}`);
}

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

  /**
   * 重连后要补发的入房请求。
   *
   * <p>WebSocket 的 open 是异步的，重连那一瞬间不能直接发 hello（会因
   * readyState=CONNECTING 被丢掉），先记在这里，由 {@code onopen} 补发。</p>
   */
  private pendingRejoin?: { roomId?: string; resumeToken?: string };

  /** 最近一次 joinRoom 的参数（自动重连时用来回房） */
  private lastJoin?: { roomId?: string; resumeToken?: string };

  /**
   * 连接代次。
   *
   * <p>主动重连会关掉旧连接，旧 socket 的 onclose 随后才回放；用代次把
   * 过期回调挡掉，否则一次「重连」会被当成掉线再重连一轮。</p>
   */
  private generation = 0;

  constructor(
    private baseUrl: string = new URL(window.location.href).origin,
    private heartbeatInterval: number = DEFAULT_HEARTBEAT_INTERVAL,
    private reconnectMax: number = DEFAULT_RECONNECT_ATTEMPTS,
    private reconnectDelay: number = DEFAULT_RECONNECT_DELAY,
  ) {
    this.maxReconnectAttempts = reconnectMax;
  }

  /* ==================== 连接管理 ==================== */

  /** 当前信令服务基地址（用于父级把房间页签指到独立房间节点） */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 设置信令服务基地址。
   *
   * <p>房间有两种接入：与应用同端口（默认当前站点）、服务管理里的 ROOM 独立节点
   * （节点 serverUrl）。嵌入页签挂载前调本方法指到节点，卸载时传回上一个值即可恢复。</p>
   *
   * <p>节点地址按绑定地址生成，{@code 0.0.0.0} / {@code ::} 表示「监听全部网卡」，
   * 浏览器连不上（直接握手失败）。这里统一换成访问当前页所用的主机名：本机互访
   * 是 127.0.0.1，远程访问就是那台机器的地址。</p>
   *
   * @param url 节点地址（http/https/ws/wss 均可），空值回落到当前站点
   */
  setBaseUrl(url?: string): void {
    const next = url?.trim();
    this.baseUrl = next ? normalizeHost(next) : new URL(window.location.href).origin;
  }

  /** 建立连接（不自动重连，连接断开后由心跳/重连机制续接） */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    this.connectionState.value = ConnectionState.CONNECTING;
    this.closed = false;
    // 连接建立后若被非主动关闭（对端重启/网络中断），onClose 里据此自动续接
    this.needReconnect = true;

    try {
      const token = getSocketToken();
      const baseUrl = toWebSocketUrl(this.baseUrl);
      const wsUrl = new URL(baseUrl);
      if (token) {
        wsUrl.searchParams.set("x-oauth-token", token);
      }
      wsUrl.searchParams.set("path", WS_PATH);

      const gen = ++this.generation;
      this.ws = new WebSocket(wsUrl.toString());

      this.ws.onopen = () => {
        if (gen !== this.generation) return;
        this.connectionState.value = ConnectionState.OPEN;
        this.reconnectAttempts = 0;
        this.lastPongAt = Date.now();
        this.startHeartbeat();
        this.startStatusGuard();
        // 重连回房：连接建立后再补发 hello（续接令牌带上才可能续上原端点）
        const pending = this.pendingRejoin;
        if (pending?.roomId) {
          this.pendingRejoin = undefined;
          this.send({ type: "hello", roomId: pending.roomId, resumeToken: pending.resumeToken, epoch: 0 });
        }
      };

      this.ws.onmessage = (event) => {
        if (gen !== this.generation) return;
        this.onMessage(event.data);
      };

      this.ws.onclose = (event) => {
        if (gen !== this.generation) return;
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
    // 让旧 socket 的回调全部作废：主动断开后，它的 onclose 不能再触发一轮重连
    this.generation++;
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
    this.lastJoin = { roomId, resumeToken };
    this.send({
      type: "hello",
      roomId,
      resumeToken,
      epoch: 0,
    });
  }

  /**
   * 记录服务端确认的房间与续接令牌。
   *
   * <p>新建房间时 hello 里的房间号是客户端生成的，welcome 回来后才算定案；
   * 把这一份写进 {@code lastJoin}，掉线自动重连时才能带着它回原房间。</p>
   *
   * @param roomId      房间号
   * @param resumeToken 续接令牌
   */
  adoptRoom(roomId?: string, resumeToken?: string): void {
    if (!roomId) {
      return;
    }
    this.lastJoin = { roomId, resumeToken };
  }

  /** 离开房间 */
  leaveRoom(reason = "user"): void {
    this.send({ type: "leave", reason });
    this.lastJoin = undefined;
    this.disconnect();
  }

  /** 转发 WebRTC 信号给对端 */
  signal(payload: string): void {
    // 带上房间号：服务端据此校验信号确实发往当前会话所属的房间
    this.send({ type: "signal", roomId: this.lastJoin?.roomId, payload });
  }

  /** 心跳续期 */
  heartbeat(): void {
    this.send({ type: "heartbeat" });
  }

  /**
   * 断线续接（手动）：关掉当前连接，延迟重建，连接建立后自动回到原房间。
   *
   * <p>手动重连会把失败计数清零——用户点了按钮就该重新获得完整的重试额度。</p>
   *
   * @param roomId      要续接的房间号（空则用最近一次 joinRoom 的参数）
   * @param resumeToken 续接令牌（配合房间号才能回到原端点）
   */
  reconnect(roomId?: string, resumeToken?: string): void {
    this.reconnectAttempts = 0;
    this.scheduleReconnect(roomId, resumeToken);
  }

  /**
   * 安排一次续接（内部）。
   *
   * <p><b>不能</b>先调 {@link disconnect} 再在定时器里判 {@code closed}：
   * disconnect 会把 closed 置 true，那个守卫永远命中，重连就成了空操作。
   * 这里只关 socket，入房参数留在 {@code pendingRejoin}，由 onopen 补发 hello。</p>
   *
   * @param roomId      要续接的房间号（空则用最近一次 joinRoom 的参数）
   * @param resumeToken 续接令牌（配合房间号才能回到原端点）
   */
  private scheduleReconnect(roomId?: string, resumeToken?: string): void {
    const target = roomId ?? this.lastJoin?.roomId;
    const token = resumeToken ?? this.lastJoin?.resumeToken;
    this.pendingRejoin = target ? { roomId: target, resumeToken: token } : undefined;
    this.needReconnect = true;
    this.closed = false;
    this.reconnectAttempts++;
    this.stopHeartbeat();
    this.stopStatusGuard();
    // 代次 +1：旧 socket 的 onclose/onmessage 全部作废，免得再触发一轮重连
    this.generation++;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = undefined;
    this.connectionState.value = ConnectionState.CONNECTING;
    setTimeout(() => {
      if (this.closed) {
        return;
      }
      this.connect();
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

    // 不是主动 leave 的关闭，尝试续接（次数到上限就停，避免无限重试打满控制台）
    if (!this.needReconnect) {
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.needReconnect = false;
      this.connectionState.value = ConnectionState.CLOSED;
      log.error(`[Room] 重连 ${this.reconnectAttempts} 次仍失败，停止续接`);
      return;
    }
    this.scheduleReconnect();
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
