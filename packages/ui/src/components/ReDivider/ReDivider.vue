<script setup lang="ts">
/**
 * ReDivider —— 分隔线（el-divider 封装）
 */
import { ElDivider } from "element-plus";
import "../shared/modern-vars.css";

defineOptions({ name: "ReDivider", inheritAttrs: true });

withDefaults(
  defineProps<{
    direction?: "horizontal" | "vertical";
    contentPosition?: "left" | "center" | "right";
    borderStyle?: string;
    plain?: boolean;
  }>(),
  {
    direction: "horizontal",
    contentPosition: "center",
    borderStyle: "solid",
    plain: true,
  },
);
</script>

<template>
  <ElDivider
    v-bind="$attrs"
    :direction="direction"
    :content-position="contentPosition"
    :border-style="borderStyle"
    :plain="plain"
    class="re-divider"
  >
    <slot />
  </ElDivider>
</template>

<style scoped>
.re-divider {
  border-color: var(--rm-border-light);
}
.re-divider :deep(.el-divider__text) {
  font-size: var(--rm-font-sm);
  font-weight: 600;
  color: var(--rm-text-regular);
  padding: 0 10px;
}
.re-divider.is-vertical {
  margin: 0 8px;
}
</style>