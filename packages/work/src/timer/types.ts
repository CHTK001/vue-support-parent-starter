/**
 * 定时器 Worker 共享类型
 *
 * 多时区计时（最多 3 个，UTC 偏移 -12 ~ +12）：
 * 主线程通过 postMessage 下发时区配置，Worker 每秒推送各时区当前时间，
 * 避免主线程 setInterval 被节流（后台标签页 / 长时间运行）。
 */

/** 单个时区时间 */
export interface TimerZoneTime {
  /** UTC 偏移（小时，-12 ~ +12） */
  offset: number;
  /** 时区标签（如 UTC+8 / UTC-5） */
  label: string;
  /** 该时区当前时间 HH:mm:ss */
  time: string;
  /** 该时区当前日期 YYYY-MM-DD */
  date: string;
  /** 该时区星期几（中文，如 星期一） */
  weekday: string;
}

/** Worker → 主线程：每秒推送 */
export interface TimerTick {
  /** 本地时间戳（毫秒） */
  timestamp: number;
  /** 各时区时间（最多 3 个） */
  zones: TimerZoneTime[];
}

/** 主线程 → Worker：配置/停止指令 */
export interface TimerWorkerMessage {
  type: "start" | "stop" | "update";
  /** start / update 时下发时区偏移列表（最多 3 个，-12 ~ +12） */
  zones?: number[];
}
