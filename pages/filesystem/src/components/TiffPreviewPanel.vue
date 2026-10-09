<script setup lang="ts">
/**
 * TIFF 预览面板（前端直渲，UTIF.js）。
 *
 * <p>浏览器不解码 TIFF：{@code <img>} 只认原生格式，TIFF 落到
 * {@link PreviewImagePanel} 只会得到一张「图片加载失败」。这里用
 * {@code utif} 在浏览器里解像素，画到 canvas 上。</p>
 *
 * <p><b>多页 TIFF 是这类文件的常态</b>（扫描件、传真、多页 TIFF 存档），
 * 所以按 IFD（图像文件目录）逐页解码并提供翻页，而不是只出第一页让人以为文件坏了。</p>
 *
 * <p><b>取值通道</b>与其它前端直渲面板一致：顶层对象直接取字节，压缩包内条目走
 * {@code ?preview=true&inner=包内路径} 的 inner-raw 通道，令牌只走请求头。</p>
 *
 * <p>解码失败（罕见压缩方式、损坏文件）经 {@code fallback} 交回父组件切服务端通道，
 * 与 {@link DataPreviewPanel} 同一口径。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ArrowLeft, ArrowRight, Download, Refresh } from "@element-plus/icons-vue";
import { authHeaders, objectUrl, resolveObjectUrl } from "../api/filestorageApi";
import type { UtifApi, UtifIfd } from "../types/client-preview-libs";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key） */
  objectKey: string;
  /** 文件名（用于标题与报错文案） */
  fileName: string;
  /** 压缩包内条目路径，为空表示解析对象本身 */
  inner?: string;
}>();

const emit = defineEmits<{
  /** 前端解码失败，请求父组件切回 iframe 服务端通道 */
  fallback: [];
}>();

/** 在线预览体积上限（与后端 TIFF 预览 256MB 一致） */
const MAX_BYTES = 256 * 1024 * 1024;

/** 可翻页的页数上限（与后端 TIFF 预览 50 页一致） */
const MAX_PAGES = 50;

/** 单页像素数上限：超出的页多半是声明了巨大尺寸的坏文件，解开就是几百 MB 内存 */
const MAX_PAGE_PIXELS = 60_000_000;

/* ==================== 状态 ==================== */

/** 是否加载中 */
const loading = ref(true);
/** 加载阶段文案 */
const phase = ref("读取文件…");
/** 错误信息（空串表示无错） */
const errorMsg = ref("");
/** 文件字节数 */
const byteSize = ref(0);
/** 总页数（IFD 数量，受 {@link MAX_PAGES} 截断） */
const pageCount = ref(0);
/** 原始 IFD 数量（截断时用于如实告知） */
const rawPageCount = ref(0);
/** 当前页序号（0 起） */
const pageIndex = ref(0);
/** 当前页尺寸 */
const pageSize = ref({ w: 0, h: 0 });
/** 是否按容器缩放显示（关掉则 1:1，可滚动查看像素） */
const fit = ref(true);
/** 画布 */
const canvasRef = ref<HTMLCanvasElement>();

/** 当前页文案 */
const pageLabel = computed(() => (pageCount.value ? `${pageIndex.value + 1} / ${pageCount.value}` : "—"));

/** 是否有多页可翻 */
const multiPage = computed(() => pageCount.value > 1);

/* ==================== 非响应式句柄 ==================== */
/* UTIF 内部会往 IFD 上挂大量 tag 字段，放进 reactive 会被 Proxy 包裹，既浪费又可能破坏它的取值路径 */

/** UTIF 实例（懒加载） */
let utif: UtifApi | null = null;
/** 原始字节（翻页时要重复解同一份容器） */
let rawBytes: ArrayBuffer | null = null;
/** 解析出的 IFD 清单 */
let ifds: UtifIfd[] = [];
/** 已解码过像素的页（避免来回翻页重复解压） */
const decoded = new Set<number>();
/** 是否已卸载，避免异步回调在卸载后写状态 */
let disposed = false;

/** 字节数可读化 */
function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 拉取文件字节（顶层直取，包内走 inner-raw 通道） */
async function fetchBytes(): Promise<ArrayBuffer> {
  const base = objectUrl(props.bucket, props.objectKey);
  const url = props.inner
    ? `${base}${base.includes("?") ? "&" : "?"}preview=true&inner=${encodeURIComponent(props.inner)}`
    : base;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`读取文件失败：HTTP ${res.status}`);
  }
  return res.arrayBuffer();
}

/** 按需加载 UTIF（只加载一次，之后复用） */
async function loadUtif(): Promise<UtifApi> {
  if (!utif) {
    const mod = await import("utif/UTIF.js");
    const api: UtifApi = mod.default;
    utif = api;
    return api;
  }
  return utif;
}

/** 解出第 index 页像素并画到画布 */
async function renderPage(index: number): Promise<void> {
  const canvas = canvasRef.value;
  const api = await loadUtif();
  const buf = rawBytes;
  if (!canvas || !buf || index < 0 || index >= ifds.length) {
    return;
  }
  const ifd = ifds[index];
  if (!decoded.has(index)) {
    try {
      api.decodeImage(buf, ifd);
    } catch (e) {
      throw new Error(`第 ${index + 1} 页解码失败：${(e as Error)?.message ?? "未知错误"}`);
    }
    decoded.add(index);
  }
  const w = Number(ifd.width ?? 0);
  const h = Number(ifd.height ?? 0);
  if (!w || !h) {
    throw new Error(`第 ${index + 1} 页没有图像数据`);
  }
  const pixels = w * h;
  if (pixels > MAX_PAGE_PIXELS) {
    throw new Error(
      `第 ${index + 1} 页尺寸 ${w}×${h} 过大（${(pixels / 1_000_000).toFixed(0)} 兆像素），`
      + `超过在线预览上限 ${(MAX_PAGE_PIXELS / 1_000_000).toFixed(0)} 兆像素，请下载后用专业软件打开`,
    );
  }
  const rgba = api.toRGBA8(ifd);
  if (!rgba || rgba.length < pixels * 4) {
    throw new Error(`第 ${index + 1} 页像素数据不完整`);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建画布上下文");
  }
  // UTIF 给的是 RGBA 四通道，直接按 ImageData 铺上去。
  // 必须拷一份成 Uint8ClampedArray：ImageData 只接受 ArrayBuffer 支撑的视图，
  // 而 UTIF 返回的 TypedArray 在类型上是 ArrayBufferLike（可能是 SharedArrayBuffer），
  // 构造函数的这条重载会直接被拒。
  const pixels8 = new Uint8ClampedArray(rgba.length);
  pixels8.set(rgba);
  ctx.putImageData(new ImageData(pixels8, w, h), 0, 0);
  pageSize.value = { w, h };
}

/** 主流程 */
async function load(fallbackOnError = true): Promise<void> {
  disposed = false;
  loading.value = true;
  errorMsg.value = "";
  phase.value = "读取文件…";
  byteSize.value = 0;
  pageCount.value = 0;
  rawPageCount.value = 0;
  pageIndex.value = 0;
  pageSize.value = { w: 0, h: 0 };
  rawBytes = null;
  ifds = [];
  decoded.clear();
  // 画布容器始终在 DOM 里，先让 DOM 就位再取 ref
  await nextTick();
  try {
    const buf = await fetchBytes();
    if (disposed) return;
    byteSize.value = buf.byteLength;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用专业软件打开`);
    }
    phase.value = "解析 TIFF…";
    // 让「解析中…」先画出来，再进同步的解压（避免看起来像卡死）
    await new Promise((r) => setTimeout(r, 30));
    if (disposed) return;
    const api = await loadUtif();
    if (disposed) return;
    const list = api.decode(buf);
    if (disposed) return;
    if (!list.length) {
      throw new Error("该文件不含任何图像（TIFF 头有效但没有可解码的页）");
    }
    rawBytes = buf;
    ifds = list;
    rawPageCount.value = list.length;
    // 只保留前 N 页：超出的页不翻、也不占内存
    ifds = list.slice(0, MAX_PAGES);
    pageCount.value = ifds.length;
    phase.value = "解码第 1 页…";
    await renderPage(0);
  } catch (e) {
    if (disposed) return;
    const msg = (e as Error)?.message ?? "TIFF 解码失败";
    if (fallbackOnError) {
      emit("fallback");
      return;
    }
    errorMsg.value = msg;
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

/** 翻页 */
async function gotoPage(index: number): Promise<void> {
  if (index < 0 || index >= pageCount.value || index === pageIndex.value) {
    return;
  }
  const prev = pageIndex.value;
  pageIndex.value = index;
  phase.value = `解码第 ${index + 1} 页…`;
  loading.value = true;
  errorMsg.value = "";
  try {
    await renderPage(index);
  } catch (e) {
    // 单页解不开就退回原来那一页，不把用户困在空画布上
    pageIndex.value = prev;
    errorMsg.value = (e as Error)?.message ?? `第 ${index + 1} 页解码失败`;
  } finally {
    loading.value = false;
  }
}

/** 上一页 / 下一页 */
function prevPage(): void {
  void gotoPage(pageIndex.value - 1);
}
function nextPage(): void {
  void gotoPage(pageIndex.value + 1);
}

/** 下载本体（包内条目下载压缩包本体，与其它前端直渲面板一致的口径） */
async function downloadSelf(): Promise<void> {
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params: { download: "true" } });
  window.open(url, "_blank");
}

onMounted(() => void load());
watch(() => [props.bucket, props.objectKey, props.inner], () => void load());
onBeforeUnmount(() => {
  disposed = true;
  // 字节与 IFD 都不小，卸载时立刻放手，别等 GC 猜
  rawBytes = null;
  ifds = [];
  decoded.clear();
});
</script>

<template>
  <section class="tiff" aria-label="TIFF 图像预览">
    <!-- ===== 统计条 ===== -->
    <div class="tiff__stats">
      <div class="tiff__stat">
        <span class="tiff__stat-label">页数</span>
        <b class="tiff__stat-value">{{ loading ? "—" : pageCount || "—" }}</b>
      </div>
      <div class="tiff__stat">
        <span class="tiff__stat-label">尺寸</span>
        <b class="tiff__stat-value">{{ pageSize.w ? `${pageSize.w}×${pageSize.h}` : "—" }}</b>
      </div>
      <div class="tiff__stat">
        <span class="tiff__stat-label">大小</span>
        <b class="tiff__stat-value tiff__stat-value--accent">{{ formatSize(byteSize) }}</b>
      </div>
    </div>

    <!-- ===== 操作条 ===== -->
    <div class="tiff__toolbar">
      <div v-if="multiPage" class="tiff__pager">
        <el-button :icon="ArrowLeft" :disabled="pageIndex === 0" title="上一页" @click="prevPage" />
        <span class="tiff__page-label">{{ pageLabel }}</span>
        <el-button :icon="ArrowRight" :disabled="pageIndex >= pageCount - 1" title="下一页" @click="nextPage" />
      </div>
      <span v-else class="tiff__hint">单页 TIFF · UTIF.js 前端解码</span>
      <span v-if="rawPageCount > pageCount && pageCount" class="tiff__hint">
        共 {{ rawPageCount }} 页，仅前 {{ pageCount }} 页可预览
      </span>
      <div class="tiff__spacer" />
      <el-button size="small" @click="fit = !fit">{{ fit ? "1:1" : "适应" }}</el-button>
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="() => load(false)" />
      <el-button :icon="Download" title="下载原文件" @click="downloadSelf">下载</el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div class="tiff__body">
      <!-- 画布容器始终存在，避免加载完成后容器 ref 拿不到 -->
      <div class="tiff__viewport">
        <canvas
          ref="canvasRef"
          class="tiff__canvas"
          :class="{ 'is-fit': fit, 'is-loading': loading || !!errorMsg }"
        />
      </div>

      <div v-if="loading" class="tiff__overlay">
        <div class="tiff__spinner" />
        <div class="tiff__overlay-text">{{ phase }}</div>
      </div>

      <div v-else-if="errorMsg" class="tiff__overlay tiff__overlay--error">
        <div class="tiff__error-icon">TIFF</div>
        <h4 class="tiff__error-title">无法预览该 TIFF 文件</h4>
        <p class="tiff__error-text">{{ errorMsg }}</p>
        <div class="tiff__error-actions">
          <el-button type="primary" :icon="Refresh" @click="() => load(false)">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="tiff__footer">
      <span>{{ fileName }}</span>
      <span>解码（UTIF.js）</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   TIFF 预览面板（koi / Element Plus 变量体系）

   与 PreviewIfcPanel 同一套结构与观感：统计条 + 工具条 +
   画布区 + 状态栏，颜色全走 --el-* 令牌。
   ======================================================== */
.tiff {
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

.tiff__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.tiff__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.tiff__stat:first-child {
  padding-left: 0;
}

.tiff__stat + .tiff__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.tiff__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tiff__stat-value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.tiff__stat-value--accent {
  color: var(--el-color-primary);
}

.tiff__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.tiff__pager {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tiff__page-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
  min-width: 56px;
  text-align: center;
}

.tiff__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.tiff__spacer {
  flex: 1;
  min-width: 0;
}

.tiff__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 视口：唯一可滚动的容器 */
.tiff__viewport {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;
  background: var(--el-fill-color-lighter, #f5f7fa);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tiff__canvas {
  display: block;
  flex: none;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
}

/* 适应窗口：长边贴住视口 */
.tiff__canvas.is-fit {
  max-width: 100%;
  max-height: 100%;
}

/* 1:1 时按最近邻显示，放大看得清像素 */
.tiff__canvas:not(.is-fit) {
  image-rendering: pixelated;
}

.tiff__canvas.is-loading {
  visibility: hidden;
}

.tiff__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background: var(--el-bg-color);
}

.tiff__overlay-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tiff__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: tiff-spin 0.9s linear infinite;
}

@keyframes tiff-spin {
  to {
    transform: rotate(360deg);
  }
}

.tiff__error-icon {
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
}

.tiff__error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tiff__error-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.tiff__error-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.tiff__footer {
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

@media (prefers-reduced-motion: reduce) {
  .tiff__spinner {
    animation: none;
  }
}
</style>