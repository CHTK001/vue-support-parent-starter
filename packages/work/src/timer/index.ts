/**
 * 多时区定时器 —— 独立线程封装
 *
 * 通过 Web Worker 在独立线程每秒推送各时区时间，规避主线程 setInterval
 * 在后台标签页 / 休眠唤醒后节流与误差累积。模块级单例保证同一 Worker。
 *
 * @example
 * ```ts
 * const timer = createTimerWorker();
 * const off = timer.subscribe((tick) => {
 *   console.log(tick.zones); // [{ offset, label, time, date, weekday }]
 * });
 * timer.start([8, 0, -5]);
 * // ...
 * off();
 * timer.stop();
 * ```
 */
import type { TimerTick, TimerWorkerMessage } from "./types";

/** Worker 实例 */
let worker: Worker | null = null;

/** 订阅者集合（模块级单例，全局共享） */
const subscribers = new Set<(tick: TimerTick) => void>();

/** 是否已绑定 message 监听 */
let initialized = false;

/** 获取或创建 Worker 实例 */
function getWorker(): Worker | null {
  if (worker) return worker;
  // 浏览器不支持 Worker 时（SSR / 异常环境）返回空，静默降级
  if (typeof Worker === "undefined" || typeof self === "undefined") return null;

  // Vite/Webpack 可识别 worker.ts 并编译为独立 chunk
  worker = new Worker(new URL("./timer.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<TimerTick>) => {
    const tick = event.data;
    if (!tick || typeof tick !== "object" || !Array.isArray(tick.zones)) return;
    subscribers.forEach((handler) => {
      try {
        handler(tick);
      } catch {
        /* ignore handler errors */
      }
    });
  };

  worker.onerror = (err: ErrorEvent) => {
    console.warn("[timer worker] error:", err.message ?? "unknown");
  };

  initialized = true;
  return worker;
}

/**
 * 创建定时器 Worker 客户端（模块级单例）
 */
export function createTimerWorker() {
  /** 通知 Worker 更新时区配置（未启动则自动启动） */
  function post(message: TimerWorkerMessage): void {
    const w = getWorker();
    if (!w) return;
    // zones 可能来自 Vue reactive 配置（Proxy），postMessage 结构化克隆无法克隆
    // Proxy，会抛 DataCloneError。此处转成普通数组再发送。
    w.postMessage({
      type: message.type,
      zones: Array.from(message.zones ?? []),
    });
  }

  /**
   * 启动定时推送（可重复调用以更新时区）
   * @param zones - UTC 偏移小时列表（-12 ~ +12，最多 3 个）
   */
  function start(zones: number[]): void {
    post({ type: "start", zones });
  }

  /** 更新时区配置（不停止推送） */
  function update(zones: number[]): void {
    post({ type: "update", zones });
  }

  /** 订阅每次推送 */
  function subscribe(handler: (tick: TimerTick) => void): () => void {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  /** 停止推送（不销毁模块） */
  function stop(): void {
    post({ type: "stop" });
  }

  /** 销毁 Worker 并清空模块（页面卸载时调用） */
  function destroy(): void {
    if (worker) {
      worker.terminate();
      worker = null;
    }
    subscribers.clear();
    initialized = false;
  }

  return { start, update, subscribe, stop, destroy };
}

// ==================== 全局单例（系统启动注册，后续统一复用） ====================

/** 全局定时器 Worker 客户端（createApp 启动时注册） */
let globalTimer: ReturnType<typeof createTimerWorker> | null = null;

/** 是否已注册全局定时器 */
let globalTimerStarted = false;

/**
 * 注册全局定时器（系统启动调用一次）
 *
 * @param zones 初始时区（UTC 偏移小时，-12 ~ +12，最多 3 个）
 * @returns 当前时区配置
 */
export function initGlobalTimer(zones: number[] = []): void {
  if (!globalTimer) {
    globalTimer = createTimerWorker();
  }
  if (zones.length > 0) {
    globalTimer.start(zones);
    globalTimerStarted = true;
  }
}

/**
 * 获取全局定时器（createApp 启动后可用）
 * 全局未注册时降级创建（幂等），保证后续组件都能直接订阅。
 */
export function getGlobalTimer(): ReturnType<typeof createTimerWorker> {
  if (!globalTimer) {
    globalTimer = createTimerWorker();
  }
  return globalTimer;
}

/** 更新全局定时器时区配置 */
export function updateGlobalTimer(zones: number[]): void {
  getGlobalTimer().update(zones);
}

/**
 * 销毁全局定时器（应用卸载时调用）
 * 注意：销毁后 createTimerWorker 模块级订阅者会被清空，再次使用需重新订阅。
 */
export function destroyGlobalTimer(): void {
  if (globalTimer) {
    globalTimer.destroy();
    globalTimer = null;
  }
  globalTimerStarted = false;
}

export type { TimerTick, TimerZoneTime, TimerWorkerMessage } from "./types";
export default createTimerWorker;
