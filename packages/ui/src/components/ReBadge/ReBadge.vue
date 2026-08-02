<template>
  <el-badge
    v-bind="$attrs"
    :value="value"
    :max="max"
    :is-dot="isDot"
    :hidden="hidden"
    :type="type"
    :show-zero="showZero"
    :color="color"
    :offset="offset"
    :badge-style="badgeStyle"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.content" #content>
      <slot name="content" />
    </template>
  </el-badge>
</template>

<script setup lang="ts">
defineOptions({ name: "ReBadge" });

defineProps<{
  value?: string | number;
  max?: number;
  isDot?: boolean;
  hidden?: boolean;
  type?: "primary" | "success" | "warning" | "danger" | "info";
  showZero?: boolean;
  color?: string;
  offset?: [number, number];
  badgeStyle?: Record<string, string | number>;
}>();
</script>
