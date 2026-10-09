<!--
  FvArchivePanel.vue — 压缩包 file-viewer 渲染面板（自包含接线，未收敛到 FvPanelBase）。
  替换旧面板：src/components/ArchivePreviewPanel.vue（旧面板自建目录树 + 条目表 + open-entry 下钻；
  新组件不需要目录树 UI，由 file-viewer 的 archive 渲染器接管，只渲染压缩包本体）。
-->
<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 压缩包对象 Key（含目录前缀） */
  objectKey: string;
  /** 压缩包文件名（不含目录） */
  fileName: string;
  /** 直接可取的字节地址（兼容透传的票据 URL；为空时按 bucket/objectKey 签票据） */
  src?: string;
  /** 压缩包内条目路径（file-viewer archive 渲染器接管目录树，本面板只渲染包本体；保留仅为兼容旧调用方，未使用） */
  inner?: string;
  /** 文件大小（字节；保留仅为兼容旧调用方，未使用） */
  size?: number;
}>();

const emit = defineEmits<{
  /** 渲染失败，请求父组件退回旧面板/下载兜底 */
  fallback: [];
  /** 加载或解析失败（msg 为可读文案） */
  error: [msg: string];
  /** 渲染完成 */
  rendered: [];
}>();

/** TODO(inner)：props.inner 暂未使用——file-viewer 的 archive 渲染器接管包内浏览后，
 *  不再需要按 inner 下钻取单一条目；若后续要在包外单独渲染某条目，再按
 *  preview=true&inner= 拼接票据取字节。 */

/** 加载中 */
const loading = ref(true);
/** 失败文案（空串表示无错） */
const failReason = ref("");
/** 交给 file-viewer 的 File 对象 */
const fileRef = shallowRef<File | null>(null);

/**
 * file-viewer 组件（懒加载，照抄 PreviewOfficePanel.vue 106-166 行模式）。
 */
const viewerComp = shallowRef<Component | null>(null);
/** archive 渲染器 preset（rendererMode:'replace' 时唯一 registry 来源） */
let archivePreset: unknown = null;
/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
let fileViewerReady = false;

/** 懒加载 file-viewer 全套依赖（并行拉取组件 + archive 渲染器 + 样式） */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  try {
    const [vueMod, rendererMod, cssMod] = await Promise.all([
      import("@file-viewer/vue3"),
      import("@file-viewer/renderer-archive"),
      import("@file-viewer/vue3/dist/file-viewer3.css"),
    ]);
    void cssMod; // 样式副作用导入
    const renderer = (rendererMod as { archiveRenderer?: unknown }).archiveRenderer;
    archivePreset = {
      id: "file-viewer-preset-archive",
      label: "Flyfish File Viewer archive renderer preset",
      renderers: [renderer],
    };
    viewerComp.value =
      (vueMod as { FileViewer?: Component; default?: Component }).FileViewer
      ?? (vueMod as { default?: Component }).default
      ?? null;
    fileViewerReady = !!viewerComp.value && !!archivePreset && !!renderer;
    return fileViewerReady;
  } catch (e) {
    console.warn("[FvArchivePanel] file-viewer 依赖加载失败", e);
    return false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: archivePreset,
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

/**
 * 取压缩包本体字节并准备渲染。
 *
 * 旧面板 ArchivePreviewPanel.vue 走 ?format=archive 纯 JSON 通道只取条目结构；
 * file-viewer 的 archive 渲染器要吃压缩包原始字节，故这里走对象直链取字节
 * （顶层文件路径；downloadSelf()/resolveObjectUrl(bucket, objectKey) 模式，
 * 不带 preview/inner——带 inner 会只拿到包内某一条目而非压缩包本体）。
 */
async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  fileRef.value = null;
  try {
    const url = props.src
      ?? await resolveObjectUrl(props.bucket, props.objectKey);
    if (!url) throw new Error("获取压缩包地址失败");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    if (!ab.byteLength) throw new Error("预览通道返回空响应体");
    const ready = await ensureFileViewerLoaded();
    if (!ready) throw new Error("file-viewer 依赖加载失败");
    fileRef.value = new File([ab], props.fileName);
  } catch (e) {
    const msg = (e as Error)?.message ?? "压缩包加载失败";
    console.warn("[FvArchivePanel] 压缩包加载失败", e);
    failReason.value = `压缩包加载失败（${props.fileName}）：${msg}`;
    emit("fallback");
    emit("error", failReason.value);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.src, props.fileName],
  () => void load(),
  { immediate: true },
);

/** file-viewer 渲染完成 */
function onRendered(): void {
  emit("rendered");
}

/** file-viewer 解析失败（多为损坏包/不支持的压缩算法）：退回旧面板兜底 */
function onRenderError(): void {
  console.warn("[FvArchivePanel] file-viewer 渲染失败", props.fileName);
  failReason.value = `压缩包解析失败（${props.fileName}），请下载后用本地软件打开`;
  emit("fallback");
  emit("error", failReason.value);
}
</script>

<template>
  <div class="fv-archive-panel">
    <div v-if="loading" class="fv-archive-panel__mask">
      <span class="fv-archive-panel__mask-text">加载中…</span>
    </div>
    <div v-else-if="failReason" class="fv-archive-panel__mask">
      <span class="fv-archive-panel__mask-text">{{ failReason }}</span>
    </div>
    <component
      :is="viewerComp"
      v-else-if="viewerComp && fileRef"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-archive-panel__body"
      data-testid="file-viewer"
      @load-complete="onRendered"
      @error="onRenderError"
    />
  </div>
</template>

<style scoped>
.fv-archive-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.fv-archive-panel__body {
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}
.fv-archive-panel__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
.fv-archive-panel__mask-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
