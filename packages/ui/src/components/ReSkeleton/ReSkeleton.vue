<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    :animated="animated"
    :count="count"
    :loading="loading"
    :rows="rows"
    :throttle="throttle"
    v-bind="$attrs"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </ModernLayout>

  <!-- 默认 el-skeleton 布局 -->
  <el-skeleton
    v-else
    v-bind="$attrs"
    :animated="animated"
    :count="count"
    :loading="loading"
    :rows="rows"
    :throttle="throttle"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.template" #template>
      <slot name="template" />
    </template>
  </el-skeleton>
</template>

<script setup lang="ts">
/**
 * ReSkeleton —— 骨架屏组件
 *
 * 透传 el-skeleton 全部能力。
 *   - layout：布局变体，"el"（默认，el-skeleton）/ "modern"（现代化扁平骨架屏，异步加载）
 */
import { defineAsyncComponent } from "vue";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReSkeleton" });

withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-skeleton）/ "modern"（现代化扁平骨架屏） */
    layout?: "el" | "modern";
    animated?: boolean;
    count?: number;
    loading?: boolean;
    rows?: number;
    throttle?: number;
  }>(),
  {
    layout: "el",
    animated: false,
    count: 1,
    loading: false,
    rows: 3,
    throttle: 0,
  },
);
</script>
