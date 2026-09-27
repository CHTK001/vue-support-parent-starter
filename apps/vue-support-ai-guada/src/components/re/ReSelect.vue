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
  options: { type: Array as () => Option[], default: () => [] },
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
  color: #475569;
  letter-spacing: 0.01em;
}

.re-select :deep(.el-select__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  transition: all 0.2s ease;
  background: #ffffff;
  min-height: 36px;
}

.re-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}

.re-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3) inset;
}

.re-select :deep(.el-select__placeholder) {
  color: #94a3b8;
}

.re-select :deep(.el-select__selected-item) {
  color: #1e293b;
  font-size: 14px;
}
</style>
