/**
 * ReCountdown workjs —— 把 <ReCountdown> 接入 @repo/work 的全局倒计时管理
 *
 * 每个 ReCountdown 实例对应一条任务（通过唯一 id 区分），
 * workjs 管事边界：
 *   1. 把任务注册到 @repo/work/countdown 的全局 worker（秒级 tick 推送）
 *   2. 暴露 rAF 插值循环（所有轮子共享一个 tick，每帧驱动所有订阅者）
 *   3. 暂停/恢复/注销走全局 task 状态
 */
import type { CountdownTask } from "./types";
import { getGlobalCountdown } from "@repo/work/countdown";

/** 任务注册表（主线程侧 + 保持与 work 内同步） */
const registry = new Map<string, CountdownTask>();

/** rAF 循环句柄 */
let tickLoop: ReturnType<typeof requestAnimationFrame> | null = null;

/** 计算变化的 callback */
type LoopCallback = (tasks: CountdownTask[]) => void;
const loopCallbacks: Set<LoopCallback> = new Set();

/** 注册倒计时（setup 调用，挂载时生效） */
export function initCountdown(task: CountdownTask): void {
  registry.set(task.id, task);
  getGlobalCountdown().add(task);
}

/** 注销倒计时（unmounted 调用） */
export function destroyCountdown(id: string): void {
  registry.delete(id);
  getGlobalCountdown().remove?.(id);
}

/** 暂停 */
export function pauseCountdown(id: string): void {
  const task = registry.get(id);
  if (!task) return;
  task.paused = true;
  getGlobalCountdown().pause(id);
}

/** 恢复 */
export function resumeCountdown(id: string): void {
  const task = registry.get(id);
  if (!task) return;
  task.paused = false;
  getGlobalCountdown().resume(id);
}

/** 获取某条任务的剩余 ms（工作秒 tick 的增量） */
export function getRemaining(id: string): number {
  return registry.get(id)?.endTime ?? 0;
}

/**
 * 在 work 的 tick（每秒）之上启动 rAF 插值循环
 *
 * 所有 ReCountdown 实例共享唯一 rAF，每帧把 callback 列表里的任务全部推一遍；
 * 回调里应该从自己任务对象的 `endTime` 读目标时间戳（不与 work 内部 copy 解耦），
 * @returns 退出函数
 */
export function startCountdownLoop(callback: LoopCallback): () => void {
  loopCallbacks.add(callback);
  // 已有循环在转，直接把 callback 塞进去，每帧整个跑
  if (tickLoop) return () => loopCallbacks.delete(callback);

  const tick = () => {
    tickLoop = requestAnimationFrame(tick);
    // 无订阅者收掉循环，避免空转
    if (loopCallbacks.size === 0) {
      tickLoop = null;
      return;
    }
    const tasks = Array.from(registry.values());
    // 先拷一份，防止某条回调在 tick 中间 self-destroy
    const callbacks = Array.from(loopCallbacks);
    callbacks.forEach((cb) => cb(tasks));
  };
  tickLoop = requestAnimationFrame(tick);

  return () => loopCallbacks.delete(callback);
}

/** 停止动画循环 */
export function stopCountdownLoop(): void {
  if (tickLoop) {
    cancelAnimationFrame(tickLoop);
    tickLoop = null;
  }
}

/** 清理（开发时） */
export function resetCountdown(): void {
  getGlobalCountdown().clearAll();
  getGlobalCountdown().stop?.();
  stopCountdownLoop();
  registry.clear();
  loopCallbacks.clear();
}
