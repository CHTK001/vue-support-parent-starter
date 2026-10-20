<!--
  file-viewer 图片预览面板。
  替换旧面板：PreviewImagePanel.vue（原生图片 <img> + 编辑）、
  TiffPreviewPanel.vue（UTIF.js 前端解码）、HeicPreviewPanel.vue（libheif-js WASM 解码）。
  imageRenderer 内置 heic2any 与 tiff.js，tiff/heic 无需额外 renderer。
  取字节照抄 TiffPreviewPanel.vue/HeicPreviewPanel.vue 的 fetchBytes：
  顶层直取 objectUrl，包内条目走 ?preview=true&inner=包内路径 的 inner-raw 通道，令牌只走请求头。
  注意：本面板只做纯预览，不承接 PreviewImagePanel 的旋转/裁剪/保存编辑能力；
  失败时 emit('fallback') 由父组件切回 iframe 服务端通道（与旧面板同一口径）。
-->
<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from "vue";
import { authHeaders, objectUrl } from "../../api/filestorageApi";
import { extensionOf } from "../../utils/officeRenderer";
import FvPanelBase from "./FvPanelBase.vue";
import FvLoadingMask from "./FvLoadingMask.vue";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key，与旧面板口径一致） */
  objectKey: string;
  /** 文件名（决定 file-viewer 选渲染器；包内条目时会被 inner 文件名校正扩展名） */
  fileName: string;
  /** 直链地址（可选；给了直接用，不再拼 URL。兼容旧调用点透传） */
  src?: string;
  /** 压缩包内条目路径（可选；为空表示解析对象本身。沿用旧面板的 inner-raw 通道处理） */
  inner?: string;
  /** 对象大小（可选；声明兼容调用点透传，本面板暂不用） */
  size?: number;
}>();

const emit = defineEmits<{
  /** 取字节/渲染器加载失败，请求父组件切回 iframe 服务端通道（与旧面板同一口径） */
  fallback: [];
  /** 错误明细（供父组件打日志/提示） */
  error: [msg: string];
  /** 渲染完成（由 FvPanelBase 转发） */
  rendered: [];
}>();

void props.size; // 仅声明以兼容调用点透传，纯预览不需要体积

/** 数据加载中（v-model:loading 兼容） */
const loading = defineModel<boolean>("loading", { default: false });

/** 交给 file-viewer 的 File（取字节→校正扩展名→构造） */
const fileRef = shallowRef<File | null>(null);
/** imageRenderer（动态 import，与 text 侧拆包，图片页不拉文本渲染器） */
const renderers = shallowRef<unknown[]>([]);
/** 是否已卸载，避免异步回调在卸载后写状态 */
let disposed = false;
/** 防竞态令牌：props 变化触发重拉，只采信最后一次 */
let loadToken = 0;

/**
 * 拉取文件字节（照抄 TiffPreviewPanel.vue 的 fetchBytes）。
 * 有 props.src 直接用；否则顶层直取 objectUrl，包内走 inner-raw 通道。
 */
async function fetchBytes(): Promise<ArrayBuffer> {
  if (props.src) {
    const res = await fetch(props.src, { headers: authHeaders() });
    if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
    return res.arrayBuffer();
  }
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
 * 按扩展名校正交给 file-viewer 的文件名。
 * file-viewer 按文件名扩展名选渲染器；包内条目（inner）的文件名才是真实格式，
 * 此时以外层 fileName 的目录无关、扩展名以 inner 为准。
 */
function resolveViewerFileName(): string {
  if (props.inner) {
    const innerBase = props.inner.split("/").pop() || props.inner;
    const innerExt = extensionOf(innerBase);
    if (innerExt) {
      const outerExt = extensionOf(props.fileName);
      if (outerExt && outerExt.toLowerCase() !== innerExt.toLowerCase()) {
        const dot = props.fileName.lastIndexOf(".");
        return `${dot > 0 ? props.fileName.slice(0, dot) : props.fileName}.${innerExt}`;
      }
      if (!outerExt) return `${props.fileName}.${innerExt}`;
    }
  }
  return props.fileName;
}

/** 按扩展名给 File 猜一个 MIME（猜不到走空串，file-viewer 按扩展名选渲染器不受影响） */
function mimeOf(name: string): string {
  switch (extensionOf(name).toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "avif":
      return "image/avif";
    case "ico":
      return "image/x-icon";
    default:
      return "";
  }
}

/** 主流程：取字节→造 File→懒加载 imageRenderer */
async function load(): Promise<void> {
  const token = ++loadToken;
  disposed = false;
  loading.value = true;
  fileRef.value = null;
  try {
    const mod = await import("@file-viewer/renderer-image");
    if (disposed || token !== loadToken) return;
    renderers.value = [(mod as { imageRenderer: unknown }).imageRenderer];
    const buf = await fetchBytes();
    if (disposed || token !== loadToken) return;
    const u8 = new Uint8Array(buf);
    const name = resolveViewerFileName();
    fileRef.value = new File([u8], name, { type: mimeOf(name) });
  } catch (e) {
    if (disposed || token !== loadToken) return;
    const msg = (e as Error)?.message ?? "图片加载失败";
    console.warn("[FvImagePanel] 图片加载失败", e);
    emit("error", msg);
    emit("fallback");
  } finally {
    if (!disposed && token === loadToken) loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.fileName, props.src, props.inner],
  () => void load(),
  { immediate: true },
);

onBeforeUnmount(() => {
  disposed = true;
  loadToken++;
  fileRef.value = null;
});

/** FvPanelBase 渲染完成 → 转发 */
function onRendered(): void {
  emit("rendered");
}

/** FvPanelBase 渲染失败 → fallback（模板分支回 iframe）+ error 明细 */
function onBaseError(err: unknown): void {
  const msg = (err as Error)?.message ?? "图片渲染失败";
  console.warn("[FvImagePanel] file-viewer 渲染失败", err);
  emit("error", msg);
  emit("fallback");
}
</script>

<template>
  <div class="fv-image-panel">
    <FvLoadingMask v-if="loading && !fileRef" :fileName="fileName" />
    <FvPanelBase
      v-else-if="fileRef && renderers.length"
      v-model:loading="loading"
      :file="fileRef"
      :renderers="renderers"
      preset-id="image"
      @rendered="onRendered"
      @error="onBaseError"
    />
  </div>
</template>

<style scoped>
.fv-image-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-image-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
}
</style>
