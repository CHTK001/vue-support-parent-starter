<script setup lang="ts">
/**
 * ReRadioGroup —— 单选组（el-radio-group 封装）
 *
 * 支持 radio / radio-button 两种形式；默认扁平化胶囊样式。
 */
import { ElRadioGroup } from "element-plus";
import "../shared/modern-vars.css";

defineOptions({ name: "ReRadioGroup", inheritAttrs: true });

const model = defineModel<string | number | boolean | undefined>({ default: undefined });

withDefaults(
  defineProps<{
    size?: "large" | "default" | "small";
    disabled?: boolean;
    /** radio-button 样式 */
    button?: boolean;
    /** 胶囊模式：button 时圆角胶囊 */
    capsule?: boolean;
  }>(),
  {
    size: "default",
    disabled: false,
    button: false,
    capsule: true,
  },
);
</script>

<template>
  <ElRadioGroup
    v-model="model"
    v-bind="$attrs"
    :size="size"
    :disabled="disabled"
    class="re-radio-group"
    :class="[`re-radio-group--${size}`, { 're-radio-group--button': button, 're-radio-group--capsule': capsule }]"
  >
    <slot />
  </ElRadioGroup>
</template>

<style scoped>
.re-radio-group {
  display: inline-flex;
  align-items: center;
}

/* radio-button 胶囊：圆角 + 光晕 + 阴影，参考 ReSelect 高度 */
.re-radio-group :deep(.el-radio-button__inner) {
  min-height: var(--rm-height);
  padding: 4px 16px;
  border: 1px solid var(--rm-border);
  border-radius: 0;
  background: color-mix(in srgb, var(--rm-bg) 94%, transparent);
  color: var(--rm-text-regular);
  font-weight: 500;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent);
  transition: all var(--rm-transition);
}

.re-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: var(--rm-radius) 0 0 var(--rm-radius);
}

.re-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 var(--rm-radius) var(--rm-radius) 0;
}

.re-radio-group :deep(.el-radio-button__inner:hover) {
  color: var(--rm-primary);
  border-color: color-mix(in srgb, var(--rm-primary) 30%, var(--rm-border));
}

.re-radio-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: var(--rm-primary-light-9);
  border-color: var(--rm-primary);
  color: var(--rm-primary);
  font-weight: 600;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 2px 8px color-mix(in srgb, var(--rm-primary) 18%, transparent);
}

.re-radio-group :deep(.el-radio-button.is-active .el-radio-button__inner:hover) {
  color: var(--rm-primary);
}

/* 尺寸 small */
.re-radio-group--small :deep(.el-radio-button__inner) {
  min-height: var(--rm-height-sm);
  padding: 2px 12px;
  font-size: var(--rm-font-sm);
}
</style>
