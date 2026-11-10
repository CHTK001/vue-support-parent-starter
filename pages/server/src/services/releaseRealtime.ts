/**
 * 发布管理全局 SSE 通道（@pages/server 唯一发布长连接）
 *
 * <p>原则：</p>
 * <ul>
 *   <li>发布管理（发布卡片、项目管理、任务浮层、实时日志、操作日志）只建立<b>一条</b>
 *       SSE 长连接，与「主机资产」的 {@code hostAssetsSse} 完全独立；</li>
 *   <li>连接由固定 {@code clientId} 标识，服务端按事件名区分内容：
 *       {@code project-task}（任务步骤/进度/结果）、{@code project-log}（实时日志行）、
 *       {@code op-log}（项目操作日志）；</li>
 *   <li>实时日志在服务端绑定到发起 {@code log/start} 的 clientId，只推给这个客户端，
 *       多标签页之间互不串台；</li>
 *   <li>页面内部不再建立自己的 SSE，也不再定时轮询后端：断线重连后由各消费方
 *       自行补一次快照（事件驱动，非轮询）。</li>
 * </ul>
 *
 * @since 4.0.0.52
 */
import { http, type SseClient } from "@repo/utils";

/** 发布管理 SSE 连接状态 */
export type ReleaseSseStatus = "idle" | "connecting" | "connected" | "closed";

/** 项目任务推送帧（与后端 ProjectTaskEventVO 字段一致） */
export interface ProjectTaskPush {
  taskId: string;
  projectId?: number;
  operation?: string;
  phase: string;
  currentStep?: string;
  progress?: number;
  startTime?: number;
  step?: string;
  line?: string;
  message?: string;
  endTime?: number;
  success?: boolean;
}

/** 实时日志推送帧（与后端 LogPushVO 字段一致） */
export interface ProjectLogPush {
  sessionId: string;
  projectId: number;
  /** LINE / STARTED / ERROR */
  status: string;
  line?: string;
  message?: string;
}

/** 项目操作日志推送帧（与后端 MsServerProjectOpLog 字段一致） */
export interface ProjectOpLogPush {
  id: number;
  projectId?: number;
  projectName?: string;
  releaseId?: number;
  operation?: string;
  operationLabel?: string;
  /** RUNNING / SUCCESS / FAILED */
  status?: string;
  message?: string;
  taskId?: string;
  operatorName?: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
}

/** Actuator 定时采集推送帧（全局时间轮采集后广播） */
export interface ProjectEndpointsPush {
  projectId: number;
  at?: number;
  swagger?: boolean;
  actuator?: boolean;
  port?: number;
  swaggerUrl?: string;
  swaggerApiUrl?: string;
  actuatorUrl?: string;
  health?: string;
  metricCount?: number;
  metrics?: string[];
  message?: string;
}

/** 任务帧处理器 */
export type ProjectTaskHandler = (task: ProjectTaskPush) => void;

/** 实时日志帧处理器 */
export type ProjectLogHandler = (frame: ProjectLogPush) => void;

/** 操作日志帧处理器 */
export type ProjectOpLogHandler = (row: ProjectOpLogPush) => void;

/** Actuator 采集帧处理器 */
export type ProjectEndpointsHandler = (push: ProjectEndpointsPush) => void;

/** 连接状态处理器 */
export type ReleaseSseStatusHandler = (status: ReleaseSseStatus) => void;

/** 发布管理全局 SSE 端点（后端 ReleaseSseController） */
const STREAM_PATH = "/ms/server/release/stream";

/** 事件名（与后端 ReleaseSseHub 常量一致） */
const EVENT_PROJECT_TASK = "project-task";
const EVENT_PROJECT_LOG = "project-log";
const EVENT_OP_LOG = "op-log";
const EVENT_PROJECT_ENDPOINTS = "project-endpoints";

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
 * 把推送负载转成对象（兼容服务端直接下发对象或 JSON 字符串两种形态）。
 *
 * @param raw 原始负载
 * @returns 对象；无法解析时返回 null
 */
function asRecord<T>(raw: unknown): T | null {
  let value: unknown = raw;
  // 服务端 SseEmitter 会把字符串再 JSON 编码一次，收到的可能是「JSON 的字符串」，
  // 因此最多解两遍：先拿对象，拿不到再解一层。
  for (let depth = 0; depth < 3; depth += 1) {
    if (value && typeof value === "object") {
      return value as T;
    }
    if (typeof value !== "string" || value === "") {
      return null;
    }
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value && typeof value === "object" ? (value as T) : null;
}

/**
 * 发布管理全局 SSE 通道（单例）。
 *
 * <p>按「持有者计数」管理连接生命周期：发布管理页面挂载时 {@link open}、卸载时
 * {@link close}；跟踪中的任务也会持有连接，计数归零才真正断开。</p>
 */
class ReleaseSse {
  /** 底层 SSE 客户端（fetch 实现：带鉴权头、自动重连） */
  private client: SseClient | null = null;
  /** 连接持有者计数 */
  private holders = 0;
  /** 当前连接状态 */
  private status: ReleaseSseStatus = "idle";
  /** 任务帧处理器 */
  private readonly taskHandlers = new Set<ProjectTaskHandler>();
  /** 实时日志帧处理器 */
  private readonly logHandlers = new Set<ProjectLogHandler>();
  /** 操作日志帧处理器 */
  private readonly opLogHandlers = new Set<ProjectOpLogHandler>();
  /** Actuator 采集帧处理器 */
  private readonly endpointsHandlers = new Set<ProjectEndpointsHandler>();
  /** 状态处理器 */
  private readonly statusHandlers = new Set<ReleaseSseStatusHandler>();
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
        onOpen: () => this.setStatus("connected"),
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
    this.setStatus("closed");
  }

  /**
   * 连接标识：服务端按它把实时日志推给正确的客户端。
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
  get currentStatus(): ReleaseSseStatus {
    return this.status;
  }

  /**
   * 是否在线（任务/日志推送可用）。
   *
   * @returns 在线返回 true
   */
  get online(): boolean {
    return this.status === "connected";
  }

  /**
   * 订阅任务帧。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onProjectTask(handler: ProjectTaskHandler): () => void {
    this.taskHandlers.add(handler);
    return () => {
      this.taskHandlers.delete(handler);
    };
  }

  /**
   * 订阅实时日志帧。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onProjectLog(handler: ProjectLogHandler): () => void {
    this.logHandlers.add(handler);
    return () => {
      this.logHandlers.delete(handler);
    };
  }

  /**
   * 订阅操作日志帧。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onOpLog(handler: ProjectOpLogHandler): () => void {
    this.opLogHandlers.add(handler);
    return () => {
      this.opLogHandlers.delete(handler);
    };
  }

  /**
   * 订阅 Actuator 定时采集帧。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onProjectEndpoints(handler: ProjectEndpointsHandler): () => void {
    this.endpointsHandlers.add(handler);
    return () => {
      this.endpointsHandlers.delete(handler);
    };
  }

  /**
   * 订阅连接状态变化。
   *
   * @param handler 处理器
   * @returns 取消订阅
   */
  onStatus(handler: ReleaseSseStatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * 分发一条 SSE 事件。
   *
   * @param event 事件名
   * @param data  负载
   */
  private handleMessage(event: string, data: unknown): void {
    if (event === EVENT_PROJECT_TASK) {
      const task = asRecord<ProjectTaskPush>(data);
      if (task && typeof task.taskId === "string") {
        this.taskHandlers.forEach((handler) => safeCall(handler, task));
      }
      return;
    }
    if (event === EVENT_PROJECT_LOG) {
      const frame = asRecord<ProjectLogPush>(data);
      if (frame && typeof frame.status === "string") {
        this.logHandlers.forEach((handler) => safeCall(handler, frame));
      }
      return;
    }
    if (event === EVENT_OP_LOG) {
      const row = asRecord<ProjectOpLogPush>(data);
      if (row) {
        this.opLogHandlers.forEach((handler) => safeCall(handler, row));
      }
      return;
    }
    if (event === EVENT_PROJECT_ENDPOINTS) {
      const push = asRecord<ProjectEndpointsPush>(data);
      if (push && Number.isFinite(Number(push.projectId))) {
        this.endpointsHandlers.forEach((handler) => safeCall(handler, push));
      }
    }
  }

  /**
   * 更新状态并通知订阅者。
   *
   * @param status 新状态
   */
  private setStatus(status: ReleaseSseStatus): void {
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
      ? `release-${cryptoApi.randomUUID()}`
      : `release-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return this.clientId;
  }
}

/**
 * 发布管理全局 SSE 单例（整个 @pages/server 只有这一条发布连接）。
 *
 * <p>与 {@code processTasks} 一样挂到 globalThis 去重：本模块可能被
 * 「主入口静态导入」和「路由异步 chunk」各实例化一次，不锚定就会出现两条连接。</p>
 */
const releaseGlobal = globalThis as any;
export const releaseSse: ReleaseSse =
  releaseGlobal.__RELEASE_SSE__ ?? (releaseGlobal.__RELEASE_SSE__ = new ReleaseSse());
