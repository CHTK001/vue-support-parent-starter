<script setup lang="ts">
/**
 * iframe 预览面板组件。
 *
 * 只负责 iframe 加载遮罩与 iframe 本体：缩放 / 帮助 / 全屏工具条已按产品要求移除。
 *
 * <p><b>为什么不再对 iframe 容器做 transform: scale()</b>：那会把遮罩、边框、
 * 定位上下文一起缩放，表现为「缩放时整个弹框都在动」，而不是只放大内容。
 * 需要缩放内容时应由 iframe 内部的文档自己处理（PDF viewer、Office 组件等
 * 本来就带自己的缩放），此处保持 1:1 呈现。</p>
 *
 * @author Buffy
 * @since 2026/09/10
 */
import { ref } from "vue";
import PreviewIframeOverlay from "./PreviewIframeOverlay.vue";

const props = defineProps<{
  /** iframe src 地址 */
  src: string;
  /** iframe 加载中状态 */
  loading: boolean;
  /** iframe key（用于强制刷新） */
  frameKey?: number;
}>();

const emit = defineEmits<{
  load: [];
  error: [];
}>();

/** wrap 容器 DOM 引用 */
const wrapRef = ref<HTMLDivElement>();
/** iframe DOM 引用 */
const iframeRef = ref<HTMLIFrameElement>();
defineExpose({ wrapRef, iframeRef });
</script>

<template>
  <div class="preview-iframe-panel">
    <div ref="wrapRef" class="preview-iframe-panel__wrap">
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
  /* 吃满父容器（.fs-preview 的 flex:1）：此前只声明 width，
     高度由 iframe 的 65vh 决定，于是弹框只占屏幕一部分、
     内容滚动条出现在半空。 */
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.preview-iframe-panel__wrap {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.preview-iframe-panel__frame {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-page);
}
</style>
