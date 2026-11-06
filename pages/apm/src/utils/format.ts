/**
 * APM 页面的展示格式化工具。
 *
 * <p>集中在一处是刻意的：SkyWalking 的数值语义（耗时毫秒、SLA 以 10000 为满值、
 * 错误率百分比、cpm 每分钟调用）散落到 9 个页面里各写一遍，必然出现
 * 「同一张表里 0.98% 与 98%」这类互相打脸的口径漂移。</p>
 *
 * @since 4.0.0.51
 */

/**
 * 耗时：≥1s 用秒，否则毫秒；非法值统一破折号。
 *
 * <p>OAP 用 {@code -1} 表示「该指标没有数据」（例如没有配置 P99 时），
 * 直接显示会变成「-1ms」—— 看起来像负数耗时，比不显示更糟。</p>
 */
export function fmtMs(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) {
    return "—";
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(2)}s`;
  }
  return `${Math.round(n)}ms`;
}

/** 数值：保留指定小数位，非法值破折号 */
export function fmtNum(value: unknown, digits = 0): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) {
    return "—";
  }
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** 百分比：入参已经是百分数（1.25 → "1.25%"），负数（无数据）破折号 */
export function fmtPercent(value: unknown, digits = 2): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) {
    return "—";
  }
  return `${n.toFixed(digits)}%`;
}

/**
 * 错误率的展示口径：没有调用的服务不显示 100%。
 *
 * <p>SkyWalking 的成功率指标在「窗口内一次调用都没有」时会返回 0，
 * 后端按 100 - 0 换算就得到 100% 错误率 —— 但一次调用都没有时，
 * 错误率本来就没有定义，显示 100% 会让人以为这个服务全挂了。
 * 只在 calls 明确为 0 时退回破折号；calls 未知（-1）时仍按原值显示。</p>
 *
 * @param errorRate 错误率百分数
 * @param calls     同一窗口内的调用量
 */
export function errorRateText(errorRate: unknown, calls: unknown): string {
  const c = Number(calls);
  if (Number.isFinite(c) && c === 0) {
    return "—";
  }
  return fmtPercent(errorRate);
}

/**
 * 指标值归一：SkyWalking 的 SLA 满值是 10000（即 100.00%），
 * 其它百分比指标也可能返回 0~10000 的放大值，这里按单位统一收口。
 *
 * @param value 原始值
 * @param unit  指标单位（"%" 时视为百分比指标）
 */
export function normalizeMetricValue(value: number, unit: string): number {
  if (unit === "%" && Math.abs(value) > 100) {
    return value / 100;
  }
  return value;
}

/** 毫秒时间戳 → 本地时间 */
export function fmtTime(ms: unknown): string {
  const n = Number(ms ?? 0);
  if (!Number.isFinite(n) || n <= 0) {
    return "—";
  }
  return new Date(n).toLocaleString();
}

/** 毫秒时间戳 → 短时间（图表轴用，含时:分:秒） */
export function fmtClock(ms: unknown): string {
  const n = Number(ms ?? 0);
  if (!Number.isFinite(n) || n <= 0) {
    return "—";
  }
  return new Date(n).toLocaleTimeString();
}

/**
 * 图表轴上的时间：按数据步长选粒度。
 *
 * <p>分钟级指标还带秒（21:30:00）会把横轴撑满，ECharts 只能每隔几个标签藏一个，
 * 轴看起来忽密忽疏。按步长收敛粒度：秒级看秒、日内看时分、跨日看月日。</p>
 *
 * @param ms     时间戳（毫秒）
 * @param stepMs 数据点间隔（毫秒），默认按分钟
 */
export function fmtAxisClock(ms: unknown, stepMs = 60_000): string {
  const n = Number(ms ?? 0);
  if (!Number.isFinite(n) || n <= 0) {
    return "—";
  }
  const date = new Date(n);
  const pad = (value: number) => String(value).padStart(2, "0");
  if (stepMs >= 86_400_000) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return stepMs < 60_000 ? `${clock}:${pad(date.getSeconds())}` : clock;
}

/** 补格上限：24 小时 × 1 分钟也才 1440，再往上说明步长判错了 */
const MAX_FILLED_BUCKETS = 1500;

/**
 * 从一串升序时间戳里取真实的数据步长：相邻间隔里出现次数最多的那个。
 *
 * <p>不能直接拿 `times[1] - times[0]`：只要第一个桶缺失，步长就会被算成两格，
 * 补格的长度随之全错。间隔只能用众数，最小间隔同样会被一次「多缺一格」带偏。</p>
 *
 * @param times 升序时间戳（毫秒），长度 ≥ 2 时才有意义
 * @returns 步长（毫秒）；样本不足时按分钟兜底
 */
export function pickStepMs(times: number[]): number {
  const counts = new Map<number, number>();
  for (let i = 1; i < times.length; i++) {
    const delta = times[i] - times[i - 1];
    if (delta > 0) {
      counts.set(delta, (counts.get(delta) ?? 0) + 1);
    }
  }
  if (!counts.size) {
    return 60_000;
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

/**
 * 把时间轴补齐成等步长的连续桶。
 *
 * <p>APM 的时序接口只返回「有数据的桶」，没有流量的那段直接消失。如果横轴只拿这些点做类目，
 * 20 分钟的空档会被压成一格（22:02 紧挨着 22:42），曲线还会跨过缺口连成一条，
 * 看图的人会以为这段时间一直在跑。补齐成 null 之后，缺口就是可见的断线。</p>
 *
 * <p>只在首末时间差能被步长整除时补，且总格数不超过 {@link MAX_FILLED_BUCKETS}：
 * 万一步长判错，宁可退回原始点，也不能把 24 小时铺成一片空网格。</p>
 *
 * @param times 升序时间戳（毫秒）
 * @returns 补齐后的升序时间戳；无法可靠补齐时原样返回
 */
export function fillTimeGaps(times: number[]): number[] {
  if (times.length < 2) {
    return times;
  }
  const step = pickStepMs(times);
  const first = times[0];
  const last = times[times.length - 1];
  if (step <= 0 || (last - first) % step !== 0) {
    return times;
  }
  const total = (last - first) / step + 1;
  if (total < times.length || total > MAX_FILLED_BUCKETS) {
    return times;
  }
  return Array.from({ length: total }, (_, i) => first + i * step);
}

/** 「x 分钟前」之类的相对时间，用于心跳/告警 */
export function fmtAgo(ms: unknown): string {
  const n = Number(ms ?? 0);
  if (!Number.isFinite(n) || n <= 0) {
    return "—";
  }
  const diff = Date.now() - n;
  if (diff < 0) {
    return fmtTime(n);
  }
  const minute = 60_000;
  if (diff < minute) {
    return `${Math.max(1, Math.round(diff / 1000))} 秒前`;
  }
  if (diff < 60 * minute) {
    return `${Math.round(diff / minute)} 分钟前`;
  }
  if (diff < 24 * 60 * minute) {
    return `${Math.round(diff / (60 * minute))} 小时前`;
  }
  return fmtTime(n);
}

/** 延迟分档类名：≥1s 危险，≥300ms 警告 */
export function latencyClass(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) {
    return "apm-muted";
  }
  if (n >= 1000) {
    return "apm-danger";
  }
  if (n >= 300) {
    return "apm-warn";
  }
  return "";
}

/** 错误率分档类名：>5% 危险，>1% 警告 */
export function errorRateClass(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) {
    return "apm-muted";
  }
  if (n > 5) {
    return "apm-danger";
  }
  if (n > 1) {
    return "apm-warn";
  }
  return "apm-ok";
}

/** 时间窗口下拉（分钟） */
export const WINDOW_OPTIONS = [
  { label: "最近 15 分钟", value: 15 },
  { label: "最近 30 分钟", value: 30 },
  { label: "最近 1 小时", value: 60 },
  { label: "最近 3 小时", value: 180 },
  { label: "最近 6 小时", value: 360 },
  { label: "最近 12 小时", value: 720 },
  { label: "最近 24 小时", value: 1440 },
];
