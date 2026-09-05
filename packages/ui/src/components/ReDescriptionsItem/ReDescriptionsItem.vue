<script setup lang="ts">
/**
 * ReDescriptionsItem —— 描述项（el-descriptions-item 薄封装）
 */
import { ElDescriptionsItem } from "element-plus";

defineOptions({ name: "ReDescriptionsItem", inheritAttrs: true });

withDefaults(
  defineProps<{
    label?: string;
    span?: number;
    minWidth?: string | number;
    align?: "left" | "center" | "right";
    labelAlign?: "left" | "center" | "right";
  }>(),
  {
    label: "",
    span: 1,
    minWidth: undefined,
    align: undefined,
    labelAlign: undefined,
  },
);
</script>

<template>
  <ElDescriptionsItem
    v-bind="$attrs"
    :label="label"
    :span="span"
    :min-width="minWidth"
    :align="align"
    :label-align="labelAlign"
  >
    <slot />
  </ElDescriptionsItem>
</template>