/**
 * 全局异常监控 —— 共享类型定义
 *
 * 主线程通过 window error / unhandledrejection / 资源加载失败等事件捕获异常，
 * 规范化后 postMessage 交给 Worker；Worker 在独立线程内做去重、限流、缓冲，
 * 达到批量阈值或节流间隔后回传主线程，由主线程按 monitor.reportUrl 上报服务端。
 *
 * 结构：异常记录（ErrorRecord） + Worker 通信协议（ErrorMonitorWorkerMessage / Response）
 */
import type { MonitorConfig } from "@repo/config";

/** 异常来源 */
export type ErrorSource = "js" | "rejection" | "resource" | "manual";

/** 单条异常记录（跨线程结构化克隆，保持纯数据） */
export interface ErrorRecord {
  /** 去重指纹（message + source + lineno + colno 归一化） */
  key: string;
  /** 异常来源 */
  source: ErrorSource;
  /** 异常消息 */
  message: string;
  /** 堆栈（js / rejection 有值，resource 为元素标签描述） */
  stack?: string;
  /** 出错文件 URL（js / rejection 有值） */
  filename?: string;
  /** 出错行号 */
  lineno?: number;
  /** 出错列号 */
  colno?: number;
  /** 资源加载失败的目标 URL（resource 有值） */
  resourceUrl?: string;
  /** 资源元素标签（resource 有值，如 IMG / SCRIPT / LINK） */
  tagName?: string;
  /** 首次发生时间（毫秒时间戳） */
  firstAt: number;
  /** 去重窗口内累计发生次数 */
  count: number;
}

/** 主线程 → Worker：配置下发 */
export interface MonitorStartMessage {
  type: "start";
  config: Pick<
    MonitorConfig,
    "batchSize" | "reportInterval" | "dedupWindow" | "sampleRate" | "maxBuffer"
  >;
}

/** 主线程 → Worker：上报一条异常 */
export interface MonitorReportMessage {
  type: "report";
  record: ErrorRecord;
}

/** 主线程 → Worker：立即冲刷缓冲（页面可见性变化 / 主动调用时） */
export interface MonitorFlushMessage {
  type: "flush";
}

/** 主线程 → Worker 消息联合 */
export type ErrorMonitorWorkerMessage =
  | MonitorStartMessage
  | MonitorReportMessage
  | MonitorFlushMessage;

/** Worker → 主线程：批量异常（达到 batchSize 或 reportInterval 触发） */
export interface MonitorBatchResponse {
  type: "batch";
  records: ErrorRecord[];
}
