/**
 * 表格页共用的 CSV 导出。
 *
 * <p>只做「当前过滤结果 → CSV 文本 → 触发下载」这一件事：过滤、排序都是前端行为，
 * 导出的是过滤（含排序）后的全量行，不是当前页。文件名里的时间戳由 {@link csvStamp}
 * 统一口径；前置 BOM 让 Excel 直接打开不乱码。</p>
 *
 * @since 4.0.0.51
 */

/** 单元格转义（RFC 4180）：含逗号 / 引号 / 换行时包引号，内部引号翻倍 */
function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * 导出行集为 CSV 并触发下载。
 *
 * @param filename 下载文件名（建议 `actuator-xxx-${csvStamp()}.csv`）
 * @param headers  表头（中文列名）
 * @param rows     数据行，与表头一一对应；导出前已是字符串 / 数字 / 布尔
 */
export function exportRowsToCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  // \uFEFF（BOM）：没有它 Excel 按 ANSI 打开，中文列名变乱码
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** 导出文件名的时间戳：`20261119-1530` */
export function csvStamp(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}
