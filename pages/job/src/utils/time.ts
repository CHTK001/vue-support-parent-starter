/**
 * 时间展示工具：调度台账的时刻列存的是毫秒时间戳，需要前端本地化格式化。
 */

/** 毫秒时间戳转 "yyyy-MM-DD HH:mm:ss"，0/空/非法一律显示占位符 */
export function fmtMs(ms: unknown): string {
  const value = Number(ms ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }
  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 「下次触发」列的紧凑时刻：当天显示「今天 HH:mm:ss」，其余显示「MM-DD HH:mm」。
 *
 * 概览表列窄，完整的 yyyy-MM-dd HH:mm:ss 会挤掉倒计时列；秒只对「马上要触发的那个」
 * 有意义，跨天的任务精确到分就够了。
 *
 * @param ms 触发时刻（毫秒时间戳）
 * @returns 紧凑时刻文案；空值/非法值显示占位符
 */
export function fmtFireShort(ms: unknown): string {
  const value = Number(ms ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }
  const date = new Date(value);
  const now = new Date();
  const pad = (input: number) => String(input).padStart(2, "0");
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
  if (sameDay) {
    return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 剩余毫秒格式化成倒计时文案（"2小时15分" / "3分20秒" / "42秒"）。
 *
 * 只精确到最有用的那一档：天以上报「天+小时」，小时以上报「小时+分」，分钟以上报
 * 「分+秒」，不足一分钟才逐秒跳。再往细里拆对排班没有意义，只会让屏幕一直在动。
 *
 * @param leftMs 剩余毫秒
 * @returns 倒计时文案；没有可倒数的目标（<=0 / 非法）时返回空串，由调用方决定回落展示什么
 */
export function fmtDuration(leftMs: number): string {
  if (!Number.isFinite(leftMs) || leftMs <= 0) {
    return "";
  }
  const totalSec = Math.floor(leftMs / 1000);
  const day = Math.floor(totalSec / 86400);
  const hour = Math.floor((totalSec % 86400) / 3600);
  const minute = Math.floor((totalSec % 3600) / 60);
  const second = totalSec % 60;
  if (day > 0) {
    return `${day}天${hour}小时`;
  }
  if (hour > 0) {
    return `${hour}小时${minute}分`;
  }
  if (minute > 0) {
    return `${minute}分${second}秒`;
  }
  return `${second}秒`;
}
