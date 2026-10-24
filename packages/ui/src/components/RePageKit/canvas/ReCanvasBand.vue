<!--
  ReCanvasBand —— 「节奏」方向的时间带

  什么时候该用它：数据本身带起止（会话区间 / 维护窗口 / 证书有效期 /
  抓包时长）。这类数据排成平表时，读者要在脑子里把两列时间戳换算成一根线段，
  换算成本全压在读者身上。

  画布负责：轴、刻度、分道结果的定位、当前时刻竖线、点空白处取位置。
  页面负责：把行算成 `BandItem`（左偏移/宽度/道/颜色），以及图例与标题。
  几何换算留在页面侧，是因为「一天是 24 小时还是 7 天」这种口径只有页面知道。
-->
<template>
  <div class="pk-band">
    <div v-if="$slots.head" class="band__head">
      <slot name="head" />
    </div>

    <div
      class="pk-band__axis band__axis"
      :style="{ height: `${height}px` }"
      role="button"
      tabindex="0"
      :aria-label="axisLabel"
      @click="onAxisClick"
    >
      <span
        v-for="item in items"
        :key="item.key"
        class="pk-band__bar"
        :style="{
          left: `${item.left}%`,
          width: `${item.width}%`,
          top: `${item.top}px`,
          background: item.color,
        }"
        :title="item.title"
        @click.stop="emit('bar-click', item)"
      />
      <span v-if="nowPercent !== null" class="pk-band__now" :style="{ left: `${nowPercent}%` }" />
    </div>

    <div v-if="ticks.length" class="pk-band__ticks">
      <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
    </div>

    <div v-if="$slots.legend" class="pk-band__legend">
      <slot name="legend" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BandItem } from './types'

const props = withDefaults(
  defineProps<{
    /** 轴上所有条 */
    items: BandItem[]
    /** 轴高度（px） */
    height?: number
    /** 刻度文案，等距铺开 */
    ticks?: string[]
    /** 「现在」的位置百分比；null 表示不画 */
    nowPercent?: number | null
    /** 点空白处的无障碍说明 */
    axisLabel?: string
  }>(),
  {
    height: 44,
    ticks: () => [],
    nowPercent: null,
    axisLabel: '点击轴上的空白位置以按该时间范围筛选',
  },
)

const emit = defineEmits<{
  /** 点在轴上的相对位置（0~1），页面据此换算成时段 */
  (e: 'axis-click', ratio: number): void
  /** 点中某根条 */
  (e: 'bar-click', item: BandItem): void
}>()

/**
 * 点轴：把坐标换算成 0~1 的比例交给页面。
 *
 * <p>用 offsetX / clientWidth 而不是 clientX 减 getBoundingClientRect().left：
 * 前者就是「相对目标元素内边距」的口径，正是这里要的，也不必读布局。
 * 上界取 0.999 保证比例落在最后一格内，不会因为整除得到 1 而越界。</p>
 *
 * @param event 鼠标事件
 */
function onAxisClick(event: MouseEvent): void {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  const width = el.clientWidth
  if (width <= 0) return
  const ratio = Math.min(Math.max(event.offsetX / width, 0), 0.999)
  emit('axis-click', ratio)
}
</script>

<style scoped>
.band__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 7px;
}

/* 轴本体：crosshair 提示这块可点（点空白按时间筛） */
.band__axis {
  cursor: crosshair;
  outline: none;
}

.band__axis:focus-visible {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

/* 轴上的条是按钮：给手型，否则用户不知道能点 */
:deep(.pk-band__bar) {
  cursor: pointer;
}
</style>
