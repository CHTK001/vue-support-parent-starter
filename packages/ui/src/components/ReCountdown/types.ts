/**
 * ReCountdown —— 倒计时组件类型定义
 */

/** 倒计时展示布局 */
export type CountdownLayout = "dial" | "ribbon" | "pulse" | "segment" | "ticker";

/** 倒计时任务（从工作流传入） */
export interface CountdownTask {
  /** 任务 ID，全局唯一 */
  id: string;
  /** 目标时间戳（ms） */
  endTime: number;
  /** 描述 */
  label?: string;
  /** 是否已暂停 */
  paused?: boolean;
  /** 暂停开始时刻 */
  pauseAt?: number;
}

/** 工作流 tick 广播 */
export interface CountdownTick {
  /** 广播时间戳（ms） */
  timestamp: number;
  /** 各任务剩余 ms */
  tasks: CountdownTickTask[];
}

export interface CountdownTickTask {
  /** 任务 ID */
  id: string;
  /** 剩余毫秒数 */
  remaining: number;
  /** 描述 */
  label?: string;
}

/** 倒计时布局 props */
export interface CountdownProps {
  /** 布局 */
  layout: CountdownLayout;
  /** 尺寸 px */
  size?: number;
  /** 颜色 */
  color?: CountdownColor;
  /** 是否显示数字 */
  showNumber?: boolean;
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 结束时的动画 */
  endAnimation?: boolean;
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 是否精确到秒 */
  precision?: "ms" | "s";
}

/** layout 之间共享的 props（由 ReCountdown 透传） */
export interface CountdownLayoutProps {
  /** 剩余毫秒 */
  remaining: number;
  /** 是否已结束 */
  finished: boolean;
  /** 布局 */
  layout: CountdownLayout;
  /** 尺寸 px */
  size?: number;
  /** 颜色 */
  color?: CountdownColor;
  /** 是否展示数字 */
  showNumber?: boolean;
  /** 是否展示文本 */
  showText?: boolean;
  /** 是否展示标签 */
  showLabel?: boolean;
  /** 结束动画 */
  endAnimation?: boolean;
  /** 标签 */
  label?: string;
  /** 总时长 ms（用于环形进度，0 = 不显示环形进度） */
  total?: number;
  /** 是否暂停 */
  paused?: boolean;
}

export type CountdownColor = "primary" | "success" | "warning" | "danger" | "info" | "secondary";
