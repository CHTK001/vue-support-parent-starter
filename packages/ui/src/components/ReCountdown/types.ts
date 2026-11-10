/**
 * ReCountdown —— 倒计时组件类型定义
 */

/** 倒计时展示布局 */
export type CountdownLayout = "dial" | "ribbon" | "pulse" | "segment" | "ticker" | "clock";

/**
 * 倒计时文本格式（layout 消费，决定时间显示哪些单位）
 *
 *   auto   按总时长（total）自动切单位（环形布局 / 文本显示默认Behavior）
 *   hms    永远显示 HH:MM:SS
 *   ms     永远显示 MM:SS
 *   s      永远显示秒
 *   short  显示短提示（"30秒"、"5分"、"1小时"）
 */
export type CountdownFormat = "auto" | "hms" | "ms" | "s" | "short";

/** 时间单位（从大到小） */
export type CountdownUnit = "d" | "h" | "m" | "s";

/** 倒计时阈值配色（按剩余时间 / 总时长的比例） */
export interface CountdownColorThresholds {
  /** 剩余比例 >= 此值时的档位（默认 0.6） */
  success?: number;
  /** 剩余比例 >= 此值时的档位（默认 0.3） */
  warning?: number;
  /** 低于 warning 档位的兜底层色（默认 0，实际与 warning 以下同色） */
  danger?: number;
  /** 档位 → 实际颜色，不填则与档位同名 */
  colors?: Record<string, CountdownColor>;
}

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
  /** 文本格式：auto 按总时长自适应单位，其余固定单位（auto 为默认） */
  format?: CountdownFormat;
  /** 阈值配色：按 remaining / total 比例切换颜色 */
  colorThresholds?: CountdownColorThresholds;
  /** 时钟布局的单位进度样式：ring 环状 / square 正方形 */
  unitShape?: "ring" | "square";
}

export type CountdownColor = "primary" | "success" | "warning" | "danger" | "info" | "secondary";
