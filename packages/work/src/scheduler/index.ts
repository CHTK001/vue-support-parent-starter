/**
 * 统一后台调度器 —— 自动选择最合适策略，不兼容时降级
 *
 * 策略优先级（最合适 → 最差）：
 *   1. Service Worker —— HTTPS 下后台独立运行，页面关闭也能刷新，兼容性最高优先
 *   2. Web Worker     —— 独立线程 setInterval，不受主线程节流，兼容性良好
 *   3. setInterval    —— 主线程定时器，后台标签页会被节流，最终降级
 *
 * 统一接口：createScheduler({ name, interval, onTick, immediate })
 * 返回的对象提供 start / stop / destroy / strategy，策略内部自动降级。
 */
import type { Scheduler, SchedulerOptions, SchedulerStrategy } from "./types";
import { createServiceWorkerScheduler } from "./serviceWorkerScheduler";
import { createWebWorkerScheduler } from "./webWorkerScheduler";
import { createIntervalScheduler } from "./intervalScheduler";
import { log } from "@repo/utils";

/** 检测当前环境支持的调度策略集合 */
export function detectSchedulerStrategies(): SchedulerStrategy[] {
  const list: SchedulerStrategy[] = [];

  // Service Worker：需 HTTPS + navigator.serviceWorker
  const isSecure = typeof window !== "undefined" && window.isSecureContext;
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator && isSecure) {
    list.push("service-worker");
  }

  // Web Worker：所有现代浏览器 / IE10+
  if (typeof Worker !== "undefined" && typeof self !== "undefined") {
    list.push("web-worker");
  }

  // setInterval：始终可用
  list.push("interval");
  return list;
}

/**
 * 创建统一调度器（自动选择策略降级）
 *
 * @example
 * ```ts
 * const scheduler = createScheduler({
 *   name: "weather",
 *   interval: 3600000,
 *   onTick: () => fetchWeather(),
 *   immediate: true,
 * });
 * scheduler.start();
 * console.log("strategy:", scheduler.strategy); // "service-worker" | "web-worker" | "interval"
 * // ...
 * scheduler.destroy();
 * ```
 */
export function createScheduler(options: SchedulerOptions): Scheduler {
  // 1) 优先 Service Worker
  const sw = createServiceWorkerScheduler(options);
  if (sw) return wrapStart(sw);

  // 2) Web Worker
  if (typeof Worker !== "undefined" && typeof self !== "undefined") {
    return wrapStart(createWebWorkerScheduler(options));
  }

  // 3) setInterval 降级
  return wrapStart(createIntervalScheduler(options));
}

/** 包装 start 为幂等可 Promise 化（SW 注册是异步的，start 可能需 await） */
function wrapStart(scheduler: Scheduler): Scheduler {
  const originalStart = scheduler.start.bind(scheduler);
  (scheduler as { start(): void }).start = () => {
    const result = originalStart();
    if ((result as any) instanceof Promise) {
      (result as unknown as Promise<any>).catch((err) => log.warn(`[scheduler] start failed:`, err));
    }
  };
  return scheduler;
}

export type { Scheduler, SchedulerOptions, SchedulerStrategy } from "./types";
export default createScheduler;