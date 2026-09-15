<template>
  <div class="re-input-wrapper">
    <label v-if="label" class="re-input-label">{{ label }}</label>
    <el-input
      v-model="inputValue"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      :clearable="clearable"
      :show-password="showPassword"
      :type="type"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      @input="$emit('update:modelValue', $event)"
      @change="$emit('change', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
      class="re-input"
    />
    <span v-if="error" class="re-input-error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '请输入' },
  size: { type: String, default: 'default' },
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
  color: #475569;
  letter-spacing: 0.01em;
}

.re-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  transition: all 0.2s ease;
  background: #ffffff;
  padding: 0 14px;
}

.re-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}

.re-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3) inset;
}

.re-input :deep(.el-input__inner) {
  height: 36px;
  font-size: 14px;
  color: #1e293b;
}

.re-input :deep(.el-input__inner::placeholder) {
  color: #94a3b8;
}

.re-input-error {
  font-size: 12px;
  color: #ef4444;
  margin-top: 2px;
}
</style>
