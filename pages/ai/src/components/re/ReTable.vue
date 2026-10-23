<template>
  <div ref="wrapperRef" class="re-table-wrapper">
    <div v-if="toolbar || $slots.toolbar" class="re-table-toolbar">
      <slot name="toolbar" />
    </div>
    <!--
      本组件是 @repo/ui 的 ReTable（完整版）的**轻量适配层**。

      引擎：默认跟随完整版默认（vxe）。此前这里写死 engine="element"，
      导致 ai 应用里所有表格都是 el-table DOM —— 与「ReTable 默认 vxe」的
      组件库约定相悖，也让 vxe 的固定表头 / 虚拟滚动等能力用不上。
      需要旧行为（依赖 :deep(.el-table …) 覆盖或 el-table 内部结构）时
      仍可显式传 engine="element"。

      分页：**不再自己写** el-pagination。完整版 ReTable 自带 RePagination
      （胶囊分页、越界钳制、切页长回第 1 页都在组件内），本页只需把
      pagination / total / pageSizes 透传下去，并接住分页事件。

      rowStyle：完整版的两个引擎都把 :row-style 绑死为拖拽 cursor，
      消费方的 rowStyle 传不进去 —— 仍在渲染后按行注入（见脚本注释）。
    -->
    <ReTableBase
      :data="data"
      :columns="columns"
      :stripe="stripe"
      :settings="{ border: border, compact: size === 'small' }"
      :loading="loading"
      :empty-text="emptyText"
      :row-key="rowKey as string"
      :show-selection="selectable"
      :show-index="showIndex"
      :engine="engine"
      :pagination="pagination"
      :total="total"
      :page-sizes="pageSizes"
      :max-page-size="maxPageSize"
      :page="page"
      :page-size="pageSize"
      :loader="loader"
      :params="params"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
      @update:page="onPageChange"
      @update:page-size="onSizeChange"
      @selection-change="$emit('selection-change', $event)"
      @row-click="$emit('row-click', $event)"
    >
      <slot />
      <template v-for="name in forwardedSlotNames" :key="name" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps" />
      </template>
      <!--
        空态**不再**在这里写死成一行纯文本。

        完整版 ReTable 在没收到 #empty 时会回落到 el-empty（插图 + 描述 + 加载窗口内
        不渲染）；此前这里硬塞了一个 `<template #empty>{{ emptyText }}</template>`，
        把那条回落路径整个挡住 —— 于是同一个应用里「表格空态是灰字」、
        「别的卡片空态是 el-empty 插图」两种风格并存。现在只透传调用方自己传的
        #empty（见上方的插槽转发），没传就交给组件回落。
      -->
    </ReTableBase>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import { useSlots } from 'vue'
import type { PropType } from 'vue'
import type { ComponentSize } from 'element-plus'
import ReTableBase from '@repo/ui/re-table'
import type { ReTableColumn, ReTableLoader } from '@repo/ui/re-table'

const props = defineProps({
  data: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
  columns: { type: Array as PropType<ReTableColumn[]>, default: () => [] },
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
  /**
   * 渲染引擎。
   *
   * <p>不传时跟随完整版 ReTable 的默认（vxe）。仅当页面确实依赖
   * {@code :deep(.el-table …)} 内部覆盖或 el-table 内部结构时才显式传
   * {@code "element"} —— 那是兼容回退，不是推荐用法。</p>
   */
  engine: { type: String as PropType<'vxe' | 'element' | undefined>, default: undefined },
  /** 是否显示分页（用 ReTable 自带的 RePagination，不再自写 el-pagination） */
  pagination: { type: Boolean, default: false },
  /** 总条数（后端分页时传） */
  total: { type: Number, default: 0 },
  /** 每页条数选项 */
  pageSizes: { type: Array as PropType<number[]>, default: () => [10, 20, 50, 100, 200, 500] },
  /** 每页条数上限（默认 500，与默认档位里最大的一档一致，否则 500 档会被过滤掉） */
  maxPageSize: { type: Number, default: 500 },
  /**
   * 当前页（后端分页的受控值）。
   *
   * <p>不传则分页状态由 ReTable 内部自持（前端分页：组件自己切片）。
   * 传了就是受控：组件只发 {@code update:page}，由页面去取数再回填。</p>
   */
  page: { type: Number, default: undefined },
  /** 每页条数（后端分页的受控值）；不传则由组件自持 */
  pageSize: { type: Number, default: undefined },
  /**
   * 后端分页加载器（可选）。
   *
   * <p><b>后端分页必须走这个</b>：完整版 ReTable 只有在传了 {@code loader} 时
   * 才进入「远程模式」—— 此时它把 {@code data} 视为「当前页的数据」直接渲染，
   * 并用 loader 返回的 total 算页数。若只传 data + total（不传 loader），
   * 它会按前端分页把这份**当前页**数据再切一遍：第 2 页从 20 条里切 20..40，
   * 结果空集或仍是第 1 页 —— 表现为「点了页码没反应」。</p>
   *
   * <p>loader 收到 {@code { page, pageSize, params }}，返回
   * {@code { total, records }}（也兼容 data/rows/list 等字段名）。</p>
   */
  loader: { type: Function as PropType<ReTableLoader | undefined>, default: undefined },
  /** 传给 loader 的附加查询参数 */
  params: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
})

const emit = defineEmits([
  'selection-change', 'row-click', 'size-change', 'current-change',
  'update:page', 'update:pageSize',
])

/* 完整版 ReTable 的分页状态是 v-model:page / v-model:pageSize（内部自持），
   不发 size-change / current-change。这里把它们转成页面熟悉的两个事件，
   让「页面写 @current-change=loadData」这种既有约定继续有效；
   同时把受控值回抛成 update:*，页面可 v-model:page 双向绑定。 */
function onPageChange(page: number) {
  emit('update:page', page)
  emit('current-change', page)
}

function onSizeChange(size: number) {
  emit('update:pageSize', size)
  emit('size-change', size)
}

const slots = useSlots()
/**
 * 需要原样转发给完整版 ReTable 的插槽。
 *
 * <p>{@code empty} 也要转发（不再排除）：调用方传了 #empty 就用它的，
 * 没传则完整版会回落到 el-empty —— 这正是「全应用空态统一」的落点。
 * {@code default} 不转发：它是 ReTableColumn 之类的列声明，跟插槽无关。</p>
 */
const forwardedSlotNames = computed(() =>
  Object.keys(slots).filter((name) => name !== 'default'),
)

/* ===================== rowStyle 等价实现 =====================
 * ReTable（packages/ui）内部把两个引擎的 :row-style 都绑死为拖拽 cursor
 * （非拖拽时为 undefined），显式绑定会覆盖 v-bind="$attrs" 合并进来的
 * row-style，消费方的 rowStyle 传不到表格。
 * 这里在渲染完成后按 data 顺序把 rowStyle 的结果直接写到数据行上，
 * 调用约定与 el-table 一致（element-plus styles-helper：函数形态按
 * rowStyle({ row, rowIndex }) 调用，对象形态逐行套用）。
 * 两套引擎的行 class 不同：element 是 tbody.el-table__body > tr.el-table__row，
 * vxe 是 .vxe-body--row —— 两个都处理，切换引擎不用改这里。
 * 触发时机：挂载后 / data、rowStyle 引用变化（post flush + nextTick）/ 表体 DOM
 * 变化（MutationObserver，覆盖原地排序、行增删等不经本组件渲染的变化）；
 * 写样式只改行内 style 属性，不会反向触发观察器。
 * 注意：样式按 data 顺序映射 DOM 行，若消费方列开启 sortable 且发生前端排序会错位。 */
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

/** 取数据行元素：element 引擎走 tbody，vxe 引擎走 .vxe-body--row */
function dataRowElements(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = []
  root.querySelectorAll('tbody.el-table__body').forEach((tbody) => {
    tbody.querySelectorAll(':scope > tr.el-table__row').forEach((tr) => {
      out.push(tr as HTMLElement)
    })
  })
  root.querySelectorAll('.vxe-body--row').forEach((tr) => {
    out.push(tr as HTMLElement)
  })
  return out
}

function applyRowStyles() {
  const root = wrapperRef.value
  if (!root) return
  const rowsData = props.data || []
  dataRowElements(root).forEach((tr, index) => {
    const row = rowsData[index]
    setRowStyle(
      tr,
      row === undefined ? null : resolveRowStyle(row, index),
    )
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

/* 表格视觉：
   vxe 引擎（默认）自带完整样式，完整版 ReTable 内部已统一处理
   （圆角细描边、渐变表头、行高），此处**不再**用 :deep(.el-table …) 覆盖 ——
   那套选择器只在 下命中，vxe 下是死规则。
   仅当页面显式传 时，才由下面这段兜底还原旧观感。 */
.re-table-wrapper:has(.el-table) :deep(.el-table__header th) {
  background: var(--el-table-header-bg-color, var(--el-fill-color-light));
  color: var(--el-table-header-text-color, var(--el-text-color-secondary));
  font-weight: 600;
  font-size: 13px;
  height: 46px;
}

.re-table-wrapper:has(.el-table) :deep(.el-table__body tr) {
  /* 原 0.15s 偏快，行高 50px 下会显得「闪」；统一到 --el-transition-duration 与其余组件同档 */
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}

.re-table-wrapper:has(.el-table) :deep(.el-table__body td) {
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

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .re-table-wrapper:has(.el-table) :deep(.el-table__body tr) {
    transition: none;
  }
}
</style>
