<template>
  <div class="resource-bar">
    <ScProgress
      type="el"
      :percentage="percentage"
      :show-text="false"
      :stroke-width="strokeWidth"
      :stages="stages"
    />
    <span class="resource-value">{{ formattedValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { ScProgress } from '@repo/components'

interface Props {
  value: number
  type?: 'cpu' | 'memory'
  strokeWidth?: number
}

const props = defineProps<Props>()

const percentage = computed(() => Math.min(100, Math.max(0, props.value)))

const stages = computed(() => {
  if (props.type === 'cpu') {
    return [
      { threshold: 50, color: '#67c23a' },
      { threshold: 80, color: '#e6a23c' },
      { threshold: 100, color: '#f56c6c' }
    ]
  } else if (props.type === 'memory') {
    return [
      { threshold: 60, color: '#67c23a' },
      { threshold: 85, color: '#e6a23c' },
      { threshold: 100, color: '#f56c6c' }
    ]
  }
  return [
    { threshold: 100, color: '#409eff' }
  ]
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
