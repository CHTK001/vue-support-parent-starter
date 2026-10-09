<!--
  file-viewer 文本预览面板（Markdown / 代码 / 纯文本）。
  替换旧通道：FileStorageManage.vue 里 Markdown/代码走服务端的 iframe 通道
  （showMarkdownPanel/showCodePanel），现改为 textRenderer 前端直渲。
  textRendererDefinitions 同时覆盖 code 与 markdown 渲染，file-viewer 按文件名
  扩展名自动选 code 或 markdown 渲染（md/markdown/代码类/txt/json/xml/yaml/ipynb 等），
  本面板不用自己分。取字节与 FvImagePanel 同一写法（TiffPreviewPanel 的 fetchBytes 口径）。
-->
<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from "vue";
import { authHeaders, objectUrl } from "../../api/filestorageApi";
import { extensionOf } from "../../utils/officeRenderer";
import FvPanelBase from "./FvPanelBase.vue";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key，与图片侧口径一致） */
  objectKey: string;
  /** 文件名（file-viewer 按其扩展名自动选 code/markdown 渲染） */
  fileName: string;
  /** 直链地址（可选；给了直接用，不再拼 URL。兼容调用点透传） */
  src?: string;
  /** 压缩包内条目路径（可选；为空表示解析对象本身。沿用图片侧的 inner-raw 通道处理） */
  inner?: string;
  /** 对象大小（可选；声明兼容调用点透传，本面板暂不用） */
  size?: number;
}>();

const emit = defineEmits<{
  /** 取字节/渲染器加载失败，请求父组件切回 iframe 服务端通道 */
  fallback: [];
  /** 错误明细（供父组件打日志/提示） */
  error: [msg: string];
  /** 渲染完成（由 FvPanelBase 转发） */
  rendered: [];
}>();

void props.size; // 仅声明以兼容调用点透传，纯预览不需要体积

/** 数据加载中（v-model:loading 兼容） */
const loading = defineModel<boolean>("loading", { default: false });

/** 交给 file-viewer 的 File */
const fileRef = shallowRef<File | null>(null);
/** textRenderer（动态 import，与图片侧拆包） */
const renderers = shallowRef<unknown[]>([]);
/** 是否已卸载 */
let disposed = false;
/** 防竞态令牌 */
let loadToken = 0;

/** 拉取文件字节（与 FvImagePanel 同一写法，TiffPreviewPanel 的 fetchBytes 口径） */
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
 * 校正交给 file-viewer 的文件名（包内条目以外层 fileName 为准、扩展名以 inner 为准）。
 * 文本侧 file-viewer 按扩展名在 code/markdown 渲染间自选，故扩展名必须真实。
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

/** 文本类 MIME（猜不到走 text/plain，渲染选择只看扩展名） */
function mimeOf(name: string): string {
  switch (extensionOf(name).toLowerCase()) {
    case "md":
    case "markdown":
      return "text/markdown";
    case "json":
      return "application/json";
    case "xml":
    case "xsl":
    case "xsd":
    case "svg":
      return "text/xml";
    case "yaml":
    case "yml":
      return "text/yaml";
    case "html":
    case "htm":
      return "text/html";
    case "ipynb":
      return "application/x-ipynb+json";
    default:
      return "text/plain";
  }
}

/** 主流程：取字节→造 File→懒加载 textRenderer */
async function load(): Promise<void> {
  const token = ++loadToken;
  disposed = false;
  loading.value = true;
  fileRef.value = null;
  try {
    const mod = await import("@file-viewer/renderer-text");
    if (disposed || token !== loadToken) return;
    renderers.value = [(mod as { textRenderer: unknown }).textRenderer];
    const buf = await fetchBytes();
    if (disposed || token !== loadToken) return;
    const u8 = new Uint8Array(buf);
    const name = resolveViewerFileName();
    fileRef.value = new File([u8], name, { type: mimeOf(name) });
  } catch (e) {
    if (disposed || token !== loadToken) return;
    const msg = (e as Error)?.message ?? "文本加载失败";
    console.warn("[FvTextPanel] 文本加载失败", e);
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

function onRendered(): void {
  emit("rendered");
}

function onBaseError(err: unknown): void {
  const msg = (err as Error)?.message ?? "文本渲染失败";
  console.warn("[FvTextPanel] file-viewer 渲染失败", err);
  emit("error", msg);
  emit("fallback");
}
</script>

<template>
  <div class="fv-text-panel">
    <div v-if="loading && !fileRef" class="fv-text-panel__mask">加载中…</div>
    <FvPanelBase
      v-else-if="fileRef && renderers.length"
      v-model:loading="loading"
      :file="fileRef"
      :renderers="renderers"
      preset-id="text"
      @rendered="onRendered"
      @error="onBaseError"
    />
  </div>
</template>

<style scoped>
.fv-text-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-text-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
}
</style>
