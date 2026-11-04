import { createSocketService } from "@repo/core";
import type { SocketTemplate } from "@repo/core";
import { getAccessToken } from "@repo/utils";

/**
 * 终端就绪事件（terminal.ready）。
 */
export interface TerminalReadyEvent {
  /** 会话标识 */
  sessionId: string;
  /** 终端当前工作目录（绝对路径） */
  cwd: string;
  /** 会话工作区根目录（绝对路径） */
  workspace: string;
  /** 实际使用的 shell 标识 */
  shell: string;
  /** 终端列数 */
  cols: number;
  /** 终端行数 */
  rows: number;
}

/**
 * 终端输出事件（terminal.output）。
 *
 * <p>输出是原始终端字节流（含 ANSI 控制序列），由 xterm.js 直接渲染，
 * 前端不再做任何清洗或截断。</p>
 */
export interface TerminalOutputEvent {
  /** 原始输出片段 */
  data: string;
}

/**
 * 终端进程退出事件（terminal.exit）。
 */
export interface TerminalExitEvent {
  /** 进程退出码 */
  code: number;
}

/**
 * 终端错误事件（terminal.error）。
 */
export interface TerminalErrorEvent {
  /** 错误信息 */
  message: string;
}

/**
 * 终端事件名 -> 数据类型映射。
 */
export interface TerminalEventPayload {
  ready: TerminalReadyEvent;
  output: TerminalOutputEvent;
  exit: TerminalExitEvent;
  error: TerminalErrorEvent;
  stopped: Record<string, never>;
}

/**
 * 终端事件监听器。
 */
type TerminalListener<K extends keyof TerminalEventPayload> = (
  payload: TerminalEventPayload[K],
) => void;

/**
 * 连接建立超时时间（毫秒）
 */
const CONNECT_TIMEOUT_MS = 10000;

/**
 * 默认终端列数（与服务端默认值保持一致）
 */
const DEFAULT_COLS = 120;

/**
 * 默认终端行数（与服务端默认值保持一致）
 */
const DEFAULT_ROWS = 32;

/**
 * 工作区终端 WebSocket 管理器（端点 /ws/terminal）。
 *
 * <p>单条连接复用，服务端按 {@code terminal.*} 事件回包；本管理器把事件分发给
 * 面板注册的监听器，并在断线重连后自动重发 {@code terminal.start} 恢复 PTY 会话。</p>
 */
class TerminalSocketManager {
  /**
   * 底层 WS 实例
   */
  private socket: SocketTemplate | null = null;

  /**
   * 正在建立的连接（避免并发重复建连）
   */
  private connecting: Promise<SocketTemplate> | null = null;

  /**
   * 事件监听器集合
   */
  private listeners = new Map<
    keyof TerminalEventPayload,
    Set<(payload: any) => void>
  >();

  /**
   * 连接状态监听器集合
   */
  private statusListeners = new Set<(connected: boolean) => void>();

  /**
   * 当前绑定的会话，重连后据此重发 terminal.start
   */
  private currentSessionId: string | null = null;

  /**
   * 当前终端列数，重连后据此恢复 PTY 尺寸
   */
  private currentCols = DEFAULT_COLS;

  /**
   * 当前终端行数，重连后据此恢复 PTY 尺寸
   */
  private currentRows = DEFAULT_ROWS;

  /**
   * 本次连接是否已经发过 terminal.start（用于区分首连与重连）
   */
  private startEmitted = false;

  /**
   * 是否已关闭（避免关闭后重连回调再次建连）
   */
  private disposed = false;

  /**
   * 当前是否已连接。
   */
  get isConnected(): boolean {
    return this.socket?.isConnected ?? false;
  }

  /**
   * 获取当前绑定的会话标识。
   */
  get sessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * 连接终端并绑定会话。
   *
   * @param sessionId 会话标识
   * @param cols      终端列数
   * @param rows      终端行数
   */
  async connect(
    sessionId: string,
    cols = DEFAULT_COLS,
    rows = DEFAULT_ROWS,
  ): Promise<void> {
    this.disposed = false;
    this.currentSessionId = sessionId;
    this.currentCols = Math.max(1, Math.floor(cols));
    this.currentRows = Math.max(1, Math.floor(rows));
    const socket = await this.ensureConnected();
    this.emitStart(socket);
  }

  /**
   * 断开并清理终端连接。
   */
  disconnect(): void {
    this.disposed = true;
    this.currentSessionId = null;
    this.startEmitted = false;
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // 关闭失败不影响后续重建
      }
      this.socket = null;
    }
    this.connecting = null;
  }

  /**
   * 发送原始按键/粘贴文本。
   *
   * @param data 输入内容
   */
  sendInput(data: string): void {
    if (!data) {
      return;
    }
    if (!this.socket?.isConnected) {
      throw new Error("终端连接已断开");
    }
    this.socket.emit("terminal.input", { data });
  }

  /**
   * 同步终端尺寸。
   *
   * @param cols 列数
   * @param rows 行数
   */
  sendResize(cols: number, rows: number): void {
    const nextCols = Math.max(1, Math.floor(cols));
    const nextRows = Math.max(1, Math.floor(rows));
    if (nextCols === this.currentCols && nextRows === this.currentRows) {
      return;
    }
    this.currentCols = nextCols;
    this.currentRows = nextRows;
    if (!this.socket?.isConnected || !this.startEmitted) {
      return;
    }
    this.socket.emit("terminal.resize", {
      cols: nextCols,
      rows: nextRows,
    });
  }

  /**
   * 终止当前终端进程。
   */
  stop(): void {
    this.socket?.emit("terminal.stop", {});
  }

  /**
   * 注册终端事件监听。
   *
   * @param event    事件名
   * @param listener 监听器
   * @returns 取消监听函数
   */
  on<K extends keyof TerminalEventPayload>(
    event: K,
    listener: TerminalListener<K>,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as (payload: any) => void);
    return () => {
      set?.delete(listener as (payload: any) => void);
    };
  }

  /**
   * 注册连接状态监听。
   *
   * @param listener 监听器，参数为 true 表示已连接、false 表示已断开
   * @returns 取消监听函数
   */
  onStatusChange(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * 发送 terminal.start。
   */
  private emitStart(socket: SocketTemplate): void {
    if (!this.currentSessionId) {
      return;
    }
    this.startEmitted = true;
    socket.emit("terminal.start", {
      sessionId: this.currentSessionId,
      cols: this.currentCols,
      rows: this.currentRows,
    });
  }

  /**
   * 广播连接状态。
   */
  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {
        console.error("[TerminalSocket] 状态监听器执行失败:", error);
      }
    });
  }

  /**
   * 确保连接可用，超时后 reject。
   */
  private ensureConnected(
    timeoutMs = CONNECT_TIMEOUT_MS,
  ): Promise<SocketTemplate> {
    if (this.socket?.isConnected) {
      return Promise.resolve(this.socket);
    }
    if (this.connecting) {
      return this.connecting;
    }

    const socket = this.build();
    this.socket = socket;
    const pending = new Promise<SocketTemplate>((resolve, reject) => {
      let settled = false;
      const fail = (reason: string) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        try {
          socket.close();
        } catch {
          // 忽略关闭异常
        }
        this.socket = null;
        this.connecting = null;
        reject(new Error(reason));
      };
      const timer = setTimeout(
        () => fail("terminal websocket connect timeout"),
        timeoutMs,
      );
      socket.on("connect", () => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        // 连接成功后释放缓存，后续 connect() 以 isConnected 为准，避免复用已失效的连接
        this.connecting = null;
        resolve(socket);
      });
      socket.on("error", () => fail("terminal websocket connect error"));
      socket.connect();
    });
    this.connecting = pending;
    return pending;
  }

  /**
   * 构建 WS 实例并绑定服务端事件。
   */
  private build(): SocketTemplate {
    const origin = window.location.origin;
    const token = getAccessToken();
    const socket = createSocketService({
      protocol: "websocket",
      urls: [origin],
      path: "/ws/terminal",
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      heartbeatInterval: 25000,
      query: token ? { "x-oauth-token": token } : undefined,
    });

    socket.on("connect", () => {
      // 断线重连后服务端已丢失 PTY，需要重新 start；首次连接由 connect() 统一发起，避免重复启动
      if (!this.disposed && this.currentSessionId && this.startEmitted) {
        this.emitStart(socket);
      }
      this.notifyStatus(true);
    });
    socket.on("disconnect", () => {
      // 允许下一次 connect() 重新建连
      this.connecting = null;
      this.notifyStatus(false);
    });
    this.bindEvent(socket, "terminal.ready", "ready");
    this.bindEvent(socket, "terminal.output", "output");
    this.bindEvent(socket, "terminal.exit", "exit");
    this.bindEvent(socket, "terminal.error", "error");
    this.bindEvent(socket, "terminal.stopped", "stopped");
    return socket;
  }

  /**
   * 把服务端事件转发到本地监听器。
   */
  private bindEvent<K extends keyof TerminalEventPayload>(
    socket: SocketTemplate,
    event: string,
    key: K,
  ): void {
    socket.on(event, (payload) => {
      const set = this.listeners.get(key);
      if (!set) {
        return;
      }
      set.forEach((listener) => {
        try {
          listener(payload as TerminalEventPayload[K]);
        } catch (error) {
          console.error(`[TerminalSocket] 监听器执行失败: ${event}`, error);
        }
      });
    });
  }
}

/**
 * 全局终端连接管理器。
 */
export const terminalSocketManager = new TerminalSocketManager();
