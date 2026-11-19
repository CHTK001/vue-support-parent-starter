/**
 * 浏览器侧文件导出工具。
 *
 * <p>多数列表后端没有导出接口，各业务页在浏览器侧拼 CSV/TXT 后触发下载。
 * 此前各页各写一份「BOM + Blob + createObjectURL + a.click + 延后 revoke」，
 * 细节（BOM 有无、字段转义、释放时机、文件名时间戳格式）各不相同；
 * 这里收敛成一套，导出口径全仓库一致。</p>
 *
 * <p>仅限浏览器环境使用（依赖 document / URL.createObjectURL）；
 * 小程序等非 DOM 环境不要引用本模块。</p>
 */

/**
 * 文件名时间戳：`YYYYMMDD-HHmmss`。
 *
 * @param date 基准时间，缺省当前时间
 */
export function fileTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const hms = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${ymd}-${hms}`;
}

/**
 * 触发浏览器下载一个 Blob。
 *
 * <p>objectURL 在 click 后延后 2s 释放：部分浏览器触发下载时仍在异步读取
 * href，立刻 revoke 会让下载变成空文件。</p>
 *
 * @param blob 文件内容
 * @param filename 保存文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * 下载文本文件。
 *
 * @param text 文件内容
 * @param filename 保存文件名
 * @param mime MIME 类型，缺省纯文本
 * @param withBom 是否带 UTF-8 BOM（缺省带；Excel / 记事本打开中文不乱码）
 */
export function downloadTextFile(
  text: string,
  filename: string,
  mime = "text/plain;charset=utf-8",
  withBom = true,
): void {
  const body = withBom ? `\ufeff${text}` : text;
  downloadBlob(new Blob([body], { type: mime }), filename);
}

/**
 * CSV 字段转义：统一包裹双引号，字段内的 `"` 翻倍（Excel 口径）；
 * null / undefined 归一为空串。
 */
export function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/**
 * 二维表 → CSV 文本（`\r\n` 连接）。
 *
 * @param rows 每行一个字段数组；调用方自行保证首行是表头
 */
export function toCsv(rows: Array<Array<unknown>>): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

/**
 * 生成并下载 CSV（带 BOM）。
 *
 * @param filename 保存文件名（建议带 .csv 后缀）
 * @param rows 首行为表头，其后为数据行
 */
export function downloadCsv(filename: string, rows: Array<Array<unknown>>): void {
  downloadTextFile(toCsv(rows), filename, "text/csv;charset=utf-8");
}
