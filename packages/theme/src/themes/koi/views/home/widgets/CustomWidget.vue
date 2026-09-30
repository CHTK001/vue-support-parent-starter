<!--
  CustomWidget - 自定义 iframe 嵌入组件

  根据 CustomWidgetConfig 渲染独立 iframe，heightMode:
  - fill: 铺满父容器
  - fixed: 按 fixedHeight 设置固定高度
-->
<script setup lang="ts">

import { computed } from "vue";
import { Link, WarningFilled } from "@element-plus/icons-vue";
import type { CustomWidgetConfig } from "../widgets";

interface Props {
  config?: CustomWidgetConfig;
}

const props = defineProps<Props>();

const cfg = computed<CustomWidgetConfig>(() => props.config ?? {});

const hasUrl = computed(() => typeof cfg.value.url === "string" && cfg.value.url.trim().length > 0);
const heightMode = computed(() => cfg.value.heightMode ?? "fill");
const fixedHeight = computed(() => cfg.value.fixedHeight ?? 360);
const scrolling = computed(() => cfg.value.scrolling ?? "auto");
const title = computed(() => cfg.value.title ?? "自定义页面");

const iframeStyle = computed(() => {
  if (heightMode.value === "fixed") {
    return { height: `${fixedHeight.value}px` };
  }
  return { height: "100%" };
});
</script>

<template>
  <div class="custom-widget">
    <div v-if="!hasUrl" class="custom-widget__empty">
      <el-icon :size="20"><WarningFilled /></el-icon>
      <div class="custom-widget__empty-title">未配置 URL</div>
      <div class="custom-widget__empty-tip">编辑模式下点击该组件设置链接</div>
    </div>
    <template v-else>
      <div class="custom-widget__header">
        <el-icon :size="14"><Link /></el-icon>
        <span class="custom-widget__title">{{ title }}</span>
      </div>
      <div class="custom-widget__body">
        <iframe
          class="custom-widget__iframe"
          :src="cfg.url"
          :style="iframeStyle"
          :scrolling="scrolling"
          frameborder="0"
          :title="title"
          loading="lazy"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.custom-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.custom-widget__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-disabled);
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.custom-widget__empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.custom-widget__empty-tip {
  font-size: 12px;
  color: var(--el-text-color-disabled);
}

.custom-widget__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.custom-widget__title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-widget__body {
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
  overflow: auto;
}

.custom-widget__iframe {
  width: 100%;
  border: 0;
  display: block;
  background: var(--el-fill-color-blank);
}
</style>