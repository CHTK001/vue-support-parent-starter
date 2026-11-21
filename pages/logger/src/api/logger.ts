/**
 * /v2/logger 后端契约封装。
 *
 * 契约（后端部署在 194 monitor 8082，本仓无后端源码）：
 *   GET    /apps     应用/实例清单（app、instance、lastSeen、eventCount、errorCount）
 *   GET    /events   cursor 分页日志查询（level 可逗号多值；返回 { items, cursor }，cursor 空 = 没有更多）
 *   GET    /stats    统计（byLevel 级别分布、eps 吞吐趋势、topLoggers 榜单）
 *   GET    /stream   原生 EventSource 实时流（event: "log" / "heartbeat"）
 *   DELETE /events   清除日志事件（可带 app / level 过滤）
 *
 * 信封 { code, message, data }，code === 0 成功（解包见 ./http.ts）。
 */
import { loggerHttp, withLoggerToken } from "./http";

export type LogLevel = string;

export interface LoggerEvent {
  /** 后端事件可能携带未声明的扩展字段；已知字段类型以声明为准 */
  [key: string]: unknown;
  ts: string | number;
  app?: string;
  instance?: string;
  level?: LogLevel;
  thread?: string;
  logger?: string;
  message?: string;
  stacktrace?: string;
  mdc?: Record<string, unknown> | null;
}

export interface LoggerAppInfo {
  /** 后端实例行可能携带未声明的扩展字段；已知字段类型以声明为准 */
  [key: string]: unknown;
  app?: string;
  instance?: string;
  lastSeen?: string | number;
  eventCount?: number;
  errorCount?: number;
}

export interface LoggerEventsPage {
  items?: LoggerEvent[];
  /** 下一页游标：空串 / 缺省 = 没有更多 */
  cursor?: string;
}

export interface LoggerStats {
  total?: number;
  byLevel?: Record<string, number>;
  /** 吞吐趋势：兼容 [{ts,count}] 与纯数字数组两种形态 */
  eps?: Array<{ ts?: string | number; count: number } | number>;
  topLoggers?: Array<{ logger?: string; count: number }>;
}

/** 级别展示顺序（配色见 styles/tokens.css 的 --log-level-*） */
export const LOG_LEVELS: string[] = ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

/** 级别归一化：后端可能给小写；未知级别原样保留大写，空值回退 INFO */
export function normLevel(level?: string): string {
  const lv = (level ?? "").toUpperCase();
  return lv || "INFO";
}

export interface FetchEventsParams {
  cursor?: string;
  limit?: number;
  app?: string;
  level?: string[];
  keyword?: string;
  startTs?: string | number;
  endTs?: string | number;
}

export function fetchApps(): Promise<LoggerAppInfo[]> {
  return loggerHttp.get<LoggerAppInfo[]>("/apps");
}

export function fetchEvents(params: FetchEventsParams): Promise<LoggerEventsPage> {
  const { level, ...rest } = params;
  return loggerHttp.get<LoggerEventsPage>("/events", {
    ...rest,
    level: level && level.length > 0 ? level.join(",") : undefined,
  });
}

export function fetchStats(): Promise<LoggerStats> {
  return loggerHttp.get<LoggerStats>("/stats");
}

export function clearEvents(params?: { app?: string; level?: string[] }): Promise<unknown> {
  const { level, ...rest } = params ?? {};
  return loggerHttp.del<unknown>("/events", {
    ...rest,
    level: level && level.length > 0 ? level.join(",") : undefined,
  });
}

export interface LogStreamHandlers {
  app?: string;
  level?: string[];
  onEvent: (event: LoggerEvent) => void;
  onHeartbeat?: () => void;
  onOpen?: () => void;
  onError?: () => void;
}

/**
 * 打开实时日志流（原生 EventSource，浏览器断线自动重连，无需手工重试逻辑）。
 * 返回关闭函数：组件卸载 / 暂停时调用。
 */
export function openLogStream(handlers: LogStreamHandlers): () => void {
  const search = new URLSearchParams();
  if (handlers.app) search.set("app", handlers.app);
  if (handlers.level && handlers.level.length > 0) search.set("level", handlers.level.join(","));
  // SSE 的 EventSource 带不了自定义请求头：令牌由 withLoggerToken 拼到查询参数
  // （宿主注入 tokenProvider 时生效；独立运行无令牌则与旧版一致）。
  const source = new EventSource(withLoggerToken(`/v2/logger/stream${search.size > 0 ? `?${search.toString()}` : ""}`));
  source.addEventListener("open", () => handlers.onOpen?.());
  source.addEventListener("heartbeat", () => handlers.onHeartbeat?.());
  source.addEventListener("log", (event) => {
    try {
      handlers.onEvent(JSON.parse((event as MessageEvent<string>).data) as LoggerEvent);
    } catch {
      // 单帧坏数据直接忽略，不打断流
    }
  });
  source.addEventListener("error", () => handlers.onError?.());
  return () => source.close();
}
