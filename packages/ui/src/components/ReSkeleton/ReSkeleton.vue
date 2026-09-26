<template>
  <!-- 透传 el-skeleton 全部能力 -->
  <el-skeleton
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
 *
 * 说明：原 `layout="modern"` 变体（layouts/Modern.vue）经审计确认全仓无人使用，
 * 已随统一表面方案一并移除；如需现代化骨架屏，请直接在业务侧按统一表面规格实现，
 * 或从 backups/ui-unused-layouts-retire-20260926/ 取回原实现。
 */
defineOptions({ name: "ReSkeleton" });

withDefaults(
  defineProps<{
    animated?: boolean;
    count?: number;
    loading?: boolean;
    rows?: number;
    throttle?: number;
  }>(),
  {
    animated: false,
    count: 1,
    loading: false,
    rows: 3,
    throttle: 0,
  },
);
</script>
