/**
 * 倒计时调度器
 *
 * 在独立线程中管理所有倒计时任务，通过 postMessage 以秒级精度向主线程推送剩余 ms，
 * 主线程用 requestAnimationFrame 插值刷新 UI，兼顾精度与性能。
 *
 * @example
 * ```ts
 * const cd = createCountdownManager();
 * cd.subscribe((tasks) => console.log(tasks));     // 每秒回调
 * cd.add({ id: "a", endTime: Date.now() + 60_000 }); // 注册 60 秒倒计时
 * cd.pause("a");
 * cd.resume("a");
 * cd.remove("a");
 * cd.clearAll();
 * cd.stop();
 * ```
 */
import type { CountdownTask, CountdownTick, CountdownWorkerMessage } from "./types";
import { log } from "@repo/utils";

/** Worker 实例 */
let worker: Worker | null = null;

/** 订阅者集合（模块级，全局共享同一个倒计时 tick） */
const subscribers = new Set<(tick: CountdownTick) => void>();

/** 已注册的倒计时列表（主线程侧，保证 postMessage 前是 plain data） */
const managedTasks: CountdownTask[] = [];

/** 是否已绑定 message 监听 */
let initialized = false;

/** 获取或创建 Worker 实例 */
function getWorker(): Worker | null {
  if (worker) return worker;
  // 浏览器不支持 Worker 时（SSR / 异常环境）返回空，静默降级
  if (typeof Worker === "undefined" || typeof self === "undefined") return null;

  worker = new Worker(new URL("./countdown.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<CountdownTick>) => {
    const tick = event.data;
    if (!tick || typeof tick !== "object" || !Array.isArray(tick.tasks)) return;
    subscribers.forEach((handler) => {
      try {
        handler(tick);
      } catch {
        /* ignore handler errors */
      }
    });
  };

  worker.onerror = (err: ErrorEvent) => {
    log.warn(`[countdown worker] error:`, err.message ?? "unknown");
  };

  initialized = true;
  return worker;
}

/** 通知 Worker 更新任务列表 */
function post(message: CountdownWorkerMessage): void {
  const w = getWorker();
  if (!w) return;
  w.postMessage({
    type: message.type,
    tasks: Array.from(message.tasks ?? []),
  });
}

/** 由主线程侧推满任务 → 同步给 Worker */
function syncTasks(): void {
  worker?.postMessage({
    type: "update",
    tasks: Array.from(managedTasks),
  });
}

/**
 * 创建倒计时调度器（模块级单例）
 */
export function createCountdownManager() {
  /** 注册或更新倒计时任务 */
  function add(task: CountdownTask): void {
    if (!task.id || !task.endTime) {
      log.warn(`[countdown] 任务缺少 id/endTime，已忽略`, task);
      return;
    }
    // 已存在则先剔除再追加（保持列表在 worker 侧排序稳定）
    remove(task.id);
    managedTasks.push({ ...task });
    syncTasks();
  }

  /** 按 ID 移除（worker 侧 stop 时自动失效） */
  function remove(id: string): void {
    const index = managedTasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    managedTasks.splice(index, 1);
    syncTasks();
  }

  /** 暂停： worker 侧自动忽略此任务， endTime 保持绝对目标时间戳 */
  function pause(id: string): void {
    const task = managedTasks.find((t) => t.id === id);
    if (!task) return;
    task.paused = true;
    // 记录暂停开始时刻，恢复时从 endTime 补回这段时长
    task.pauseAt = Date.now();
    syncTasks();
  }

  /** 恢复：把暂停期间从 endTime 中补回（目标时间推迟） */
  function resume(id: string): void {
    const task = managedTasks.find((t) => t.id === id);
    if (!task || !task.paused) return;
    const pausedFor = Date.now() - (task.pauseAt ?? Date.now());
    task.endTime += pausedFor;
    task.paused = false;
    delete task.pauseAt;
    syncTasks();
  }

  /** 清空所有任务 */
  function clearAll(): void {
    managedTasks.length = 0;
    syncTasks();
  }

  /** 停止推送（不销毁模块） */
  function stop(): void {
    post({ type: "stop" });
  }

  /** 订阅每次推送 */
  function subscribe(handler: (tick: CountdownTick) => void): () => void {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  /** 销毁 Worker 并清空模块（页面卸载时调用） */
  function destroy(): void {
    stop();
    if (worker) {
      worker.terminate();
      worker = null;
    }
    subscribers.clear();
    managedTasks.length = 0;
    initialized = false;
  }

  return { add, remove, pause, resume, clearAll, stop, subscribe, destroy };
}

// ==================== 全局单例（系统启动注册，后续统一复用） ====================

/** 全局倒计时调度器（createApp 启动时注册） */
let globalCountdown: ReturnType<typeof createCountdownManager> | null = null;

/** 是否已注册全局倒计时 */
let globalCountdownStarted = false;

/**
 * 注册全局倒计时（系统启动调用一次）
 * @returns 全局倒计时管理器
 */
export function initGlobalCountdown(): ReturnType<typeof createCountdownManager> {
  if (!globalCountdown) {
    globalCountdown = createCountdownManager();
  }
  return globalCountdown;
}

/**
 * 获取全局倒计时（createApp 启动后可用）
 * 全局未注册时降级创建（幂等），保证后续组件都能直接订阅。
 */
export function getGlobalCountdown(): ReturnType<typeof createCountdownManager> {
  if (!globalCountdown) {
    globalCountdown = createCountdownManager();
  }
  return globalCountdown;
}

/** 销毁全局倒计时 */
export function destroyGlobalCountdown(): void {
  if (globalCountdown) {
    globalCountdown.destroy();
    globalCountdown = null;
  }
  globalCountdownStarted = false;
}

export type { CountdownTask, CountdownTick, CountdownWorkerMessage };
export default createCountdownManager;
