<script setup lang="ts">
/**
 * ReRadio —— 单选（el-radio 封装）
 */
import { ElRadio } from "element-plus";

defineOptions({ name: "ReRadio", inheritAttrs: true });

withDefaults(
  defineProps<{
    value?: string | number | boolean | object;
    label?: string | number | object;
    disabled?: boolean;
    border?: boolean;
    size?: "large" | "default" | "small";
  }>(),
  {
    value: "",
    label: undefined,
    disabled: false,
    border: false,
    size: "default",
  },
);
</script>

<template>
  <ElRadio v-bind="$attrs" :value="value" :label="label" :disabled="disabled" :border="border" :size="size">
    <slot />
  </ElRadio>
</template>