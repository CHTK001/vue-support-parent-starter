<script setup lang="ts">
/**
 * DICOM 医疗影像预览面板 —— 纯前端渲染
 *
 * <p><b>取数与渲染链路</b>：票据直链（{@code resolveObjectUrl}，包内条目带
 * {@code ?preview=true&inner=}）拉回原始字节 → Blob 塞进 dicom-image-loader 的
 * {@code wadouri.fileManager}（得到 {@code dicomfile:<n>} 形式的 imageId）→
 * Cornerstone3D 的 RenderingEngine + StackViewport 渲染。整个解析/解码都在
 * 浏览器端完成，不经后端转换、不新增 SPI provider。</p>
 *
 * <p><b>初始化口径</b>：{@code @cornerstonejs/core} 的 {@code init()} 是同步函数
 * （返回 boolean，5.11.6 实测无异步变体），只需调用一次；随后
 * {@code dicomImageLoader.init()} 注册 {@code dicomfile/wadouri/dicomweb} 三个
 * scheme 的加载器、元数据 provider 与解码 Web Worker。两者都做了幂等保护。</p>
 *
 * <p><b>交互</b>：窗宽/窗位用指针拖拽直接改 viewport 的 VOI range（水平调窗宽、
 * 垂直调窗位，灵敏度按影像像素值域自适应）；单文件多帧影像（NumberOfFrames>1）
 * 展开成 frame imageId 栈，滚轮翻帧；重置按钮恢复初始窗宽/窗位并复位相机。</p>
 *
 * <p><b>压缩传输语法降级</b>：所有解码都走解码 Worker（连未压缩语法在 5.11.6
 * 里也是 Worker 任务）。JPEG2000 / HTJ2K / JPEG-LS / JPEG XL 等 wasm codec 的
 * 资产在 Vite 托管下不可靠（Worker 内 {@code new URL('@cornerstonejs/codec-*',
 * import.meta.url)} 的裸包名 URL 无法解析），解码失败时按传输语法给出中文
 * 提示引导下载；未压缩 / RLE 走纯 JS 解码路径，正常渲染。结论详见集成说明。</p>
 *
 * <p><b>影像区背景</b>：医学影像查看惯例是纯黑背景（暗室阅片），此处作为
 * 暗色模式「只用变量」规则的显式例外，其余部分仍全部使用 koi / Element Plus
 * 变量。</p>
 *
 * @author CH
 * @since 2026/10/08
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, Refresh, RefreshLeft } from "@element-plus/icons-vue";
import {
  Enums,
  RenderingEngine,
  cache,
  init as cornerstoneInit,
  isCornerstoneInitialized,
  metaData,
  utilities,
} from "@cornerstonejs/core";
import type { StackViewport } from "@cornerstonejs/core";
import dicomImageLoader from "@cornerstonejs/dicom-image-loader";
import { resolveObjectUrl } from "../api/filestorageApi";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，展示与判型请用生效名） */
  fileName: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入；包内条目取不到时统计条显示 - */
  size?: number;
}>();

/* ==================== 常量 ==================== */

/** 在线预览体积上限：CT/MR 单序列动辄几十帧，超过就直接引导下载 */
const MAX_BYTES = 256 * 1024 * 1024;

/** JPEG 2000 家族传输语法 UID（wasm codec，浏览器端不保证可解码） */
const TS_JPEG2000 = new Set(["1.2.840.10008.1.2.4.90", "1.2.840.10008.1.2.4.91"]);
/** HTJ2K（JPEG 2000 高吞吐）传输语法 UID */
const TS_HTJ2K = new Set([
  "3.2.840.10008.1.2.4.96",
  "1.2.840.10008.1.2.4.201",
  "1.2.840.10008.1.2.4.202",
  "1.2.840.10008.1.2.4.203",
]);
/** JPEG-LS 传输语法 UID */
const TS_JPEGLS = new Set(["1.2.840.10008.1.2.4.80", "1.2.840.10008.1.2.4.81"]);
/** JPEG XL 传输语法 UID */
const TS_JPEGXL = new Set([
  "1.2.840.10008.1.2.4.110",
  "1.2.840.10008.1.2.4.111",
  "1.2.840.10008.1.2.4.112",
]);

/** 传输语法 UID → 展示名（认不全就原样显示 UID） */
const TS_NAMES: Record<string, string> = {
  "1.2.840.10008.1.2": "隐式 VR 小端",
  "1.2.840.10008.1.2.1": "显式 VR 小端",
  "1.2.840.10008.1.2.2": "显式 VR 大端",
  "1.2.840.10008.1.2.1.99": "Deflated 显式 VR 小端",
  "1.2.840.10008.1.2.5": "RLE 无损",
  "1.2.840.10008.1.2.4.50": "JPEG Baseline",
  "1.2.840.10008.1.2.4.51": "JPEG 扩展",
  "1.2.840.10008.1.2.4.57": "JPEG 无损",
  "1.2.840.10008.1.2.4.70": "JPEG 无损 SV1",
  "1.2.840.10008.1.2.4.80": "JPEG-LS 无损",
  "1.2.840.10008.1.2.4.81": "JPEG-LS 近无损",
  "1.2.840.10008.1.2.4.90": "JPEG 2000 无损",
  "1.2.840.10008.1.2.4.91": "JPEG 2000",
  "1.2.840.10008.1.2.4.110": "JPEG XL 无损",
  "1.2.840.10008.1.2.4.111": "JPEG XL",
  "1.2.840.10008.1.2.4.112": "JPEG XL",
};

/* ==================== 状态（响应式） ==================== */

/** 加载中 */
const loading = ref(true);
/** 加载阶段文案（读取影像 / 初始化解码器 / 解析 DICOM） */
const phase = ref("读取影像…");
/** 错误文案（空串表示无错） */
const errorText = ref("");

/** 患者姓名（取不到为 "-"） */
const patientName = ref("-");
/** 患者 ID */
const patientId = ref("-");
/** 检查描述（Study Description） */
const studyDesc = ref("-");
/** 序列描述（Series Description，含序列号） */
const seriesDesc = ref("-");
/** 检查模态（CT / MR / DX…） */
const modality = ref("-");
/** 当前窗宽（null 表示未就绪/取不到） */
const wlWidth = ref<number | null>(null);
/** 当前窗位 */
const wlCenter = ref<number | null>(null);
/** 像素行数 */
const rows = ref(0);
/** 像素列数 */
const columns = ref(0);
/** 帧总数（单帧文件为 1） */
const frameCount = ref(0);
/** 当前帧（1 起） */
const currentFrame = ref(1);
/** 实际取回的字节数（用于「大小」统计） */
const byteSize = ref(0);
/** 从文件头嗅探出的传输语法 UID（空串表示未知） */
const transferSyntax = ref("");

/** 影像容器引用（cornerstone 会往里塞 canvas） */
const stageRef = ref<HTMLDivElement>();

/* ==================== 状态（非响应式句柄） ==================== */

/** cornerstone 对象不能进 reactive（Proxy 会破坏内部引用） */
let renderingEngine: RenderingEngine | null = null;
let viewport: StackViewport | null = null;
/** fileManager 条目下标（-1 表示未占用） */
let fileIndex = -1;
/** 当前栈里的全部 imageId（含多帧展开），清理时逐个出缓存 */
let imageIds: string[] = [];
/** 已绑定 cornerstone 事件的元素（解绑用） */
let boundEl: HTMLDivElement | null = null;
/** 容器尺寸监听 */
let resizeObs: ResizeObserver | null = null;
/** 是否已随组件卸载放弃后续异步写状态 */
let disposed = false;
/** 面板实例序号（渲染引擎 / viewport id 用，避免多实例冲突） */
let seq = 1;
/** 初始（文件元数据给出的）VOI 范围，重置按钮用 */
let initialVoi: { lower: number; upper: number } | null = null;

/* ---- 指针拖拽调窗状态 ---- */
let dragging = false;
let dragX0 = 0;
let dragY0 = 0;
let dragW0 = 0;
let dragC0 = 0;
/** 拖拽灵敏度：每像素对应的像素值变化量 */
let dragSens = 1;

/* ---- 模块级幂等标记（多个面板实例共享同一份全局初始化） ---- */
let loaderReady = false;

/* ==================== 工具函数 ==================== */

/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 字节数可读化 */
function formatSize(bytes?: number): string {
  if (!bytes || bytes < 0) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 统计条「大小」：优先显示实际取回字节数；包内条目与未知显示 - */
const sizeText = computed(() =>
  props.inner ? "-" : formatSize(byteSize.value || props.size || 0),
);

/** 像素尺寸文案（列×行，取不到为 "-"） */
const dimText = computed(() => {
  const r = rows.value;
  const c = columns.value;
  return r > 0 && c > 0 ? `${c} × ${r}` : "-";
});

/** 帧文案：多帧显示「当前 / 总数」，单帧显示 1 */
const frameText = computed(() => {
  const total = frameCount.value;
  if (total <= 0) {
    return "-";
  }
  return total > 1 ? `${currentFrame.value} / ${total}` : "1";
});

/** 当前窗宽/窗位文案（取不到为 "-"） */
const wlText = computed(() =>
  wlWidth.value === null || wlCenter.value === null
    ? "-"
    : `W ${wlWidth.value} / L ${wlCenter.value}`,
);

/** 传输语法展示名（未知显示原始 UID，连 UID 都没有显示空） */
const transferSyntaxName = computed(() => {
  const ts = transferSyntax.value;
  return ts ? (TS_NAMES[ts] ?? ts) : "";
});

/** 底部状态栏右侧文案 */
const statusText = computed(() => {
  if (errorText.value) {
    return "无法渲染";
  }
  const name = transferSyntaxName.value;
  return name ? `DICOM · ${name}` : "DICOM";
});

/**
 * 从 Part-10 文件头嗅探传输语法 UID。
 *
 * <p>只读 128 字节前导 + {@code DICM} 魔数之后的 0002 元信息组（该组固定为
 * 显式 VR 小端，遍历是安全的），不碰主数据集——用它来在解码失败时给出
 * 针对性的降级文案。非 Part-10 或读不到时返回空串。</p>
 */
function sniffTransferSyntax(bytes: Uint8Array): string {
  if (bytes.length < 132) {
    return "";
  }
  // 128~131 必须是 "DICM"
  if (
    bytes[128] !== 0x44 ||
    bytes[129] !== 0x49 ||
    bytes[130] !== 0x43 ||
    bytes[131] !== 0x4d
  ) {
    return "";
  }
  // 长度字段的 VR 集合（这些 VR 的长度用 4 字节、前有 2 字节保留位）
  const LONG_VR = new Set(["OB", "OW", "OF", "SQ", "UT", "UN", "UC", "UR", "OD", "OL", "OV"]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 132;
  while (offset + 8 <= bytes.length) {
    const group = view.getUint16(offset, true);
    if (group !== 0x0002) {
      break;
    }
    const elem = view.getUint16(offset + 2, true);
    const vr = String.fromCharCode(bytes[offset + 4], bytes[offset + 5]);
    let headerLen = 8;
    let length = 0;
    if (LONG_VR.has(vr)) {
      headerLen = 12;
      length = view.getUint32(offset + 8, true);
    } else {
      length = view.getUint16(offset + 6, true);
    }
    if (length === 0xffffffff) {
      // 元信息组不该出现未定长，防御性退出
      break;
    }
    if (elem === 0x0010 && length > 0 && offset + headerLen + length <= bytes.length) {
      let s = "";
      const end = offset + headerLen + length;
      for (let i = offset + headerLen; i < end; i++) {
        const c = bytes[i];
        // UI 值以 \0 填充结尾
        if (c === 0 || c === 32) {
          continue;
        }
        s += String.fromCharCode(c);
      }
      return s.trim();
    }
    offset += headerLen + length;
  }
  return "";
}

/** 从 imageId（dicomfile:&lt;n&gt;）提取 fileManager 下标 */
function extractFileIndex(imageId: string): number {
  const m = /^dicomfile:(\d+)/.exec(imageId);
  return m ? Number(m[1]) : -1;
}

/**
 * cornerstone 全局初始化（幂等）。
 *
 * <p>{@code core.init()} 同步返回；{@code dicomImageLoader.init()} 注册
 * 解码 Worker 与各 scheme 加载器。重复调用前者无害（内部有开关），后者
 * 用模块级标记挡掉。</p>
 */
function initCornerstone(): void {
  if (!isCornerstoneInitialized()) {
    cornerstoneInit();
  }
  if (!loaderReady) {
    dicomImageLoader.init({ maxWebWorkers: 1 });
    loaderReady = true;
  }
}

/** 在元数据对象上按候选键取第一个非空值（键名大小写因 provider 而异，多试几个） */
function firstDefined(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (v !== undefined && v !== null && v !== "") {
      return v;
    }
  }
  return undefined;
}

/** 值 → 展示文本（字符串去空白；有限数字转字符串；其余为空） */
function toText(v: unknown): string {
  if (typeof v === "string") {
    return v.trim();
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(v);
  }
  return "";
}

/** 加载前清空元信息条（避免上一张影像的字段串台） */
function resetMeta(): void {
  patientName.value = "-";
  patientId.value = "-";
  studyDesc.value = "-";
  seriesDesc.value = "-";
  modality.value = "-";
  wlWidth.value = null;
  wlCenter.value = null;
  rows.value = 0;
  columns.value = 0;
  frameCount.value = 0;
  currentFrame.value = 1;
  byteSize.value = 0;
  transferSyntax.value = "";
}

/** 加载完读元信息（所有字段取不到都给 "-"） */
function collectMetadata(): void {
  const id = imageIds[0];
  if (!id) {
    return;
  }
  const patient = metaData.get("patientModule", id);
  patientName.value = toText(firstDefined(patient, ["patientName", "PatientName"])) || "-";
  patientId.value = toText(firstDefined(patient, ["patientId", "patientID", "PatientID"])) || "-";
  const study = metaData.get("generalStudyModule", id);
  studyDesc.value = toText(firstDefined(study, ["studyDescription", "StudyDescription"])) || "-";
  const series = metaData.get("generalSeriesModule", id);
  modality.value = toText(firstDefined(series, ["modality", "Modality"])) || "-";
  const seriesText = toText(firstDefined(series, ["seriesDescription", "SeriesDescription"]));
  const seriesNumber = toText(firstDefined(series, ["seriesNumber", "SeriesNumber"]));
  seriesDesc.value = [seriesText, seriesNumber && `#${seriesNumber}`].filter(Boolean).join(" ") || "-";
  const image = viewport?.getCornerstoneImage();
  rows.value = image?.rows ?? 0;
  columns.value = image?.columns ?? 0;
}

/** VOI 范围 → 窗宽/窗位并回填状态条 */
function updateWl(range: { lower: number; upper: number } | undefined): void {
  if (
    !range ||
    !Number.isFinite(range.lower) ||
    !Number.isFinite(range.upper) ||
    range.upper <= range.lower
  ) {
    return;
  }
  const wl = utilities.windowLevel.toWindowLevel(range.lower, range.upper);
  wlWidth.value = Math.round(wl.windowWidth);
  wlCenter.value = Math.round(wl.windowCenter);
}

/**
 * 把异常翻译成人话（按传输语法优先级）。
 *
 * <p>JPEG2000 家族是任务里点名的降级对象；其余压缩语法给同类但点名的
 * 文案；疑似 Worker 构建问题给单独提示（整面板所有语法都会失败时基本
 * 是这个）；最后才是原始错误信息兜底。</p>
 */
function describeError(e: unknown): string {
  const ts = transferSyntax.value;
  if (TS_JPEG2000.has(ts)) {
    return "该影像采用 JPEG2000 压缩，浏览器端暂不支持解码，请下载后用专业 DICOM 查看器打开。";
  }
  if (TS_HTJ2K.has(ts)) {
    return "该影像采用 HTJ2K（JPEG 2000 高吞吐）压缩，浏览器端暂不支持解码，请下载后查看。";
  }
  if (TS_JPEGLS.has(ts)) {
    return "该影像采用 JPEG-LS 无损压缩，浏览器端暂不支持解码，请下载后查看。";
  }
  if (TS_JPEGXL.has(ts)) {
    return "该影像采用 JPEG XL 压缩，浏览器端暂不支持解码，请下载后查看。";
  }
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  if (/worker|Failed to construct|import|module|dynamically/i.test(msg)) {
    return "影像解码线程加载失败，当前构建可能未正确托管 DICOM 解码 Web Worker，请下载后用专业查看器打开。";
  }
  if (!transferSyntax.value) {
    return "该文件不是有效的 DICOM 影像（缺少 DICM 文件头）。";
  }
  return msg ? `影像解析失败：${msg}` : "影像解析失败。";
}

/* ==================== 交互 ==================== */

/** 指针按下：开始窗宽/窗位拖拽（左键） */
function onPointerDown(e: PointerEvent): void {
  if (e.button !== 0 || !viewport) {
    return;
  }
  const range = viewport.getProperties().voiRange;
  if (!range || range.upper <= range.lower) {
    return;
  }
  dragging = true;
  dragX0 = e.clientX;
  dragY0 = e.clientY;
  dragW0 = range.upper - range.lower;
  dragC0 = (range.upper + range.lower) / 2;
  // 灵敏度：全像素值域拖 ~800px 从最窄拉到最宽，观感与主流阅片器接近
  const image = viewport.getCornerstoneImage();
  const span =
    image &&
    Number.isFinite(image.maxPixelValue) &&
    Number.isFinite(image.minPixelValue) &&
    image.maxPixelValue > image.minPixelValue
      ? image.maxPixelValue - image.minPixelValue
      : Math.max(1, dragW0);
  dragSens = span / 800;
  stageRef.value?.setPointerCapture(e.pointerId);
  e.preventDefault();
}

/** 指针移动：水平改窗宽、垂直改窗位（上拖增亮） */
function onPointerMove(e: PointerEvent): void {
  if (!dragging || !viewport) {
    return;
  }
  const dx = e.clientX - dragX0;
  const dy = e.clientY - dragY0;
  const ww = Math.max(1, dragW0 + dx * dragSens);
  const wc = dragC0 - dy * dragSens;
  viewport.setProperties({ voiRange: { lower: wc - ww / 2, upper: wc + ww / 2 } });
  viewport.render();
  e.preventDefault();
}

/** 指针抬起/取消：结束拖拽 */
function onPointerUp(e: PointerEvent): void {
  if (!dragging) {
    return;
  }
  dragging = false;
  try {
    stageRef.value?.releasePointerCapture(e.pointerId);
  } catch {
    // pointerId 可能已被释放，忽略
  }
}

/** 滚轮翻帧（多帧文件才有意义；setStack 展开后的栈） */
function onWheel(e: WheelEvent): void {
  if (!viewport) {
    return;
  }
  const total = viewport.getNumberOfSlices();
  if (total <= 1) {
    return;
  }
  e.preventDefault();
  viewport.scroll(e.deltaY > 0 ? 1 : -1);
}

/** VOI 变化事件：回填 W/L 状态条（拖拽与重置共用一条通路） */
function onVoiModified(e: Event): void {
  const detail = (e as CustomEvent<{ range?: { lower: number; upper: number } }>).detail;
  updateWl(detail?.range);
}

/** 换帧事件：回填「当前 / 总数」 */
function onStackNewImage(e: Event): void {
  const detail = (e as CustomEvent<{ imageIdIndex?: number }>).detail;
  if (typeof detail?.imageIdIndex === "number") {
    currentFrame.value = detail.imageIdIndex + 1;
  }
}

/** 给已就绪的 viewport 绑交互（ cornerstone 事件 + 指针 + 滚轮） */
function bindEvents(): void {
  const el = stageRef.value;
  const vp = viewport;
  if (!el || !vp) {
    return;
  }
  boundEl = vp.element;
  boundEl.addEventListener(Enums.Events.VOI_MODIFIED, onVoiModified);
  boundEl.addEventListener(Enums.Events.STACK_NEW_IMAGE, onStackNewImage);
  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerUp);
  el.addEventListener("wheel", onWheel, { passive: false });
}

/** 解绑（可重复调用） */
function unbindEvents(): void {
  const el = stageRef.value;
  if (boundEl) {
    boundEl.removeEventListener(Enums.Events.VOI_MODIFIED, onVoiModified);
    boundEl.removeEventListener(Enums.Events.STACK_NEW_IMAGE, onStackNewImage);
    boundEl = null;
  }
  if (el) {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerUp);
    el.removeEventListener("wheel", onWheel);
  }
  dragging = false;
}

/** 重置：恢复文件元数据给出的初始窗宽/窗位，并把相机复位到适配画布 */
function resetView(): void {
  if (!viewport) {
    return;
  }
  if (initialVoi) {
    viewport.setProperties({ voiRange: { ...initialVoi } });
  }
  viewport.resetCamera({
    resetPan: true,
    resetZoom: true,
    resetToCenter: true,
    resetAspectRatio: true,
  });
  viewport.render();
  updateWl(viewport.getProperties().voiRange);
}

/* ==================== 生命周期与资源回收 ==================== */

/** 释放全部资源（可重复调用；不触碰 disposed 标记） */
function disposeAll(): void {
  unbindEvents();
  resizeObs?.disconnect();
  resizeObs = null;
  viewport = null;
  if (renderingEngine) {
    try {
      renderingEngine.destroy();
    } catch {
      // 引擎可能已随弹层销毁，忽略
    }
    renderingEngine = null;
  }
  for (const id of imageIds) {
    try {
      cache.removeImageLoadObject(id, { force: true });
    } catch {
      // 缓存条目可能不存在，忽略
    }
  }
  imageIds = [];
  if (fileIndex >= 0) {
    try {
      dicomImageLoader.wadouri.fileManager.remove(fileIndex);
    } catch {
      // 忽略释放异常
    }
    try {
      // dataSet 缓存以 fileManager 下标为 key
      dicomImageLoader.wadouri.dataSetCacheManager.unload(String(fileIndex));
    } catch {
      // 忽略释放异常
    }
    fileIndex = -1;
  }
  initialVoi = null;
}

/**
 * 拉字节 → 嗅探传输语法 → fileManager 注册 → 渲染。
 *
 * <p>包内条目必须带 {@code preview=true&inner=}：条目提取只挂在预览分支上。</p>
 */
async function load(): Promise<void> {
  disposeAll();
  disposed = false;
  loading.value = true;
  errorText.value = "";
  phase.value = "读取影像…";
  resetMeta();
  // 等一帧，保证容器在 DOM 里（弹层动画中可能还是 0 尺寸）
  await nextTick();
  try {
    const params: Record<string, string> = {};
    if (props.inner) {
      params.preview = "true";
      params.inner = props.inner;
    }
    const url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
    if (!url) {
      throw new Error("获取文件地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`读取文件失败（HTTP ${res.status}）`);
    }
    const buf = await res.arrayBuffer();
    if (disposed) {
      return;
    }
    byteSize.value = buf.byteLength;
    if (buf.byteLength === 0) {
      throw new Error("文件为空");
    }
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(
        `文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后查看`,
      );
    }
    transferSyntax.value = sniffTransferSyntax(new Uint8Array(buf));

    phase.value = "初始化解码器…";
    initCornerstone();
    const container = stageRef.value;
    if (!container) {
      throw new Error("预览容器尚未就绪");
    }

    phase.value = "解析 DICOM…";
    // Blob 塞进 fileManager，得到 dicomfile:<n>
    const blob = new Blob([buf], { type: "application/dicom" });
    const baseImageId = dicomImageLoader.wadouri.fileManager.add(blob);
    fileIndex = extractFileIndex(baseImageId);

    // 渲染引擎 + Stack viewport（id 用自增序号，避免多面板实例冲突）
    const engineId = `dcm-engine-${seq}`;
    const viewportId = `dcm-viewport-${seq}`;
    seq += 1;
    renderingEngine = new RenderingEngine(engineId);
    renderingEngine.enableElement({
      viewportId,
      type: Enums.ViewportType.STACK,
      element: container,
      defaultOptions: { background: [0, 0, 0] },
    });
    viewport = renderingEngine.getViewport<StackViewport>(viewportId);
    // 先加载第一帧（顺带把整份实例的自然化元数据注册进 provider）
    await viewport.setStack([baseImageId], 0);
    if (disposed) {
      return;
    }
    imageIds = [baseImageId];
    frameCount.value = 1;

    // 多帧：实例元数据就绪后展开 frame imageIds（dicomfile:<n>?frame=<i>）。
    // 展开失败（个别 provider 链路异常）不算致命：退回已加载成功的单帧栈
    try {
      const frameIds = metaData.getTyped("frameImageIds", baseImageId);
      if (frameIds && frameIds.size > 1) {
        const list = Array.from(frameIds);
        await viewport.setStack(list, 0);
        if (disposed) {
          return;
        }
        imageIds = list;
        frameCount.value = list.length;
      }
    } catch {
      // 展开失败：退回已验证可加载的单帧栈（第一次 setStack 已成功）
      await viewport.setStack([baseImageId], 0);
      if (disposed) {
        return;
      }
      imageIds = [baseImageId];
      frameCount.value = 1;
    }
    currentFrame.value = viewport.getCurrentImageIdIndex() + 1;

    collectMetadata();
    const props0 = viewport.getProperties();
    initialVoi = props0.voiRange ? { ...props0.voiRange } : null;
    updateWl(props0.voiRange);

    bindEvents();
    // 弹层动画结束后补一次 resize（连同 ResizeObserver 的持续跟随）
    renderingEngine.resize();
    resizeObs = new ResizeObserver(() => renderingEngine?.resize());
    resizeObs.observe(container);
  } catch (e) {
    if (!disposed) {
      errorText.value = describeError(e);
      disposeAll();
    }
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

/** 手动刷新 */
function reload(): void {
  void load();
}

/**
 * 下载本体。
 *
 * <p>顶层对象带 {@code download=true} 走附件下载；包内条目在新标签打开条目
 * 字节（{@code preview+inner}）——网关包内通道固定内联响应。</p>
 */
async function downloadSelf(): Promise<void> {
  const params: Record<string, string> = {};
  if (props.inner) {
    params.preview = "true";
    params.inner = props.inner;
  } else {
    params.download = "true";
  }
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params }).catch(() => "");
  if (url) {
    window.open(url, "_blank");
  }
}

onMounted(load);
// 同一面板复用：切换对象 / 切换包内条目时必须整链重建
watch(() => [props.bucket, props.objectKey, props.inner], () => void load());

onBeforeUnmount(() => {
  disposed = true;
  disposeAll();
});
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担 -->
  <section class="dcm" aria-label="DICOM 医疗影像预览">
    <!-- ===== 元信息条 ===== -->
    <div class="dcm__stats">
      <div class="dcm__stat dcm__stat--wide" :title="patientName">
        <span class="dcm__stat-label">患者</span>
        <b class="dcm__stat-value">{{ patientName }}<i v-if="patientId !== '-'" class="dcm__stat-sub">{{ patientId }}</i></b>
      </div>
      <div class="dcm__stat dcm__stat--wide" :title="studyDesc">
        <span class="dcm__stat-label">检查</span>
        <b class="dcm__stat-value">{{ studyDesc }}</b>
      </div>
      <div class="dcm__stat dcm__stat--wide" :title="seriesDesc">
        <span class="dcm__stat-label">序列</span>
        <b class="dcm__stat-value">{{ seriesDesc }}</b>
      </div>
      <div class="dcm__stat">
        <span class="dcm__stat-label">模态</span>
        <b class="dcm__stat-value dcm__stat-value--accent">{{ modality }}</b>
      </div>
      <div class="dcm__stat">
        <span class="dcm__stat-label">尺寸</span>
        <b class="dcm__stat-value">{{ dimText }}</b>
      </div>
      <div class="dcm__stat">
        <span class="dcm__stat-label">帧</span>
        <b class="dcm__stat-value">{{ frameText }}</b>
      </div>
      <div class="dcm__stat dcm__stat--wide">
        <span class="dcm__stat-label">窗宽/窗位</span>
        <b class="dcm__stat-value">{{ wlText }}</b>
      </div>
    </div>

    <!-- ===== 工具条 ===== -->
    <div class="dcm__toolbar">
      <span class="dcm__hint">左键拖拽调窗宽/窗位 · 滚轮翻帧</span>
      <div class="dcm__spacer" />
      <el-button
        :icon="RefreshLeft"
        :disabled="!!errorText || loading"
        title="重置窗宽/窗位与视图"
        aria-label="重置"
        @click="resetView"
      />
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="reload" />
      <el-button :icon="Download" title="下载文件" @click="downloadSelf">
        {{ inner ? "打开" : "下载" }}
      </el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <!-- 影像容器必须始终挂在 DOM 上（v-if 重建会让 enableElement 的 canvas 与监听成对泄漏），
         加载/错误态作为覆盖层叠在它上面 -->
    <div class="dcm__body">
      <!-- 医学影像查看区按阅片惯例用纯黑背景（暗色模式规则的显式例外） -->
      <div ref="stageRef" class="dcm__stage" />

      <div v-if="loading" class="dcm__overlay dcm__overlay--soft">
        <div class="dcm__spinner" />
        <p class="dcm__loading-text">{{ phase }}</p>
      </div>

      <div v-else-if="errorText" class="dcm__overlay">
        <div class="dcm__error-icon">DCM</div>
        <h4 class="dcm__error-title">无法预览该 DICOM 影像</h4>
        <p class="dcm__error-text">{{ errorText }}</p>
        <div class="dcm__error-actions">
          <el-button type="primary" :icon="Refresh" @click="reload">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="dcm__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span :class="{ 'is-error': !!errorText }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   DICOM 预览面板（koi / Element Plus 变量体系）

   结构与 Geo / IFC 面板一致：元信息条 + 工具条 + 主体 + 状态栏。
   唯一的变量例外是影像查看区的纯黑底（阅片惯例）。
   ======================================================== */
.dcm {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ---- 元信息条 ---- */
.dcm__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.dcm__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
  min-width: 0;
}

.dcm__stat:first-child {
  padding-left: 0;
}

.dcm__stat + .dcm__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.dcm__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  flex: none;
}

.dcm__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dcm__stat--wide .dcm__stat-value {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.dcm__stat-value--accent {
  color: var(--el-color-primary);
}

/* 患者 ID 作为次级信息内联在姓名后 */
.dcm__stat-sub {
  margin-left: 6px;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---- 工具条 ---- */
.dcm__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.dcm__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.dcm__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.dcm__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 影像查看区：阅片惯例的纯黑背景（暗色模式规则的显式例外） */
.dcm__stage {
  position: absolute;
  inset: 0;
  background: #000;
  touch-action: none;
  cursor: crosshair;
}

/* cornerstone 生成的 canvas 填满容器 */
.dcm__stage :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---- 覆盖层（加载 / 错误） ---- */
.dcm__overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background: var(--el-bg-color);
}

.dcm__overlay--soft {
  background: var(--el-bg-color-page);
}

.dcm__loading-text {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dcm__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: dcm-spin 0.9s linear infinite;
}

@keyframes dcm-spin {
  to {
    transform: rotate(360deg);
  }
}

.dcm__error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.dcm__error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dcm__error-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.dcm__error-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ---- 底部状态栏 ---- */
.dcm__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dcm__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dcm__footer .is-error {
  color: var(--el-color-danger);
}

/* ---- 无障碍：尊重「减少动态效果」偏好 ---- */
@media (prefers-reduced-motion: reduce) {
  .dcm__spinner {
    animation: none;
  }
}
</style>
