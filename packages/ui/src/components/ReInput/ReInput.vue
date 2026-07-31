<script setup lang="ts">
/**
 * ReInput —— 输入框组件
 *
 * 透传 el-input 全部能力（v-model + 所有 props / slots）。
 */
import { ElInput } from "element-plus";

defineOptions({ name: "ReInput", inheritAttrs: true });

const model = defineModel<string | number | null>({ default: "" });

defineProps<{
  type?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  showPassword?: boolean;
  maxlength?: number | string;
  rows?: number | string;
  autosize?: boolean | { minRows: number; maxRows: number };
  size?: "large" | "default" | "small";
}>();
</script>

<template>
  <ElInput v-model="model" v-bind="$attrs" />
</template>
