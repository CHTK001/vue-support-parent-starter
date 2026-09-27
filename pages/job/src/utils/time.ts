/**
 * 时间展示工具：调度台账的时刻列存的是毫秒时间戳，需要前端本地化格式化。
 */

/** 毫秒时间戳转 "yyyy-MM-dd HH:mm:ss"，0/空/非法一律显示占位符 */
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
