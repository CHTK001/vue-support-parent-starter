/**
 * 主机资产全局 SSE 通道（@pages/server 唯一长连接）
 *
 * <p>原则：</p>
 * <ul>
 *   <li>整个「主机资产」页面只建立<b>一条</b> SSE 长连接，由页面外壳
 *       （{@code AssetsView}）在挂载时打开、卸载时关闭；</li>
 *   <li>连接由 {@code clientId} 标识，服务端按下发内容区分事件：
 *       {@code host-summary}（底部状态条句柄/inode）与 {@code mailbox}（新邮件）；</li>
 *   <li>消费方只声明「关注哪台主机 / 哪个邮箱身份」，订阅动作由本模块用普通 HTTP
 *       转交给服务端，服务端再经这条长连接推送；</li>
 *   <li>断线重连后自动补订阅（{@code host-summary} 与邮箱各一次），消费方无需感知。</li>
 * </ul>
 *
 * <p>除本页面的主机资产区域外，{@code pages/server} 的其它页面不建立 SSE。</p>
 *
 * @since 4.0.0.46
 */
import { http, type SseClient } from "@repo/utils";
import {
  subscribeHostSummary,
  unsubscribeHostSummary,
} from "../api/hostProfile";
import {
  registerMailbox as registerMailboxRequest,
  unregisterMailbox as unregisterMailboxRequest,
} from "../api";

/** 全局 SSE 连接状态 */
export type HostAssetsSseStatus = "idle" | "connecting" | "connected" | "closed";

/** 主机资源摘要推送负载（句柄数 / inode） */
export interface HostSummaryPush {
  hostId: number;
  handleCount: number;
  inodeUsed: number;
  inodeTotal: number;
  inodePercent: number;
  inodeMount: string;
  collectedAt?: string;
}

/** 摘要处理器 */
export type HostSummaryHandler = (summary: HostSummaryPush) => void;

/** 新邮件处理器 */
export type MailboxHandler = (emails: any[]) => void;

/** 连接状态处理器 */
export type HostAssetsSseStatusHandler = (status: HostAssetsSseStatus) => void;

/** 全局 SSE 端点（后端 HostAssetsSseController） */
const STREAM_PATH = "/ms/server/host/assets/stream";

/** 资源摘要事件名 */
const EVENT_SUMMARY = "host-summary";

/** 新邮件事件名 */
const EVENT_MAILBOX = "mailbox";

/** 采不到值时的占位（与服务端一致：-1 显示为「—」） */
const UNKNOWN = -1;

/** 重连间隔（毫秒） */
const RECONNECT_INTERVAL_MS = 3_000;

/** 重连次数上限（接近无限：长连接不应因短暂断网而永久失效） */
const MAX_RECONNECT_ATTEMPTS = 1_000;

/**
 * 安全调用处理器：单个消费方抛异常不影响其它消费方。
 *
 * @param handler 处理器
 * @param value   入参
 */
function safeCall<T>(handler: (value: T) => void, value: T): void {
  try {
    handler(value);
  } catch {
    /* 忽略处理器异常 */
  }
}

/**
 * 把推送负载转成对象（兼容服务端直接下发对象或字符串两种形态）。
 *
 * @param raw 原始负载
 * @returns 对象；无法解析时返回 null
 */
function asRecord(raw: unknown): Record<string, any> | null {
  if (raw && typeof raw === "object") {
    return raw as Record<string, any>;
  }
  if (typeof raw !== "string" || raw === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 把推送负载转成邮件数组。
 *
 * @param raw 原始负载
 * @returns 邮件数组；形态不对时返回空数组
 */
function asEmailList(raw: unknown): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw !== "") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * 主机资产全局 SSE 通道（单例）。
 *
 * <p>按「持有者计数」管理连接生命周期：页面挂载时 {@link open}，卸载时 {@link close}，
 * 计数归零才真正断开，避免同一页面内多个组件分别开合把连接关掉。</p>
 */
class HostAssetsSse {
  /** 底层 SSE 客户端（fetch 实现：带鉴权头、自动重连） */
  private client: SseClient | null = null;
  /** 连接持有者计数 */
  private holders = 0;
  /** 当前连接状态 */
  private status: HostAssetsSseStatus = "idle";
  /** 当前关注的主机（null 表示不订阅摘要） */
  private summaryHostId: number | null = null;
  /** 当前关注的邮箱身份（null 表示不订阅邮件） */
  private mailboxIdentityId: number | null = null;
  /** 摘要处理器 */
  private readonly summaryHandlers = new Set<HostSummaryHandler>();
  /** 新邮件处理器 */
  private readonly mailboxHandlers = new Set<MailboxHandler>();
  /** 状态处理器 */
  private readonly statusHandlers = new Set<HostAssetsSseStatusHandler>();
  /** 订阅请求队列：串行发送，保证「切主机」时服务端收到的顺序与用户操作一致 */
  private queue: Promise<unknown> = Promise.resolve();
  /** 连接标识（一次页面生命周期内保持不变） */
  private clientId = "";

  /**
   * 建立连接（可重复调用，按持有者计数）。
   */
  open(): void {
    this.holders += 1;
    if (this.client) {
      return;
    }
    this.setStatus("connecting");
    const clientId = this.ensureClientId();
    this.client = http()
      .get(STREAM_PATH)
      .query({ clientId })
      .sse({
        reconnect: true,
        maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectInterval: RECONNECT_INTERVAL_MS,
        onOpen: () => {
          this.setStatus("connected");
          this.resubscribe();
        },
        onMessage: (event) => this.handleMessage(event.event, event.data),
        onError: () => {
          /* 仍持有连接时进入重连等待，界面据状态显示「连接中」 */
          if (this.client) {
            this.setStatus("connecting");
          }
        },
        onClose: () => {
          if (this.client) {
            this.setStatus("connecting");
          }
        },
      });
  }

  /**
   * 释放连接（与 {@link open} 配对；计数归零才断开）。
   */
  close(): void {
    this.holders = Math.max(0, this.holders - 1);
    if (this.holders > 0) {
      return;
    }
    this.client?.close();
    this.client = null;
    this.summaryHostId = null;
    this.mailboxIdentityId = null;
    this.setStatus("closed");
  }

  /**
   * 连接标识：服务端按它管理推送订阅。
   *
   * @returns clientId
   */
  getClientId(): string {
    return this.ensureClientId();
  }

  /**
   * 当前连接状态。
   *
   * @returns 状态
   */
  get currentStatus(): HostAssetsSseStatus {
    return this.status;
  }

  /**
   * 订阅主机资源摘要推送（null 表示取消）。
   *
   * @param hostId 主机标识
   */
  setSummaryHost(hostId: number | null): void {
    const next = hostId ?? null;
    if (next === this.summaryHostId) {
      return;
    }
    this.summaryHostId = next;
    if (this.status !== "connected") {
      /* 未连上时只记录关注对象，连上后由 resubscribe() 补发 */
      return;
    }
    const clientId = this.clientId;
    this.enqueue(() => (next == null
      ? unsubscribeHostSummary(clientId)
      : subscribeHostSummary(next, clientId)));
  }

  /**
   * 注册新邮件推送（打开邮件箱时调用）。
   *
   * @param identityId 邮箱身份标识
   */
  registerMailbox(identityId: number): void {
    this.mailboxIdentityId = identityId;
    if (this.status !== "connected") {
      return;
    }
    const clientId = this.clientId;
    this.enqueue(() => registerMailboxRequest(identityId, clientId));
  }

  /**
   * 注销新邮件推送（关闭邮件箱时调用）。
   */
  unregisterMailbox(): void {
    if (this.mailboxIdentityId == null) {
      return;
    }
    this.mailboxIdentityId = null;
    if (this.status !== "connected") {
      return;
    }
    const clientId = this.clientId;
    this.enqueue(() => unregisterMailboxRequest(clientId));
  }

  /**
   * 订阅摘要事件。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onHostSummary(handler: HostSummaryHandler): () => void {
    this.summaryHandlers.add(handler);
    return () => {
      this.summaryHandlers.delete(handler);
    };
  }

  /**
   * 订阅新邮件事件。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onMailbox(handler: MailboxHandler): () => void {
    this.mailboxHandlers.add(handler);
    return () => {
      this.mailboxHandlers.delete(handler);
    };
  }

  /**
   * 订阅连接状态变化。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onStatus(handler: HostAssetsSseStatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * 断线重连（或首次连上）后补发订阅：服务端在断开期间可能已清理订阅。
   */
  private resubscribe(): void {
    const hostId = this.summaryHostId;
    if (hostId != null) {
      const clientId = this.clientId;
      this.enqueue(() => subscribeHostSummary(hostId, clientId));
    }
    const identityId = this.mailboxIdentityId;
    if (identityId != null) {
      const clientId = this.clientId;
      this.enqueue(() => registerMailboxRequest(identityId, clientId));
    }
  }

  /**
   * 串行执行订阅请求；失败只记控制台，不影响后续请求。
   *
   * @param task 请求任务
   */
  private enqueue(task: () => Promise<unknown>): void {
    this.queue = this.queue.then(task).catch(() => undefined);
  }

  /**
   * 分发一条 SSE 事件。
   *
   * @param event 事件名
   * @param data  负载
   */
  private handleMessage(event: string, data: unknown): void {
    if (event === EVENT_SUMMARY) {
      const record = asRecord(data);
      if (!record) {
        return;
      }
      const summary = this.normalizeSummary(record);
      if (summary == null) {
        return;
      }
      /* 只认当前关注的主机：切主机的瞬间可能还有上一条在途 */
      if (this.summaryHostId != null && summary.hostId !== this.summaryHostId) {
        return;
      }
      this.summaryHandlers.forEach((handler) => safeCall(handler, summary));
      return;
    }
    if (event === EVENT_MAILBOX) {
      const emails = asEmailList(data);
      this.mailboxHandlers.forEach((handler) => safeCall(handler, emails));
    }
  }

  /**
   * 规整摘要负载（缺字段按 -1 处理，界面显示「—」）。
   *
   * @param record 原始负载
   * @returns 规整后的摘要；无 hostId 时返回 null
   */
  private normalizeSummary(record: Record<string, any>): HostSummaryPush | null {
    const hostId = Number(record.hostId);
    if (!Number.isFinite(hostId)) {
      return null;
    }
    return {
      hostId,
      handleCount: Number(record.handleCount ?? UNKNOWN),
      inodeUsed: Number(record.inodeUsed ?? UNKNOWN),
      inodeTotal: Number(record.inodeTotal ?? UNKNOWN),
      inodePercent: Number(record.inodePercent ?? UNKNOWN),
      inodeMount: String(record.inodeMount ?? ""),
      collectedAt: record.collectedAt == null ? "" : String(record.collectedAt),
    };
  }

  /**
   * 更新状态并通知订阅者。
   *
   * @param status 新状态
   */
  private setStatus(status: HostAssetsSseStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.statusHandlers.forEach((handler) => safeCall(handler, status));
  }

  /**
   * 懒生成 clientId（浏览器不支持 crypto.randomUUID 时退化为随机串）。
   *
   * @returns clientId
   */
  private ensureClientId(): string {
    if (this.clientId !== "") {
      return this.clientId;
    }
    const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
    this.clientId = cryptoApi && typeof cryptoApi.randomUUID === "function"
      ? `assets-${cryptoApi.randomUUID()}`
      : `assets-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return this.clientId;
  }
}

/** 主机资产全局 SSE 单例（整个 @pages/server 只有这一条连接） */
export const hostAssetsSse = new HostAssetsSse();
