<template>
  <component
    :is="currentComponent || ElFormItem"
    :prop="prop"
    :label="label"
    :label-width="labelWidth"
    :required="required"
    :rules="rules"
    :error="error"
    :show-message="showMessage"
    :inline-message="inlineMessage"
    :size="size"
    :class="`sc-form-item--${theme}`"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
    <template v-if="$slots.error" #error="{ error }">
      <slot name="error" :error="error" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScFormItem 表单项组件
 * 封装 Element Plus FormItem 与 PixelUI PxFormItem
 * 在 data-skin 为 8bit 时自动切换为像素风表单项
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElFormItem } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  prop: {
    type: String,
    default: ""
  },
  label: {
    type: String,
    default: ""
  },
  labelWidth: {
    type: [String, Number],
    default: ""
  },
  required: {
    type: Boolean,
    default: undefined
  },
  rules: {
    type: [Object, Array],
    default: undefined
  },
  error: {
    type: String,
    default: ""
  },
  showMessage: {
    type: Boolean,
    default: true
  },
  inlineMessage: {
    type: Boolean,
    default: false
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  theme: {
    type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info" | "tech">,
    default: "default"
  }
});

const { currentComponent } = useThemeComponent("ElFormItem");


</script>
