<template>
  <el-tooltip v-if="showTooltip" :content="tooltipText" :placement="tooltipPlacement" :show-after="tooltipShowAfter">
    <div class="sc-progress sc-progress-liquid" :class="[`text-${textPosition}`]" :style="{ width: `${size}px` }">
      <svg :width="size" :height="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="progress">
        <defs>
          <clipPath :id="clipId">
            <circle cx="50" cy="50" :r="radius" />
          </clipPath>
        </defs>

        <g :clip-path="`url(#${clipId})`">
          <!-- 背景 -->
          <rect x="0" y="0" width="100" height="100" :fill="trailColor" />

          <!-- 液面填充层 -->
          <rect x="0" :y="100 - clamped" width="100" :height="clamped" :fill="currentColor" />

          <!-- 波浪层 1 -->
          <g opacity="0.4">
            <path :d="wavePath(100 - clamped, 4, 25)" :fill="currentColor">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="25 0" dur="2s" repeatCount="indefinite" />
            </path>
          </g>
          <!-- 波浪层 2 -->
          <g opacity="0.6">
            <path :d="wavePath(100 - clamped + 1.5, 3, 20)" :fill="currentColor">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="20 0" dur="3s" repeatCount="indefinite" />
            </path>
          </g>
        </g>

        <!-- 外环描边 -->
        <circle cx="50" cy="50" :r="radius" :stroke="ringColor" :stroke-width="ringWidth" fill="none" />

        <!-- 文本 -->
        <template v-if="showText">
          <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" :fill="effectiveTextColor" :font-size="fontSize">
            {{ displayText }}
          </text>
        </template>
      </svg>
    </div>
  </el-tooltip>
  <div v-else class="sc-progress sc-progress-liquid" :class="[`text-${textPosition}`]" :style="{ width: `${size}px` }">
    <svg :width="size" :height="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="progress">
      <defs>
        <clipPath :id="clipId">
          <circle cx="50" cy="50" :r="radius" />
        </clipPath>
      </defs>

      <g :clip-path="`url(#${clipId})`">
        <!-- 背景 -->
        <rect x="0" y="0" width="100" height="100" :fill="trailColor" />

        <!-- 液面填充层 -->
        <rect x="0" :y="100 - clamped" width="100" :height="clamped" :fill="currentColor" />

        <!-- 波浪层 1 -->
        <g opacity="0.4">
          <path :d="wavePath(100 - clamped, 4, 25)" :fill="currentColor">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="25 0" dur="2s" repeatCount="indefinite" />
          </path>
        </g>
        <!-- 波浪层 2 -->
        <g opacity="0.6">
          <path :d="wavePath(100 - clamped + 1.5, 3, 20)" :fill="currentColor">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="20 0" dur="3s" repeatCount="indefinite" />
          </path>
        </g>
      </g>

      <!-- 外环描边 -->
      <circle cx="50" cy="50" :r="radius" :stroke="ringColor" :stroke-width="ringWidth" fill="none" />

      <!-- 文本 -->
      <template v-if="showText">
        <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" :fill="effectiveTextColor" :font-size="fontSize">
          {{ displayText }}
        </text>
      </template>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Stage {
  threshold: number
  color: string
}

interface Props {
  percentage: number
  showText?: boolean
  textPosition?: 'inside' | 'top' | 'bottom' | 'left' | 'right'
  textColor?: string
  valueColor?: string
  valueFormat?: (p: number) => string
  trailColor?: string
  color?: string
  stages?: Stage[]
  size?: number
  ringColor?: string
  ringWidth?: number
  radius?: number
  fontSize?: number
  tooltip?: boolean | string
  tooltipPlacement?: string
  tooltipShowAfter?: number
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  textPosition: 'inside',
  trailColor: '#f5f7fa',
  size: 120,
  radius: 48,
  ringColor: 'var(--el-border-color, #dcdfe6)',
  ringWidth: 2,
  fontSize: 18,
  tooltip: false,
  tooltipPlacement: 'top',
  tooltipShowAfter: 300
})

const clamped = computed(() => Math.max(0, Math.min(100, props.percentage ?? 0)))
const stagesSorted = computed(() => {
  if (!props.stages || props.stages.length === 0) return [] as Stage[]
  return [...props.stages].sort((a, b) => a.threshold - b.threshold)
})

const currentColor = computed(() => {
  const p = clamped.value
  if (stagesSorted.value.length) {
    for (const s of stagesSorted.value) {
      if (p <= s.threshold) return s.color
    }
    return stagesSorted.value[stagesSorted.value.length - 1].color
  }
  return props.color || '#409eff'
})

const effectiveTextColor = computed(() => props.valueColor || props.textColor || 'var(--el-text-color-primary, #303133)')
const displayText = computed(() => props.valueFormat ? props.valueFormat(clamped.value) : `${Math.round(clamped.value)}%`)

const ringColor = computed(() => props.ringColor)
const ringWidth = computed(() => props.ringWidth)
const radius = computed(() => props.radius)
const fontSize = computed(() => props.fontSize)
const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`

function wavePath(y: number, amp = 4, waveLen = 25): string {
  const startY = Math.max(0, Math.min(100, y))
  let d = `M 0 ${startY}`
  let x = 0
  while (x <= 100 + waveLen) {
    const mid = x + waveLen / 2
    const next = x + waveLen
    d += ` Q ${mid} ${startY - amp} ${next} ${startY}`
    x = next
  }
  d += ` L 100 100 L 0 100 Z`
  return d
}

// tooltip
const showTooltip = computed(() => props.tooltip !== false && props.tooltip !== undefined && props.tooltip !== null)
const tooltipText = computed(() => typeof props.tooltip === 'string' ? props.tooltip : displayText.value)
const tooltipPlacement = computed(() => props.tooltipPlacement || 'top')
const tooltipShowAfter = computed(() => props.tooltipShowAfter || 300)
</script>

<style scoped>
.sc-progress-liquid { display: inline-block; }
</style>