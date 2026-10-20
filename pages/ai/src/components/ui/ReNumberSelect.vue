<template>
  <el-input-number
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :precision="precision"
    :disabled="disabled"
    :controls-position="controlsPosition"
    :placeholder="placeholder"
    :size="size"
    class="re-number-select"
    @update:model-value="handleUpdate"
    @change="emit('change', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>

<script setup lang="ts">
import type { ComponentSize } from 'element-plus'

withDefaults(defineProps<{
  modelValue?: number | null
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  controlsPosition?: 'right' | ''
  placeholder?: string
  size?: ComponentSize | ''
}>(), {
  modelValue: null,
  min: undefined,
  max: undefined,
  step: 1,
  precision: undefined,
  disabled: false,
  controlsPosition: 'right',
  placeholder: '',
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  change: [value: number | null]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

function handleUpdate(value: number | undefined | null) {
  emit('update:modelValue', value ?? null)
}
</script>

<style scoped>
/* 与 ui 组件统一：1px inset 描边、不加投影、聚焦使用内描边高亮 */
.re-number-select :deep(.el-input__wrapper) {
  border-radius: var(--el-radius-md, 8px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  transition: box-shadow var(--el-transition-duration-fast, 0.2s) ease;
  background: var(--el-bg-color);
}

.re-number-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.re-number-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 30%, transparent) inset;
}

.re-number-select {
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .re-number-select :deep(.el-input__wrapper) {
    transition: none;
  }
}
</style>
