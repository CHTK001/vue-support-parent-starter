<script setup lang="ts">
/**
 * ReOption —— 下拉选项（el-option 薄封装）
 *
 * 直接透传 el-option 全部能力，常用于 ReSelect 默认布局中的插槽选项。
 */
import { ElOption } from "element-plus";

defineOptions({ name: "ReOption", inheritAttrs: true });

withDefaults(
  defineProps<{
    value?: string | number | boolean | object;
    label?: string | number;
    disabled?: boolean;
  }>(),
  {
    value: undefined,
    label: undefined,
    disabled: false,
  },
);
</script>

<template>
  <ElOption v-bind="$attrs" :value="value" :label="label" :disabled="disabled">
    <slot />
  </ElOption>
</template>
