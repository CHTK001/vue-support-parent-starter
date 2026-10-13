<!--
  临时占位组件：DisplaySettings.vue 引用的分段开关在当前工作区缺失，
  导致 Vite 无法解析 import，整个应用加载失败。先放一个最小占位以解除阻塞，
  待用户补齐真实 SegmentedToggle 后删除本文件。
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: string
  options?: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const active = computed(() => props.modelValue)
</script>

<template>
  <div class="segmented-toggle">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="segmented-toggle__item"
      :class="{ 'is-active': active === opt.value }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 2px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 6px;
}
.segmented-toggle__item {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular, #606266);
}
.segmented-toggle__item.is-active {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
</style>
