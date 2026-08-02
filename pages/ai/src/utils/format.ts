/**
 * 通用格式化工具
 */

/**
 * 数字千分位格式化
 *
 * @example
 * formatNumber(1234567) // '1,234,567'
 */
export function formatNumber(n: number | undefined | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * 上下文长度格式化：8192 -> '8K'，200000 -> '200K'
 */
export function formatContext(n: number): string {
  if (!n) return '-';
  if (n >= 1000) return (n / 1000) + 'K';
  return n + '';
}

/**
 * 字节大小格式化
 */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return v.toFixed(2) + ' ' + units[i];
}

/**
 * 时间戳格式化为 yyyy-MM-dd HH:mm:ss
 */
export function formatDateTime(ts: number | string | Date): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 短时间格式 HH:mm:ss
 */
export function formatTime(ts: number | string | Date): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 持续秒数格式化为 HH:mm:ss
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}