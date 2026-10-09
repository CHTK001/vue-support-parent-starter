<script setup lang="ts">
/**
 * TGA（Truevision Targa）图像预览面板（前端直渲，内置纯 TS 解码器）。
 *
 * <p><b>为什么不用 iframe</b>：浏览器不原生解码 TGA，若交给 iframe 服务端通道，
 * 要么依赖后端额外的转换能力，要么直接返回原字节让浏览器显示成乱码。这里用
 * {@link decodeTga} 在浏览器里解像素、画到 canvas，零新增依赖、离线可用，
 * 也不必改动任何后端。</p>
 *
 * <p><b>取值通道</b>：与 {@link PreviewGeoPanel} 一致 —— 顶层对象由
 * {@code resolveObjectUrl} 签一张短时票据直连；压缩包内条目带
 * {@code ?preview=true&inner=路径} 走条目提取通道（只传 inner 会拿到整个压缩包）。</p>
 *
 * <p><b>方向与旋转</b>：TGA 历史上默认底来源（bottom-left），解码时按来源标志
 * 统一纠正为正立；面板再提供顺时针 90° 旋转，方便查看竖拍/倒置的截图。</p>
 *
 * @author CH
 * @since 2026/10/08
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, Refresh, RefreshRight } from "@element-plus/icons-vue";
import { resolveObjectUrl } from "../api/filestorageApi";
import { decodeTga, type TgaInfo } from "../utils/tga";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，展示请用生效名） */
  fileName: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入；为 0 时统计条显示 - */
  size?: number;
}>();

/** 在线预览体积上限：TGA 一般不大，超过此值多半是专业产物，引导下载 */
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
/** 已取回的字节数 */
const byteSize = ref(0);
/** 图像尺寸 */
const imgSize = ref({ w: 0, h: 0 });
/** 解码元信息 */
const info = ref<TgaInfo | null>(null);
/** 是否按容器缩放显示（关掉则 1:1，可滚动查看像素） */
const fit = ref(true);
/** 顺时针旋转的 90° 次数（0~3） */
const rotation = ref(0);
/** 画布 */
const canvasRef = ref<HTMLCanvasElement>();

/* ==================== 非响应式句柄 ==================== */
/* ImageData 与离屏 canvas 体积大且无需响应式，放普通变量避免 Preview 包装 */

/** 解码出的像素（原图，旋转时反复重绘，不销毁） */
let decodedImage: ImageData | null = null;
/** 离屏画布（承载原图，供带变换的 drawImage 取用） */
let offscreen: HTMLCanvasElement | null = null;
/** 是否已卸载，避免异步回调在卸载后写状态 */
let disposed = false;

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

/**
 * 拉取文件字节。
 *
 * <p>顶层对象签票据直连；包内条目带 {@code preview=true&inner=} 走条目提取通道。</p>
 *
 * @returns 文件字节
 */
async function fetchBytes(): Promise<ArrayBuffer> {
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
  return res.arrayBuffer();
}

/**
 * 按当前旋转角把解码结果重绘到画布。
 *
 * <p>putImageData 不吃 canvas 变换，所以先把原图铺到离屏画布，再用带
 * translate/rotate 的 drawImage 画到可见画布：90° 的整数倍为精确重排，
 * 不会插值糊边。</p>
 */
function redraw(): void {
  const img = decodedImage;
  const canvas = canvasRef.value;
  if (!img || !canvas) {
    return;
  }
  if (!offscreen) {
    offscreen = document.createElement("canvas");
  }
  offscreen.width = img.width;
  offscreen.height = img.height;
  const octx = offscreen.getContext("2d");
  if (!octx) {
    errorMsg.value = "无法创建画布上下文";
    return;
  }
  octx.putImageData(img, 0, 0);

  const rot = ((rotation.value % 4) + 4) % 4;
  const swap = rot % 2 === 1;
  canvas.width = swap ? img.height : img.width;
  canvas.height = swap ? img.width : img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  switch (rot) {
    case 1:
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 2:
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
      break;
    case 3:
      ctx.translate(0, canvas.height);
      ctx.rotate(-Math.PI / 2);
      break;
    default:
      break;
  }
  ctx.drawImage(offscreen, 0, 0);
  ctx.restore();
}

/** 顺时针旋转 90°（canvas 变换，不重新解码） */
function rotateCW(): void {
  rotation.value = (rotation.value + 1) % 4;
  redraw();
}

/** 主流程：签票据 → 取字节 → 预检尺寸 → 解码 → 绘制 */
async function load(): Promise<void> {
  disposed = false;
  loading.value = true;
  errorMsg.value = "";
  phase.value = "读取文件…";
  byteSize.value = 0;
  imgSize.value = { w: 0, h: 0 };
  info.value = null;
  decodedImage = null;
  rotation.value = 0;
  // 画布始终在 DOM 里，先让布局就位再取 ref
  await nextTick();
  try {
    const buf = await fetchBytes();
    if (disposed) {
      return;
    }
    byteSize.value = buf.byteLength;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(
        `文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用专业软件打开`,
      );
    }
    // 先读头部尺寸做像素预检，避免为超大图分配几百 MB 的像素数组
    if (buf.byteLength >= 18) {
      const head = new DataView(buf);
      const w = head.getUint16(12, true);
      const h = head.getUint16(14, true);
      if (w > 0 && h > 0 && w * h > MAX_PIXELS) {
        throw new Error(
          `图像尺寸 ${w}×${h} 过大（${(w * h / 1_000_000).toFixed(0)} 兆像素），`
          + `超过在线预览上限 ${(MAX_PIXELS / 1_000_000).toFixed(0)} 兆像素，请下载后用专业软件打开`,
        );
      }
    }
    phase.value = "解码 TGA…";
    // 让「解码中…」先画出来，再进同步的解码
    await new Promise((r) => setTimeout(r, 30));
    if (disposed) {
      return;
    }
    const result = decodeTga(buf);
    if (disposed) {
      return;
    }
    decodedImage = result.imageData;
    info.value = result.info;
    imgSize.value = { w: result.info.width, h: result.info.height };
    redraw();
  } catch (e) {
    if (disposed) {
      return;
    }
    errorMsg.value = (e as Error)?.message ?? "TGA 解码失败";
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

/** 下载本体（包内条目下载压缩包本体，与其它前端直渲面板一致的口径） */
async function downloadSelf(): Promise<void> {
  const url = await resolveObjectUrl(props.bucket, props.objectKey, {
    params: { download: "true" },
  });
  window.open(url, "_blank");
}

/** 统计条「类型」：未压缩 / RLE */
const typeText = computed(() => {
  const i = info.value;
  if (!i) {
    return "—";
  }
  return i.compressed ? "RLE 压缩" : "未压缩";
});

/** 统计条「色彩」：调色板 / 真彩 / 灰度 */
const colorText = computed(() => {
  const i = info.value;
  if (!i) {
    return "—";
  }
  if (i.colorModel === "colormap") {
    return `调色板（表 ${i.colormapDepth} 位）`;
  }
  return i.colorModel === "truecolor" ? "真彩色" : "灰度";
});

/** 统计条「位深」 */
const depthText = computed(() => (info.value ? `${info.value.pixelDepth} 位` : "—"));

/**
 * 统计条「大小」：优先用实际取回的字节数。
 *
 * <p>与 GeoJSON 面板按 {@code size} 参数显示的口径不同 —— 这里的字节是实际取回的
 * 入口字节，包内条目也拿得到真实条目体积，故不因 inner 而显示 -。</p>
 */
const sizeText = computed(() => formatSize(byteSize.value || props.size));

/** 页脚右侧状态文案 */
const statusText = computed(() => {
  if (errorMsg.value) {
    return "无法渲染";
  }
  const i = info.value;
  return i ? `${i.width}×${i.height}` : "";
});

onMounted(() => void load());
watch(() => [props.bucket, props.objectKey, props.inner], () => void load());
onBeforeUnmount(() => {
  disposed = true;
  // 像素数据与离屏画布都不小，卸载时立刻放手
  decodedImage = null;
  offscreen = null;
});
</script>

<template>
  <section class="tga" aria-label="TGA 图像预览">
    <!-- ===== 统计条 ===== -->
    <div class="tga__stats">
      <div class="tga__stat">
        <span class="tga__stat-label">尺寸</span>
        <b class="tga__stat-value">{{ imgSize.w ? `${imgSize.w}×${imgSize.h}` : "—" }}</b>
      </div>
      <div class="tga__stat">
        <span class="tga__stat-label">类型</span>
        <b class="tga__stat-value">{{ typeText }}</b>
      </div>
      <div class="tga__stat">
        <span class="tga__stat-label">位深</span>
        <b class="tga__stat-value">{{ depthText }}</b>
      </div>
      <div class="tga__stat">
        <span class="tga__stat-label">色彩</span>
        <b class="tga__stat-value">{{ colorText }}</b>
      </div>
      <div class="tga__stat">
        <span class="tga__stat-label">大小</span>
        <b class="tga__stat-value tga__stat-value--accent">{{ sizeText }}</b>
      </div>
    </div>

    <!-- ===== 操作条 ===== -->
    <div class="tga__toolbar">
      <span class="tga__hint">TGA · 内置解码器</span>
      <div class="tga__spacer" />
      <el-button size="small" @click="fit = !fit">{{ fit ? "1:1" : "适应" }}</el-button>
      <el-button
        :icon="RefreshRight"
        size="small"
        :disabled="!info"
        title="顺时针旋转 90°"
        aria-label="顺时针旋转 90°"
        @click="rotateCW"
      >旋转</el-button>
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="load" />
      <el-button :icon="Download" title="下载原文件" @click="downloadSelf">下载</el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div class="tga__body">
      <!-- 画布容器始终存在，避免加载完成后 ref 拿不到 -->
      <div class="tga__viewport">
        <canvas
          ref="canvasRef"
          class="tga__canvas"
          :class="{ 'is-fit': fit, 'is-loading': loading || !!errorMsg }"
        />
      </div>

      <div v-if="loading" class="tga__overlay">
        <div class="tga__spinner" />
        <div class="tga__overlay-text">{{ phase }}</div>
      </div>

      <div v-else-if="errorMsg" class="tga__overlay tga__overlay--error">
        <div class="tga__error-icon">TGA</div>
        <h4 class="tga__error-title">无法预览该 TGA 文件</h4>
        <p class="tga__error-text">{{ errorMsg }}</p>
        <div class="tga__error-actions">
          <el-button type="primary" :icon="Refresh" @click="load">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="tga__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span :class="{ 'is-error': !!errorMsg }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   TGA 预览面板（koi / Element Plus 变量体系）

   与 TIFF / HEIC 面板同一套结构与观感：统计条 + 操作条 +
   画布区 + 状态栏，颜色全走 --el-* 令牌（暗色模式只靠变量）。
   ======================================================== */
.tga {
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

/* ---- 统计条 ---- */
.tga__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.tga__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.tga__stat:first-child {
  padding-left: 0;
}

.tga__stat + .tga__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.tga__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tga__stat-value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.tga__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 操作条 ---- */
.tga__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.tga__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.tga__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.tga__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 视口：唯一可滚动的容器 */
.tga__viewport {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;
  background: var(--el-fill-color-lighter, #f5f7fa);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tga__canvas {
  display: block;
  flex: none;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
}

/* 适应窗口：长边贴住视口 */
.tga__canvas.is-fit {
  max-width: 100%;
  max-height: 100%;
}

/* 1:1 时按最近邻显示，放大看得清像素 */
.tga__canvas:not(.is-fit) {
  image-rendering: pixelated;
}

.tga__canvas.is-loading {
  visibility: hidden;
}

.tga__overlay {
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

.tga__overlay-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tga__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: tga-spin 0.9s linear infinite;
}

@keyframes tga-spin {
  to {
    transform: rotate(360deg);
  }
}

.tga__error-icon {
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

.tga__error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tga__error-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.tga__error-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ---- 底部状态栏 ---- */
.tga__footer {
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

.tga__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tga__footer .is-error {
  color: var(--el-color-danger);
}

@media (prefers-reduced-motion: reduce) {
  .tga__spinner {
    animation: none;
  }
}
</style>
