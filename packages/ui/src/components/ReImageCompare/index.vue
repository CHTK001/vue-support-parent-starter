<template>
  <div class="re-image-compare">
    <VueCompareImage
      :left-image="leftImage"
      :left-image-css="leftImageCss"
      :left-image-label="leftLabel"
      :right-image="rightImage"
      :right-image-css="rightImageCss"
      :right-image-label="rightLabel"
      :handle="handle"
      :slider="slider"
      :hover="hover"
      :default-slider-handle="defaultSliderHandle"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ReImageCompare —— 图片左右对比组件
 *
 * 基于 vue3-compare-image，支持拖拽对比
 *   <ReImageCompare left-image="a.png" right-image="b.png" />
 */
import { VueCompareImage } from "vue3-compare-image";

interface Props {
  /** 左侧图片 URL */
  leftImage: string;
  /** 右侧图片 URL */
  rightImage: string;
  /** 左侧标签 */
  leftLabel?: string;
  /** 右侧标签 */
  rightLabel?: string;
  /** 左侧图片样式 */
  leftImageCss?: Record<string, string>;
  /** 右侧图片样式 */
  rightImageCss?: Record<string, string>;
  /** 滑块线条颜色 */
  handle?: string;
  /** 滑块样式 */
  slider?: string;
  /** 是否悬停时滑动 */
  hover?: boolean;
  /** 默认滑块位置（0-100） */
  defaultSliderHandle?: number;
}

withDefaults(defineProps<Props>(), {
  leftLabel: "",
  rightLabel: "",
  leftImageCss: () => ({}),
  rightImageCss: () => ({}),
  handle: "",
  slider: "",
  hover: false,
  defaultSliderHandle: 50,
});
</script>

<style scoped>
.re-image-compare {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.re-image-compare :deep(.vci--root) {
  width: 100%;
  height: 100%;
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.re-image-compare :deep(.vci--left-image),
.re-image-compare :deep(.vci--right-image) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.re-image-compare :deep(.vci--left-image img),
.re-image-compare :deep(.vci--right-image img) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.re-image-compare :deep(.vci--controller) {
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.6);
  cursor: ew-resize;
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px !important;
  transform: none !important;
}

.re-image-compare :deep(.vci--left-label),
.re-image-compare :deep(.vci--right-label) {
  top: 8% !important;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  z-index: 9999;
}

.re-image-compare :deep(.vci--left-label) {
  background: rgba(15, 23, 42, 0.85);
  color: #e5e7eb;
}

.re-image-compare :deep(.vci--right-label) {
  background: rgba(5, 150, 105, 0.95);
  color: #ecfdf5;
}
</style>
