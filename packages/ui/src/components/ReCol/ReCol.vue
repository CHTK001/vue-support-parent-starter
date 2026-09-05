<script setup lang="ts">
/**
 * ReCol —— 栅格列（el-col 薄封装）
 */
import { ElCol } from "element-plus";

defineOptions({ name: "ReCol", inheritAttrs: true });

withDefaults(
  defineProps<{
    span?: number;
    offset?: number;
    push?: number;
    pull?: number;
    xs?: number | object;
    sm?: number | object;
    md?: number | object;
    lg?: number | object;
    xl?: number | object;
    tag?: string;
  }>(),
  {
    span: 24,
    offset: 0,
    push: 0,
    pull: 0,
    xs: undefined,
    sm: undefined,
    md: undefined,
    lg: undefined,
    xl: undefined,
    tag: "div",
  },
);
</script>

<template>
  <ElCol v-bind="$attrs" :span="span" :offset="offset" :push="push" :pull="pull" :xs="xs" :sm="sm" :md="md" :lg="lg" :xl="xl" :tag="tag">
    <slot />
  </ElCol>
</template>
