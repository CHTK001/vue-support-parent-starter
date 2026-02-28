<template>
  <component
    :is="currentComponent || ElForm"
    ref="formRef"
    :model="model"
    :rules="rules"
    :inline="inline"
    :label-position="labelPosition"
    :label-width="labelWidth"
    :label-suffix="labelSuffix"
    :hide-required-asterisk="hideRequiredAsterisk"
    :show-message="showMessage"
    :inlineMessage="inlineMessage"
    :status-icon="statusIcon"
    :validate-on-rule-change="validateOnRuleChange"
    :scroll-into-view-options="scrollIntoViewOptions"
    :size="size"
    :disabled="disabled"
    :class="`sc-form--${theme}`"
    @validate="handleValidate"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScForm 表单容器组件
 * 封装 Element Plus Form 与 PixelUI PxForm
 * 在 data-skin 为 8bit 时自动切换为像素风表单
 */
import { computed, ref } from "vue";
import type { PropType } from "vue";
import { ElForm } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  model: {
    type: Object,
    required: false,
    default: () => ({})
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  inline: {
    type: Boolean,
    default: false
  },
  labelPosition: {
    type: String as PropType<"left" | "right" | "top">,
    default: "right"
  },
  labelWidth: {
    type: [String, Number],
    default: ""
  },
  labelSuffix: {
    type: String,
    default: ""
  },
  hideRequiredAsterisk: {
    type: Boolean,
    default: false
  },
  showMessage: {
    type: Boolean,
    default: true
  },
  inlineMessage: {
    type: Boolean,
    default: false
  },
  statusIcon: {
    type: Boolean,
    default: false
  },
  validateOnRuleChange: {
    type: Boolean,
    default: true
  },
  scrollIntoViewOptions: {
    type: [Boolean, Object],
    default: true
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String as PropType<"default" | "primary" | "success" | "warning" | "danger" | "info" | "tech">,
    default: "default"
  }
});

const emit = defineEmits(["validate"]);

const formRef = ref();

const { currentComponent } = useThemeComponent("ElForm");



const handleValidate = (prop: string, isValid: boolean, message: string) => {
  emit("validate", prop, isValid, message);
};

// 暴露表单方法
const validate = async () => {
  return formRef.value?.validate();
};

const validateField = async (props: string | string[]) => {
  return formRef.value?.validateField(props);
};

const resetFields = () => {
  formRef.value?.resetFields();
};

const scrollToField = (prop: string) => {
  formRef.value?.scrollToField(prop);
};

const clearValidate = (props?: string | string[]) => {
  formRef.value?.clearValidate(props);
};

defineExpose({
  validate,
  validateField,
  resetFields,
  scrollToField,
  clearValidate,
  formRef
});
</script>
