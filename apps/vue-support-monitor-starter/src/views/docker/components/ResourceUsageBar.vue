<template>
  <div class="resource-bar">
    <el-progress 
      :percentage="percentage" 
      :show-text="false" 
      :stroke-width="strokeWidth"
      :color="color"
    />
    <span class="resource-value">{{ formattedValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'

interface Props {
  value: number
  type?: 'cpu' | 'memory'
  strokeWidth?: number
}

const props = defineProps<Props>()

const percentage = computed(() => Math.min(100, Math.max(0, props.value)))

const color = computed(() => {
  if (props.type === 'cpu') {
    if (props.value < 50) return '#67c23a'
    if (props.value < 80) return '#e6a23c'
    return '#f56c6c'
  } else if (props.type === 'memory') {
    if (props.value < 60) return '#67c23a'
    if (props.value < 85) return '#e6a23c'
    return '#f56c6c'
  }
  return '#409eff'
})

const formattedValue = computed(() => `${props.value.toFixed(1)}%`)

const strokeWidth = computed(() => props.strokeWidth || 6)
</script>

<style scoped>
.resource-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-value {
  font-size: 12px;
  color: #606266;
  width: 40px;
  text-align: right;
}
</style>