<template>
  <el-tooltip v-if="showTooltip" :content="tooltipText" :placement="tooltipPlacement" :show-after="tooltipShowAfter">
    <div class="sc-progress sc-progress-line" :class="[`text-${textPosition}`]" :style="rootStyle">
      <div v-if="showText && textPosition === 'top'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
      <div class="sc-progress__svg" :style="{ height: `${strokeWidth}px` }">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-label="progress">
          <defs>
            <clipPath :id="outerClipId">
              <rect x="0" y="0" width="100" height="10" rx="5" ry="5" />
            </clipPath>
          </defs>
          <g :clip-path="`url(#${outerClipId})`">
            <!-- 轨道背景 -->
            <rect x="0" y="0" width="100" height="10" :fill="trailColor" />

            <!-- 填充矩形（不含右侧液体cap） -->
            <rect x="0" y="0" :width="fillBaseWidth" height="10" :fill="currentColor" />

            <!-- 右侧液体cap（使用轨道色切割填充，制造液体边缘效果） -->
            <g v-if="clamped > 0" :transform="`translate(${fillCapLeft}, 0)`" opacity="1">
              <path :d="verticalWavePath" :fill="trailColor">
                <animateTransform attributeName="transform" type="translate" from="0 0" to="2 0" dur="2s" repeatCount="indefinite" />
              </path>
            </g>
          </g>
        </svg>
        <div v-if="showText && textPosition === 'inside'" class="sc-progress__text--inside" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
      </div>
      <div v-if="showText && textPosition === 'bottom'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
      <template v-if="textPosition === 'left' || textPosition === 'right'">
        <div v-if="textPosition === 'right'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
        <div v-else class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
      </template>
    </div>
  </el-tooltip>
  <div v-else class="sc-progress sc-progress-line" :class="[`text-${textPosition}`]" :style="rootStyle">
    <div v-if="showText && textPosition === 'top'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
    <div class="sc-progress__svg" :style="{ height: `${strokeWidth}px` }">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-label="progress">
        <defs>
          <clipPath :id="outerClipId">
            <rect x="0" y="0" width="100" height="10" rx="5" ry="5" />
          </clipPath>
        </defs>
        <g :clip-path="`url(#${outerClipId})`">
          <!-- 轨道背景 -->
          <rect x="0" y="0" width="100" height="10" :fill="trailColor" />

          <!-- 填充矩形（不含右侧液体cap） -->
          <rect x="0" y="0" :width="fillBaseWidth" height="10" :fill="currentColor" />

          <!-- 右侧液体cap（使用轨道色切割填充，制造液体边缘效果） -->
          <g v-if="clamped > 0" :transform="`translate(${fillCapLeft}, 0)`" opacity="1">
            <path :d="verticalWavePath" :fill="trailColor">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="2 0" dur="2s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      </svg>
      <div v-if="showText && textPosition === 'inside'" class="sc-progress__text--inside" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
    </div>
    <div v-if="showText && textPosition === 'bottom'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
    <template v-if="textPosition === 'left' || textPosition === 'right'">
      <div v-if="textPosition === 'right'" class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
      <div v-else class="sc-progress__text" :style="{ color: effectiveTextColor }">{{ displayText }}</div>
    </template>
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
  width?: string | number
  strokeWidth?: number
  tooltip?: boolean | string
  tooltipPlacement?: string
  tooltipShowAfter?: number
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  textPosition: 'inside',
  trailColor: '#f5f7fa',
  strokeWidth: 8,
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

const rootStyle = computed(() => ({
  width: props.width != null ? (typeof props.width === 'number' ? `${props.width}px` : String(props.width)) : undefined,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
}))

// 填充矩形宽度（去除右侧cap波形宽度，避免露出直线边）
const capWidth = computed(() => Math.max(1.2, props.strokeWidth * 0.5))
const fillBaseWidth = computed(() => Math.max(0, clamped.value - (clamped.value > 0 ? (capWidth.value / props.strokeWidth) * 10 : 0)))
// cap 左侧相对位置（viewBox 坐标）
const fillCapLeft = computed(() => Math.max(0, clamped.value - (capWidth.value / props.strokeWidth) * 10))

function buildVerticalWavePath(W = 10, H = 10, amp = 3, cycles = 2): string {
  const steps = 24
  const k = cycles * Math.PI * 2
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const y = (H * i) / steps
    const s = Math.sin((k * y) / H)
    const x = W - (amp * (1 + s))
    pts.push(`${Math.max(0, Math.min(W, x)).toFixed(3)} ${y.toFixed(3)}`)
  }
  let d = `M ${W} 0 L ${pts[0]}`
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i]}`
  d += ` L ${W} ${H} Z`
  return d
}

const verticalWavePath = computed(() => buildVerticalWavePath(10, 10, Math.min(4, Math.max(2, props.strokeWidth / 3)), 2))

// tooltip
const showTooltip = computed(() => props.tooltip !== false && props.tooltip !== undefined && props.tooltip !== null)
const tooltipText = computed(() => typeof props.tooltip === 'string' ? props.tooltip : displayText.value)
const tooltipPlacement = computed(() => props.tooltipPlacement || 'top')
const tooltipShowAfter = computed(() => props.tooltipShowAfter || 300)
</script>

<style scoped>
.sc-progress__svg { position: relative; width: 100%; }
.sc-progress__text { font-size: 12px; line-height: 1; }
.sc-progress__text--inside { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; font-size:12px; }
</style>