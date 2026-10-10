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
  /* 原值 9px → md 档 */
  padding: 3px; border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
}
.seg-toggle.is-disabled { opacity: 0.5; pointer-events: none; }

.seg-btn {
  display: inline-flex; align-items: center; gap: 6px;
  /* 原值 7px → sm 档 */
  padding: 5px 11px; border: none; border-radius: var(--el-radius-sm, 6px);
  background: transparent; cursor: pointer;
  font-size: 12.5px; font-weight: 600; line-height: 1.2;
  color: var(--el-text-color-secondary);
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.seg-btn:hover { color: var(--el-text-color-primary); }
/* 选中项是「浮起」的当前态，原为双层手写投影，收敛为单层令牌 */
.seg-btn.is-active {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  box-shadow: var(--el-box-shadow-light);
}
.seg-ico { width: 14px; height: 14px; }

/* 动效降级：系统开启「减少动态效果」时，分段按钮的底色/文字/投影直接到位。
   选中的 .seg-btn.is-active 仍保留静态底色与投影，选中态不会因此丢失。 */
@media (prefers-reduced-motion: reduce) {
  .seg-btn {
    transition: none;
  }
}
</style>
