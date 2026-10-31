<template>
  <div class="re-input-wrapper">
    <label v-if="label" class="re-input-label">{{ label }}</label>
    <ReInputBase
      :model-value="inputValue"
      @update:model-value="onUpdate"
      :placeholder="placeholder"
      :size="size || undefined"
      :disabled="disabled"
      :clearable="clearable"
      :show-password="showPassword"
      :type="type"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      @change="$emit('change', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    />
    <span v-if="error" class="re-input-error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'
import ReInputBase from '@repo/ui/re-input'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '请输入' },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  showPassword: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  prefixIcon: { type: [String, Object], default: undefined },
  suffixIcon: { type: [String, Object], default: undefined },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur'])

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function onUpdate(val: string | number | null | undefined) {
  inputValue.value = val as never
}
</script>

<style scoped>
.re-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.re-input-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  letter-spacing: 0.01em;
}

/* 输入框三态：常态 / 悬浮 / 聚焦，全部用 1px inset 描边表达，
   不加投影（koi 规约）；聚焦环是允许的第二类阴影，保留原来的内描边形态 */
.re-input-wrapper :deep(.el-input__wrapper) {
  border-radius: var(--el-radius-md, 8px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
  background: var(--el-bg-color);
  padding: 0 14px;
}

.re-input-wrapper :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.re-input-wrapper :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 30%, transparent) inset;
}

.re-input-wrapper :deep(.el-input__inner) {
  height: 36px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.re-input-wrapper :deep(.el-input__inner::placeholder) {
  color: var(--el-text-color-placeholder);
}

.re-input-error {
  font-size: 12px;
  color: var(--el-color-danger);
  margin-top: 2px;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-input-wrapper :deep(.el-input__wrapper) {
    transition: none;
  }
}
</style>