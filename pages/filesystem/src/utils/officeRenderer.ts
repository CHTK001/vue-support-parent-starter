/**
 * 客户端 Office 直渲染类型映射
 *
 * 与后端 `com.chua.filestorage.support.preview.ClientPreviewSupport` 保持严格一致：
 * 后端据此决定 `?preview=true` 是否直吐原始字节（而非走 SPI / LibreOffice / Aspose 转换），
 * 前端据此选择对应的 Vue3 Office 组件。两侧清单必须同步修改，否则会出现
 * 「后端已直出字节、前端却按 iframe 服务端页面渲染」或反之的空转。
 *
 * 能力边界（已对发布产物做字节级扫描确认，勿凭 README 臆断）：
 * `@vue-office/*` 组件族底层全部为 ZIP / OOXML 解析器，均不含 OLE2 / CFB
 * （复合文档）文件头 `D0 CF 11 E0 A1 B1 1A E1`，也无任何 OLE 解析器符号。
 * 因此传统二进制格式无法在浏览器端解析：
 *   - `.doc`、`.ppt`（OLE2 复合文档）→ 不支持，仍走服务端转换链路
 *   - `.odt` / `.ods` / `.odp`（OpenDocument）→ 不属于该组件族
 * 这类扩展名不在下表中，由后端继续走服务端渲染，前端继续使用 iframe。
 *
 * @author CH
 * @since 2026/09/26
 */

/** 客户端渲染器标识 */
export type OfficeRenderer = "docx" | "excel" | "pdf" | "pptx";

/** 扩展名到客户端渲染器标识的映射 */
const EXTENSION_TO_RENDERER: Readonly<Record<string, OfficeRenderer>> = Object.freeze({
  // Word：OOXML wordprocessingml 家族（含宏启用与模板变体）
  docx: "docx",
  docm: "docx",
  dotx: "docx",
  dotm: "docx",
  // Excel：OOXML spreadsheetml 家族 + 传统 xls + 二进制 xlsb
  xlsx: "excel",
  xlsm: "excel",
  xlsb: "excel",
  xltx: "excel",
  xltm: "excel",
  xlt: "excel",
  xls: "excel",
  // PowerPoint：OOXML presentationml 家族（传统 ppt 为 OLE2，不在支持范围）
  pptx: "pptx",
  pptm: "pptx",
  potx: "pptx",
  potm: "pptx",
  ppsx: "pptx",
  ppsm: "pptx",
  // PDF
  pdf: "pdf",
});

/**
 * 仅支持传统二进制形态、客户端无法解析的扩展名（OLE2 容器）
 *
 * 这些扩展名与 OOXML 同名系列（`.doc` vs `.docx`）在扩展名层面无法区分，
 * 必须结合内容魔数判断。
 *
 * 实测依据（务必以此为准，勿被产物里的字符串误导）：
 *   - `@vue-office/excel` **不能**读取传统 BIFF(.xls)。虽然其产物中可检出
 *     108 处 `BIFF` 与 `Workbook stream` 字样，但实测把真实 BIFF8 文件交给它
 *     渲染会抛 `Can't find end of central directory : is this a zip file`
 *     —— 即它按 ZIP 解析 OLE2 字节后失败。那些字样只是 exceljs 内部常量，
 *     并非可用的 BIFF 读取器。
 *   - `@vue-office/docx` / `@vue-office/pptx` 分别基于 docx-preview 与
 *     pptx-preview，均为 ZIP/OOXML 解析器，读不了 OLE2。
 *
 * 因此 doc / xls / ppt 三者都必须嗅探：命中 OLE2 交服务端 POI，
 * 命中 ZIP（扩展名骗人的 OOXML）才交客户端。
 */
const LEGACY_BINARY_EXTS: ReadonlySet<string> = new Set(["doc", "xls", "ppt"]);

/** OLE2 / CFB 复合文档文件头（传统 .doc / .xls / .ppt） */
const OLE2_MAGIC: readonly number[] = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

/** ZIP 本地文件头（OOXML 家族） */
const ZIP_MAGIC: readonly number[] = [0x50, 0x4b, 0x03, 0x04];

/** 嗅探 OOXML 内部部件路径的最大扫描字节数 */
const OOXML_SNIFF_LIMIT = 64 * 1024;

/** 已知会伪装成传统扩展名的 OOXML 部件标记（与后端 ClientPreviewSupport 保持一致） */
const OOXML_PART_MARKERS: ReadonlyArray<readonly [string, OfficeRenderer]> = [
  ["word/document.xml", "docx"],
  ["xl/workbook.xml", "excel"],
  ["ppt/presentation.xml", "pptx"],
];

/**
 * 判断字节数组是否以指定前缀开头
 *
 * @param data   数据
 * @param prefix 前缀
 * @returns true 表示匹配
 */
function startsWith(data: Uint8Array, prefix: readonly number[]): boolean {
  if (data.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (data[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

/**
 * 在字节数组中按 ASCII 查找字符串首次出现的位置
 *
 * @param data   数据
 * @param needle 待查找的 ASCII 串
 * @returns 首次出现下标；未找到返回 -1
 */
function indexOfAscii(data: Uint8Array, needle: string): number {
  const target = new TextEncoder().encode(needle);
  const limit = Math.min(data.length, OOXML_SNIFF_LIMIT);
  const max = limit - target.length;
  outer: for (let i = 0; i <= max; i++) {
    for (let j = 0; j < target.length; j++) {
      if (data[i + j] !== target[j]) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}

/**
 * 扫描 ZIP 容器内的部件路径，识别真实 OOXML 类型
 *
 * @param data ZIP 字节
 * @returns 渲染器标识；非已知 OOXML 返回空串
 */
function sniffOoxmlRenderer(data: Uint8Array): OfficeRenderer | "" {
  for (const [marker, renderer] of OOXML_PART_MARKERS) {
    if (indexOfAscii(data, marker) >= 0) {
      return renderer;
    }
  }
  return "";
}

/**
 * 结合内容魔数判定客户端渲染器，处理「扩展名与真实格式不符」的文件
 *
 * 现实中大量文件扩展名不可信（Word/WPS「另存为」、在线转换、邮件附件等），
 * 会产生「实际是 .docx 却叫 .doc」的文件。仅按扩展名判断会让这类文件
 * 误入服务端 OLE2 解析链路而失败。
 *
 * @param fileName 文件名或对象键
 * @param bytes    文件字节；未取到时传 undefined，退化为纯扩展名判定
 * @returns 渲染器标识；不支持客户端直渲染时返回空串
 */
export function officeRendererOfSniffed(fileName: string, bytes?: Uint8Array): OfficeRenderer | "" {
  const ext = extensionOf(fileName);
  if (!LEGACY_BINARY_EXTS.has(ext)) {
    return EXTENSION_TO_RENDERER[ext] ?? "";
  }
  if (!bytes || bytes.length < 4) {
    // 无内容可嗅探：传统二进制扩展名交服务端处理
    return "";
  }
  if (startsWith(bytes, OLE2_MAGIC)) {
    // 确实是传统二进制格式（真 .doc / .xls / .ppt），交服务端
    return "";
  }
  if (startsWith(bytes, ZIP_MAGIC)) {
    // 扩展名写着 doc，内容其实是 OOXML：按真实类型走客户端组件
    return sniffOoxmlRenderer(bytes);
  }
  return "";
}

/**
 * 提取文件名的小写扩展名（不含点）
 *
 * @param fileName 文件名或对象键
 * @return 小写扩展名；无扩展名时返回空串
 */
export function extensionOf(fileName: string): string {
  if (!fileName || !fileName.includes(".")) {
    return "";
  }
  return fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
}

/**
 * 判断文件是否可能走客户端直渲染
 *
 * 包含两类：
 *   1. 扩展名即可确定的客户端格式（docx / xlsx / pdf 等）
 *   2. 传统二进制扩展名（doc / xls / ppt）——它们有可能实际是 OOXML，
 *      需要取到字节后嗅探真实类型，交由 {@link officeRendererOfSniffed} 判定
 *
 * @param fileName 文件名或对象键
 * @returns true 表示可能走客户端直渲染
 */
export function isClientRenderable(fileName: string): boolean {
  const ext = extensionOf(fileName);
  return Boolean(EXTENSION_TO_RENDERER[ext]) || LEGACY_BINARY_EXTS.has(ext);
}

/**
 * 渲染通道取值：客户端直渲染（后端直吐原始字节）
 */
export const RENDER_CLIENT = "client";

/**
 * 渲染通道取值：服务端渲染（SPI 提供者 / 转换链路）
 */
export const RENDER_SERVER = "server";
