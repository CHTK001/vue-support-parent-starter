import type { Scheduler, SchedulerOptions, SchedulerStrategy } from "./types";

/**
 * setInterval 降级策略 —— 主线程定时器，后台标签页可能被浏览器节流。
 * 作为 Service Worker / Web Worker 均不可用时的最终降级。
 */
export function createIntervalScheduler(options: SchedulerOptions): Scheduler {
  let timer: ReturnType<typeof setInterval> | null = null;
  let started = false;

  function start(): void {
    if (started) return;
    started = true;
    if (options.immediate) {
      void options.onTick();
    }
    timer = setInterval(() => {
      void options.onTick();
    }, Math.max(1000, options.interval));
  }

  function stop(): void {
    if (!started) return;
    started = false;
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function destroy(): void {
    stop();
  }

  return { start, stop, destroy, strategy: "interval" as SchedulerStrategy };
}