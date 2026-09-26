<template>
  <div class="seg-toggle" :class="{ 'is-disabled': disabled }">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="seg-btn"
      :class="{ 'is-active': modelValue === option.value }"
      @click="emit('update:modelValue', option.value)"
    >
      <component v-if="option.icon" :is="option.icon" class="seg-ico" />
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface SegmentedOption {
  label: string
  value: string | number | boolean
  icon?: any
}

defineProps<{
  modelValue: string | number | boolean
  options: SegmentedOption[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean]
}>()
</script>

<style scoped>
.seg-toggle {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 3px; border-radius: 9px;
  background: var(--el-fill-color-light);
}
.seg-toggle.is-disabled { opacity: 0.5; pointer-events: none; }

.seg-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; border: none; border-radius: 7px;
  background: transparent; cursor: pointer;
  font-size: 12.5px; font-weight: 600; line-height: 1.2;
  color: var(--el-text-color-secondary);
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.seg-btn:hover { color: var(--el-text-color-primary); }
.seg-btn.is-active {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
}
.seg-ico { width: 14px; height: 14px; }
</style>
