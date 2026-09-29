<script setup lang="ts">
/**
 * iframe 预览面板组件。
 *
 * 封装了缩放工具栏 + iframe 加载遮罩 + iframe 渲染的完整模式，
 * 用于 PDF、Office、Font 等 iframe 预览类型，消除三处重复代码。
 *
 * @author Buffy
 * @since 2026/09/10
 */
import { ref } from "vue";
import PreviewIframeOverlay from "./PreviewIframeOverlay.vue";

/** 缩放比例（v-model） */
const zoom = defineModel<number>("zoom", { default: 100 });

const props = defineProps<{
  /** iframe src 地址 */
  src: string;
  /** iframe 加载中状态 */
  loading: boolean;
  /** iframe key（用于强制刷新） */
  frameKey?: number;
}>();

const emit = defineEmits<{
  fullscreen: [];
  load: [];
  error: [];
}>();

/** wrap 容器 DOM 引用（供父组件全屏切换） */
const wrapRef = ref<HTMLDivElement>();
/** iframe DOM 引用 */
const iframeRef = ref<HTMLIFrameElement>();

/** 切换快捷键帮助弹窗 */
function toggleHelp(): void {
  toolbarRef.value?.toggleHelp();
}
defineExpose({ wrapRef, iframeRef, toggleHelp });
</script>

<template>
  <div class="preview-iframe-panel">
    <div
      ref="wrapRef"
      class="preview-iframe-panel__wrap"
      :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }"
    >
      <PreviewIframeOverlay :loading="loading" />
      <iframe
        ref="iframeRef"
        :key="frameKey"
        :src="src"
        class="preview-iframe-panel__frame"
        @load="emit('load')"
        @error="emit('error')"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-iframe-panel {
  width: 100%;
}

.preview-iframe-panel__wrap {
  position: relative;
  width: 100%;
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
  overflow: visible;
}

.preview-iframe-panel__frame {
  width: 100%;
  height: 65vh;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}

:fullscreen .preview-iframe-panel__wrap {
  width: 100vw;
  height: 100vh;
  transform-origin: top left;
}

:fullscreen .preview-iframe-panel__frame {
  height: 100vh;
  border-radius: 0;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .preview-iframe-panel__wrap {
    transition: none;
  }
}
</style>
