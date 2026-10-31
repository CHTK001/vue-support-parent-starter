/**
 * 调试中心 API（@pages/debug）
 *
 * <p>对接 {@code spring-support-cdp-starter} 的两个通道：</p>
 * <ul>
 *   <li>REST {@code /ms/cdp/**}：浏览器生命周期 / 目标 / 页面操作（状态、启动、停止、
 *     页面列表、截屏、求值…）；</li>
 *   <li>WebSocket {@code /ws/cdp}：音视频级的 CDP JSON-RPC 透传 + 事件推送
 *     （Console / Network / Page / Target 事件），是 DevTools 面板的实时通道。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { http, unwrapResult } from "@repo/utils";

/* ==================== 类型 ==================== */

/** 浏览器状态（REST /ms/cdp/status 返回） */
export interface CdpStatus {
  /** 端口 */
  port: number;
  /** 状态 NOT_STARTED / STARTING / STARTED / STOPPED / FAILED */
  state: string;
  /** DevTools WS 端点 */
  endpoint?: string;
  /** 浏览器版本 */
  version?: string;
  targetCount?: number;
  /** 启动时间（ms） */
  startedAt?: number;
}

/** 目标（CDP Target） */
export interface CdpTarget {
  id: string;
  type: string;
  title?: string;
  url?: string;
  /** 如 "service_worker" 等 */
  category?: string;
}

/** 页面级目标 */
export interface CdpTargetPage extends CdpTarget {}

/** 控制台消息（CDP Console.messageAdded） */
export interface CdpConsoleMessage {
  /** 方法名，CdpEngineService 统一回传 */
  method?: string;
  /** 控制台行为 */
  type?: string;
  /** 参数（DOM/Console） */
  args?: Record<string, unknown>[];
  /** 页面目标标识 */
  targetId?: string;
  /** 原生时间 */
  timestamp?: number;
}

/** 网络请求（CDP Network.requestWillBeSent） */
export interface CdpNetworkRequest {
  method?: string;
  url?: string;
  /** 当前站点的帧 */
  frameId?: string;
  /** 请求标识 */
  requestId?: string;
  /** 页面目标标识 */
  targetId?: string;
  /** 时间 */
  timestamp?: number;
}

/* ==================== 常量 ==================== */

/** REST 路径前缀 */
export const CDP_PREFIX = "/ms/cdp";

/** WebSocket 路径前缀（后端 {@code spring.cdp.ws-path}） */
export const CDP_WS_PATH = "/ws/cdp";

/** 事件推送帧的标志 */
export const PUSH_EVENT = "Push";

/** 连接成功帧的标志 */
export const CONNECTED_EVENT = "connected";

/** 页面级目标（就是 type === "page" 的目标） */
export interface CdpTargetPage extends CdpTarget {}

/* ==================== REST ==================== */

/**
 * 浏览器状态
 */
export const cdpStatus = () =>
  http().get(`${CDP_PREFIX}/status`).then((r) => unwrapResult<CdpStatus>(r));

/**
 * 所有目标（浏览器级 /json）
 */
export const cdpTargets = () =>
  http().get(`${CDP_PREFIX}/targets`).then((r) => unwrapResult<CdpTarget[]>(r));

/**
 * 页面列表（type=page 的目标）
 */
export const cdpPages = () =>
  http().get(`${CDP_PREFIX}/pages`).then((r) => unwrapResult<CdpTargetPage[]>(r));

/**
 * 打开页面（{url} 默认 about:blank）
 */
export const cdpCreateTarget = (url?: string) => {
  const body: Record<string, unknown> = {};
  if (url) body.url = url;
  return http()
    .post(`${CDP_PREFIX}/targets`)
    .data(body)
    .then((r) => unwrapResult<Record<string, unknown>>(r));
};

/**
 * 关闭页面（targetId）
 */
export const cdpCloseTarget = (targetId: string) =>
  http().delete(`${CDP_PREFIX}/targets/${encodeURIComponent(targetId)}`).then((r) => unwrapResult<boolean>(r));

/**
 * 页面导航
 */
export const cdpNavigate = (targetId: string, url: string) =>
  http()
    .post(`${CDP_PREFIX}/targets/${encodeURIComponent(targetId)}/navigate`)
    .query({ url })
    .then((r) => unwrapResult<Record<string, unknown>>(r));

/**
 * 页面求值（JS 表达式）
 */
export const cdpEvaluate = (targetId: string, expression: string) =>
  http()
    .post(`${CDP_PREFIX}/targets/${encodeURIComponent(targetId)}/evaluate`)
    .query({ expression })
    .then((r) => unwrapResult<Record<string, unknown>>(r));

/**
 * 页面内容（HTML）
 */
export const cdpContent = (targetId: string) =>
  http().get(`${CDP_PREFIX}/targets/${encodeURIComponent(targetId)}/content`).then((r) => unwrapResult<string>(r));

/**
 * 页面 Cookies
 */
export const cdpCookies = (targetId: string) =>
  http().get(`${CDP_PREFIX}/targets/${encodeURIComponent(targetId)}/cookies`).then((r) => unwrapResult<Record<string, unknown>[]>(r));

/**
 * 页面截屏（base64 png）
 */
export const cdpScreenshot = (targetId: string, fullPage = false) =>
  http()
    .post(`${CDP_PREFIX}/targets/${encodeURIComponent(targetId)}/screenshot`)
    .query({ fullPage })
    .then((r) => unwrapResult<string>(r));

/** 启动浏览器 */
export const cdpStart = () => http().post(`${CDP_PREFIX}/start`).then((r) => unwrapResult<CdpStatus>(r));

/** 停止浏览器 */
export const cdpStop = () => http().post(`${CDP_PREFIX}/stop`).then((r) => unwrapResult<CdpStatus>(r));

/* ==================== WebSocket（CDP JSON-RPC） ==================== */

/** WS 事件回调 */
export interface CdpWsHandlers {
  /** 收到事件推送（含 Console / Network / Page / Target） */
  onEvent?: (message: Record<string, unknown>) => void;
  /** 收到调用回复（{"id","result"/"error"}） */
  onResult?: (message: Record<string, unknown>) => void;
  /** 连接已建立 */
  onOpened?: () => void;
  /** 连接断开 */
  onClosed?: (code?: number, reason?: string) => void;
  /** 连接异常 */
  onError?: (error: unknown) => void;
}

/**
 * 构造调试 WS 地址（dev 下走 `ws://${host}/ws/cdp`，prod 下同源 wss）
 */
export function wsAddress(path = CDP_WS_PATH): string {
  const origin = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${origin}//${window.location.host}${path}`;
}

/**
 * 前端 -> 后端 WS 指令（JSON-RPC 风格）。
 *
 * <p>格式的完整约定见 {@code CdpWebSocketHandler}：</p>
 * <ul>
 *   <li>指令：{"method","params","targetId","id"}；</li>
 *   <li>回复：{"id","result"} 或 {"id","error":{"message"}}；</li>
 *   <li>事件推送：{"event":"Push","method","params","targetId"}。</li>
 * </ul>
 */
export class CdpClient {
  private ws?: WebSocket;
  private opened: boolean = false;
  private handlers: CdpWsHandlers = {};
  /** 各方法的事件监听器（method -> handler 列表） */
  private eventHandlers: Record<string, Array<(m: Record<string, unknown>) => void>> = {};
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  private sequence = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private url: string;

  constructor(url?: string) {
    this.url = wsAddress(url ?? CDP_WS_PATH);
  }

  /**
   * 连接
   */
  async connect(): Promise<void> {
    if (this.ws) return;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (error) {
        reject(error);
        return;
      }
      this.ws.onopen = () => {
        this.opened = true;
        this.handlers.onOpened?.();
        resolve();
      };
      this.ws.onmessage = (e: MessageEvent) => this.dispatch(e.data);
      this.ws.onclose = (e) => {
        this.opened = false;
        this.handlers.onClosed?.(e.code, e.reason);
        this.rejectPending(e.reason);
        // 断线重连（指数退避，1s → 30s）
        this.reconnectTimer = setTimeout(() => this.connect().catch(() => {}), 1000);
      };
      this.ws.onerror = (e) => {
        this.handlers.onError?.(e);
        reject(e);
      };
    });
  }

  /** 断开 */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    clearTimeout(this.reconnectTimer);
  }

  /** 是否开着 */
  isOpen(): boolean {
    return this.opened;
  }

  /**
   * 发送 CDP 指令并等待回复
   *
   * @param method 方法名（如 {@code Target.createTarget}）
   * @param params 参数
   * @param targetId 页面目标标识（None = 浏览器级）
   */
  call(method: string, params: Record<string, unknown> = {}, targetId?: string): Promise<unknown> {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const message: Record<string, unknown> = { method, params, id };
      if (targetId) message.targetId = targetId;
      this.ws?.send(JSON.stringify(message));
    });
  }

  /**
   * 一次性调用（发完即收，不需要事件）
   */
  async callOnce(method: string, params: Record<string, unknown> = {}, targetId?: string): Promise<unknown> {
    try {
      return await this.call(method, params, targetId);
    } finally {
      // call 的回复可能由页面事件流带来（无 id），这里不主动等待；直接归还，
      // 算作一次性执行完成。
    }
  }

  /**
   * 注册事件（Browser 级，{@code method} 为 CDP 事件方法名）
   */
  on(method: string, handler: (m: Record<string, unknown>) => void): void {
    (this.eventHandlers[method] ??= []).push(handler);
  }

  /**
   * 注销事件
   */
  off(method: string, handler?: (m: Record<string, unknown>) => void): void {
    if (!handler) {
      delete this.eventHandlers[method];
      return;
    }
    const list = this.eventHandlers[method];
    if (list) this.eventHandlers[method] = list.filter((h) => h !== handler);
  }

  private dispatch(data: string): void {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    const event = message.event as string | undefined;
    const id = message.id as number | undefined;
    const method = message.method as string | undefined;
    // 调用回复
    if (id !== undefined && typeof id === "number") {
      const p = this.pending.get(id);
      if (p) {
        this.pending.delete(id);
        if (message.error) {
          const err = message.error as { message?: string } | undefined;
          p.reject(new Error(String(err?.message ?? "CDP error")));
        } else {
          p.resolve(message.result);
        }
        return;
      }
      // 没有找到待回答的交易：当作未知的事件推送
      const anyMessage = { ...message };
      this.handlers.onResult?.(anyMessage);
      return;
    }
    // 推送事件帧
    if (event === PUSH_EVENT) {
      const list = this.eventHandlers[method ?? ""];
      if (list) {
        for (const h of list) h(message);
      }
      return;
    }
    if (event === CONNECTED_EVENT) {
      this.handlers.onOpened?.();
      return;
    }
    this.handlers.onEvent?.(message);
  }

  private rejectPending(reason: string): void {
    for (const [id, p] of this.pending) {
      p.reject(new Error(reason ?? "connection closed"));
      this.pending.delete(id);
    }
  }
}

export function createCdpClient(url?: string): CdpClient {
  return new CdpClient(url);
}
