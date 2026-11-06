/**
 * 协同快照 → 真实文件的导出
 *
 * <p>协同文档的内容是「客户端渲染器吃的表示」：excel 是 Univer 工作簿 JSON、
 * word 是富文本 HTML、text 是纯文本。要把它们变回用户能打开的文件（xlsx / docx / txt），
 * 需要各转一次。下载与「写回源文件」两个动作都要同一套转换，所以抽到这里，
 * 避免两份实现慢慢跑偏（比如一边用了 SheetJS 的日期格式，一边没有）。</p>
 *
 * @author Buffy
 * @since 2026/11/06
 */
import { htmlToDocxBlob } from "./collabDocx";
import type { CollabDocType } from "../api/filestorageApi";

/** 导出结果 */
export interface SnapshotExport {
  /** 文件字节 */
  blob: Blob;
  /** 建议扩展名（含点，如 {@code .xlsx}） */
  ext: string;
}

/**
 * 把协同快照还原成文件字节。
 *
 * @param type     文档类型：excel / word / text
 * @param snapshot 快照内容
 * @param fileName 原文件名（word 导出里用不到，保留给未来按名定制）
 * @returns 字节与建议扩展名
 */
export async function snapshotToBlob(
  type: CollabDocType,
  snapshot: string,
  fileName: string,
): Promise<SnapshotExport> {
  void fileName;
  if (type === "word") {
    return { blob: await htmlToDocxBlob(snapshot), ext: ".docx" };
  }
  if (type === "text") {
    return { blob: new Blob([snapshot], { type: "text/plain;charset=utf-8" }), ext: ".txt" };
  }
  return { blob: await excelSnapshotToBlob(snapshot), ext: ".xlsx" };
}

/**
 * Univer 工作簿快照 → xlsx（SheetJS）
 *
 * <p>快照结构：{@code { sheets: { [name]: { cellData, rowCount, columnCount } }, sheetOrder }}。
 * 单元格值是 {@code { v }}（也可以带公式 {@code f}，这里只取展示值）。</p>
 *
 * @param snapshot 快照 JSON 字符串
 * @returns xlsx 字节
 */
async function excelSnapshotToBlob(snapshot: string): Promise<Blob> {
  const XLSX = await import("xlsx");
  const json = snapshot ? JSON.parse(snapshot) : null;
  const wb = XLSX.utils.book_new();
  const sheets = json?.sheets ?? {};
  const order: string[] = json?.sheetOrder ?? Object.keys(sheets);
  for (const name of order) {
    const sheet = sheets[name];
    const rows: unknown[][] = [];
    const cellData = sheet?.cellData ?? {};
    const maxRow = sheet?.rowCount ?? 0;
    const maxCol = sheet?.columnCount ?? 0;
    for (let r = 1; r <= maxRow; r++) {
      const row: unknown[] = [];
      for (let cIdx = 0; cIdx < maxCol; cIdx++) {
        // 列号 → 列名（A..Z, AA..AZ, ...）：只支持到 26 列会在大表上丢数据
        row.push(cellData[`${columnName(cIdx)}${r}`]?.v ?? "");
      }
      rows.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  if (order.length === 0) {
    // 空文档（还没画过任何表格）：SheetJS 在「工作簿里一个 sheet 都没有」时
    // write() 会直接抛 "Workbook is empty"，导不出字节。补一张空表即可。
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), "Sheet1");
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out]);
}

/**
 * 0 基列下标 → 列名（0=A, 25=Z, 26=AA …）
 *
 * <p>此前用的是 {@code String.fromCharCode(65 + cIdx)}，超过 25 列之后会跑到
 * {@code [} {@code \} 这些非字母字符上，导出的 xlsx 里那些列直接错位/丢失。</p>
 *
 * @param index 0 基列下标
 * @returns 列名
 */
export function columnName(index: number): string {
  let n = Math.max(0, Math.floor(index));
  let name = "";
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}
