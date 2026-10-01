<script setup lang="ts">
/**
 * PDF 预览面板（左分页缩略图 + 右页面详情）
 *
 * <p><b>为什么不用 VueOfficePdf</b>：它把 PDF 的**所有页面按原始尺寸纵向堆叠**
 * 且不限制容器高度。实测 679KB 的「精工一部.pdf」被渲染成 **209,362 px** 高，
 * 弹框被撑到 20 万像素——表现为「弹框只占屏幕一小块、滚动条落在半空」，
 * 且无法按页跳转。</p>
 *
 * <p>本面板直接用后端内置的 pdf.js（{@code /preview-vendor/pdf/pdf.min.js}，
 * 3.11.174，与文件字节同源、无 CORS）自己渲染：左侧每页一张缩略图，
 * 右侧按容器宽度自适应显示当前页，滚动限制在右侧舞台内。</p>
 */

import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getServerBase, objectUrl } from "../api/filestorageApi";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key */
  objectKey: string;
  /** 文件名（用于标题与报错文案） */
  fileName: string;
}>();

/* ==================== 常量 ==================== */

/** 缩略图宽度（CSS 像素），编译一次后复用 */
const THUMB_W = 108;
/** 最多渲染多少个缩略图，防止超长文档把浏览器拖死 */
const MAX_THUMBS = 200;
/** pdf.js 资源在服务端的同源路径（避免依赖公网 CDN） */
const VENDOR_DIR = "/preview-vendor/pdf";

/* ==================== 状态 ==================== */

/** 加载中 */
const loading = ref(true);
/** 错误信息；非空时展示错误态 */
const errorMsg = ref("");
/** 总页数 */
const totalPages = ref(0);
/** 当前页（1-based） */
const current = ref(1);
/** 缩略图是否已生成 */
const thumbsReady = ref(false);
/** 右侧舞台 DOM */
const stageRef = ref<HTMLDivElement>();
/** 缩略图容器 DOM（用于取 canvas） */
const sideRef = ref<HTMLDivElement>();

/** pdf.js 文档（只声明用到的部分） */
interface PdfDoc {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
}

/** pdf.js 文档代理 */
let pdfDoc: PdfDoc | null = null;
/** 页面渲染任务（切换页时要先取消上一个，否则 pdf.js 会报渲染冲突） */
let renderTask: { cancel: () => void } | null = null;
/** 是否已卸载，避免异步回调在卸载后写状态 */
let disposed = false;

/** pdf.js 极简类型（只声明用到的部分） */
interface PdfPage {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => {
    promise: Promise<void>;
    cancel: () => void;
  };
}
/** pdf.js 全局对象（由注入的 script 提供） */
interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (o: { data: Uint8Array }) => { promise: Promise<unknown>; destroy: () => Promise<void> };
}

/**
 * 取全局 pdf.js
 *
 * <p>用显式 cast 而不是 {@code declare global}：后者在 {@code <script setup>}
 * 里不参与 Window 合并，TS 会把属性收窄成 never。</p>
 *
 * @returns pdf.js 全局对象；未装载时 undefined
 */
function pdfjsGlobal(): PdfJsLib | undefined {
  return (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
}

const total = computed(() => totalPages.value);
const thumbs = computed(() => Array.from({ length: Math.min(totalPages.value, MAX_THUMBS) }, (_, i) => i + 1));

/* ==================== pdf.js 装载 ==================== */

/**
 * 按需注入 pdf.js 脚本（同源、只注入一次）
 *
 * @returns pdf.js 全局对象
 */
async function ensurePdfJs(): Promise<PdfJsLib> {
  const existing = pdfjsGlobal();
  if (existing) {
    return existing;
  }
  const base = getServerBase().replace(/\/+$/, "");
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${base}${VENDOR_DIR}/pdf.min.js`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("pdf.js 资源加载失败"));
    document.head.appendChild(s);
  });
  const lib = pdfjsGlobal();
  if (!lib) {
    throw new Error("pdf.js 未就绪");
  }
  // worker 同样走同源：不同源会被浏览器拦成 blob 回退，性能差且会告警
  lib.GlobalWorkerOptions.workerSrc = `${base}${VENDOR_DIR}/pdf.worker.min.js`;
  return lib;
}

/* ==================== 渲染 ==================== */

/**
 * 把某一页画到指定 canvas，等比缩放到给定宽度
 *
 * @param page    pdf.js 页对象
 * @param canvas  目标 canvas
 * @param cssW    目标 CSS 宽度
 * @returns 渲染后的 CSS 高度
 */
async function drawPage(page: PdfPage, canvas: HTMLCanvasElement, cssW: number): Promise<number> {
  const base = page.getViewport({ scale: 1 });
  const scale = cssW / base.width;
  const vp = page.getViewport({ scale });
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  canvas.style.width = `${Math.floor(vp.width)}px`;
  canvas.style.height = `${Math.floor(vp.height)}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas 上下文不可用");
  }
  // 记下渲染任务：同一 canvas 上并发渲染 pdf.js 会抛错，切页前必须先 cancel
  const task = page.render({ canvasContext: ctx, viewport: vp });
  renderTask = task;
  try {
    await task.promise;
  } finally {
    renderTask = null;
  }
  return vp.height;
}

/** 渲染右侧当前页（按舞台宽度自适应） */
async function renderCurrent(): Promise<void> {
  if (!pdfDoc || disposed) {
    return;
  }
  const stage = stageRef.value;
  if (!stage) {
    return;
  }
  renderTask?.cancel();
  renderTask = null;
  try {
    const page = await pdfDoc.getPage(current.value);
    if (disposed) {
      return;
    }
    let canvas = stage.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "pdf__canvas";
      stage.innerHTML = "";
      stage.appendChild(canvas);
    }
    // 舞台内有内边距，可用宽度按内容盒算
    const avail = Math.max(120, stage.clientWidth - 24);
    await drawPage(page, canvas, avail);
  } catch (e) {
    if (!disposed) {
      console.warn("[PreviewPdfPanel] 页面渲染失败", e);
    }
  }
}

/** 生成左侧缩略图（逐页、低分辨率） */
async function renderThumbs(): Promise<void> {
  const side = sideRef.value;
  if (!pdfDoc || !side || disposed) {
    return;
  }
  for (const n of thumbs.value) {
    if (disposed) {
      return;
    }
    const box = side.querySelector(`[data-thumb="${n}"] canvas`) as HTMLCanvasElement | null;
    if (!box) {
      continue;
    }
    try {
      const page = await pdfDoc.getPage(n);
      await drawPage(page, box, THUMB_W);
    } catch {
      // 个别页渲染失败不影响其它页
    }
  }
  if (!disposed) {
    thumbsReady.value = true;
  }
}

/* ==================== 交互 ==================== */

/**
 * 跳到指定页
 *
 * @param n 页码（1-based）
 */
function goto(n: number): void {
  const p = Math.min(Math.max(1, n), Math.max(1, totalPages.value));
  if (p === current.value) {
    return;
  }
  current.value = p;
}

/**
 * 上一页
 */
function prev(): void {
  goto(current.value - 1);
}

/**
 * 下一页
 */
function next(): void {
  goto(current.value + 1);
}

/**
 * 键盘翻页（只在面板内监听，避免和弹框自身的按键冲突）
 *
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent): void {
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return;
  }
  if (e.key === "ArrowDown" || e.key === "PageDown") {
    e.preventDefault();
    next();
  } else if (e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    prev();
  }
}

/* ==================== 生命周期 ==================== */

/** 载入 PDF 并渲染首屏 */
async function load(): Promise<void> {
  loading.value = true;
  errorMsg.value = "";
  totalPages.value = 0;
  current.value = 1;
  thumbsReady.value = false;
  pdfDoc = null;
  renderTask?.cancel();
  renderTask = null;
  try {
    const lib = await ensurePdfJs();
    if (disposed) {
      return;
    }
    // 走 objectUrl（自带令牌），拿原始字节交给 pdf.js
    const res = await fetch(objectUrl(props.bucket, props.objectKey));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") {
      errorMsg.value = `不是有效的 PDF（${props.fileName}）：缺少 %PDF- 文件头，可能已损坏或被加密`;
      return;
    }
    const task = lib.getDocument({ data: bytes });
    const doc = (await task.promise) as PdfDoc;
    if (disposed) {
      return;
    }
    pdfDoc = doc;
    totalPages.value = doc.numPages;
    loading.value = false;
    // 先出正文，再后台补缩略图（大文档时缩略图慢，不应阻塞首屏）
    await renderCurrent();
    void renderThumbs();
  } catch (e) {
    if (!disposed) {
      console.warn("[PreviewPdfPanel] 加载失败", e);
      errorMsg.value = `PDF 加载失败（${props.fileName}）：${(e as Error)?.message ?? "未知错误"}`;
      loading.value = false;
    }
  }
}

watch(() => [props.bucket, props.objectKey], () => void load(), { immediate: true });
watch(current, () => void renderCurrent());

onBeforeUnmount(() => {
  disposed = true;
  renderTask?.cancel();
  renderTask = null;
  void pdfDoc?.destroy().catch(() => undefined);
  pdfDoc = null;
});
</script>

<template>
  <div class="pdf" tabindex="0" @keydown="onKeydown">
    <!-- 左：分页缩略图 -->
    <aside ref="sideRef" class="pdf__side">
      <div v-if="loading" class="pdf__side-hint">加载中…</div>
      <template v-else-if="totalPages">
        <button
          v-for="n in thumbs"
          :key="n"
          type="button"
          class="pdf__thumb"
          :class="{ 'is-active': n === current }"
          :data-thumb="n"
          :title="`第 ${n} 页`"
          @click="goto(n)"
        >
          <canvas class="pdf__thumb-canvas" />
          <span class="pdf__thumb-no">{{ n }}</span>
        </button>
        <div v-if="totalPages > MAX_THUMBS" class="pdf__side-hint">
          仅显示前 {{ MAX_THUMBS }} 页缩略图
        </div>
      </template>
    </aside>

    <!-- 右：当前页详情 -->
    <section class="pdf__main">
      <div class="pdf__bar">
        <button type="button" class="pdf__btn" :disabled="current <= 1" @click="prev">上一页</button>
        <span class="pdf__pos">
          <b>{{ current }}</b> / {{ total || "-" }}
        </span>
        <button type="button" class="pdf__btn" :disabled="!total || current >= total" @click="next">
          下一页
        </button>
        <span class="pdf__hint">↑/↓ 或 PageUp/PageDown 翻页</span>
      </div>
      <div ref="stageRef" class="pdf__stage">
        <div v-if="loading" class="pdf__mask">加载中…</div>
        <div v-else-if="errorMsg" class="pdf__mask pdf__mask--err">{{ errorMsg }}</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 面板吃满弹框：父级（.fs-preview）已是 flex:1 + min-height:0 */
.pdf {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 10px;
  outline: none;
}

/* ---- 左侧分页 ---- */
.pdf__side {
  flex: none;
  width: 132px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.pdf__side-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  text-align: center;
  padding: 6px 0;
}

.pdf__thumb {
  position: relative;
  display: block;
  padding: 0;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-bg-color, #fff);
  cursor: pointer;
  overflow: hidden;
  line-height: 0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pdf__thumb:hover {
  border-color: var(--el-color-primary, #409eff);
}

.pdf__thumb.is-active {
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7, rgba(64, 158, 255, 0.32));
}

.pdf__thumb-canvas {
  display: block;
  width: 108px;
  background: #fff;
}

.pdf__thumb-no {
  position: absolute;
  right: 3px;
  bottom: 2px;
  padding: 0 5px;
  font-size: 11px;
  line-height: 16px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 8px;
}

/* ---- 右侧详情 ---- */
.pdf__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
  background: var(--el-bg-color, #fff);
}

.pdf__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light, #fafafa);
}

.pdf__btn {
  padding: 2px 12px;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
}

.pdf__btn:hover:not(:disabled) {
  color: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary, #409eff);
}

.pdf__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf__pos {
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
  font-variant-numeric: tabular-nums;
}

.pdf__hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

/* 舞台：这里是**唯一**的滚动容器，页面按宽度自适应，超出高度时纵向滚动 */
.pdf__stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: var(--el-fill-color-lighter, #f5f7fa);
}

.pdf__canvas {
  display: block;
  background: #fff;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
}

.pdf__mask {
  align-self: center;
  margin: auto;
  padding: 20px;
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
}

.pdf__mask--err {
  color: var(--el-color-danger, #f56c6c);
  max-width: 520px;
  line-height: 1.7;
}
</style>