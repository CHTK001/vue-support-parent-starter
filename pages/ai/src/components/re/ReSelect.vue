<template>
  <div class="re-select-wrapper">
    <label v-if="label" class="re-select-label">{{ label }}</label>
    <el-select
      v-model="selectValue"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      :clearable="clearable"
      :filterable="filterable"
      :multiple="multiple"
      :collapse-tags="multiple && collapseTags"
      class="re-select"
      @change="$emit('change', $event)"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        :disabled="item.disabled"
      />
      <slot />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'

interface Option {
  label: string
  /** 选项值：el-option 的 value 与 v-for key 均以此为准，故须为可索引类型 */
  value: string | number
  disabled?: boolean
}

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Boolean] as PropType<
      string | number | boolean | (string | number)[]
    >,
    default: '',
  },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '请选择' },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  filterable: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  collapseTags: { type: Boolean, default: true },
  options: { type: Array as PropType<Option[]>, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'change'])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped>
.re-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.re-select-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  letter-spacing: 0.01em;
}

/* 与 ReInput 保持同一套三态写法：常态 / 悬浮 / 聚焦，都是 1px inset 描边，不加投影 */
.re-select :deep(.el-select__wrapper) {
  border-radius: var(--el-radius-md, 8px);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
  background: var(--el-bg-color);
  min-height: 36px;
}

.re-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.re-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 30%, transparent) inset;
}

.re-select :deep(.el-select__placeholder) {
  color: var(--el-text-color-placeholder);
}

.re-select :deep(.el-select__selected-item) {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-select :deep(.el-select__wrapper) {
    transition: none;
  }
}
</style>
