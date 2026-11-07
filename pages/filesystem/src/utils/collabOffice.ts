/**
 * 协同快照的 OOXML 封装（office-engine 版）。
 *
 * <p><b>为什么要换掉原来的字符串快照。</b>旧协同引擎把文档内容存成「渲染器私有表示」：
 * excel 是 Univer 工作簿 JSON、word 是富文本 HTML。新引擎（{@code @p10node/office-engine}）
 * 直接吃真实文件字节（xlsx / docx），所以快照必须能装下二进制。</p>
 *
 * <p><b>格式约定</b>：Excel / Word 快照统一写成
 * {@code ooxml1:<base64>}，冒号后是文件的原始字节经 Base64 编码的结果；
 * text 类型仍保持纯文本，不套壳（可读性优先，也避免无谓的 33% 膨胀）。</p>
 *
 * <p><b>向后兼容</b>：历史快照（Univer JSON / HTML）没有前缀，读取时由
 * {@code collabExport.snapshotToBlob} 走旧转换路径生成 xlsx/docx 字节；
 * 用户首次保存后自动升级为新格式，无需数据迁移脚本。</p>
 *
 * @author Buffy
 * @since 2026/11/07
 */
import type { CollabDocType } from "../api/filestorageApi";

/** 新快照前缀：ooxml1 + 冒号 + Base64 文件字节 */
export const OFFICE_SNAPSHOT_PREFIX = "ooxml1:";

/** 是否为新格式（二进制）快照 */
export function isOfficeSnapshot(snapshot: string): boolean {
  return typeof snapshot === "string" && snapshot.startsWith(OFFICE_SNAPSHOT_PREFIX);
}

/**
 * 文件字节 → 新格式快照。
 *
 * @param bytes 文件原始字节（xlsx / docx）
 * @returns {@code ooxml1:<base64>}
 */
export function encodeOfficeSnapshot(bytes: Uint8Array): string {
  return OFFICE_SNAPSHOT_PREFIX + bytesToBase64(bytes);
}

/**
 * 新格式快照 → 文件原始字节。
 *
 * @param snapshot {@code ooxml1:<base64>}
 * @returns 文件字节
 * @throws Error 快照不是新格式或 Base64 非法
 */
export function decodeOfficeSnapshot(snapshot: string): Uint8Array {
  if (!isOfficeSnapshot(snapshot)) {
    throw new Error("不是 OOXML 格式的协同快照");
  }
  return base64ToBytes(snapshot.slice(OFFICE_SNAPSHOT_PREFIX.length));
}

/**
 * Blob → 新格式快照（编辑器保存回调的入口）。
 *
 * @param blob 引擎产出的文件
 * @returns {@code ooxml1:<base64>}
 */
export async function blobToOfficeSnapshot(blob: Blob): Promise<string> {
  return encodeOfficeSnapshot(new Uint8Array(await blob.arrayBuffer()));
}

/** 协同类型 → OOXML MIME */
export function officeMimeOf(type: CollabDocType): string {
  if (type === "word") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (type === "excel") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "text/plain;charset=utf-8";
}

/** 协同类型 → 下载扩展名（含点） */
export function officeExtOf(type: CollabDocType): string {
  if (type === "word") return ".docx";
  if (type === "excel") return ".xlsx";
  return ".txt";
}

/**
 * 快照里真实文件的字节数（列表/历史展示用）。
 *
 * <p>Base64 有 33% 膨胀，直接按字符串长度展示会让用户看到「100KB 的表格占 133KB」，
 * 所以新格式按解码后长度估算（不真正解码，避免大快照逐个分配内存）。</p>
 *
 * @param snapshot 快照
 * @returns 估算的原始字节数
 */
export function officeSnapshotBytes(snapshot: string): number {
  if (!isOfficeSnapshot(snapshot)) {
    return new TextEncoder().encode(snapshot || "").length;
  }
  const body = snapshot.slice(OFFICE_SNAPSHOT_PREFIX.length);
  const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((body.length * 3) / 4) - padding);
}

/** 分块 btoa：一次 spread 一个巨大的 Uint8Array 会打爆调用栈 */
function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

/** Base64 → 字节（atob 后逐字符取码，避免 TextEncoder 的 UTF-8 破坏二进制） */
function base64ToBytes(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
