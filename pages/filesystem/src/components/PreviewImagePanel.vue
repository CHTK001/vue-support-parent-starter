<script setup lang="ts">
/**
 * 图片预览面板组件。
 *
 * 封装了缩放工具栏 + 图片渲染的完整模式，
 * 与 PreviewIframePanel 视觉一致，提供缩放/全屏工具栏。
 *
 * @author Buffy
 * @since 2026/09/10
 */
import { ref } from "vue";
import PreviewToolbar from "./PreviewToolbar.vue";

/** 缩放比例（v-model） */
const zoom = defineModel<number>("zoom", { default: 100 });

const props = defineProps<{
  /** 图片 src 地址 */
  src: string;
  /** 图片 alt 文本 */
  alt?: string;
}>();

const emit = defineEmits<{
  fullscreen: [];
  load: [];
  error: [];
}>();

/** wrap 容器 DOM 引用（供父组件全屏切换） */
const wrapRef = ref<HTMLDivElement>();
/** 工具栏引用 */
const toolbarRef = ref<InstanceType<typeof PreviewToolbar>>();

/** 切换快捷键帮助弹窗 */
function toggleHelp(): void {
  toolbarRef.value?.toggleHelp();
}
defineExpose({ wrapRef, toggleHelp });
</script>

<template>
  <div class="preview-image-panel">
    <PreviewToolbar ref="toolbarRef" v-model:zoom="zoom" @fullscreen="emit('fullscreen')" />
    <div
      ref="wrapRef"
      class="preview-image-panel__wrap"
      :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }"
    >
      <img
        :src="src"
        :alt="alt"
        class="preview-image-panel__img"
        @load="emit('load')"
        @error="emit('error')"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-image-panel {
  width: 100%;
}

.preview-image-panel__wrap {
  position: relative;
  width: 100%;
  transition: transform 0.2s ease;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image-panel__img {
  max-width: 100%;
  max-height: 65vh;
  border-radius: 8px;
  object-fit: contain;
}

:fullscreen .preview-image-panel__wrap {
  width: 100vw;
  height: 100vh;
  transform-origin: top left;
}

:fullscreen .preview-image-panel__img {
  max-height: 100vh;
  border-radius: 0;
}
</style>
