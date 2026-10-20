<!--
  file-viewer 文档预览面板（一对多：xmind/epub/eml 等按扩展名选渲染器）。
  替换旧通道：xmind/epub/eml 此前走 FileStorageManage.vue 的服务端 iframe 通道，
  现改为前端直渲（xmind→mindmapRenderer、epub/fb2/umd→ebookRenderer、
  eml/msg/mbox→emailRenderer）。
  取字节照抄 PreviewGeoPanel.vue/PreviewDrawioPanel.vue 的 load 取字节段：
  票据直链优先（props.src），否则顶层直取 objectUrl，包内条目走 ?preview=true&inner= 通道。
  file-viewer 接线自包含（照抄 PreviewOfficePanel.vue 第 106-166 行模式），未使用 FvPanelBase。
  渲染器按生效扩展名动态 import 对应包（拆包粒度与其他面板一致）。
  失败时 emit('fallback') + emit('error', msg)，由父组件切回 iframe 服务端通道。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { authHeaders, objectUrl } from "../../api/filestorageApi";
import { extensionOf } from "../../utils/officeRenderer";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key，与旧面板口径一致） */
  objectKey: string;
  /** 文件名（决定渲染器分支；包内条目时会被 inner 文件名校正扩展名） */
  fileName: string;
  /** 直链地址（可选；给了直接用，不再拼 URL。兼容旧调用点透传） */
  src?: string;
  /** 压缩包内条目路径（可选；为空表示解析对象本身。沿用旧面板的 inner-raw 通道处理） */
  inner?: string;
  /** 对象大小（可选；声明兼容调用点透传，本面板暂不用） */
  size?: number;
}>();

const emit = defineEmits<{
  /** 取字节/渲染器加载/渲染失败，请求父组件切回 iframe 服务端通道（与旧面板同一口径） */
  fallback: [];
  /** 错误明细（供父组件打日志/提示） */
  error: [msg: string];
  /** 渲染完成（由 file-viewer 的 load-complete 转发） */
  rendered: [];
}>();

void props.size; // 仅声明以兼容调用点透传，纯预览不需要体积

/** 文档分支：xmind=脑图、epub/fb2/umd=电子书、eml/msg/mbox=邮件 */
type DocKind = "mindmap" | "ebook" | "email";

/** 数据加载中（v-model:loading 兼容） */
const loading = defineModel<boolean>("loading", { default: false });

/** 交给 file-viewer 的 File（取字节→校正扩展名→构造） */
const fileRef = shallowRef<File | null>(null);
/** 按扩展名选中的单个渲染器（动态 import，分支间拆包） */
const renderers = shallowRef<unknown[]>([]);
/** file-viewer 组件（懒加载，用 shallowRef：组件对象无需深响应） */
const viewerComp = shallowRef<Component | null>(null);
/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
let fileViewerReady = false;
/** 是否已卸载，避免异步回调在卸载后写状态 */
let disposed = false;
/** 防竞态令牌：props 变化触发重拉，只采信最后一次 */
let loadToken = 0;

/** 面板内可读的失败文案（非空时盖住渲染区，例如「XMind 已加密」） */
const failReason = ref("");

/**
 * XMind 容器校验：不是 ZIP，或 ZIP 内既无 content.json 也无 content.xml 时，
 * 给出**可执行的中文提示**，而不是把解析器抛出的原始异常
 * （如 {@code Cannot parse .xmind file: neither content.json nor content.xml found}）
 * 或 iframe 报错页直接甩给用户。
 *
 * @param buf 文件字节
 * @return 失败文案；校验通过返回 {@code null}
 */
function validateXmind(buf: ArrayBuffer): string | null {
  const u8 = new Uint8Array(buf);
  if (u8.length < 4 || u8[0] !== 0x50 || u8[1] !== 0x4b) {
    return "该文件不是有效的 XMind 压缩包（可能已损坏或已加密），无法预览";
  }
  // ZIP 条目名以 ASCII 存于本地文件头/中央目录，直接按字节搜索即可判断条目是否存在
  const text = new TextDecoder("latin1").decode(u8);
  if (!text.includes("content.json") && !text.includes("content.xml")) {
    return "XMind 文件缺少 content.json / content.xml（可能已加密或版本不受支持），无法预览";
  }
  return null;
}

/**
 * 懒加载 file-viewer 全套依赖（照抄 PreviewOfficePanel.vue 第 106-166 行模式）。
 *
 * @returns 全部就绪返回 true；任一 import 失败返回 false（调用方改走兜底）
 */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  try {
    const [vueMod, cssMod] = await Promise.all([
      import("@file-viewer/vue3-full"),
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
    console.warn("[FvDocPanel] file-viewer 依赖加载失败", e);
    return false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: { id: "doc", label: "doc", renderers: renderers.value },
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

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

/**
 * 按生效文件名扩展名判定文档分支。
 *
 * @param name 生效文件名
 * @returns 文档分支；未知扩展名返回 null（调用方 fallback）
 */
function kindOf(name: string): DocKind | null {
  switch (extensionOf(name).toLowerCase()) {
    case "xmind":
      return "mindmap";
    case "epub":
    case "fb2":
    case "umd":
      return "ebook";
    case "eml":
    case "msg":
    case "mbox":
      return "email";
    default:
      return null;
  }
}

/**
 * 按分支动态 import 对应渲染器（分支间拆包，文档页不拉无关渲染器）。
 *
 * @param kind 文档分支
 * @returns 单个渲染器对象
 */
async function loadRenderer(kind: DocKind): Promise<unknown> {
  if (kind === "mindmap") {
    const mod = await import("@file-viewer/renderer-mindmap");
    return (mod as { mindmapRenderer: unknown }).mindmapRenderer;
  }
  if (kind === "ebook") {
    const mod = await import("@file-viewer/renderer-epub");
    return (mod as { ebookRenderer: unknown }).ebookRenderer;
  }
  const mod = await import("@file-viewer/renderer-email");
  return (mod as { emailRenderer: unknown }).emailRenderer;
}

/**
 * 拉取文件字节（照抄 PreviewGeoPanel.vue / PreviewDrawioPanel.vue 的取字节段）。
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

/** 文档类 MIME（猜不到走空串，file-viewer 按扩展名选渲染器不受影响） */
function mimeOf(name: string, kind: DocKind): string {
  switch (kind) {
    case "ebook":
      return extensionOf(name).toLowerCase() === "fb2" ? "text/xml" : "application/epub+zip";
    case "email":
      return extensionOf(name).toLowerCase() === "mbox" ? "application/mbox" : "message/rfc822";
    default:
      return "";
  }
}

/** 主流程：判分支→取字节→造 File→懒加载对应渲染器 + file-viewer */
async function load(): Promise<void> {
  const token = ++loadToken;
  disposed = false;
  loading.value = true;
  fileRef.value = null;
  failReason.value = "";
  try {
    const name = resolveViewerFileName();
    const kind = kindOf(name);
    if (!kind) throw new Error(`该格式暂不支持在线预览（${props.fileName}），请下载后用本地软件打开`);
    const [renderer, ready] = await Promise.all([loadRenderer(kind), ensureFileViewerLoaded()]);
    if (disposed || token !== loadToken) return;
    if (!ready) throw new Error("file-viewer 依赖加载失败");
    renderers.value = [renderer];
    const buf = await fetchBytes();
    if (disposed || token !== loadToken) return;
    if (kind === "mindmap") {
      const bad = validateXmind(buf);
      if (bad) {
        // 明确的容器问题（损坏/加密/非 XMind）：面板内提示，不再切 iframe
        // （服务端同样解析不了，切过去只会再失败一次）
        failReason.value = bad;
        emit("error", bad);
        return;
      }
    }
    fileRef.value = new File([new Uint8Array(buf)], name, { type: mimeOf(name, kind) });
  } catch (e) {
    if (disposed || token !== loadToken) return;
    const msg = (e as Error)?.message ?? "文档加载失败";
    console.warn("[FvDocPanel] 文档加载失败", e);
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
  const msg = (err as Error)?.message ?? "文档渲染失败";
  console.warn("[FvDocPanel] file-viewer 渲染失败", err);
  emit("error", msg);
  emit("fallback");
}
</script>

<template>
  <div class="fv-doc-panel">
    <div v-if="loading && !fileRef" class="fv-doc-panel__mask">
      <span class="fv-doc-panel__spinner" aria-hidden="true"></span>
      <span>正在准备预览…</span>
    </div>
    <div v-else-if="failReason" class="fv-doc-panel__mask fv-doc-panel__mask--error">
      <div class="fv-doc-panel__card">
        <span class="fv-doc-panel__icon" aria-hidden="true">!</span>
        <span class="fv-doc-panel__title">无法预览该文件</span>
        <span class="fv-doc-panel__desc">{{ failReason }}</span>
      </div>
    </div>
    <component
      :is="viewerComp"
      v-else-if="viewerComp && fileRef && renderers.length"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-doc-panel__body"
      data-testid="file-viewer"
      @load-complete="onRendered"
      @error="onRenderError"
    />
  </div>
</template>

<style scoped>
.fv-doc-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-doc-panel__body {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-doc-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 24px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  text-align: center;
}

.fv-doc-panel__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--el-border-color-lighter, #ebeef5);
  border-top-color: var(--el-color-primary, #409eff);
  animation: fv-doc-spin 0.8s linear infinite;
}

@keyframes fv-doc-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 失败态：赛博风说明卡片 */
.fv-doc-panel__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 46ch;
  padding: 24px 28px;
  border: 1px solid transparent;
  border-radius: 14px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-warning, #e6a23c) 8%, var(--el-fill-color-lighter, #fafafa)) 0%,
      color-mix(in srgb, var(--el-color-danger, #f56c6c) 4%, var(--el-fill-color-lighter, #fafafa)) 100%
    );
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-warning, #e6a23c) 20%, transparent),
    0 8px 32px color-mix(in srgb, var(--el-color-warning, #e6a23c) 14%, transparent);
}

.fv-doc-panel__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--el-color-warning-light-9, #fdf6ec) 0%,
    color-mix(in srgb, var(--el-color-warning, #e6a23c) 20%, var(--el-color-warning-light-9, #fdf6ec)) 100%
  );
  color: var(--el-color-warning, #e6a23c);
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 0 16px color-mix(in srgb, var(--el-color-warning, #e6a23c) 40%, transparent);
}

.fv-doc-panel__title {
  color: var(--el-text-color-primary, #303133);
  font-size: 14px;
  font-weight: 600;
}

.fv-doc-panel__desc {
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  line-height: 1.7;
  word-break: break-word;
}

@media (prefers-reduced-motion: reduce) {
  .fv-doc-panel__spinner {
    animation: none;
  }
}

/* ---- 选中颜色 + 细滚动条 ---- */
.fv-doc-panel ::selection,
.fv-doc-panel *::selection {
  background: var(--el-color-primary-light-8, rgba(64, 158, 255, 0.18));
  color: var(--el-text-color-primary, #303133);
}

.fv-doc-panel::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.fv-doc-panel::-webkit-scrollbar-track {
  background: transparent;
}
.fv-doc-panel::-webkit-scrollbar-thumb {
  background: var(--el-border-color, #dcdfe6);
  border-radius: 999px;
}
.fv-doc-panel::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker, #c4c7ce);
}
</style>
