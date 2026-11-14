<!--
  上下文构成迷你 treemap（侧栏会话悬停卡用）。

  <p>与「执行轨迹 → 上下文窗口」里的大图同源：都是 breakdown 的五个分类按
  占比铺格子，只是这里固定尺寸、不交互、不显示剩余空间——悬停卡只回答
  「这个会话的上下文被什么占满了」。</p>

  <p>铺格用 {@code @repo/ui/re-chart} 的 {@code layoutTreemap}，保证与面板里的
  大图算法一致（面积 ∝ token），不自己实现一套会走样的布局。</p>
-->
<template>
  <div class="ctm" :style="{ width: `${width}px`, height: `${height}px` }" role="img"
    :aria-label="ariaLabel">
    <div v-for="cell in cells" :key="cell.slice.key" class="ctm__cell" :style="cellStyle(cell)"
      :title="`${cell.slice.label}：${formatTokens(cell.slice.tokens)} token`">
      <span v-if="showLabel(cell)" class="ctm__label">{{ labelOf(cell.slice) }}</span>
    </div>
    <div v-if="!cells.length" class="ctm__empty">暂无上下文统计</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { layoutTreemap, type ContextSlice } from '@repo/ui/re-chart'

interface TreemapItem {
  key: string
  label: string
  tokens: number
  color: string
}

const props = withDefaults(defineProps<{
  items: TreemapItem[]
  width?: number
  height?: number
}>(), {
  width: 264,
  height: 84,
})

const slices = computed<ContextSlice[]>(() =>
  props.items
    .filter((item) => item.tokens > 0)
    .map((item) => ({ key: item.key, label: item.label, tokens: item.tokens }))
    .sort((a, b) => b.tokens - a.tokens),
)

const cells = computed(() => {
  if (!slices.value.length) return []
  return layoutTreemap(slices.value, props.width, props.height)
})

const colorOf = (key: string): string =>
  props.items.find((item) => item.key === key)?.color || 'var(--el-color-primary)'

function cellStyle(cell: { x: number; y: number; w: number; h: number; slice: ContextSlice }) {
  return {
    left: `${cell.x + 1}px`,
    top: `${cell.y + 1}px`,
    width: `${Math.max(0, cell.w - 2)}px`,
    height: `${Math.max(0, cell.h - 2)}px`,
    background: colorOf(cell.slice.key),
  }
}

/** 格子够大才放文字，否则挤成一团反而看不清 */
function showLabel(cell: { w: number; h: number }): boolean {
  return cell.w >= 52 && cell.h >= 18
}

function labelOf(slice: ContextSlice): string {
  return `${slice.label} ${formatTokens(slice.tokens)}`
}

function formatTokens(value: number): string {
  const n = Number(value) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(Math.round(n))
}

const ariaLabel = computed(() =>
  slices.value.length
    ? '上下文构成：' + slices.value.map((s) => `${s.label} ${formatTokens(s.tokens)} token`).join('，')
    : '暂无上下文统计',
)
</script>

<style scoped>
.ctm {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}

.ctm__cell {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 2px;
}

.ctm__label {
  padding: 0 3px;
  font-size: 10px;
  line-height: 1.2;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  user-select: none;
}

.ctm__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
