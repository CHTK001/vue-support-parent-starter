<!--
  ReCanvasTable —— 「工单台 / 节奏」两个方向共用的密集表

  为什么不用 ReTable：这两个方向的表格需要「整行可点 + 行尾操作 + 行高 38px +
  列宽完全由页面掌控」；el-table 的单元格内边距与固定行高会把 38px 的行撑到 44px 以上，
  而这三件事恰好是「一屏多两行」的全部来源。代价是没有内置分页 ——
  但这几个页面的规模都是「一天几百条」，滚动比翻页快。

  列由页面声明（key / label / width），单元格用具名插槽 `cell-<key>` 提供，
  因此画布完全不认识业务字段。行尾操作统一走 `row-actions` 插槽：
  给了这个插槽，画布会自动在末尾补一列「操作」，列宽也一并进 grid，
  页面不必自己数一遍列数。
-->
<template>
  <div class="pk-table pk-grow">
    <div class="pk-cells pk-hd" :style="gridStyle">
      <span v-for="col in allColumns" :key="col.key" :style="alignStyle(col)">{{ col.label }}</span>
    </div>

    <div class="pk-table__scroll">
      <div
        v-for="row in rows"
        :key="rowKey(row)"
        class="pk-cells pk-tr"
        :class="{ 'is-clickable': clickable }"
        :style="gridStyle"
        :tabindex="clickable ? 0 : undefined"
        :role="clickable ? 'button' : undefined"
        @click="onRow(row)"
        @keydown.enter.prevent="onRow(row)"
        @keydown.space.prevent="onRow(row)"
      >
        <div
          v-for="col in columns"
          :key="col.key"
          :style="alignStyle(col)"
          style="min-width: 0"
        >
          <slot :name="`cell-${col.key}`" :row="row" :value="cellValue(row, col.key)">
            {{ cellText(row, col.key) }}
          </slot>
        </div>
        <div v-if="hasActions" class="pk-ops" @click.stop>
          <slot name="row-actions" :row="row" />
        </div>
      </div>

      <div v-if="!rows.length" class="pk-empty">
        <span>{{ loading ? '正在读取…' : emptyText }}</span>
        <span v-if="!loading && emptyHint" class="pk-empty__hint">{{ emptyHint }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import {
  cellText,
  cellValue,
  gridTemplate,
  minTableWidth,
  type CanvasColumn,
} from './types'

/** 行类型：只要是个对象就行，取不到键时画布给空串 */
type KeyedRow = Record<string, unknown>

const props = defineProps<{
  /** 行数据 */
  rows: KeyedRow[]
  /** 列定义 */
  columns: CanvasColumn[]
  /** 行唯一键 */
  rowKey: (row: KeyedRow) => string | number
  /** 是否整行可点 */
  clickable?: boolean
  /** 加载态 */
  loading?: boolean
  /** 空态主文案 */
  emptyText?: string
  /** 空态引导文案 */
  emptyHint?: string
}>()

const emit = defineEmits<{
  (e: 'row-click', row: KeyedRow): void
}>()

const slots = useSlots()

/** 页面是否提供了行尾操作 */
const hasActions = computed(() => Boolean(slots['row-actions']))

/**
 * 参与 grid 列定义的完整列表。
 *
 * <p>有行尾操作时补一列，否则表头列数会少于每行实际渲染的单元格数，
 * grid 会自动多出一列把内容挤歪。</p>
 */
const allColumns = computed<CanvasColumn[]>(() =>
  hasActions.value
    ? [...props.columns, { key: '__actions', label: '操作', width: '116px', align: 'right' }]
    : props.columns,
)

const gridStyle = computed(() => ({
  '--pk-cols': gridTemplate(allColumns.value),
  '--pk-min-w': `${minTableWidth(allColumns.value)}px`,
}))

/**
 * 列对齐
 *
 * @param col 列
 */
function alignStyle(col: CanvasColumn): Record<string, string> {
  return col.align && col.align !== 'left' ? { textAlign: col.align } : {}
}

/**
 * 点行
 *
 * @param row 行
 */
function onRow(row: KeyedRow): void {
  if (!props.clickable) return
  emit('row-click', row)
}
</script>
