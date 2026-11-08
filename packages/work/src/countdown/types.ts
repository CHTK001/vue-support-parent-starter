/**
 * 倒计时 Worker 共享类型
 *
 * 定时器的作用是秒级推送所有倒计时的剩余毫秒数，精确度由 UI 层的 rAF 插值补偿。
 */

/** 倒计时任务（从 UI 层传入，worker 只负责秒级推送剩余 ms） */
export interface CountdownTask {
  /** 任务 ID，全局唯一 */
  id: string;
  /** 目标时间戳（ms） */
  endTime: number;
  /** 距离目标时间的描述（如 "还有 5 分钟"） */
  label?: string;
  /** 是否已暂停（暂停的任务 worker 不推送，恢复时补回暂停时长） */
  paused?: boolean;
  /** 暂停开始时刻（ms），用于计算暂停时长 */
  pauseAt?: number;
}

/** 单条任务的广播（Worker → 主线程） */
export interface CountdownTickTask {
  /** 任务 ID */
  id: string;
  /** 剩余毫秒数 */
  remaining: number;
  /** 描述 */
  label?: string;
}

/** Worker → 主线程：每秒推送 */
export interface CountdownTick {
  /** 广播时间戳（ms） */
  timestamp: number;
  /** 各任务剩余 ms */
  tasks: CountdownTickTask[];
}

/** 主线程 → Worker：指令 */
export interface CountdownWorkerMessage {
  type: "start" | "stop" | "update";
  /** start/update 时下发任务列表 */
  tasks?: CountdownTask[];
}

/** 人类可读的剩余时间（H:M:S） */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** 增加余时（暂停即刻） */
export function shiftRemaining(ms: number, shiftMs: number): number {
  return Math.max(0, ms + shiftMs);
}

/** 数字补零 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
