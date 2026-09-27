<template>
  <div class="re-switch-wrapper">
    <span v-if="label" class="re-switch-label">{{ label }}</span>
    <el-switch
      v-model="switchValue"
      :size="size"
      :disabled="disabled"
      :active-text="activeText"
      :inactive-text="inactiveText"
      @change="$emit('change', $event)"
      class="re-switch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  size: { type: String as PropType<'' | 'small' | 'default' | 'large'>, default: 'default' },
  disabled: { type: Boolean, default: false },
  activeText: { type: String, default: '' },
  inactiveText: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const switchValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped>
.re-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.re-switch-label {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.re-switch :deep(.el-switch__core) {
  border-radius: 20px;
  transition: all 0.3s ease;
}

.re-switch :deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}

.re-switch :deep(.el-switch__core .el-switch__action) {
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
