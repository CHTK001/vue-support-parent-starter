<template>
  <div ref="wrapperRef" class="re-table-wrapper">
    <div v-if="toolbar || $slots.toolbar" class="re-table-toolbar">
      <slot name="toolbar" />
    </div>
    <!--
      2026-10-11 机械换算：原生 el-table 元素 → @repo/ui 的 ReTable（engine="element"，DOM 与原生 el-table 一致）。
      - 列仍由消费方以 <el-table-column> 经默认插槽透传（ReTable element 分支会把默认插槽放进 ElTable 内）。
      - row-style 无法下传：ReTable 内部把 :row-style 绑死为拖拽 cursor，会覆盖 $attrs，
        消费方的 rowStyle 改由下方 applyRowStyles 在渲染后按行注入，语义等价（见脚本注释）。
      - 空态用 #empty 插槽保留原 el-table 的纯文本形态，避免回落到 ReTable 默认的 el-empty 卡片。
    -->
    <ReTableBase
      :data="data"
      :stripe="stripe"
      :settings="{ border: border, compact: size === 'small' }"
      :loading="loading"
      :empty-text="emptyText"
      :row-key="rowKey as string"
      :show-selection="selectable"
      :show-index="showIndex"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
      @selection-change="$emit('selection-change', $event)"
      @row-click="$emit('row-click', $event)"
    >
      <slot />
      <template #empty>{{ emptyText }}</template>
    </ReTableBase>
    <div v-if="pagination" class="re-table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('current-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'
import ReTableBase from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'

const props = defineProps({
  data: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
  stripe: { type: Boolean, default: true },
  border: { type: Boolean, default: false },
  size: { type: String as PropType<ComponentSize | ''>, default: 'default' },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  rowKey: {
    type: [String, Function] as PropType<
      string | ((row: Record<string, any>) => string)
    >,
    default: 'id',
  },
  rowStyle: {
    type: [Object, Function] as PropType<
      Record<string, any> | ((row: Record<string, any>) => Record<string, any>)
    >,
    default: () => ({}),
  },
  selectable: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: true },
  toolbar: { type: Boolean, default: false },
  pagination: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array as PropType<number[]>, default: () => [20, 50, 100] },
})

const emit = defineEmits([
  'selection-change', 'row-click', 'size-change', 'current-change',
  'update:current-page', 'update:page-size'
])

const currentPage = ref(1)
const pageSize = ref(50)

/* ===================== rowStyle 等价实现 =====================
 * ReTable（packages/ui）内部把 ElTable 的 :row-style 绑死为拖拽 cursor（非拖拽时为 undefined），
 * 显式绑定会覆盖 v-bind="$attrs" 合并进来的 row-style，消费方的 rowStyle 传不到 el-table。
 * 这里在渲染完成后按 data 顺序把 rowStyle 的结果直接写到
 * tbody.el-table__body > tr.el-table__row 的行内样式上，调用约定与 el-table 一致
 * （element-plus styles-helper：函数形态按 rowStyle({ row, rowIndex }) 调用，对象形态逐行套用）。
 * 触发时机：挂载后 / data、rowStyle 引用变化（post flush + nextTick）/ 表体 DOM 变化（MutationObserver，
 * 覆盖原地排序、行增删等不经本组件渲染的变化）；写样式只改行内 style 属性，不会反向触发观察器。
 * 注意：样式按 data 顺序映射 DOM 行，若消费方列开启 sortable 且发生前端排序会错位（当前无此用法）。 */
const wrapperRef = ref<HTMLElement | null>(null)
let rowStyleObserver: MutationObserver | null = null
let rowStyleScheduled = false

function resolveRowStyle(
  row: Record<string, any>,
  rowIndex: number,
): Record<string, any> | null {
  if (typeof props.rowStyle === 'function') {
    return props.rowStyle({ row, rowIndex }) || null
  }
  return props.rowStyle || null
}

function setRowStyle(tr: HTMLElement, style: Record<string, any> | null) {
  tr.style.cssText = ''
  if (!style) return
  for (const key of Object.keys(style)) {
    const value = style[key]
    if (value == null) continue
    const str = String(value)
    if (key.startsWith('--')) {
      tr.style.setProperty(key, str)
      continue
    }
    const camel = key.includes('-')
      ? key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
      : key
    if (camel in tr.style) {
      ;(tr.style as unknown as Record<string, string>)[camel] = str
    } else {
      tr.style.setProperty(key, str)
    }
  }
}

function applyRowStyles() {
  const root = wrapperRef.value
  if (!root) return
  const rowsData = props.data || []
  root.querySelectorAll('tbody.el-table__body').forEach((tbody) => {
    tbody.querySelectorAll(':scope > tr.el-table__row').forEach((tr, index) => {
      const row = rowsData[index]
      setRowStyle(
        tr as HTMLElement,
        row === undefined ? null : resolveRowStyle(row, index),
      )
    })
  })
}

function scheduleRowStyles() {
  if (rowStyleScheduled) return
  rowStyleScheduled = true
  nextTick(() => {
    rowStyleScheduled = false
    applyRowStyles()
  })
}

watch([() => props.data, () => props.rowStyle], scheduleRowStyles, { flush: 'post' })

onMounted(() => {
  applyRowStyles()
  if (typeof MutationObserver !== 'undefined' && wrapperRef.value) {
    rowStyleObserver = new MutationObserver(scheduleRowStyles)
    rowStyleObserver.observe(wrapperRef.value, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }
})

onBeforeUnmount(() => {
  rowStyleObserver?.disconnect()
  rowStyleObserver = null
})
</script>

<style scoped>
.re-table-wrapper {
  background: transparent;
  /* 原 var(--mp-radius, 12px) 里的 --mp-radius 不是 koi 令牌（永远取不到），统一到 --el-radius-lg */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}

.re-table-toolbar {
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-fill-color-light);
}

/* 2026-10-11：原 `.re-table :deep(.el-table) { background: transparent; --el-table-bg-color: transparent;
   --el-table-tr-bg-color: transparent; }` 已删除。换算前 .re-table 就是 el-table 根元素自身，
   该后代选择器匹配不到任何元素（死规则）；换算后 .re-table 变成 ReTable 的外层 div，
   这条规则会被意外激活（表体变透明），为保持视觉零回归故删除。 */

.re-table :deep(.el-table__header th) {
  background: var(--el-table-header-bg-color, var(--el-fill-color-light));
  color: var(--el-table-header-text-color, var(--el-text-color-secondary));
  font-weight: 600;
  font-size: 13px;
  height: 46px;
}

.re-table :deep(.el-table__body tr) {
  /* 原 0.15s 偏快，行高 50px 下会显得「闪」；统一到 --el-transition-duration 与其余组件同档 */
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}

.re-table :deep(.el-table__body td) {
  height: 50px;
  font-size: 13.5px;
  color: var(--el-table-text-color, var(--el-text-color-regular));
  border-bottom-color: var(--el-border-color-lighter);
}

.re-table-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.re-table-pagination {
  padding: 14px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
  background: var(--el-fill-color-light);
}

.re-table-pagination :deep(.el-pagination) {
  --el-pagination-hover-color: var(--el-color-primary);
}

.re-table-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-table :deep(.el-table__body tr) {
    transition: none;
  }
}
</style>
