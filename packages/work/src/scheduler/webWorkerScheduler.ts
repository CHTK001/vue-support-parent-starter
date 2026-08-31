import type { Scheduler, SchedulerOptions, SchedulerStrategy, SchedulerTickMessage } from "./types";
import { log } from "@repo/utils";

/**
 * Web Worker 策略 —— 独立线程 setInterval，不受主线程节流影响。
 * 浏览器兼容性：IE10+ / 所有现代浏览器。
 */
export function createWebWorkerScheduler(options: SchedulerOptions): Scheduler {
  let worker: Worker | null = null;
  let started = false;

  function getWorker(): Worker | null {
    if (worker) return worker;
    if (typeof Worker === "undefined" || typeof self === "undefined") return null;
    try {
      worker = new Worker(new URL("./scheduler.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<SchedulerTickMessage>) => {
        if (e.data?.type === "tick") {
          void options.onTick();
        }
      };
      worker.onerror = () => {
        log.warn(`[scheduler][${options.name}] web worker error, stopping`);
        stop();
      };
    } catch {
      return null;
    }
    return worker;
  }

  function start(): void {
    if (started) return;
    const w = getWorker();
    if (!w) return;
    started = true;
    w.postMessage({ type: "start", interval: options.interval });
    if (options.immediate) {
      void options.onTick();
    }
  }

  function stop(): void {
    if (!started) return;
    started = false;
    if (worker) {
      worker.postMessage({ type: "stop" });
    }
  }

  function destroy(): void {
    stop();
    if (worker) {
      worker.terminate();
      worker = null;
    }
  }

  return { start, stop, destroy, strategy: "web-worker" as SchedulerStrategy };
}