/**
 * @repo/work —— 后台 Worker 模块集合
 *
 * 统一承载需在独立线程中运行的周期任务，避免主线程 setInterval 节流。
 *
 * 子模块：
 *  - timer：多时区定时器（UTC 偏移 -12 ~ +12，最多 3 个，每秒推送）
 *  - countdown：多任务倒计时管理器（每秒推送剩余 ms，pausable)
 *  - scheduler：统一后台调度器（自动选择 Service Worker / Web Worker / setInterval）
 */
export {
  createTimerWorker,
  initGlobalTimer,
  getGlobalTimer,
  updateGlobalTimer,
  destroyGlobalTimer,
} from "./timer";
export type { TimerTick, TimerZoneTime, TimerWorkerMessage } from "./timer";

export {
  createCountdownManager,
  initGlobalCountdown,
  getGlobalCountdown,
  destroyGlobalCountdown,
} from "./countdown";
export type { CountdownTask, CountdownTick, CountdownWorkerMessage } from "./countdown";

export {
  createScheduler,
  detectSchedulerStrategies,
} from "./scheduler";
export type { Scheduler, SchedulerOptions, SchedulerStrategy } from "./scheduler";