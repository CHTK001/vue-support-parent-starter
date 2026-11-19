/**
 * APM 时间窗的统一表达与换算。
 *
 * <p>页面上的「时间窗」有两种形态：<b>预设分钟数</b>（最近 15/30/60 分钟…）与
 * <b>自定义起止区间</b>（告警下钻、复盘某段时间）。后端 {@code ApmQuery} 两种都认：
 * 给 {@code startTime/endTime}（毫秒）按区间查，否则按 {@code minutes} 回推。
 * 这里把两种形态收成一个小结构，避免每个页面各写一套 if/else，出现
 * 「链路页认 start/end、日志页只认 minutes」的口径漂移。</p>
 *
 * @since 4.0.0.51
 */

/** 时间窗：`minutes > 0` 为预设；`startTime/endTime` 同时有效时为自定义区间（毫秒） */
export interface ApmTimeWindow {
  /** 预设窗口分钟数；自定义区间时为 0（仅作展示占位） */
  minutes: number;
  /** 自定义起点（毫秒），缺省表示未用自定义区间 */
  startTime?: number;
  /** 自定义终点（毫秒），缺省表示未用自定义区间 */
  endTime?: number;
}

/** 首次进入页面时的默认窗口（与各页原默认一致：30 分钟） */
export const DEFAULT_WINDOW_MINUTES = 30;

/** 下拉里「自定义」选项的值：预设都是正分钟数，0 不会撞车 */
export const CUSTOM_WINDOW_VALUE = 0;

/** 告警下钻时，围绕告警时间点前后各取多久（毫秒） */
export const DRILL_MARGIN_MS = 5 * 60_000;

/** 是否为有效的自定义区间 */
export function isCustomWindow(win: ApmTimeWindow | null | undefined): boolean {
  return !!win && !!win.startTime && !!win.endTime && win.endTime > win.startTime;
}

/**
 * 换算成后端查询参数。
 *
 * <p>自定义区间有效时给 {@code startTime/endTime}（此时不再传 minutes，
 * 两个口径同时下发会让后端无所适从）；否则按预设分钟数回推。</p>
 */
export function timeQuery(win: ApmTimeWindow | null | undefined): { minutes?: number; startTime?: number; endTime?: number } {
  if (isCustomWindow(win)) {
    return { startTime: win!.startTime, endTime: win!.endTime };
  }
  const minutes = win?.minutes && win.minutes > 0 ? win.minutes : DEFAULT_WINDOW_MINUTES;
  return { minutes };
}

/**
 * 从外部输入（URL query / 跳转上下文）解析时间窗。
 *
 * <p>URL 是外部输入，一律不信任类型：解析失败或区间倒挂时退回
 * {@code minutes}，再不行返回 null（调用方保持自己的默认值）。
 * {@code start/end}（毫秒）优先于 {@code minutes} —— 它更具体。</p>
 */
export function parseTimeWindow(params: { start?: unknown; end?: unknown; minutes?: unknown }): ApmTimeWindow | null {
  const num = (value: unknown): number => {
    const raw = Array.isArray(value) ? value[0] : value;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const start = num(params.start);
  const end = num(params.end);
  if (start && end && end > start) {
    return { minutes: CUSTOM_WINDOW_VALUE, startTime: start, endTime: end };
  }
  const minutes = num(params.minutes);
  return minutes > 0 ? { minutes } : null;
}

/** 时间窗 → 路由 query（自定义给 start/end，预设给 minutes），供跨路由跳转携带 */
export function timeWindowQuery(win: ApmTimeWindow | null | undefined): Record<string, string> {
  const query = timeQuery(win);
  const out: Record<string, string> = {};
  if (query.startTime && query.endTime) {
    out.start = String(query.startTime);
    out.end = String(query.endTime);
  } else if (query.minutes) {
    out.minutes = String(query.minutes);
  }
  return out;
}

/** 毫秒 → 本地短时间（选择器里回显用） */
export function windowLabel(win: ApmTimeWindow | null | undefined): string {
  if (isCustomWindow(win)) {
    const fmt = (ms: number) => new Date(ms).toLocaleString();
    return `${fmt(win!.startTime!)} ~ ${fmt(win!.endTime!)}`;
  }
  return `最近 ${win?.minutes || DEFAULT_WINDOW_MINUTES} 分钟`;
}
