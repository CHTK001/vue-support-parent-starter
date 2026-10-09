<!--
  file-viewer 3D 模型预览面板（glb/gltf/obj/stl/ifc/step/3dm 等 + ifc 同一渲染器）。
  替换旧面板：PreviewModel3dPanel.vue（通用 3D）、PreviewIfcPanel.vue（IFC/BIM）。
  取字节照抄 PreviewModel3dPanel.vue/PreviewIfcPanel.vue 的 fetchBytes：
  顶层直取 objectUrl，包内条目走 ?preview=true&inner=包内路径 的 inner-raw 通道，令牌只走请求头。
  超限阈值照抄 PreviewModel3dPanel.vue/PreviewIfcPanel.vue 的 MAX_BYTES（200MB）：
  file-viewer 侧做不到旧面板的几何级管控，超限直接 fallback，不在本面板内报错展示。
  file-viewer 接线自包含（照抄 PreviewOfficePanel.vue 第 106-166 行模式），未使用 FvPanelBase。
  modelRenderer 同时覆盖 3D 网格与 IFC，file-viewer 按文件名扩展名自选。
  失败时 emit('fallback') + emit('error', msg)，由父组件切回 iframe 服务端通道。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { authHeaders, objectUrl } from "../../api/filestorageApi";
import { extensionOf } from "../../utils/officeRenderer";

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
  /** 取字节/超限/渲染器加载/渲染失败，请求父组件切回 iframe 服务端通道（与旧面板同一口径） */
  fallback: [];
  /** 错误明细（供父组件打日志/提示） */
  error: [msg: string];
  /** 渲染完成（由 file-viewer 的 load-complete 转发） */
  rendered: [];
}>();

void props.size; // 仅声明以兼容调用点透传，纯预览不需要体积

/**
 * 在线预览的体积上限（照抄 PreviewModel3dPanel.vue / PreviewIfcPanel.vue 的 MAX_BYTES）。
 * file-viewer 侧做不到旧面板的几何级管控，超限直接 fallback。
 */
const MAX_BYTES = 200 * 1024 * 1024;

/** 数据加载中（v-model:loading 兼容） */
const loading = defineModel<boolean>("loading", { default: false });

/** 交给 file-viewer 的 File（取字节→校正扩展名→构造） */
const fileRef = shallowRef<File | null>(null);
/** modelRenderer（动态 import，与其他渲染器侧拆包） */
const renderers = shallowRef<unknown[]>([]);
/** file-viewer 组件（懒加载，用 shallowRef：组件对象无需深响应） */
const viewerComp = shallowRef<Component | null>(null);
/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
let fileViewerReady = false;
/** 是否已卸载，避免异步回调在卸载后写状态 */
let disposed = false;
/** 防竞态令牌：props 变化触发重拉，只采信最后一次 */
let loadToken = 0;

/**
 * 懒加载 file-viewer 全套依赖（照抄 PreviewOfficePanel.vue 第 106-166 行模式）。
 *
 * @returns 全部就绪返回 true；任一 import 失败返回 false（调用方改走兜底）
 */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  try {
    const [vueMod, cssMod] = await Promise.all([
      import("@file-viewer/vue3"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
    ]);
    void cssMod; // 样式副作用导入
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer ??
      (vueMod as { default?: Component }).default ??
      null;
    fileViewerReady = !!viewerComp.value;
    return fileViewerReady;
  } catch (e) {
    console.warn("[FvModelPanel] file-viewer 依赖加载失败", e);
    return false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: { id: "model", label: "model", renderers: renderers.value },
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

/**
 * 拉取文件字节（照抄 PreviewModel3dPanel.vue / PreviewIfcPanel.vue 的 fetchBytes）。
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
 * 此时以外层 fileName 为名、扩展名以 inner 为准。
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

/** 3D 模型 MIME（猜不到走空串，file-viewer 按扩展名选渲染器不受影响） */
function mimeOf(name: string): string {
  switch (extensionOf(name).toLowerCase()) {
    case "glb":
      return "model/gltf-binary";
    case "gltf":
      return "model/gltf+json";
    case "obj":
      return "model/obj";
    case "stl":
      return "model/stl";
    default:
      return "";
  }
}

/** 主流程：取字节→超限检查→造 File→懒加载 modelRenderer + file-viewer */
async function load(): Promise<void> {
  const token = ++loadToken;
  disposed = false;
  loading.value = true;
  fileRef.value = null;
  try {
    const [modelMod, ready] = await Promise.all([
      import("@file-viewer/renderer-3d"),
      ensureFileViewerLoaded(),
    ]);
    if (disposed || token !== loadToken) return;
    if (!ready) throw new Error("file-viewer 依赖加载失败");
    renderers.value = [(modelMod as { modelRenderer: unknown }).modelRenderer];
    const buf = await fetchBytes();
    if (disposed || token !== loadToken) return;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(
        `文件过大（${buf.byteLength} B），超过在线预览上限 ${MAX_BYTES} B，请下载后用专业软件打开`,
      );
    }
    const name = resolveViewerFileName();
    fileRef.value = new File([new Uint8Array(buf)], name, { type: mimeOf(name) });
  } catch (e) {
    if (disposed || token !== loadToken) return;
    const msg = (e as Error)?.message ?? "3D 模型加载失败";
    console.warn("[FvModelPanel] 3D 模型加载失败", e);
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

/** file-viewer 渲染完成 */
function onRendered(): void {
  emit("rendered");
}

/** file-viewer 渲染失败 → fallback + error 明细 */
function onRenderError(err: unknown): void {
  const msg = (err as Error)?.message ?? "3D 模型渲染失败";
  console.warn("[FvModelPanel] file-viewer 渲染失败", err);
  emit("error", msg);
  emit("fallback");
}
</script>

<template>
  <div class="fv-model-panel">
    <div v-if="loading && !fileRef" class="fv-model-panel__mask">加载中…</div>
    <component
      :is="viewerComp"
      v-else-if="viewerComp && fileRef && renderers.length"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-model-panel__body"
      data-testid="file-viewer"
      @load-complete="onRendered"
      @error="onRenderError"
    />
  </div>
</template>

<style scoped>
.fv-model-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-model-panel__body {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-model-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
}
</style>
