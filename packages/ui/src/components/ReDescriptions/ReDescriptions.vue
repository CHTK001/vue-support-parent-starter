<script setup lang="ts">
/**
 * ReDescriptions —— 描述列表（el-descriptions 封装）
 *
 * 扁平化面板风格：label 列底色微灰、内容加粗、圆角描边 + 柔和阴影。
 */
import { ElDescriptions } from "element-plus";
import "../shared/modern-vars.css";

defineOptions({ name: "ReDescriptions", inheritAttrs: true });

withDefaults(
  defineProps<{
    column?: number;
    border?: boolean;
    size?: "large" | "default" | "small";
    title?: string;
    direction?: "horizontal" | "vertical";
    labelStyle?: Record<string, any>;
    contentStyle?: Record<string, any>;
  }>(),
  {
    column: 2,
    border: true,
    size: "small",
    title: "",
    direction: "horizontal",
    labelStyle: () => ({}),
    contentStyle: () => ({}),
  },
);
</script>

<template>
  <ElDescriptions
    v-bind="$attrs"
    :column="column"
    :border="border"
    :size="size"
    :title="title"
    :direction="direction"
    :label-style="labelStyle"
    :content-style="contentStyle"
    class="re-descriptions"
  >
    <slot />
  </ElDescriptions>
</template>

<style scoped>
.re-descriptions :deep(.el-descriptions__table) {
  border-radius: var(--rm-radius);
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.re-descriptions :deep(.el-descriptions__label) {
  font-weight: 600;
  color: var(--rm-text-regular);
  background: var(--rm-bg-subtle);
  width: 110px;
}

.re-descriptions :deep(.el-descriptions__content) {
  font-weight: 500;
  color: var(--rm-text);
}

.re-descriptions :deep(.el-descriptions__cell) {
  border-color: var(--rm-border-light) !important;
}
</style>