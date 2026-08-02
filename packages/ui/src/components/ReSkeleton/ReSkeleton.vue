<template>
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
defineOptions({ name: "ReSkeleton" });

defineProps<{
  animated?: boolean;
  count?: number;
  loading?: boolean;
  rows?: number;
  throttle?: number;
}>();
</script>
