<!--
  ReCanvasCards —— 「卡片墙」方向的卡片网格

  画布只提供网格、卡片外框、滚动容器与空态；卡片里放什么完全由页面的
  `card` 插槽决定。这是刻意的：卡片墙这个方向的价值就在「把载荷直接摊在卡上」，
  若画布规定卡片结构，各页就只能往同一个模子里塞字段，方向的意义就没了。

  卡片可点（整张可点且键盘可达），也可以在里面放自己的按钮 ——
  内层按钮需要 `@click.stop`，否则会连带触发整卡点击。
-->
<template>
  <div class="pk-grow cards">
    <div v-if="rows.length" class="pk-cards" :style="gridStyle">
      <article
        v-for="row in rows"
        :key="rowKey(row)"
        class="pk-card"
        :class="{ 'is-picked': pickedKey !== undefined && pickedKey === rowKey(row) }"
        :tabindex="clickable ? 0 : undefined"
        :role="clickable ? 'button' : undefined"
        @click="onRow(row)"
        @keydown.enter.prevent="onRow(row)"
        @keydown.space.prevent="onRow(row)"
      >
        <slot name="card" :row="row" />
      </article>
    </div>

    <div v-else class="cards__empty">
      <div class="pk-empty">
        <span>{{ loading ? '正在读取…' : emptyText }}</span>
        <span v-if="!loading && emptyHint" class="pk-empty__hint">{{ emptyHint }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** 行类型 */
type KeyedRow = Record<string, unknown>

const props = defineProps<{
  /** 行数据 */
  rows: KeyedRow[]
  /** 行唯一键 */
  rowKey: (row: KeyedRow) => string | number
  /** 卡片最小宽度（px），默认 220 */
  minWidth?: number
  /** 是否整卡可点 */
  clickable?: boolean
  /** 加载态 */
  loading?: boolean
  /** 空态主文案 */
  emptyText?: string
  /** 空态引导文案 */
  emptyHint?: string
  /** 选中键（用于高亮）；不传表示无选中概念 */
  pickedKey?: string | number
}>()

const emit = defineEmits<{
  (e: 'row-click', row: KeyedRow): void
}>()

const gridStyle = computed(() => ({
  '--pk-card-min': `${props.minWidth ?? 220}px`,
}))

/**
 * 点卡
 *
 * @param row 行
 */
function onRow(row: KeyedRow): void {
  if (!props.clickable) return
  emit('row-click', row)
}
</script>

<style scoped>
/* 网格容器自己滚动：卡片数量可能远超一屏，页面本身不该跟着长 */
.cards {
  overflow: auto;
  padding-right: 2px;
}

.cards__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
