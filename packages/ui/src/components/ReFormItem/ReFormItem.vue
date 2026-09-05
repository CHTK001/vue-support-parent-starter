<script setup lang="ts">
/**
 * ReFormItem —— 表单项（el-form-item 薄封装）
 *
 * 透传 el-form-item 全部能力（label/prop/required/rules 等），
 * 统一表单项外观：label 加粗、错误提示常规间距。
 */
import { ElFormItem } from "element-plus";

defineOptions({ name: "ReFormItem", inheritAttrs: true });

withDefaults(
  defineProps<{
    prop?: string;
    label?: string;
    required?: boolean;
    labelWidth?: string | number;
    error?: string;
    showMessage?: boolean;
    size?: "large" | "default" | "small";
  }>(),
  {
    prop: "",
    label: "",
    required: false,
    labelWidth: undefined,
    error: "",
    showMessage: true,
    size: undefined,
  },
);
</script>

<template>
  <ElFormItem v-bind="$attrs" :prop="prop" :label="label" :required="required" :label-width="labelWidth" :error="error" :show-message="showMessage" :size="size" class="re-form-item">
    <slot />
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
    <template v-if="$slots.error" #error>
      <slot name="error" />
    </template>
  </ElFormItem>
</template>

<style scoped>
.re-form-item :deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
