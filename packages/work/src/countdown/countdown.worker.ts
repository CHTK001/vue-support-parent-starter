/**
 * 倒计时 Worker
 *
 * 在独立线程中管理所有已注册的倒计时任务，每秒广播一次各任务的剩余毫秒数，
 * 避免在主线程使用 setInterval 导致后台标签页/休眠唤醒后的误差累积。
 *
 * 消息协议：
 *   主线程  → Worker：
 *     { type: "start", tasks: CountdownTask[] }    启动/更新倒计时列表
 *     { type: "stop" }                              停止推送
 *   Worker  → 主线程：
 *     { type: "tick", timestamp, tasks }            每秒推送各任务剩余 ms
 *
 * 注意：每 1000ms 广播一次足够支撑 UI 秒级刷新；组件内部用 rAF 插值补偿显示精度。
 */
import type { CountdownTask, CountdownTick, CountdownWorkerMessage } from "./types";

/** 每秒推送一次 */
const TICK_INTERVAL_MS = 1000;
/** 完成态任务的剩余阈值：剩余 <= 此值认为已完成（交给主线程移除） */
const FINISHED_DELTA_MS = 1000;

/** 所有倒计时任务（按 key 索引） */
let tasks: CountdownTask[] = [];
/** 定时器句柄 */
let timer: ReturnType<typeof setInterval> | null = null;

/** 数字补零 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 计算单个任务的剩余毫秒数（已暂停的任务不注册） */
function remainingMs(task: CountdownTask): number {
  return Math.max(task.endTime - Date.now(), 0);
}

/** 广播当前 tick */
function broadcast(): void {
  const outputs = tasks
    .filter((task) => !task.paused)
    .map((task) => {
      const remaining = remainingMs(task);
      if (remaining <= FINISHED_DELTA_MS) return null; // 已完成 → 主线程负责移除
      return {
        id: task.id,
        remaining,
        label: task.label,
      };
    })
    .filter(Boolean);

  // 如果没有存活的任务，停止心跳
  if (outputs.length === 0) {
    stop();
    return;
  }

  self.postMessage({
    type: "tick",
    timestamp: Date.now(),
    tasks: outputs,
  });
}

/** 启动/重启心跳推送 */
function startTicking(nextTasks: CountdownTask[]): void {
  // 过滤并去重，限制数量避免 worker 过载
  const seen = new Set<string>();
  tasks = nextTasks
    .filter((t) => Boolean(t && t.id) && !seen.has(t.id) && seen.add(t.id))
    .slice(0, 50);

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  broadcast(); // 立即发一轮
  timer = setInterval(broadcast, TICK_INTERVAL_MS);
}

/** 停止推送并清空任务 */
function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  tasks = [];
}

self.onmessage = (event: MessageEvent<CountdownWorkerMessage>) => {
  const { type, tasks: nextTasks } = event.data ?? {};
  if (type === "start" || type === "update") {
    startTicking(Array.isArray(nextTasks) ? nextTasks : []);
  } else if (type === "stop") {
    stop();
  }
};
