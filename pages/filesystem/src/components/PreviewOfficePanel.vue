<script setup lang="ts">
/**
 * 客户端 Office 文档预览面板组件（@file-viewer / preset-office 版）。
 *
 * <p>渲染底座由 {@code @vue-office/*} 换成 {@code @file-viewer/vue3} +
 * {@code @file-viewer/preset-office}：一个 {@code <file-viewer>} 组件按
 * 文件名扩展名自选渲染器（OOXML / OLE2 / RTF / OpenDocument / iWork /
 * WordPerfect / Hangul），传统二进制（.doc / .xls / .ppt）不再需要服务端转换，
 * 服务端只需回吐原始字节。Excel 选区统计（求和 / 平均 / 计数 / 最值 + 复制）
 * 经 e-virt-table prototype 补丁桥接保留（见 {@link eVirtTableSelectionBridge}）。</p>
 *
 * <p>组件按**内容魔数**校正交给 file-viewer 的文件名（见
 * {@link resolveViewerFileName}），能正确处理「扩展名是 .doc、内容其实是
 * .docx」这类文件；真正的传统二进制 .doc 由 preset-office 原生渲染，
 * 不再退回服务端。服务端判需服务端渲染（channel=spi）时，面板仍会自行
 * 嗅探原始字节、在可直渲染时改走客户端渲染。</p>
 *
 * @author CH
 * @since 2026/09/26（@file-viewer 迁移：2026/10/09）
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";
import {
  extensionOf,
  isCorruptOfficeFile,
  isEncryptedDoc,
  RENDER_SERVER,
  resolveViewerFileName,
} from "../utils/officeRenderer";

import {
  colIndexToLetter,
  computeRangeStats,
  type ParsedXlsx,
  parseDelimitedBytes,
  parseFodsWorkbook,
  parseOdsWorkbook,
  parseXlsxWorkbook,
  type RangeSelection,
  type RangeStats,
  rangeToTsv,
} from "../utils/xlsxSelectStats";
import {
  FV_SELECTION_EVENT,
  installEVirtTableFillerColumns,
  installEVirtTableSelectionBridge,
} from "../utils/eVirtTableSelectionBridge";
import { previewAssetBase } from "../utils/previewAssetBase";

/**
 * 可做选区统计的表格扩展名。
 *
 * <p>四类容器各有解析器：OOXML（xlsx/xlsm/xltx/xltm）、传统 BIFF（xls/xlt，
 * 浏览器内 WASM 转 xlsx 后复用 OOXML 解析器）、纯文本分隔（csv/tsv）、
 * OpenDocument（ods 压缩包 / fods 扁平 XML）。</p>
 */
const STATS_EXTS: ReadonlySet<string> = new Set([
  "xlsx", "xlsm", "xltx", "xltm", "xls", "xlt",
  "csv", "tsv", "ods", "fods",
]);

/** 去掉扩展名，作为 CSV / TSV 的工作表名 */
function stripExt(name: string): string {
  const i = name.lastIndexOf(".");
  const base = i > 0 ? name.slice(0, i) : name;
  return base || "Sheet1";
}

/** 数据加载中状态（v-model，由本组件在拉取字节期间置位） */
const loading = defineModel<boolean>("loading", { default: false });

const props = defineProps<{
  /** 文件字节地址（后端预览通道 ?preview=true） */
  src: string;
  /**
   * 原始字节地址（不带 preview/render 参数）
   *
   * <p>用于后端把文件判成 {@code spi}（服务端渲染）时**再嗅探一次真实字节**：
   * 密文文件后端也解析不了，会回一个服务端渲染页，若直接采信就会得到空页，
   * 而不是「已加密」的可执行提示。</p>
   */
  rawSrc?: string;
  /** 文件名（用于选择渲染器） */
  fileName: string;
}>();

const emit = defineEmits<{
  /** 渲染完成 */
  rendered: [];
  /**
   * 加载或解析失败
   *
   * @param payload `noFallback=true` 表示**不要再退回服务端渲染**
   *                （内容损坏，或服务端既没有渲染器也没有转换器）；
   *                `channel` 告诉父组件该用哪条兜底通道（`server` / `pdf`）；
   *                `reason` 是给用户看的中文文案
   */
  error: [payload?: { noFallback?: boolean; reason?: string; channel?: "server" | "pdf" }];
}>();

/** wrap 容器 DOM 引用 */
const wrapRef = ref<HTMLDivElement>();

/**
 * 文档二进制内容
 *
 * 用 shallowRef 而非 ref：ArrayBuffer 为大对象，深响应性代理没有意义且会拖慢渲染
 */
const buffer = shallowRef<ArrayBuffer | null>(null);

/**
 * 交给 file-viewer 的 File 对象（按内容魔数校正过文件名）
 *
 * <p>file-viewer 按文件名扩展名选渲染器，故文件名必须反映真实格式
 * （见 {@link resolveViewerFileName}）。</p>
 */
const fileRef = shallowRef<File | null>(null);

/**
 * file-viewer 组件（懒加载）
 *
 * <p>vue3 + preset-office + e-virt-table 补丁 + 样式只在真正打开文档时才加载，
 * 不进主包。{@link ensureFileViewerLoaded} 幂等，首个文档触发一次后缓存。</p>
 */
const viewerComp = shallowRef<Component | null>(null);
/** file-viewer 实例 ref（用于读 Shadow DOM 内的活动工作表） */
const viewerRef = ref<{ $el?: HTMLElement } | null>(null);
/** preset-office 渲染器集合（rendererMode:'replace' 时唯一 registry 来源） */
let officePreset: unknown = null;

/**
 * file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次打开可重试）
 *
 * <p>刻意不用 {@code if (viewerComp.value)} 做门闩：条件判空会把该属性
 * 窄化成 {@code null}（TS 4.4 还会经别名条件反向追踪），后续
 * {@code viewerComp.value = ...} 赋 {@code Component | null} 触发 TS2322。
 * 门闩只读这个普通标志，条件里完全不碰该属性。</p>
 */
let fileViewerReady = false;

/**
 * 懒加载 file-viewer 全套依赖
 *
 * <p>并行拉取：vue3 组件、preset-office 渲染器、e-virt-table 选区桥接补丁、
 * 窄表格补列补丁、组件样式。补丁必须在 file-viewer 创建表格实例之前装好，
 * 故在此先行 await。补列补丁失败仅损失"右侧铺满"的视觉效果（回退到留白原状），
 * 不阻塞主流程。</p>
 *
 * @returns 全部就绪返回 true；任一 import 失败返回 false（调用方改走兜底）
 */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  try {
    const [bridgeOk, fillOk, vueMod, presetMod, cssMod, coreMod] = await Promise.all([
      installEVirtTableSelectionBridge(),
      installEVirtTableFillerColumns(),
      import("@file-viewer/vue3-full"),
      import("@file-viewer/preset-office"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
      import("@file-viewer/core"),
    ]);
    if (!fillOk) {
      // 非门闩：补列失败仅右侧留白（原状），不影响预览与统计
      console.warn("[PreviewOfficePanel] e-virt-table 窄表格补列补丁未生效");
    }
    void cssMod; // 样式副作用导入（shadow 模式下组件也会自注入，此处冗余但无害）
    // full 层 + core 层都要显式指到前端同源：core 层不设时会走 automatic
    // 推断，把 file-viewer 运行期 chunk 拼到存储域（文件字节的来源），
    // 于是 /assets/*.js 请求失败、渲染器整体崩掉。详见 FvPanelBase 的注释。
    // previewAssetBase()：预览壳内嵌态返回挂载前缀（如 /fs/），其余同源根 /。
    (vueMod as { setDefaultFullAssetBaseUrl?: (base?: string | URL | null) => void })
      .setDefaultFullAssetBaseUrl?.(previewAssetBase());
    (coreMod as { setDefaultFileViewerAssetBaseUrl?: (base?: string | URL | null) => void })
      .setDefaultFileViewerAssetBaseUrl?.(previewAssetBase());
    officePreset =
      (presetMod as { default?: unknown; officeRenderers?: unknown }).default
      ?? (presetMod as { officeRenderers?: unknown }).officeRenderers;
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer
      ?? (vueMod as { default?: Component }).default
      ?? null;
    fileViewerReady = bridgeOk && !!viewerComp.value && !!officePreset;
    return fileViewerReady;
  } catch (e) {
    console.warn("[PreviewOfficePanel] file-viewer 依赖加载失败", e);
    return false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: officePreset,
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
  presentation: {
    workerUrl: "/vendor/pptx/pptx.worker.js",
    pptModuleUrl: "/vendor/ppt/index.mjs",
    pptWorkerUrl: "/vendor/ppt/worker.mjs",
    pptWasmUrl: "/vendor/ppt/ppt-native.wasm",
    pptFontUrl: "/vendor/ppt/ppt-font-cjk.otf",
  },
}));

/** 加载失败信息（渲染错误时展示，便于定位） */
const failReason = ref("");

/**
 * 可走后端 Word→PDF 转换的 Word 家族扩展名。
 *
 * <p>与后端 {@code FileConvertSystem} SPI 的 aspose-word 覆盖范围对齐
 * （doc/docx/wps；docm/dotx/dotm/dot 与 docx/doc 同 OOXML/OLE2 家族，
 * 加载器一致）。rtf/odt 亦由 Aspose.Words 加载器支持。仅这些格式
 * 显示「PDF 视图」切换入口。</p>
 */
const WORD_PDF_EXTS: ReadonlySet<string> = new Set([
  "doc", "docx", "docm", "dot", "dotx", "dotm", "wps", "rtf", "odt",
]);

/** 当前文件是否为 Word 家族（决定是否显示「PDF 视图」切换） */
const isWordDocument = computed(() => WORD_PDF_EXTS.has(extensionOf(props.fileName)));

/**
 * 后端 Word→PDF 转换是否可用。
 *
 * <p>null=尚未探测；true=后端有转换依赖（aspose-word），显示切换入口；
 * false=后端无依赖，不显示（需后端「有依赖才会显示 pdf」）。</p>
 */
const pdfAvailable = ref<boolean | null>(null);

/**
 * 当前视图：false=客户端原样渲染（file-viewer）；true=PDF 视图
 * （后台 {@code ?format=pdf} 转换出的 PDF 由 renderer-pdf 渲染）。
 */
const pdfMode = ref(false);

/** 探测用的实例级防抖令牌（避免并发重复探测同一文件） */
let pdfProbeToken = 0;

/**
 * 静默探测后端是否支持把当前 Word 文件转成 PDF。
 *
 * <p>读响应头而不消费响应体（{@code X-FileStorage-Convert: pdf} 或
 * {@code application/pdf}），随后立即释放连接 —— 转换发生在服务端写响应体
 * 之前，这里只需知道「能不能转」，不需要真的拉回整份 PDF。失败一律按
 * 「不可用」处理（不显示切换入口，绝不臆测放行）。</p>
 *
 * <p>父组件已带 format=pdf（.doc 等 previewUsePdf 强制 PDF 通道）时
 * 不重复探测、不显示切换（本就渲染 PDF，切换无意义）。</p>
 */
async function probePdfAvailable(): Promise<void> {
  if (!props.src || props.src.includes("format=pdf") || pdfAvailable.value !== null || pdfMode.value) {
    return;
  }
  const token = ++pdfProbeToken;
  const sep = props.src.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${props.src}${sep}format=pdf`);
    if (token !== pdfProbeToken) return;
    const ct = res.headers.get("content-type") ?? "";
    const ok = res.ok && (res.headers.get("X-FileStorage-Convert") === "pdf" || ct.startsWith("application/pdf"));
    pdfAvailable.value = ok;
    // 释放响应体流，避免为探测白拉整份 PDF 传输
    void res.body?.cancel().catch(() => {});
  } catch {
    if (token === pdfProbeToken) pdfAvailable.value = false;
  }
}

/** 切换视图：client=原样渲染；pdf=后台转 PDF 渲染 */
/**
 * PDF 视图直链：当前文件交给浏览器原生 PDF 阅读器的地址。
 *
 * <p>后端 {@code ?format=pdf} 把 Word 转换出的 PDF 经 {@code application/pdf}
 * 直出（含 {@code Content-Disposition} 预览头）。iframe 直挂该地址后由浏览器
 * 内置 pdfium 渲染 —— 不走 file-viewer 的 renderer-pdf（其 worker/字体资源在
 * 本仓库会加载失败并抛未捕获异常导致弹框关闭，见 OFD 先例），也更省资源。</p>
 */
const pdfSrc = computed(() => {
  if (!props.src) return "";
  const sep = props.src.includes("?") ? "&" : "?";
  return `${props.src}${sep}format=pdf`;
});

/** 切换视图：client=原样渲染；pdf=后台转 PDF 交给浏览器原生阅读器 */
function switchView(mode: "client" | "pdf"): void {
  if (mode === "pdf" && pdfAvailable.value !== true) {
    return;
  }
  pdfMode.value = mode === "pdf";
  failReason.value = "";
  // pdf 视图不调 load()：改成渲染 <iframe :src="pdfSrc">（浏览器原生渲染）。
  // 只在切回 client 时重新走一次客户端渲染。
  if (!pdfMode.value) void load();
}

/**
 * 重置 Word PDF 切换状态（切换文件时调用）
 */
function resetPdfSwitch(): void {
  pdfMode.value = false;
  pdfAvailable.value = null;
  pdfProbeToken++;
}

/* ------------------------------------------------------------------ *
 *  Excel 选区统计（求和 / 平均值 / 计数 / 最小值 / 最大值 + 复制）
 *
 *  <p>file-viewer 的 spreadsheet 渲染器底层用 e-virt-table（见
 *  eVirtTableSelectionBridge），选区经 prototype 补丁以 composed
 *  CustomEvent 派发到容器，外部 document 监听即得行列范围。
 *  行列范围只给坐标、不给单元格值，故另用 JSZip 在浏览器内解析
 *  xlsx 容器建稀疏索引，配合事件计算统计 / 生成 TSV。
 *  传统 .xls 经浏览器内 WASM 转成 xlsx 后同样可解析（见 ensureExcelParsed）。</p>
 * ------------------------------------------------------------------ */
const excelSheetIndex = ref(0);
const excelSelection = ref<RangeSelection | null>(null);
const excelParsed = shallowRef<ParsedXlsx | null>(null);
const excelStats = ref<RangeStats | null>(null);
const excelStatsError = ref(false);

/** 防竞态令牌：每次重新解析递增，只采信最后一次的结果 */
let excelParseToken = 0;

/** rAF 合并令牌：一个帧内多次选区事件只刷新一次统计 */
let statsFrame = 0;

/** 切换文件时重置全部统计状态 */
function resetExcelStats(): void {
  excelSheetIndex.value = 0;
  excelSelection.value = null;
  excelParsed.value = null;
  excelStats.value = null;
  excelStatsError.value = false;
  excelParseToken++;
}

/**
 * 懒解析当前表格为稀疏单元格索引（首次选区事件时触发）
 *
 * <p>ZIP 容器（xlsx 家族）直接解析；非 ZIP（传统 .xls BIFF）先经浏览器内
 * WASM 转成 xlsx 再解析 —— 这样 <b>.xls 与 .xlsx 共用同一套统计</b>。
 * 转换器失败或非已知表格结构时置 {@link excelStatsError}，工具条提示「不可用」。</p>
 */
async function ensureExcelParsed(): Promise<void> {
  if (excelParsed.value || excelStatsError.value) return;
  const bytes = buffer.value;
  if (!bytes) return;
  const token = ++excelParseToken;
  try {
    const u8 = new Uint8Array(bytes);
    const ext = extensionOf(props.fileName);
    let parsed: ParsedXlsx;
    if (ext === "csv" || ext === "tsv") {
      // 纯文本分隔：自动去 BOM + 嗅探分隔符（逗号 / 分号 / 制表符 / 竖线）
      parsed = parseDelimitedBytes(u8, stripExt(props.fileName));
    } else if (ext === "fods") {
      // 扁平 ODS：单文件 XML，不算 ZIP
      parsed = parseFodsWorkbook(new TextDecoder("utf-8").decode(u8));
    } else if (ext === "ods") {
      // ODS 压缩包：读 content.xml（不必是 xl/workbook.xml）
      parsed = await parseOdsWorkbook(bytes);
    } else {
      // ZIP 容器直接解析；否则按 .xls 的 BIFF 走 WASM 转换再解析
      const isZip =
        u8.length > 3 && u8[0] === 0x50 && u8[1] === 0x4b && u8[2] === 0x03 && u8[3] === 0x04;
      parsed = isZip ? await parseXlsxWorkbook(bytes) : await parseXlsBytesForStats(u8);
    }
    if (token === excelParseToken) excelParsed.value = parsed;
  } catch (e) {
    console.warn("[PreviewOfficePanel] 表格统计解析失败", e);
    if (token === excelParseToken) excelStatsError.value = true;
  }
}

/** 把 BIFF(.xls) 字节转成 xlsx 后解析（仅 .xls 统计用；渲染仍用原 BIFF 字节） */
async function parseXlsBytesForStats(u8: Uint8Array): Promise<ParsedXlsx> {
  const { convertXlsToXlsx } = await import("../utils/xls2xlsx");
  const ab = await convertXlsToXlsx(u8);
  return parseXlsxWorkbook(ab);
}

/** 根据当前选区 + 工作表计算统计 */
async function refreshExcelStats(): Promise<void> {
  const sel = excelSelection.value;
  if (!sel) {
    excelStats.value = null;
    return;
  }
  if (!excelParsed.value && !excelStatsError.value) await ensureExcelParsed();
  if (!excelParsed.value) {
    excelStats.value = null;
    return;
  }
  const sheet = excelParsed.value.sheets[excelSheetIndex.value];
  excelStats.value = sheet ? computeRangeStats(sheet, sel) : null;
}

/**
 * 从 file-viewer 的 Shadow DOM 内读取当前活动工作表序号
 *
 * <p>file-viewer 的 spreadsheet 渲染器把 sheet 页签渲染在宿主元素的
 * Shadow DOM 内（{@code .sheet-tab}，活动页签带 {@code .active}）。
 * 页签序号与 workbook 的 sheet 数组序号一致。每次选区事件时即时读取，
 * 避免工作表切换与统计刷新之间的竞态。读不到时退化为当前值。</p>
 */
function readActiveSheetIndex(): number {
  const host = viewerRef.value?.$el as HTMLElement | undefined;
  const root = host?.shadowRoot ?? null;
  if (!root) return excelSheetIndex.value;
  const tabs = root.querySelectorAll(".sheet-tab");
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].classList.contains("active")) return i;
  }
  return excelSheetIndex.value;
}

/** 选区变化事件处理（document 级，composed 穿透 Shadow DOM） */
function onSelectionChange(e: Event): void {
  const detail = (e as CustomEvent).detail as { xArr: number[]; yArr: number[] } | null;
  if (detail) {
    excelSheetIndex.value = readActiveSheetIndex();
    excelSelection.value = {
      sci: Math.min(detail.xArr[0], detail.xArr[1]),
      eci: Math.max(detail.xArr[0], detail.xArr[1]),
      sri: Math.min(detail.yArr[0], detail.yArr[1]),
      eri: Math.max(detail.yArr[0], detail.yArr[1]),
    };
  } else {
    excelSelection.value = null;
    excelStats.value = null;
    return;
  }
  // 一个 rAF 内多次事件合并刷新，避免拖选过程每格都重算
  if (statsFrame) return;
  statsFrame = requestAnimationFrame(() => {
    statsFrame = 0;
    void refreshExcelStats();
  });
}

/** 格式化统计数值显示 */
function formatStat(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (Number.isInteger(n)) return n.toLocaleString("zh-CN");
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 4 });
}

/** 选区地址标签（如 "Sheet1!B2:D5"） */
const excelRangeLabel = computed(() => {
  const sel = excelSelection.value;
  if (!sel) return "";
  const r1 = Math.min(sel.sri, sel.eri);
  const r2 = Math.max(sel.sri, sel.eri);
  const c1 = Math.min(sel.sci, sel.eci);
  const c2 = Math.max(sel.sci, sel.eci);
  const sheet = excelParsed.value?.sheets[excelSheetIndex.value];
  const name = sheet?.name ? `${sheet.name}!` : "";
  return `${name}${colIndexToLetter(c1)}${r1 + 1}:${colIndexToLetter(c2)}${r2 + 1}`;
});

/** 复制选区内容到系统剪贴板（TSV 格式） */
async function copyExcelSelection(): Promise<void> {
  const sel = excelSelection.value;
  if (!sel) return;
  if (!excelParsed.value && !excelStatsError.value) await ensureExcelParsed();
  const sheet = excelParsed.value?.sheets[excelSheetIndex.value];
  if (!sheet) {
    message.warning("当前文件暂不支持复制");
    return;
  }
  const r1 = Math.min(sel.sri, sel.eri);
  const r2 = Math.max(sel.sri, sel.eri);
  const c1 = Math.min(sel.sci, sel.eci);
  const c2 = Math.max(sel.sci, sel.eci);
  if ((r2 - r1 + 1) * (c2 - c1 + 1) > 200_000) {
    message.warning("选区过大，请缩小范围后再复制");
    return;
  }
  const tsv = rangeToTsv(sheet, sel);
  if (!tsv.trim()) {
    message.warning("所选区域没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(tsv);
    message.success("已复制选区内容");
  } catch {
    // 降级：部分 http 环境剪贴板 API 不可用
    try {
      const ta = document.createElement("textarea");
      ta.value = tsv;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      message.success("已复制选区内容");
    } catch {
      message.error("复制失败，请手动选择内容");
    }
  }
}

/** 是否显示 Excel 选区统计工具条 */
const showStatsBar = computed(
  () => STATS_EXTS.has(extensionOf(props.fileName)) && !failReason.value && !!fileRef.value,
);

/**
 * 把当前选区的统计结果复制到剪贴板（纯文本，一行一项）。
 *
 * <p>与「复制选区」区分：后者复制单元格内容（TSV，可直接粘回表格），
 * 这里只复制统计口径，便于贴进邮件 / 记录。</p>
 */
async function copyExcelStats(): Promise<void> {
  const st = excelStats.value;
  if (!st) return;
  const lines = [
    `选区：${excelRangeLabel.value}`,
    `求和：${formatStat(st.sum)}`,
    `平均值：${formatStat(st.avg)}`,
    `计数：${st.count}`,
    `最小值：${formatStat(st.min)}`,
    `最大值：${formatStat(st.max)}`,
    `中位数：${formatStat(st.median)}`,
    `标准差：${formatStat(st.stdev)}`,
    `非空：${st.nonEmpty}`,
    `去重：${st.distinct}`,
    `单元格总数：${st.total}`,
  ];
  const text = lines.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    message.success("已复制统计结果");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      message.success("已复制统计结果");
    } catch {
      message.error("复制失败");
    }
  }
}

/**
 * 取原始字节用于嗅探（不带 preview/render 参数）
 *
 * <p>拿不到时返回 undefined：嗅探失败不应阻断原有的兜底流程。</p>
 *
 * @returns 原始字节（前 64 字节，用于密文头判定）；失败返回 undefined
 */
async function sniffRawBytes(): Promise<Uint8Array | undefined> {
  if (!props.rawSrc) {
    return undefined;
  }
  try {
    const r = await fetch(props.rawSrc);
    if (!r.ok) {
      return undefined;
    }
    // 只取前 64 字节即可判定密文头，避免为一个大文件白白拉全量
    const buf = await r.arrayBuffer();
    return new Uint8Array(buf.slice(0, 64));
  } catch {
    return undefined;
  }
}

/**
 * 取完整原始字节（供 .xls 统计用 WASM 转换，以及服务端判 spi 时改走客户端渲染）
 *
 * <p>{@link sniffRawBytes} 只取前 64 字节做密文嗅探；当服务端已判需服务端渲染时，
 * {@link buffer} 里装的是它的 HTML、没有原始字节，所以必须再拉一次。</p>
 *
 * @returns 原始字节；未配置 rawSrc 或失败返回 undefined
 */
async function fetchFullRawBytes(): Promise<Uint8Array | undefined> {
  if (!props.rawSrc) {
    return undefined;
  }
  try {
    const r = await fetch(props.rawSrc);
    if (!r.ok) {
      return undefined;
    }
    return new Uint8Array(await r.arrayBuffer());
  } catch {
    return undefined;
  }
}

/**
 * 拉取文档字节并准备客户端渲染
 *
 * <p>与后端约定：命中客户端直渲染通道时，响应头 {@code X-FileStorage-Preview}
 * 为 {@code client} 且响应体是原始文件字节；命中转换通道时响应头为
 * {@code pdf}（或 {@code X-FileStorage-Convert: pdf}）且响应体是**转换后的
 * PDF 字节**；若后端判定该文件需服务端渲染（channel=spi 等），响应体是
 * HTML 预览页 —— 面板会自行嗅探原始字节，能直渲染就改走客户端
 * （file-viewer 直接吃原始字节），否则退回服务端。</p>
 */
async function load(): Promise<void> {
  // 预览地址（短时票据）是异步换来的，挂载瞬间可能还是空串。此时 fetch("") 会
  // 命中当前文档 URL —— 也就是应用自己的 index.html，把那段 HTML 当成「文档字节」
  // 喂给解析器：日志报 "Cannot detect file format"，还可能被误判成
  // 「需服务端渲染」而把面板降级成 iframe。等票据就绪后 watch 会再触发一次。
  if (!props.src) {
    return;
  }
  loading.value = true;
  failReason.value = "";
  buffer.value = null;
  fileRef.value = null;
  resetExcelStats();
  try {
    // 不带 credentials：数据源是独立 origin（如 http://host:18080），鉴权由 URL 上的
    // x-oauth-token 与请求头承担，不依赖 cookie。一旦写 credentials:"include"，
    // 浏览器会强制要求响应带 Access-Control-Allow-Credentials: true，
    // 而存储服务不返回该头 → 请求直接被 CORS 拦掉（预览整条链路失败）。
    // 注：PDF 视图（pdfMode=true）不经过本函数 —— 由 <iframe :src=pdfSrc>
    // 直接把 Word→PDF 转换结果交给浏览器原生阅读器（见 switchView / pdfSrc）。
    const res = await fetch(props.src);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const channel = res.headers.get("X-FileStorage-Preview");
    // ?format=pdf 转换通道：响应体是转换好的 PDF 字节，不是服务端 HTML。
    // 与后端约定：转换成功回 X-FileStorage-Preview: pdf（或 X-FileStorage-Convert: pdf），
    // 转换失败回 X-FileStorage-Convert: unavailable 并继续走原通道，故只看状态码不够。
    const convertHeader = res.headers.get("X-FileStorage-Convert");
    const isPdfBytes = channel === "pdf" || convertHeader === "pdf"
      || (res.headers.get("content-type") ?? "").startsWith("application/pdf");
    if (isPdfBytes) {
      const pdfBytes = new Uint8Array(await res.arrayBuffer());
      if (pdfBytes.length === 0) {
        throw new Error("PDF 转换通道返回空响应体");
      }
      await prepareClientRender(pdfBytes);
      return;
    }
    if (channel && channel !== "client") {
      // 服务端已按自己的链路渲染出 HTML 预览页，无法作为文档字节解析。
      // 但**先嗅探一次原始字节**：密文（防泄密软件透明加密）后端同样解析不了，
      // 也会回 spi，若直接采信就会得到一张空页，而不是「已加密」的可执行提示。
      const raw = await sniffRawBytes();
      if (isEncryptedDoc(raw)) {
        failReason.value = `该文件已被文档防泄密软件透明加密（${props.fileName}）：`
          + "磁盘上存放的是密文，只有装了客户端并获授权的终端才能解密。"
          + "服务端与浏览器读到的都是密文，重新上传也没用，请提供未加密的副本";
        emit("error", { noFallback: true, reason: failReason.value });
        return;
      }
      // 内容损坏（仅 OOXML 扩展名 .docx/.xlsx/.pptx 校验容器头）：不再退回服务端
      // （服务端拿到的是同一堆坏字节），直接给可执行提示。
      if (isCorruptOfficeFile(props.fileName, raw)) {
        failReason.value = `文件不是有效的 ${props.fileName.split(".").pop()?.toUpperCase()} 容器（${props.fileName}）：`
          + "内容已损坏或格式不符，请重新上传后再试";
        emit("error", { noFallback: true, reason: failReason.value });
        return;
      }
      // 能直渲染：拉完整原始字节，交 file-viewer 客户端渲染
      const fullRaw = await fetchFullRawBytes();
      if (fullRaw) {
        await prepareClientRender(fullRaw);
        return;
      }
      // 拿不到原始字节：探测服务端兜底通道
      const fallback = await probeFallback();
      emitFallback(fallback);
      return;
    }
    // channel=client（或无 channel 头）：响应体即原始字节
    // （显式标注 Uint8Array：下面回退分支赋的是 ArrayBufferLike 泛型实例）
    let bytes: Uint8Array = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0) {
      // 部署差异兜底：有的实例（198:18080 实测）对 client 通道只回通道头、
      // 不回响应体（200 + 空 body）——空字节会绕过长度守卫下的密文/损坏校验，
      // 直接喂给解析器抛「不是有效压缩包」。此时改拉票据直链
      // （rawSrc 不带 preview 参数，实测返回完整原始字节）。
      const fullRaw = await fetchFullRawBytes();
      if (!fullRaw || fullRaw.length === 0) {
        throw new Error("预览通道返回空响应体且票据直链不可用");
      }
      bytes = fullRaw;
    }
    if (isEncryptedDoc(bytes)) {
      failReason.value = `该文件已被文档防泄密软件透明加密（${props.fileName}）：`
        + "磁盘上存放的是密文，只有装了客户端并获授权的终端才能解密。"
        + "服务端与浏览器读到的都是密文，重新上传也没用，请提供未加密的副本";
      emit("error", { noFallback: true, reason: failReason.value });
      return;
    }
    if (isCorruptOfficeFile(props.fileName, bytes)) {
      failReason.value = `文件不是有效的 ${props.fileName.split(".").pop()?.toUpperCase()} 容器（${props.fileName}）：`
        + "内容已损坏或格式不符，请重新上传后再试";
      emit("error", { noFallback: true, reason: failReason.value });
      return;
    }
    await prepareClientRender(bytes);
  } catch (e) {
    // 解析库抛的是英文原始异常（如 "Can't find end of central directory"），
    // 直达界面对用户无意义。统一收敛为中文文案，具体原因见控制台。
    console.warn("[PreviewOfficePanel] 文档加载失败", e);
    failReason.value = `文档加载失败（${props.fileName}），可尝试下载后用本地软件打开`;
    emit("error");
  } finally {
    loading.value = false;
  }
}

/**
 * 把字节装入 buffer、懒加载 file-viewer 全套依赖、构造 File 交给组件渲染
 *
 * @param bytes 原始文档字节（已通过密文 / 损坏校验）
 */
async function prepareClientRender(bytes: Uint8Array): Promise<void> {
  const ab = bytes.slice().buffer as ArrayBuffer;
  buffer.value = ab;
  const ready = await ensureFileViewerLoaded();
  if (!ready) {
    // file-viewer 依赖加载失败：按客户端解析失败走兜底
    await fallbackAfterClientError();
    return;
  }
  // 按内容魔数校正文件名（处理「扩展名说谎」的文件），让 file-viewer 选对渲染器
  const viewerName = resolveViewerFileName(props.fileName, bytes);
  fileRef.value = new File([ab], viewerName);
}

/**
 * 把兜底探测结果转成 error 事件
 */
function emitFallback(fallback: "server" | "pdf" | null): void {
  if (fallback === "server") {
    failReason.value = "该文件需由服务端渲染";
    emit("error", { noFallback: false, reason: failReason.value, channel: "server" });
  } else if (fallback === "pdf") {
    failReason.value = "该文件需由服务端转换为 PDF 后由 file-viewer 预览";
    emit("error", { noFallback: false, reason: failReason.value, channel: "pdf" });
  } else {
    failReason.value = `该格式暂不支持在线预览（${props.fileName}），请下载后用本地软件打开`;
    emit("error", { noFallback: true, reason: failReason.value });
  }
}

/**
 * 探测服务端能为该文件提供哪种兜底通道
 *
 * <p>按优先级探测：</p>
 * <ol>
 *   <li>{@code render=server} 返回 {@code X-FileStorage-Preview: spi} → 服务端有
 *       HTML 渲染器，返回 {@code "server"}</li>
 *   <li>{@code format=pdf} 返回 {@code X-FileStorage-Convert: pdf}
 *       → 服务端有 Office→PDF 转换器（Aspose），返回 {@code "pdf"}</li>
 *   <li>都没有 → {@code null}</li>
 * </ol>
 *
 * <p>必须看响应头而不是只看状态码：转不成功时服务端**不报错**，而是带
 * {@code X-FileStorage-Convert: unavailable} 继续走原通道并返回原始字节，
 * 只看状态码会把 Office 二进制当成 PDF 交给读取器。</p>
 *
 * @returns 可用通道；都没有返回 null
 */
async function probeFallback(): Promise<"server" | "pdf" | null> {
  const sep = props.src.includes("?") ? "&" : "?";
  // 顺序：先试 Office→PDF 转换，再试服务端 HTML 渲染。
  // 产品口径是「客户端能显示就用客户端，报错才转 PDF」——所以兜底时
  // PDF 优先：转换出来的文档与原样一致，比服务端拼的 HTML 预览页更可靠。
  try {
    const res = await fetch(`${props.src}${sep}format=pdf`, { method: "GET" });
    if (res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      // 同时看响应头与内容类型：`X-FileStorage-Convert` 说明服务端真转换了；
      // 内容类型兜底，防止中间代理改写响应头。
      // 只看状态码不行——转换失败时服务端仍返回 200，靠这个头区分。
      if (res.headers.get("X-FileStorage-Convert") === "pdf" || ct.startsWith("application/pdf")) {
        return "pdf";
      }
    }
  } catch {
    // 继续探测下一条通道
  }
  try {
    const res = await fetch(`${props.src}${sep}render=${RENDER_SERVER}`, { method: "GET" });
    if (res.ok && res.headers.get("X-FileStorage-Preview") === "spi") {
      return "server";
    }
  } catch {
    // 都没有
  }
  return null;
}

watch(() => [props.src, props.fileName], () => void load(), { immediate: true });

// 切文件：重置 Word PDF 切换状态。探测改在客户端渲染成功后进行
// （见 onRendered），避免为每个文件白白触发一次后端转换。
watch(
  () => props.fileName,
  () => resetPdfSwitch(),
);

/** file-viewer 渲染完成 */
function onRendered(): void {
  emit("rendered");
  // 客户端原样渲染成功后，静默探测后端 Word→PDF 转换是否可用；
  // 可用才显示「PDF 视图」切换入口（需后台有依赖才会显示）。
  if (isWordDocument.value && pdfAvailable.value === null && !pdfMode.value) {
    void probePdfAvailable();
  }
}

/**
 * PDF 视图 iframe 加载完成：通知父组件收起骨架屏，并把面板 loading 复位。
 * （PDF 由浏览器原生阅读器渲染，这里只负责状态同步，不解析内容。）
 */
function onPdfFrameLoad(): void {
  loading.value = false;
  emit("rendered");
}

/**
 * 客户端组件解析失败后的兜底
 *
 * <p>产品口径：客户端能显示就用客户端，报错才转。所以这里不是无条件退回
 * 服务端渲染，而是先探测兜底通道（PDF 优先），由结果决定去向：</p>
 * <ul>
 *   <li>有转换器 → 让父组件用 {@code ?format=pdf} 交给浏览器内置 PDF 阅读器</li>
 *   <li>只有 HTML 渲染器 → 退回 {@code render=server}</li>
 *   <li>都没有 → 面板自己给一句可执行的中文提示，不再切换通道</li>
 * </ul>
 */
async function fallbackAfterClientError(): Promise<void> {
  loading.value = true;
  let fallback: "server" | "pdf" | null = null;
  try {
    fallback = await probeFallback();
  } finally {
    loading.value = false;
  }
  emitFallback(fallback);
}

/**
 * file-viewer 解析失败
 *
 * <p>file-viewer 的 error 事件载荷不一致，此处不取载荷，统一交给
 * {@link fallbackAfterClientError} 按兜底通道决定去向。</p>
 */
function onRenderError(): void {
  console.warn("[PreviewOfficePanel] file-viewer 渲染失败", props.fileName);
  void fallbackAfterClientError();
}

onMounted(() => {
  document.addEventListener(FV_SELECTION_EVENT, onSelectionChange);
});
onBeforeUnmount(() => {
  document.removeEventListener(FV_SELECTION_EVENT, onSelectionChange);
  if (statsFrame) cancelAnimationFrame(statsFrame);
});

defineExpose({ wrapRef });
</script>

<template>
  <div class="preview-office-panel">
    <!-- Word 家族「PDF 视图」切换：仅当后端有 Word→PDF 转换依赖
         （pdfAvailable=true）且文档渲染成功时显示，支持在「原样渲染」与
         「后台转 PDF」之间来回切换。父组件已强制 PDF 通道（src 带
         format=pdf，如 .doc）时不显示 —— 本就渲染 PDF，切换无意义。 -->
    <div
      v-if="isWordDocument && pdfAvailable === true && !props.src.includes('format=pdf') && !failReason"
      class="preview-office-panel__viewbar"
    >
      <button
        type="button"
        class="preview-office-panel__viewbtn"
        :class="{ 'preview-office-panel__viewbtn--on': !pdfMode }"
        :disabled="loading"
        @click="switchView('client')"
      >
        文档视图
      </button>
      <button
        type="button"
        class="preview-office-panel__viewbtn"
        :class="{ 'preview-office-panel__viewbtn--on': pdfMode }"
        :disabled="loading"
        @click="switchView('pdf')"
      >
        PDF 视图
      </button>
    </div>
    <!-- Excel 选区统计工具条（求和 / 平均值 / 计数 / 最值 + 复制选区） -->
    <div v-if="showStatsBar" class="preview-office-panel__toolbar">
      <template v-if="excelSelection">
        <span class="preview-office-panel__toolbar-range">{{ excelRangeLabel }}</span>
        <template v-if="excelStats">
          <span class="preview-office-panel__stat">求和 <b>{{ formatStat(excelStats.sum) }}</b></span>
          <span class="preview-office-panel__stat">平均值 <b>{{ formatStat(excelStats.avg) }}</b></span>
          <span class="preview-office-panel__stat">计数 <b>{{ excelStats.count }}</b></span>
          <span class="preview-office-panel__stat">中位数 <b>{{ formatStat(excelStats.median) }}</b></span>
          <span class="preview-office-panel__stat">标准差 <b>{{ formatStat(excelStats.stdev) }}</b></span>
          <span class="preview-office-panel__stat">最小值 <b>{{ formatStat(excelStats.min) }}</b></span>
          <span class="preview-office-panel__stat">最大值 <b>{{ formatStat(excelStats.max) }}</b></span>
          <span class="preview-office-panel__stat">非空 <b>{{ excelStats.nonEmpty }}</b></span>
          <span class="preview-office-panel__stat">去重 <b>{{ excelStats.distinct }}</b></span>
          <span class="preview-office-panel__stat">单元格 <b>{{ excelStats.total }}</b></span>
        </template>
        <span v-else class="preview-office-panel__toolbar-hint">
          <svg class="preview-office-panel__hint-icon" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" fill="none"/>
            <line x1="8" y1="6.5" x2="8" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="8" cy="4.5" r="0.7" fill="currentColor"/>
          </svg>
          {{ excelStatsError ? "统计不可用（表格结构异常）" : "拖选单元格即可查看统计" }}
        </span>
        <button
          v-if="excelStats"
          type="button"
          class="preview-office-panel__copy-btn"
          title="复制当前选区的统计结果"
          @click="copyExcelStats"
        >
          复制统计
        </button>
        <button
          type="button"
          class="preview-office-panel__copy-btn"
          title="将选中的单元格内容以 TSV 格式复制到剪贴板（可直接粘回 Excel）"
          :disabled="!excelParsed || excelStatsError"
          @click="copyExcelSelection"
        >
          复制选区
        </button>
      </template>
      <span v-else class="preview-office-panel__toolbar-hint">选择单元格可查看求和 / 平均值 / 计数等统计</span>
    </div>
    <!-- 不再对 wrap 做 transform: scale()：那会连同遮罩与边框一起缩放，
         表现为「缩放时整个弹框都在动」。缩放工具条已按产品要求移除。 -->
    <div ref="wrapRef" class="preview-office-panel__wrap">
      <!-- PDF 视图：Word→PDF 由后端转换，交给浏览器原生阅读器（pdfium）渲染。
           iframe 直挂 format=pdf 直链：加载与渲染由浏览器负责，不经过 file-viewer。 -->
      <iframe
        v-if="pdfMode && pdfSrc"
        :key="`pdf:${pdfSrc}`"
        class="preview-office-panel__pdf-frame"
        :src="pdfSrc"
        @load="onPdfFrameLoad"
      />
      <div v-else-if="loading" class="preview-office-panel__mask">
        <span class="preview-office-panel__mask-text">加载中…</span>
      </div>

      <div v-else-if="failReason" class="preview-office-panel__mask">
        <span class="preview-office-panel__mask-text">{{ failReason }}</span>
      </div>

      <component
        :is="viewerComp"
        v-else-if="viewerComp && fileRef"
        ref="viewerRef"
        :file="fileRef"
        :options="viewerOptions"
        class="preview-office-panel__body"
        data-testid="file-viewer"
        @load-complete="onRendered"
        @error="onRenderError"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-office-panel {
  width: 100%;
  /* 吃满父容器并允许内部滚动：此前只有 width + min-height:65vh，
     内容比容器高时（实测 docx 内容 1158px > 可用 881px）会直接顶出弹框。 */
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.preview-office-panel__wrap {
  position: relative;
  width: 100%;
  flex: 1;
  /* height:100% 兜底：宿主把根元素 display 覆盖成 block（如统一预览入口）
     时 flex:1 失效，wrap 会塌成内容高度（实测 CSV 47px）——显式高度保证
     表格/文档渲染容器始终吃满面板。 */
  height: 100%;
  min-height: 0;
  /* 唯一滚动容器：Office 组件内容超出时在这里滚，而不是撑高弹框 */
  overflow: auto;
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}

.preview-office-panel__body {
  width: 100%;
  /* 吃满 wrap 高度：内部 file-viewer（shadow host）的 :host 是 display:block
     且 Univer 表格容器按容器高度初始化——缺这条时空表格只有内容高度
     （实测 CSV 47px），在统一预览入口的全高容器里表现为「高度不够」。 */
  height: 100%;
  min-height: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}

/* PDF 视图：浏览器原生阅读器 iframe 吃满 wrap */
.preview-office-panel__pdf-frame {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}

.preview-office-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  flex: 1;
  /* 显式高度：__wrap 是普通 block 容器（非 flex），
     flex:1 在 block 容器里不生效，遮罩会塌成文字行高
     （实测 CSV 加载态 18px vs 容器 468px，「加载中…」
     贴在顶部而非居中铺满）；height:100% 保证吃满。 */
  height: 100%;
}

.preview-office-panel__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* ---- Word 家族 PDF 视图切换条 ---- */
.preview-office-panel__viewbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary, #409eff) 7%, var(--el-bg-color, #fff)) 0%,
      color-mix(in srgb, var(--el-color-primary, #409eff) 2%, var(--el-bg-color, #fff)) 100%
    );
  box-shadow:
    0 1px 0 0 color-mix(in srgb, var(--el-color-primary, #409eff) 25%, var(--el-border-color-lighter, #ebeef5)),
    0 4px 16px color-mix(in srgb, var(--el-color-primary, #409eff) 8%, transparent);
  font-size: 12px;
  line-height: 1.6;
}

.preview-office-panel__viewbtn {
  all: unset;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-primary, #303133);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.1s ease;
}

.preview-office-panel__viewbtn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--el-color-primary, #409eff) 60%, var(--el-border-color, #dcdfe6));
  color: var(--el-color-primary, #409eff);
}

.preview-office-panel__viewbtn:active:not(:disabled) {
  transform: translateY(1px);
}

.preview-office-panel__viewbtn--on {
  border-color: var(--el-color-primary, #409eff);
  background: linear-gradient(
    135deg,
    var(--el-color-primary, #409eff) 0%,
    color-mix(in srgb, var(--el-color-primary, #409eff) 70%, var(--el-color-info, #909399)) 100%
  );
  color: #fff;
  box-shadow: 0 0 10px color-mix(in srgb, var(--el-color-primary, #409eff) 35%, transparent);
}

.preview-office-panel__viewbtn:disabled {
  color: var(--el-text-color-placeholder, #c0c4cc);
  cursor: default;
  border-color: var(--el-border-color-lighter, #ebeef5);
  background: transparent;
  box-shadow: none;
}

.preview-office-panel__viewbtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--el-color-primary, #409eff) 60%, transparent);
  outline-offset: 2px;
}

/* ---- Excel 选区统计工具条 ---- */
.preview-office-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: none;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary, #409eff) 7%, var(--el-bg-color, #fff)) 0%,
      color-mix(in srgb, var(--el-color-success, #67c23a) 4%, var(--el-bg-color, #fff)) 100%
    );
  box-shadow:
    0 1px 0 0 color-mix(in srgb, var(--el-color-primary, #409eff) 25%, var(--el-border-color-lighter, #ebeef5)),
    0 4px 16px color-mix(in srgb, var(--el-color-primary, #409eff) 10%, transparent);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
  line-height: 1.6;
}

.preview-office-panel__toolbar-range {
  padding: 2px 9px;
  border-radius: 6px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary, #409eff) 0%,
    color-mix(in srgb, var(--el-color-primary, #409eff) 55%, var(--el-color-info, #909399)) 100%
  );
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  line-height: 18px;
  margin-right: 4px;
  box-shadow: 0 0 10px color-mix(in srgb, var(--el-color-primary, #409eff) 35%, transparent);
}

.preview-office-panel__stat {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #409eff) 20%, var(--el-border-color-lighter, #ebeef5));
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 5%, var(--el-bg-color, #fff));
  color: var(--el-text-color-secondary, #909399);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}
.preview-office-panel__stat:hover {
  border-color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 10%, var(--el-bg-color, #fff));
  box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-primary, #409eff) 28%, transparent);
}
.preview-office-panel__stat b {
  color: var(--el-text-color-primary, #303133);
  font-weight: 700;
  margin-left: 2px;
  font-variant-numeric: tabular-nums;
}

.preview-office-panel__toolbar-hint {
  color: var(--el-text-color-placeholder, #c0c4cc);
  user-select: none;
}

.preview-office-panel__copy-btn {
  all: unset;
  cursor: pointer;
  font-size: 12px;
  color: var(--el-color-success, #67c23a);
  margin-left: auto;
  padding: 2px 12px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--el-color-success, #67c23a) 40%, transparent);
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 8%, transparent);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.1s ease;
}
/* 第二个按钮贴在前一个右侧，不再各自吃掉剩余空间 */
.preview-office-panel__copy-btn ~ .preview-office-panel__copy-btn {
  margin-left: 0;
}
.preview-office-panel__copy-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 16%, transparent);
  border-color: var(--el-color-success, #67c23a);
  box-shadow: 0 0 10px color-mix(in srgb, var(--el-color-success, #67c23a) 35%, transparent);
}
.preview-office-panel__copy-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.preview-office-panel__copy-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--el-color-success, #67c23a) 60%, transparent);
  outline-offset: 2px;
  box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-success, #67c23a) 30%, transparent);
}
.preview-office-panel__copy-btn:disabled {
  color: var(--el-text-color-placeholder, #c0c4cc);
  cursor: default;
  border-color: var(--el-border-color-lighter, #ebeef5);
  background: transparent;
  box-shadow: none;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .preview-office-panel__wrap {
    transition: none;
  }
}
.preview-office-panel__toolbar-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--el-text-color-placeholder, #a8abb2);
  font-size: 12px;
}
.preview-office-panel__hint-icon {
  flex: none;
  color: var(--el-text-color-placeholder, #b1b3b8);
}

/* ---- 选中颜色 + 细滚动条 ---- */
.preview-office-panel ::selection,
.preview-office-panel *::selection {
  background: var(--el-color-primary-light-8, rgba(64, 158, 255, 0.18));
  color: var(--el-text-color-primary, #303133);
}

.preview-office-panel__wrap::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.preview-office-panel__wrap::-webkit-scrollbar-track {
  background: transparent;
}
.preview-office-panel__wrap::-webkit-scrollbar-thumb {
  background: var(--el-border-color, #dcdfe6);
  border-radius: 999px;
}
.preview-office-panel__wrap::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker, #c4c7ce);
}
</style>
