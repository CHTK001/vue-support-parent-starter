<!--
  file-viewer 宿主组件（唯一渲染底座）。
  替换旧面板：TiffPreviewPanel.vue / HeicPreviewPanel.vue / PreviewImagePanel.vue（图片类），
  以及服务端 iframe 通道（FileStorageManage.vue 的 Markdown/代码预览）。
  职责只有：懒加载 @file-viewer/vue3（含样式）→ 按 presetId + renderers 组 options →
  把 File 交给 <component :is> 渲染。不做任何工具条/统计条/编辑能力。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";

const props = defineProps<{
  /** 交给 file-viewer 渲染的文件（file-viewer 按其 name 的扩展名选渲染器） */
  file: File;
  /** 渲染器对象数组（如 imageRenderer / textRenderer），原样喂给 preset.renderers */
  renderers: unknown[];
  /** preset id/label（image 侧如 "image"，text 侧如 "text"） */
  presetId: string;
}>();

const emit = defineEmits<{
  /** file-viewer 渲染完成（由 load-complete 转发） */
  rendered: [];
  /** file-viewer 报错（由 error 转发，载荷原样透传） */
  error: [err: unknown];
  /** loading 双向绑定（v-model:loading 兼容） */
  "update:loading": [value: boolean];
}>();

/** 数据加载中（v-model:loading 兼容：props.loading + emit('update:loading') 的 defineModel 形态） */
const loading = defineModel<boolean>("loading", { default: false });

/** file-viewer 组件（懒加载，用 shallowRef：组件对象无需深响应） */
const viewerComp = shallowRef<Component | null>(null);
/** 加载失败时的门闩：失败不置位，下次文件变化可重试 */
let fileViewerReady = false;
/** 卸载标记，避免异步回调在卸载后写状态 */
let disposed = false;

/**
 * 懒加载 file-viewer 组件 + 样式（幂等）。
 * 用法与 PreviewOfficePanel.vue 第 106-166 行一致。
 */
async function ensureFileViewerLoaded(): Promise<boolean> {
  if (fileViewerReady) return true;
  loading.value = true;
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
    console.warn("[FvPanelBase] file-viewer 依赖加载失败", e);
    emit("error", e);
    return false;
  } finally {
    loading.value = false;
  }
}

/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
const viewerOptions = computed(() => ({
  preset: { id: props.presetId, label: props.presetId, renderers: props.renderers },
  rendererMode: "replace" as const,
  theme: "light" as const,
  toolbar: { position: "bottom-right" as const },
}));

/** 当前文件引用（props.file 变化即重渲染） */
const fileRef = ref<File | null>(null);

onMounted(() => {
  void ensureFileViewerLoaded();
  fileRef.value = props.file;
});
onBeforeUnmount(() => {
  disposed = true;
});
watch(
  () => props.file,
  (f) => {
    fileRef.value = f;
    if (!fileViewerReady && !disposed) void ensureFileViewerLoaded();
  },
);
watch(
  () => props.renderers,
  () => {
    if (!fileViewerReady && !disposed) void ensureFileViewerLoaded();
  },
);

/** load-complete → rendered 转发 */
function onLoadComplete(): void {
  emit("rendered");
}

/** error → error 转发（载荷原样透传） */
function onViewerError(err: unknown): void {
  emit("error", err);
}
</script>

<template>
  <div class="fv-panel-base">
    <div v-if="loading && !viewerComp" class="fv-panel-base__mask">加载中…</div>
    <component
      :is="viewerComp"
      v-else-if="viewerComp && fileRef"
      :file="fileRef"
      :options="viewerOptions"
      class="fv-panel-base__body"
      data-testid="file-viewer"
      @load-complete="onLoadComplete"
      @error="onViewerError"
    />
  </div>
</template>

<style scoped>
.fv-panel-base {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-panel-base__body {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fv-panel-base__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
}
</style>
