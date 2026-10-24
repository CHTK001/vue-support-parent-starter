<!--
  ReCanvasTelemetry —— 一行遥测数字

  用 1px 缝隙连成一条，而不是 N 张独立统计卡：这些数字是同一份数据的几个切面，
  分开摆会被读成几个互不相干的对象。宽度用 auto-fit 自动折行，
  页面不必为「三个数字还是六个数字」各写一套栅格。
-->
<template>
  <div class="pk-tele">
    <div v-for="cell in cells" :key="cell.label" class="pk-tele__cell" :class="toneClass(cell)">
      <span class="pk-tele__value">{{ cell.value }}</span>
      <span class="pk-tele__label">{{ cell.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatCell } from './types'

defineProps<{
  /** 遥测格子，按顺序渲染 */
  cells: StatCell[]
}>()

/**
 * 强调色档
 *
 * @param cell 格子
 */
function toneClass(cell: StatCell): string {
  if (cell.tone === 'hot') return 'is-hot'
  if (cell.tone === 'warn') return 'is-warn'
  if (cell.tone === 'bad') return 'is-bad'
  return ''
}
</script>
