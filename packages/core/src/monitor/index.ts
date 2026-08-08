/**
 * 全局异常监控（core）—— 主线程封装
 *
 * 启动时注册 window error / unhandledrejection / 资源加载失败监听，
 * 将异常规范化后交给 Worker（errorMonitor.worker.ts）做去重、采样、批量缓冲，
 * Worker 回传批量记录后，主线程按 monitor.reportUrl 上报服务端（POST JSON）。
 *
 * reportUrl 为空时不上报服务端，仅通过 onBatch 订阅对外暴露（本地统计 / 控制台）。
 * 卸载函数同时终止 Worker 并移除所有监听，保证页面销毁无残留。
 *
 * 用法（createApp 已接入，无需手动调用）：
 *   const dispose = installErrorMonitor();
 *   // 页面卸载时
 *   dispose();
 */
import { getConfig } from "@repo/config";
import type { MonitorConfig } from "@repo/config";
import { getApiHttp } from "../api";
import type { ErrorRecord, ErrorSource } from "./types";

/** 监控实例（模块级单例，重复 install 幂等） */
let monitorInstance: {
  dispose: () => void;
  capture: (error: unknown, source?: ErrorSource) => void;
  subscribe: (handler: (records: ErrorRecord[]) => void) => () => void;
  flush: () => void;
} | null = null;

/**
 * 安装全局异常监控（读取 getConfig().monitor）。
 * @returns 卸载函数；monitor.enable=false 时返回空操作
 */
export function installErrorMonitor() {
  const cfg = getConfig().monitor;
  if (!cfg?.enable) {
    return () => {};
  }
  if (monitorInstance) {
    return monitorInstance.dispose;
  }
  monitorInstance = createErrorMonitor(cfg);
  return monitorInstance.dispose;
}

/** 主动捕获一条异常（供 Vue errorHandler / 业务代码调用） */
export function captureError(error: unknown, source: ErrorSource = "manual"): void {
  monitorInstance?.capture(error, source);
}

/** 订阅批量异常记录（reportUrl 为空时也能拿到本地统计） */
export function subscribeErrorReport(handler: (records: ErrorRecord[]) => void): () => void {
  return monitorInstance?.subscribe(handler) ?? (() => {});
}

/** 立即冲刷缓冲并上报（页面隐藏 / 主动调用时） */
export function flushErrorMonitor(): void {
  monitorInstance?.flush();
}

/** 获取监控实例（未启用返回 null） */
export function getErrorMonitor() {
  return monitorInstance;
}

/** 构建监控实例（内部实现，单例由 installErrorMonitor 保证） */
function createErrorMonitor(cfg: MonitorConfig) {
  let worker: Worker | null = null;
  let workerReady = false;
  const subscribers = new Set<(records: ErrorRecord[]) => void>();
  const buffer: ErrorRecord[] = [];

  // ── Worker 创建（不支持 Worker 时降级为纯主线程缓冲上报） ──
  try {
    if (typeof Worker !== "undefined") {
      worker = new Worker(new URL("./errorMonitor.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg?.type === "batch" && Array.isArray(msg.records)) {
          emitBatch(msg.records as ErrorRecord[]);
        }
      };
      worker.onerror = () => {
        // Worker 异常时降级为主线程缓冲，保证监控不中断
        worker = null;
      };
      worker.postMessage({ type: "start", config: cfg });
    }
  } catch {
    worker = null;
  }

  /** 主线程直接缓冲并触发批量上报（Worker 不可用时的降级路径） */
  function pushToWorker(record: ErrorRecord): void {
    if (worker) {
      worker.postMessage({ type: "report", record });
      return;
    }
    // 降级：简单按条缓冲，超上限丢弃最旧，达到 batchSize 立即上报
    buffer.push(record);
    if (buffer.length > cfg.maxBuffer) buffer.shift();
    if (buffer.length >= cfg.batchSize) {
      emitBatch(buffer.splice(0, buffer.length));
    }
  }

  /** 批量记录交给订阅者并按 reportUrl 上报 */
  function emitBatch(records: ErrorRecord[]): void {
    subscribers.forEach((handler) => {
      try {
        handler(records);
      } catch {
        /* 订阅者异常不影响上报 */
      }
    });
    reportToServer(records);
  }

  /** 上报服务端（reportUrl 为空时跳过） */
  async function reportToServer(records: ErrorRecord[]): Promise<void> {
    const url = cfg.reportUrl;
    if (!url || records.length === 0) return;
    try {
      const http = getApiHttp();
      await http
        .post(url)
        .data({ records, time: Date.now() })
        .timeout(10_000)
        .then<unknown>((r) => r.data);
    } catch {
      /* 上报失败静默，下批次重试 */
    }
  }

  /** 规范化异常事件 → ErrorRecord */
  function buildRecord(
    input: {
      message: string;
      source: ErrorSource;
      stack?: string;
      filename?: string;
      lineno?: number;
      colno?: number;
      resourceUrl?: string;
      tagName?: string;
    },
  ): ErrorRecord {
    const key = [
      input.source,
      input.message,
      input.filename ?? "",
      input.resourceUrl ?? "",
      input.lineno ?? 0,
      input.colno ?? 0,
    ].join("|");
    return {
      key,
      source: input.source,
      message: input.message,
      stack: input.stack,
      filename: input.filename,
      lineno: input.lineno,
      colno: input.colno,
      resourceUrl: input.resourceUrl,
      tagName: input.tagName,
      firstAt: Date.now(),
      count: 1,
    };
  }

  /** 捕获 JS 运行时错误（window error 事件） */
  function handleError(event: ErrorEvent): void {
    if (!cfg.captureJsError) return;
    pushToWorker(
      buildRecord({
        source: "js",
        message: event.message || "Uncaught Error",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: (event.error as Error)?.stack,
      }),
    );
  }

  /** 捕获未处理的 Promise 拒绝 */
  function handleRejection(event: PromiseRejectionEvent): void {
    if (!cfg.captureRejection) return;
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled Promise Rejection";
    pushToWorker(
      buildRecord({
        source: "rejection",
        message,
        stack: reason instanceof Error ? reason.stack : undefined,
      }),
    );
  }

  /** 捕获资源加载失败（window error 捕获阶段，target 为元素） */
  function handleResourceError(event: Event): void {
    if (!cfg.captureResource) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const tagName = target.tagName ?? "";
    if (!["IMG", "SCRIPT", "LINK", "VIDEO", "AUDIO", "SOURCE", "IFRAME"].includes(tagName)) {
      return;
    }
    const el = target as HTMLElement & { src?: string; href?: string; currentSrc?: string };
    const resourceUrl = (el.currentSrc || el.src || el.href || "").slice(0, 500);
    pushToWorker(
      buildRecord({
        source: "resource",
        message: `资源加载失败: <${tagName.toLowerCase()}>`,
        tagName,
        resourceUrl,
      }),
    );
  }

  // ── 注册监听 ──
  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);
  window.addEventListener("error", handleResourceError, true);

  // 页面隐藏时冲刷一次，避免后台积累
  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      if (worker) worker.postMessage({ type: "flush" });
      else if (buffer.length) emitBatch(buffer.splice(0, buffer.length));
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  /** 主动捕获（外部调用，如 Vue errorHandler） */
  function capture(error: unknown, source: ErrorSource = "manual"): void {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown Error";
    pushToWorker(
      buildRecord({
        source,
        message,
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
  }

  /** 订阅批量记录 */
  function subscribe(handler: (records: ErrorRecord[]) => void): () => void {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  /** 立即冲刷 */
  function flush(): void {
    if (worker) {
      worker.postMessage({ type: "flush" });
    } else if (buffer.length) {
      emitBatch(buffer.splice(0, buffer.length));
    }
  }

  /** 卸载：终止 Worker + 移除监听 */
  function dispose(): void {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
    window.removeEventListener("error", handleResourceError, true);
    document.removeEventListener("visibilitychange", onVisibility);
    if (worker) {
      worker.terminate();
      worker = null;
    }
    subscribers.clear();
    buffer.length = 0;
    monitorInstance = null;
  }

  void workerReady;
  return { dispose, capture, subscribe, flush };
}
