<template>
  <div class="resource-bar system-container modern-bg">
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

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


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


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
