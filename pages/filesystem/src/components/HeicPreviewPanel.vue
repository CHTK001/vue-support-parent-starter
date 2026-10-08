<script setup lang="ts">
/**
 * HEIC / HEIF 预览面板（前端直渲，libheif-js WASM）。
 *
 * <p>iPhone 拍出来的默认格式，Chrome / Firefox 至今都不能原生解码，
 * 落到 {@link PreviewImagePanel} 只会得到「图片加载失败」。这里用 libheif
 * （Emscripten WASM）在浏览器里解码出像素。</p>
 *
 * <p><b>wasm 自带、不用配资产</b>：取包内 {@code libheif-bundle.mjs}
 * （wasm 已内联为 base64，官方推荐的 ESM 形态），省掉 {@code locateFile}
 * 与 public 目录，比 {@code web-ifc} 那套 {@code ?url} 少一环。</p>
 *
 * <p><b>HEIF 容器里常不止一张图</b>（主图 + 缩略图 + alpha 辅助图），
 * 所以按解码器返回的清单逐张列出并可切换，而不是默认只画第一张
 * —— 拍一张照片常常解出 2~3 张，第一张未必是主图。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, Refresh } from "@element-plus/icons-vue";
import { authHeaders, objectUrl, resolveObjectUrl } from "../api/filestorageApi";
import type { HeifImage, LibheifModule } from "../types/client-preview-libs";

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

/** 在线预览体积上限（与后端 HEIC 预览 256MB 一致） */
const MAX_BYTES = 256 * 1024 * 1024;

/** 单图像素数上限：坏文件常声明巨大尺寸，解开就是几百 MB 内存 */
const MAX_PIXELS = 60_000_000;

/* ==================== 状态 ==================== */

/** 是否加载中 */
const loading = ref(true);
/** 加载阶段文案 */
const phase = ref("读取文件…");
/** 错误信息（空串表示无错） */
const errorMsg = ref("");
/** 文件字节数 */
const byteSize = ref(0);
/** 容器内图像张数 */
const imageCount = ref(0);
/** 当前图序号（0 起） */
const imageIndex = ref(0);
/** 当前图尺寸 */
const imageSize = ref({ w: 0, h: 0 });
/** 是否按容器缩放显示（关掉则 1:1） */
const fit = ref(true);
/** 画布 */
const canvasRef = ref<HTMLCanvasElement>();

/** 是否有多张图可切 */
const multiImage = computed(() => imageCount.value > 1);

/* ==================== 非响应式句柄 ==================== */
/* libheif 的 image 句柄是 WASM 侧对象，放进 reactive 会被 Proxy 包裹而失效 */

/** libheif 模块（懒加载） */
let libheif: LibheifModule | null = null;
/** 容器内全部图像句柄 */
let images: HeifImage[] = [];
/** 是否已卸载 */
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

/** 按需加载 libheif 并实例化模块（只做一次，之后复用） */
async function loadLibheif(): Promise<LibheifModule> {
  if (!libheif) {
    const mod = await import("libheif-js/libheif-wasm/libheif-bundle.mjs");
    // mjs 版导出的是 emscripten 工厂，调用一次才拿到模块
    const instance: LibheifModule = mod.default();
    libheif = instance;
    return instance;
  }
  return libheif;
}

/** 解出第 index 张图并画到画布 */
async function renderImage(index: number): Promise<void> {
  const canvas = canvasRef.value;
  if (!canvas || index < 0 || index >= images.length) {
    return;
  }
  const image = images[index];
  const w = image.get_width();
  const h = image.get_height();
  if (!w || !h) {
    throw new Error(`第 ${index + 1} 张图没有可解码的数据`);
  }
  const pixels = w * h;
  if (pixels > MAX_PIXELS) {
    throw new Error(
      `图像尺寸 ${w}×${h} 过大（${(pixels / 1_000_000).toFixed(0)} 兆像素），`
      + `超过在线预览上限 ${(MAX_PIXELS / 1_000_000).toFixed(0)} 兆像素，请下载后用专业软件打开`,
    );
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建画布上下文");
  }
  const imageData = ctx.createImageData(w, h);
  // display 是回调式的：HEVC 解码在 WASM 里同步跑，回调只负责把结果交回来
  const ok = await new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (v: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    // 解码异常在 WASM 侧抛出，兜个底避免卡在 loading
    setTimeout(() => finish(false), 60_000);
    try {
      image.display(imageData, (displayData) => finish(Boolean(displayData)));
    } catch (e) {
      finish(false);
      void e;
    }
  });
  if (!ok) {
    throw new Error(`第 ${index + 1} 张图解码失败（可能是该文件用了当前 libheif 不支持的编码特性）`);
  }
  ctx.putImageData(imageData, 0, 0);
  imageSize.value = { w, h };
}

/** 主流程 */
async function load(fallbackOnError = true): Promise<void> {
  disposed = false;
  loading.value = true;
  errorMsg.value = "";
  phase.value = "读取文件…";
  byteSize.value = 0;
  imageCount.value = 0;
  imageIndex.value = 0;
  imageSize.value = { w: 0, h: 0 };
  images = [];
  await nextTick();
  try {
    const buf = await fetchBytes();
    if (disposed) return;
    byteSize.value = buf.byteLength;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用专业软件打开`);
    }
    phase.value = "初始化解码器…";
    await new Promise((r) => setTimeout(r, 30));
    if (disposed) return;
    const heif = await loadLibheif();
    if (disposed) return;
    phase.value = "解码 HEIC…";
    await new Promise((r) => setTimeout(r, 30));
    if (disposed) return;
    const decoder = new heif.HeifDecoder();
    const list = decoder.decode(new Uint8Array(buf));
    if (disposed) return;
    if (!list.length) {
      throw new Error("该文件不含任何图像（HEIF 容器有效但没有可解码的图）");
    }
    images = list;
    imageCount.value = list.length;
    await renderImage(0);
  } catch (e) {
    if (disposed) return;
    const msg = (e as Error)?.message ?? "HEIC 解码失败";
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

/** 切换图像 */
async function gotoImage(index: number): Promise<void> {
  if (index < 0 || index >= imageCount.value || index === imageIndex.value) {
    return;
  }
  const prev = imageIndex.value;
  imageIndex.value = index;
  phase.value = `解码第 ${index + 1} 张…`;
  loading.value = true;
  errorMsg.value = "";
  try {
    await renderImage(index);
  } catch (e) {
    imageIndex.value = prev;
    errorMsg.value = (e as Error)?.message ?? `第 ${index + 1} 张图解码失败`;
  } finally {
    loading.value = false;
  }
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
  images = [];
});
</script>

<template>
  <section class="heic" aria-label="HEIC 图像预览">
    <!-- ===== 统计条 ===== -->
    <div class="heic__stats">
      <div class="heic__stat">
        <span class="heic__stat-label">图像</span>
        <b class="heic__stat-value">{{ loading ? "—" : imageCount || "—" }}</b>
      </div>
      <div class="heic__stat">
        <span class="heic__stat-label">尺寸</span>
        <b class="heic__stat-value">{{ imageSize.w ? `${imageSize.w}×${imageSize.h}` : "—" }}</b>
      </div>
      <div class="heic__stat">
        <span class="heic__stat-label">大小</span>
        <b class="heic__stat-value heic__stat-value--accent">{{ formatSize(byteSize) }}</b>
      </div>
    </div>

    <!-- ===== 操作条 ===== -->
    <div class="heic__toolbar">
      <span class="heic__hint">HEIC · libheif 前端解码</span>
      <!-- 多图时给一条可点的清单：HEIF 容器里常含主图 + 缩略图 -->
      <div v-if="multiImage" class="heic__picker" role="tablist" aria-label="容器内图像">
        <button
          v-for="i in imageCount"
          :key="i"
          type="button"
          role="tab"
          class="heic__picker-item"
          :class="{ 'is-active': i - 1 === imageIndex }"
          :aria-selected="i - 1 === imageIndex"
          @click="gotoImage(i - 1)"
        >{{ i }}</button>
      </div>
      <div class="heic__spacer" />
      <el-button size="small" @click="fit = !fit">{{ fit ? "1:1" : "适应" }}</el-button>
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="() => load(false)" />
      <el-button :icon="Download" title="下载原文件" @click="downloadSelf">下载</el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div class="heic__body">
      <div class="heic__viewport">
        <canvas
          ref="canvasRef"
          class="heic__canvas"
          :class="{ 'is-fit': fit, 'is-loading': loading || !!errorMsg }"
        />
      </div>

      <div v-if="loading" class="heic__overlay">
        <div class="heic__spinner" />
        <div class="heic__overlay-text">{{ phase }}</div>
      </div>

      <div v-else-if="errorMsg" class="heic__overlay heic__overlay--error">
        <div class="heic__error-icon">HEIC</div>
        <h4 class="heic__error-title">无法预览该 HEIC 文件</h4>
        <p class="heic__error-text">{{ errorMsg }}</p>
        <div class="heic__error-actions">
          <el-button type="primary" :icon="Refresh" @click="() => load(false)">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="heic__footer">
      <span>{{ fileName }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   HEIC 预览面板（与 TIFF 面板同一套结构与观感）
   ======================================================== */
.heic {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 72vh;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

.heic__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.heic__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.heic__stat:first-child {
  padding-left: 0;
}

.heic__stat + .heic__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.heic__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.heic__stat-value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.heic__stat-value--accent {
  color: var(--el-color-primary);
}

.heic__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.heic__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.heic__picker {
  display: flex;
  align-items: center;
  gap: 4px;
}

.heic__picker-item {
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 4px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.heic__picker-item:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.heic__picker-item.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}

.heic__spacer {
  flex: 1;
  min-width: 0;
}

.heic__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.heic__viewport {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;
  background: var(--el-fill-color-lighter, #f5f7fa);
  display: flex;
  align-items: center;
  justify-content: center;
}

.heic__canvas {
  display: block;
  flex: none;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
}

.heic__canvas.is-fit {
  max-width: 100%;
  max-height: 100%;
}

.heic__canvas:not(.is-fit) {
  image-rendering: pixelated;
}

.heic__canvas.is-loading {
  visibility: hidden;
}

.heic__overlay {
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

.heic__overlay-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.heic__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: heic-spin 0.9s linear infinite;
}

@keyframes heic-spin {
  to {
    transform: rotate(360deg);
  }
}

.heic__error-icon {
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

.heic__error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.heic__error-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.heic__error-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.heic__footer {
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
  .heic__spinner {
    animation: none;
  }
}
</style>