<template>
  <el-tooltip v-if="showTooltip" :content="tooltipText" :placement="tooltipPlacement" :show-after="tooltipShowAfter">
    <div class="sc-progress sc-progress-el" :class="[`text-${textPosition}`]" :style="rootStyle">
      <el-progress
        :percentage="clamped"
        :stroke-width="strokeWidth"
        :text-inside="textPosition === 'inside' && showText"
        :show-text="textPosition === 'inside' ? showText : false"
        :color="currentColor"
        :status="status"
      />
      <div v-if="showText && textPosition !== 'inside'" class="sc-progress__text" :style="{ color: effectiveTextColor }">
        {{ displayText }}
      </div>
    </div>
  </el-tooltip>
  <div v-else class="sc-progress sc-progress-el" :class="[`text-${textPosition}`]" :style="rootStyle">
    <el-progress
      :percentage="clamped"
      :stroke-width="strokeWidth"
      :text-inside="textPosition === 'inside' && showText"
      :show-text="textPosition === 'inside' ? showText : false"
      :color="currentColor"
      :status="status"
    />
    <div v-if="showText && textPosition !== 'inside'" class="sc-progress__text" :style="{ color: effectiveTextColor }">
      {{ displayText }}
    </div>
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
  status?: 'success' | 'exception' | 'warning'
  tooltip?: boolean | string
  tooltipPlacement?: string
  tooltipShowAfter?: number
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  textPosition: 'inside',
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
  width: props.width != null ? (typeof props.width === 'number' ? `${props.width}px` : String(props.width)) : undefined
}))

const status = computed(() => props.status)

// tooltip
const showTooltip = computed(() => props.tooltip !== false && props.tooltip !== undefined && props.tooltip !== null)
const tooltipText = computed(() => typeof props.tooltip === 'string' ? props.tooltip : displayText.value)
const tooltipPlacement = computed(() => props.tooltipPlacement || 'top')
const tooltipShowAfter = computed(() => props.tooltipShowAfter || 300)
</script>

<style scoped>
.sc-progress__text { font-size: 12px; line-height: 1; margin-top: 6px; }
</style>