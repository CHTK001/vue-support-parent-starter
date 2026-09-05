<script setup lang="ts">
/**
 * ReRadioButton —— 单选按钮（el-radio-button 封装，配合 ReRadioGroup 使用）
 */
import { ElRadioButton } from "element-plus";

defineOptions({ name: "ReRadioButton", inheritAttrs: true });

withDefaults(
  defineProps<{
    value?: string | number | boolean | object;
    label?: string | number | object;
    disabled?: boolean;
  }>(),
  {
    value: "",
    label: undefined,
    disabled: false,
  },
);
</script>

<template>
  <ElRadioButton v-bind="$attrs" :value="value" :label="label" :disabled="disabled">
    <slot />
  </ElRadioButton>
</template>