<script setup lang="ts">
/**
 * ReRow —— 栅格行（el-row 薄封装）
 */
import { ElRow } from "element-plus";

defineOptions({ name: "ReRow", inheritAttrs: true });

withDefaults(
  defineProps<{
    gutter?: number;
    justify?: "start" | "center" | "end" | "space-around" | "space-between" | "space-evenly";
    align?: "top" | "middle" | "bottom";
    wrap?: boolean;
    tag?: string;
  }>(),
  {
    gutter: 0,
    justify: "start",
    align: "top",
    wrap: true,
    tag: "div",
  },
);
</script>

<template>
  <ElRow v-bind="$attrs" :gutter="gutter" :justify="justify" :align="align" :wrap="wrap" :tag="tag">
    <slot />
  </ElRow>
</template>
