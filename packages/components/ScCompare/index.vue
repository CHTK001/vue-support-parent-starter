<template>
  <div class="sc-compare-root">
    <VueCompareImage
      :left-image="leftImage"
      :leftImageCss="leftImageCss"
      :leftImageLabel="leftImageLabel"
      :rightImageCss="rightImageCss"
      :rightImageLabel="rightImageLabel"
      :right-image="rightImage"
    />
  </div>
</template>

<script setup>
import { toRefs } from "vue";
import { VueCompareImage } from "vue3-compare-image";

const props = defineProps({
  leftImage: { type: String, default: "" },
  leftImageLabel: { type: String, default: "源图片" },
  leftImageCss: {
    type: Object,
    default: () => ({
      backgroundColor: "#0f172a",
      border: "1px solid rgba(148, 163, 184, 0.6)",
      borderRadius: "8px"
    })
  },
  rightImage: { type: String, default: "" },
  rightImageLabel: { type: String, default: "修复图片" },
  rightImageCss: {
    type: Object,
    default: () => ({
      backgroundColor: "#020617",
      border: "1px solid rgba(148, 163, 184, 0.6)",
      borderRadius: "8px"
    })
  }
});

const { leftImage, rightImage, leftImageLabel, rightImageLabel, leftImageCss, rightImageCss } = toRefs(props);
</script>

<style scoped>
.sc-compare-root {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.sc-compare-root :deep(.vci--root) {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.sc-compare-root :deep(.vci--left-label),
.sc-compare-root :deep(.vci--right-label) {
  top: 8% !important;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  backdrop-filter: blur(6px);
}

.sc-compare-root :deep(.vci--left-label) {
  background: rgba(15, 23, 42, 0.8);
  color: #e5e7eb;
}

.sc-compare-root :deep(.vci--right-label) {
  background: rgba(5, 150, 105, 0.9);
  color: #ecfdf5;
}

.sc-compare-root :deep(.vci--controller) {
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.6);
}

/* 8bit 主题下的像素风适配（参考 Pixel-UI Image 组件风格） */
:global(html[data-skin="8bit"]) .sc-compare-root {
  padding: 8px;
  background: #000000;
  border-radius: 0;
  image-rendering: pixelated;
}

:global(html[data-skin="8bit"]) .sc-compare-root :deep(.vci--root) {
  border-radius: 0;
  box-shadow: 0 0 0 2px #000000, 0 0 0 4px #ffffff, 0 0 0 6px #00ff00;
}

:global(html[data-skin="8bit"]) .sc-compare-root :deep(.vci--left-label),
:global(html[data-skin="8bit"]) .sc-compare-root :deep(.vci--right-label) {
  top: 6% !important;
  border-radius: 0;
  font-family: "Press Start 2P", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  font-size: 10px;
  letter-spacing: 0.03em;
  padding: 3px 6px;
  box-shadow: 0 0 0 2px #000000;
}

:global(html[data-skin="8bit"]) .sc-compare-root :deep(.vci--left-label) {
  background: #222222;
  color: #00ff00;
}

:global(html[data-skin="8bit"]) .sc-compare-root :deep(.vci--right-label) {
  background: #222222;
  color: #ffdd00;
}

:global(html[data-skin="8bit"]) .sc-compare-root :deep(.vci--controller) {
  border-radius: 0;
  background: #00ff00;
  box-shadow: 0 0 0 2px #000000, 0 0 0 4px #ffffff;
}
</style>


