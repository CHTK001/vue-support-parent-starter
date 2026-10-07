<script setup lang="ts">
/**
 * PSD / PSB 设计稿预览面板（前端直渲，ag-psd）。
 *
 * <p>后端 {@code DesignPreviewProvider} 只能转出图片链接，PSD 走服务端链路要么
 * 慢（起一次转换）要么拿不到合成图。这里用 {@code ag-psd} 在浏览器里直接读
 * 文档结构与合成图（composite）。</p>
 *
 * <p><b>按 ag-psd 官方的不可信文件指引分两步走</b>：先用
 * {@code useRawData} 只读结构（不解任何位图），量过画布尺寸、位深、图层数之后
 * 再单独解合成图。原因很直接——PSD 头里可以声明 300000×300000 的画布却几乎不占
 * 字节，一次性 {@code readPsd(buffer)} 会直接申请几 TB 内存把标签页干掉。</p>
 *
 * <p><b>图层只列不解</b>：每个图层的位图都是独立解码，逐层画出来对「看一眼设计稿」
 * 这个诉求收益很低、代价极高，所以这里只给图层结构（名称 / 可见性 / 不透明度 / 混合模式）。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, Refresh } from "@element-plus/icons-vue";
import { authHeaders, objectUrl, resolveObjectUrl } from "../api/filestorageApi";
import type { Layer, Psd } from "ag-psd";

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
  /** 前端解析失败，请求父组件切回 iframe 服务端通道 */
  fallback: [];
}>();

/** 在线预览体积上限（与后端 PSD 预览 128MB 一致） */
const MAX_BYTES = 128 * 1024 * 1024;

/** 画布边长上限：PSD 头可以声明任意大，超出就引导下载 */
const MAX_CANVAS_EDGE = 20_000;

/** 图层数上限：超出只截断显示，不影响合成图 */
const MAX_LAYERS = 300;

/* ==================== 状态 ==================== */

/** 是否加载中 */
const loading = ref(true);
/** 加载阶段文案 */
const phase = ref("读取文件…");
/** 错误信息（空串表示无错） */
const errorMsg = ref("");
/** 文件字节数 */
const byteSize = ref(0);
/** 文档尺寸 */
const docSize = ref({ w: 0, h: 0 });
/** 位深（bit per channel） */
const bitsPerChannel = ref(0);
/** 色彩模式文案 */
const colorModeText = ref("");
/** 顶层图层组数 */
const layerCount = ref(0);
/** 扁平化后的图层清单（含嵌套层级） */
const layers = ref<{ name: string; depth: number; hidden: boolean; opacity: number; blendMode: string }[]>([]);
/** 是否按容器缩放显示（关掉则 1:1） */
const fit = ref(true);
/** 画布 */
const canvasRef = ref<HTMLCanvasElement>();

/* ==================== 非响应式句柄 ==================== */

/** ag-psd 文档对象（位图留在 WASM/canvas 侧，不进 reactive） */
let psd: Psd | null = null;
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

/** 色彩模式（ag-psd ChannelID）转中文 */
function colorModeTextOf(mode: number): string {
  switch (mode) {
    case 1: return "灰度";
    case 2: return "索引色";
    case 3: return "RGB";
    case 4: return "CMYK";
    case 7: return "多通道";
    case 8: return "双色调";
    case 9: return "Lab";
    default: return `模式 ${mode}`;
  }
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

/**
 * 递归摊平图层树（PSD 的图层是任意嵌套的组结构）
 *
 * @param list 图层数组
 * @param depth 当前层级
 * @param out 摊平结果
 */
function flattenLayers(list: Layer[] | undefined, depth: number, out: typeof layers.value): void {
  if (!list?.length || out.length >= MAX_LAYERS) {
    return;
  }
  for (const layer of list) {
    if (out.length >= MAX_LAYERS) {
      return;
    }
    out.push({
      name: layer.name || "(未命名)",
      depth,
      hidden: layer.hidden === true,
      opacity: Math.round((layer.opacity ?? 1) * 100),
      blendMode: layer.blendMode ?? "normal",
    });
    flattenLayers(layer.children, depth + 1, out);
  }
}

/** 主流程 */
async function load(fallbackOnError = true): Promise<void> {
  disposed = false;
  loading.value = true;
  errorMsg.value = "";
  phase.value = "读取文件…";
  byteSize.value = 0;
  docSize.value = { w: 0, h: 0 };
  bitsPerChannel.value = 0;
  colorModeText.value = "";
  layerCount.value = 0;
  layers.value = [];
  psd = null;
  await nextTick();
  try {
    const buf = await fetchBytes();
    if (disposed) return;
    byteSize.value = buf.byteLength;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用 Photoshop 打开`);
    }
    phase.value = "读取文档结构…";
    await new Promise((r) => setTimeout(r, 30));
    if (disposed) return;
    // 动态引入：ag-psd 体积不小，只在真的预览设计稿时才进包
    const agpsd = await import("ag-psd");
    if (disposed) return;
    // 第一步只读结构，不解位图（useRawData），先把危险尺寸挡掉
    const doc = agpsd.readPsd(buf, {
      useRawData: true,
      useRawThumbnail: true,
      skipLayerImageData: true,
      skipThumbnail: true,
      skipLinkedFilesData: true,
    });
    if (disposed) return;
    const w = Number(doc.width ?? 0);
    const h = Number(doc.height ?? 0);
    if (!w || !h) {
      throw new Error("该文件没有可用的画布尺寸（内容损坏或不是有效的 PSD）");
    }
    if (w > MAX_CANVAS_EDGE || h > MAX_CANVAS_EDGE) {
      throw new Error(
        `画布尺寸 ${w}×${h} 过大，超过在线预览上限 ${MAX_CANVAS_EDGE}×${MAX_CANVAS_EDGE}，请下载后用 Photoshop 打开`,
      );
    }
    const bits = Number(doc.bitsPerChannel ?? 8);
    if (bits > 8) {
      throw new Error(`该文档为 ${bits} 位/通道，超过 8 位，浏览器端无法解码，请下载后用 Photoshop 打开`);
    }
    // 第二步：结构已验证安全，再单独解合成图
    phase.value = "解码合成图…";
    await new Promise((r) => setTimeout(r, 30));
    if (disposed) return;
    const composite = agpsd.getCompositeCanvas(doc);
    if (!composite) {
      throw new Error("该设计稿没有合成图（可能各图层都没有像素数据）");
    }
    const canvas = canvasRef.value;
    if (!canvas) {
      throw new Error("预览容器尚未就绪");
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("无法创建画布上下文");
    }
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(composite as unknown as CanvasImageSource, 0, 0, w, h);

    psd = doc;
    docSize.value = { w, h };
    bitsPerChannel.value = bits;
    colorModeText.value = colorModeTextOf(Number(doc.colorMode ?? 3));
    const flat: typeof layers.value = [];
    flattenLayers(doc.children, 0, flat);
    layerCount.value = doc.children?.length ?? flat.length;
    layers.value = flat;
  } catch (e) {
    if (disposed) return;
    const msg = (e as Error)?.message ?? "PSD 解析失败";
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

/** 下载本体（包内条目下载压缩包本体，与其它前端直渲面板一致的口径） */
async function downloadSelf(): Promise<void> {
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params: { download: "true" } });
  window.open(url, "_blank");
}

onMounted(() => void load());
watch(() => [props.bucket, props.objectKey, props.inner], () => void load());
onBeforeUnmount(() => {
  disposed = true;
  psd = null;
});
</script>

<template>
  <section class="psd" aria-label="设计稿预览">
    <!-- ===== 统计条 ===== -->
    <div class="psd__stats">
      <div class="psd__stat">
        <span class="psd__stat-label">尺寸</span>
        <b class="psd__stat-value">{{ docSize.w ? `${docSize.w}×${docSize.h}` : "—" }}</b>
      </div>
      <div class="psd__stat">
        <span class="psd__stat-label">色彩模式</span>
        <b class="psd__stat-value">{{ colorModeText || "—" }}</b>
      </div>
      <div class="psd__stat">
        <span class="psd__stat-label">位深</span>
        <b class="psd__stat-value">{{ bitsPerChannel ? `${bitsPerChannel} bit` : "—" }}</b>
      </div>
      <div class="psd__stat">
        <span class="psd__stat-label">图层</span>
        <b class="psd__stat-value">{{ loading ? "—" : layerCount || "—" }}</b>
      </div>
      <div class="psd__stat">
        <span class="psd__stat-label">大小</span>
        <b class="psd__stat-value psd__stat-value--accent">{{ formatSize(byteSize) }}</b>
      </div>
    </div>

    <!-- ===== 操作条 ===== -->
    <div class="psd__toolbar">
      <span class="psd__hint">设计稿 · ag-psd 前端解析合成图（图层仅列结构）</span>
      <div class="psd__spacer" />
      <el-button size="small" @click="fit = !fit">{{ fit ? "1:1" : "适应" }}</el-button>
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="() => load(false)" />
      <el-button :icon="Download" title="下载原文件" @click="downloadSelf">下载</el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div class="psd__body">
      <div class="psd__canvas-wrap">
        <!-- 画布容器始终存在，避免加载完成后容器 ref 拿不到 -->
        <div class="psd__viewport">
          <canvas
            ref="canvasRef"
            class="psd__canvas"
            :class="{ 'is-fit': fit, 'is-loading': loading || !!errorMsg }"
          />
        </div>

        <div v-if="loading" class="psd__overlay">
          <div class="psd__spinner" />
          <div class="psd__overlay-text">{{ phase }}</div>
        </div>

        <div v-else-if="errorMsg" class="psd__overlay psd__overlay--error">
          <div class="psd__error-icon">PSD</div>
          <h4 class="psd__error-title">无法预览该设计稿</h4>
          <p class="psd__error-text">{{ errorMsg }}</p>
          <div class="psd__error-actions">
            <el-button type="primary" :icon="Refresh" @click="() => load(false)">重试</el-button>
            <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
          </div>
        </div>
      </div>

      <!-- 图层结构：只给名称 / 可见性 / 不透明度 / 混合模式 -->
      <aside v-if="layers.length" class="psd__layers" aria-label="图层结构">
        <div class="psd__layers-title">图层（{{ layers.length }}）</div>
        <ul class="psd__layers-list">
          <li
            v-for="(l, i) in layers"
            :key="i"
            class="psd__layer"
            :class="{ 'is-hidden': l.hidden }"
            :style="{ paddingLeft: `${6 + l.depth * 12}px` }"
            :title="`${l.name} · ${l.blendMode} · 不透明度 ${l.opacity}%`"
          >
            <span class="psd__layer-name">{{ l.name }}</span>
            <span class="psd__layer-meta">{{ l.opacity }}%</span>
          </li>
        </ul>
      </aside>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="psd__footer">
      <span>{{ fileName }}</span>
      <span>纯前端解析（ag-psd）</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   PSD 设计稿预览面板（与 TIFF / HEIC 面板同一套结构与观感）
   ======================================================== */
.psd {
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

.psd__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.psd__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.psd__stat:first-child {
  padding-left: 0;
}

.psd__stat + .psd__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.psd__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.psd__stat-value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.psd__stat-value--accent {
  color: var(--el-color-primary);
}

.psd__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.psd__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.psd__spacer {
  flex: 1;
  min-width: 0;
}

.psd__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.psd__canvas-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.psd__viewport {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;
  background: var(--el-fill-color-lighter, #f5f7fa);
  display: flex;
  align-items: center;
  justify-content: center;
}

.psd__canvas {
  display: block;
  flex: none;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
}

.psd__canvas.is-fit {
  max-width: 100%;
  max-height: 100%;
}

.psd__canvas:not(.is-fit) {
  image-rendering: pixelated;
}

.psd__canvas.is-loading {
  visibility: hidden;
}

.psd__overlay {
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

.psd__overlay-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.psd__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: psd-spin 0.9s linear infinite;
}

@keyframes psd-spin {
  to {
    transform: rotate(360deg);
  }
}

.psd__error-icon {
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

.psd__error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.psd__error-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.psd__error-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ---- 图层结构栏 ---- */
.psd__layers {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 8px;
  border-left: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}

.psd__layers-title {
  padding: 2px 6px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.psd__layers-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.psd__layer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: var(--el-radius-sm, 6px);
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.psd__layer:hover {
  background: var(--el-fill-color-light);
}

.psd__layer.is-hidden {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.psd__layer-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.psd__layer-meta {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.psd__footer {
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
  .psd__spinner {
    animation: none;
  }
}
</style>