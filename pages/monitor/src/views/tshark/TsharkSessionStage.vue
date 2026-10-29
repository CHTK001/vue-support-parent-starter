<!--
  会话列表的节奏视图 —— 抓包分析与 PCAP 分析共用的画布。

  **抽出来的理由**：这两页看的是同一类数据（一次抓包或一次导入就是一个会话），
  差别只在「来源」与「能做什么」。各自写一套就是 2 套，
  键盘可达性、空态引导、分道算法会立刻分叉 —— 正是这次重构要消灭的东西。
  两页各自只保留自己的动作按钮（新增会话 / 导入）与会话详情弹层。

  筛选项由这个组件持有：会话名 / 网卡关键字是两页共同的唯一筛法，
  塞进页面再传进来只会多一层透传。页面若想知道当前筛选结果，用 `filters-change`。

  **不渲染页头**（`no-head`）：两页的标题在标签页与面包屑里已经说过一遍，
  再顶一行「大标题 + 一句说明」只是把控制栏往下推。页面的动作按钮走
  `bar-actions`，与控制栏同处一张卡 —— 这是 RePageStage 约定的位置。

  **只有一个方向：节奏**（时间轴 + 明细表），也不再挂方向坞。
  抓包与导入的会话都带起止时刻，「什么时候抓的、抓了多久」是这两页最该先回答的
  问题；其余四个方向（工单台 / 仪表 / 档案柜 / 卡片墙）只是把同一批会话换个排法，
  摆出来只会让人在「怎么看」上分心。`variant` 固定传 `rhythm`、`variant-items`
  传空数组，方向坞因此整块不渲染 —— 与 ACME 证书页同一套写法。
-->
<template>
  <RePageStage
    variant="rhythm"
    :title="title"
    no-head
    :variant-items="[]"
    :tabs="tabs"
    :tab-value="filters.status"
    :filters="stageFilters"
    :filter-model="filters as unknown as Record<string, string>"
    :count-text="countText"
    :loading="loading"
    refresh-tip="刷新列表"
    @update:tab-value="onTab"
    @filter="(k, v) => (filters[k as 'keyword'] = v)"
    @refresh="emit('refresh')"
  >
    <template v-if="$slots['bar-actions']" #bar-actions>
      <slot name="bar-actions" />
    </template>

    <template v-if="$slots.alerts" #alerts>
      <slot name="alerts" />
    </template>

    <!-- ==================== 节奏：这些抓包落在一天的什么位置 ==================== -->
    <template #rhythm>
      <!-- 没有任何会话时，空轴和「— 的抓包时刻」只是噪音，整段让位给下面的空态表 -->
      <template v-if="days.length">
        <div class="day-picker">
          <button
            v-for="d in days"
            :key="d.dayKey"
            type="button"
            class="day-chip"
            :class="{ 'is-active': d.dayKey === activeDay }"
            :aria-pressed="d.dayKey === activeDay"
            @click="activeDay = d.dayKey"
          >
            {{ dayLabel(d.dayKey) }}
            <span class="day-chip__count">{{ d.count }}</span>
          </button>
        </div>

        <ReCanvasBand
          :items="bandItems"
          :height="axisHeight"
          :ticks="['00', '04', '08', '12', '16', '20', '24']"
          :now-percent="nowPercent"
          :axis-clickable="false"
          @bar-click="(item) => openOf({ id: Number(item.key) }, 'packet')"
        >
          <template #head>
            <span class="band__title">
              {{ activeDay || '—' }} 的抓包时刻
              <span>每根标记是一份会话的开始时刻；时长在下面的表里</span>
            </span>
            <span class="pk-band__legend">
              <span class="pk-band__legend-item">
                <i class="pk-band__legend-chip" :style="{ background: runColor }" />{{ runningLabel }}
              </span>
              <span class="pk-band__legend-item">
                <i class="pk-band__legend-chip" :style="{ background: errColor }" />异常
              </span>
              <span class="pk-band__legend-item">
                <i class="pk-band__legend-chip" :style="{ background: stopColor }" />已停止
              </span>
            </span>
          </template>
        </ReCanvasBand>
      </template>

      <ReCanvasTable
        :rows="dayViews as unknown as Array<Record<string, unknown>>"
        :columns="rhythmCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        :empty-text="tableEmptyText"
        :empty-hint="tableEmptyHint"
        @row-click="(r) => openOf(r, 'packet')"
      >
        <template #cell-name="{ row }">
          <span class="pk-strong pk-ellipsis">{{ viewOf(row).name }}</span>
        </template>
        <template #cell-ifaceText="{ row }">
          <span class="pk-dim pk-ellipsis" :title="viewOf(row).iface">{{ viewOf(row).ifaceText }}</span>
        </template>
        <template #cell-statusText="{ row }">
          <span class="sstate" :class="`is-${viewOf(row).statusTone}`">
            <i class="pk-dot" />{{ statusTextOf(viewOf(row)) }}
          </span>
        </template>
        <template #cell-startText="{ row }">
          <span class="pk-num">{{ viewOf(row).startText }}</span>
        </template>
        <template #cell-durationText="{ row }">
          <span class="pk-num pk-dim">{{ viewOf(row).durationText }}</span>
        </template>
        <template #row-actions="{ row }">
          <TsharkSessionActions
            :session="viewOf(row)"
            :can-stop="canStop"
            @open="(tab) => openOf(row, tab)"
            @download="emit('download', viewOf(row).id, viewOf(row).name)"
            @stop="emit('stop', viewOf(row).id)"
            @remove="emit('remove', viewOf(row).id)"
          />
        </template>
      </ReCanvasTable>
    </template>

  </RePageStage>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ReCanvasBand, ReCanvasTable, RePageStage } from '@repo/ui/components/RePageKit'
import type { BandItem, CanvasColumn, TabItem } from '@repo/ui/components/RePageKit'
import type { TsharkTabKey } from './types'
import TsharkSessionActions from './TsharkSessionActions.vue'
import {
  EMPTY_SESSION_FILTERS,
  countSessions,
  dayLabel,
  filterSessions,
  sessionDays,
  sessionTicks,
  toSessionViews,
  type SessionFilters,
  type SessionRow,
  type SessionView,
  type SessionTone,
} from './sessionView'

const props = withDefaults(
  defineProps<{
    /** 后端会话行（该来源的全量） */
    rows: SessionRow[]
    /** 页面标题（不画在页头，只进控制栏与无障碍标签） */
    title: string
    /** 会话的量词与名词（`抓包会话` / `导入记录`），用于空态与图注文案 */
    noun?: string
    /**
     * 状态码 1 的说法。
     *
     * <p>同一个状态码在两页的意思不同：抓包页是「抓包中」，导入页是「解析中」。
     * 这是数据语义差异，不是配色差异，所以让页面传进来而不是在组件里猜。</p>
     */
    runningLabel?: string
    /** 是否可以停止抓包（导入记录没有这个动作） */
    canStop?: boolean
    /** 搜索框占位文案 */
    searchPlaceholder?: string
    /**
     * 外部受控的搜索词。
     *
     * <p>两页的目录结构不同：抓包分析只有一级（组件不会卸载），PCAP 分析是「目录 / 详情」
     * 两级 —— 进详情时这个组件会整个销毁，搜索词若只存在组件内部，返回目录就丢了，
     * 而用户刚才是「搜到了那一份、点进去看」，回来还得再搜一遍。所以搜索词可以由页面
     * 持有并通过这个属性传回来。</p>
     */
    keyword?: string
    /** 空态主文案；不传按 `还没有{noun}` 生成 */
    emptyText?: string
    /** 空态引导文案 */
    emptyHint?: string
    /** 加载态 */
    loading?: boolean
    /** 网卡友好名解析 */
    ifaceLabel?: (value?: string | null) => string
  }>(),
  {
    noun: '会话',
    runningLabel: '抓包中',
    canStop: false,
    searchPlaceholder: '搜索会话名 / 网卡',
    keyword: '',
    emptyText: '',
    emptyHint: '',
    loading: false,
    ifaceLabel: (value?: string | null) => {
      const text = String(value ?? '')
      if (!text) return '—'
      // Windows 的网卡是 `\Device\NPF_{GUID}`，整串塞进表格会把列撑爆
      const guid = /\{([0-9A-Fa-f-]{8,})\}/.exec(text)
      return guid ? `网卡 {${guid[1]!.slice(0, 8)}…}` : text
    },
  },
)

const emit = defineEmits<{
  /** 打开会话详情并切到某个标签页 */
  (e: 'open', id: number, tab: TsharkTabKey): void
  /** 下载原件 */
  (e: 'download', id: number, name: string): void
  /** 停止抓包 */
  (e: 'stop', id: number): void
  /** 删除 */
  (e: 'remove', id: number): void
  /** 刷新 */
  (e: 'refresh'): void
  /** 搜索词变化（页面可持有它，跨「目录 / 详情」两级时不丢） */
  (e: 'update:keyword', value: string): void
}>()

// ==================== 筛选 ====================

const filters = reactive<SessionFilters>({ ...EMPTY_SESSION_FILTERS, keyword: props.keyword })

// 搜索词双向同步：向外发（页面可记住），也向内收（页面返回目录时把词放回来）
watch(
  () => filters.keyword,
  value => {
    if (value !== props.keyword) emit('update:keyword', value)
  },
)
watch(
  () => props.keyword,
  value => {
    if (value !== filters.keyword) filters.keyword = value
  },
)

const stageFilters = computed(() => [
  { key: 'keyword', kind: 'search' as const, placeholder: props.searchPlaceholder, width: 240 },
])

// ==================== 派生 ====================

const allViews = computed(() =>
  toSessionViews(props.rows, value => props.ifaceLabel(value)),
)

const filtered = computed(() => filterSessions(allViews.value, filters))

const counts = computed(() => countSessions(allViews.value))

const tabs = computed<TabItem[]>(() => [
  { label: '全部', value: '', count: counts.value.total },
  { label: props.runningLabel, value: 'run', count: counts.value.running },
  { label: '已停止', value: 'stop', count: counts.value.stopped },
  { label: '异常', value: 'err', count: counts.value.error },
])

const countText = computed(() =>
  filtered.value.length === allViews.value.length
    ? `共 ${allViews.value.length} 个${props.noun}`
    : `筛选出 ${filtered.value.length} / ${allViews.value.length} 个`,
)

/** 状态档配色（图例、时间带共用一份，免得两处颜色跑偏） */
const runColor = 'var(--el-color-primary)'
const errColor = 'var(--el-color-danger)'
const stopColor = 'var(--el-text-color-disabled)'

/**
 * 状态档 → 颜色
 *
 * @param tone 状态档
 */
function toneColor(tone: SessionTone): string {
  if (tone === 'run') return runColor
  if (tone === 'err') return errColor
  return stopColor
}

/**
 * 状态说法。
 *
 * <p>状态码 1 在两页叫法不同（抓包中 / 解析中），展示处一律过这一道，
 * 免得出现「表里写解析中、图例写抓包中」这种同一状态两种说法。</p>
 *
 * @param view 展示行
 */
function statusTextOf(view: SessionView): string {
  return view.statusCode === 1 ? props.runningLabel : view.statusText
}

// ==================== 时间轴 ====================

const activeDay = ref('')

/** 上一次渲染时的日期键集合，用于识别「冒出新的一天」（跨零点开始的新抓包） */
const prevDayKeys = ref<string[]>([])

const days = computed(() => sessionDays(filtered.value))

// 数据变了以后选中的那天可能已经不在列表里（换了筛选、或当天会话被删），
// 这时退到最近的一天，而不是留着一个空轴。
//
// 另外有一种情况也得切天：新抓包正好跨过零点（比如 00:0x 点「开始抓包」），
// 新会话落在「新的一天」，而选中的还是昨天 —— 昨天的会话仍在列表里，上面的
// 「选中天消失才回退」逻辑不会触发，结果新会话的整行都不渲染，用户以为抓包
// 没开始。这里只在「日期集合真的冒出一个更晚的新天」时切过去（此刻通常是刚
// 开始的新抓包），普通刷新（同一天计数变化）不打扰用户手动选中的天。
watch(
  days,
  list => {
    const keys = list.map(d => d.dayKey)
    if (!list.length) {
      activeDay.value = ''
      prevDayKeys.value = []
      return
    }
    const newest = list[list.length - 1]!.dayKey
    const gainedNewerDay = keys.some(k => !prevDayKeys.value.includes(k) && k > activeDay.value)
    if (gainedNewerDay || !list.some(d => d.dayKey === activeDay.value)) {
      activeDay.value = newest
    }
    prevDayKeys.value = keys
  },
  { immediate: true },
)

const dayViews = computed(() => filtered.value.filter(v => v.dayKey === activeDay.value))

const ticks = computed(() => sessionTicks(dayViews.value, 13))

const bandItems = computed<BandItem[]>(() =>
  ticks.value.map(t => ({
    key: t.id,
    left: t.leftPercent,
    width: 1.2,
    top: t.top,
    color: toneColor(t.statusTone),
    title: `${t.name} · ${t.statusTone === 'run' ? props.runningLabel : t.statusText} · ${t.rangeText}`,
  })),
)

const axisHeight = computed(() => {
  const maxTop = ticks.value.reduce((m, t) => Math.max(m, t.top), 0)
  return Math.max(maxTop + 13 + 6, 30)
})

/** 「现在」线只在看今天时才有意义 */
const nowPercent = computed<number | null>(() => {
  const d = new Date()
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  if (activeDay.value !== key) return null
  return ((d.getHours() + d.getMinutes() / 60) / 24) * 100
})

// ==================== 列 ====================

/**
 * 有没有网卡可展示。
 *
 * <p>导入记录的网卡恒为空 —— 硬留一列会让整列都是「—」，那是纯粹的行高浪费，
 * 也会让人以为「网卡丢了」。没有就整列不出现。</p>
 */
const showIface = computed(() => filtered.value.some(v => v.ifaceText && v.ifaceText !== '—'))

/** 空态主文案 */
const emptyMain = computed(() => props.emptyText || `还没有${props.noun}`)

/**
 * 表格空态：区分「一条会话都没有」和「这一天没有」。
 *
 * <p>整个列表都空时，正确的引导是页面的 empty-hint（去新增会话 / 选文件）；
 * 只有「有会话但今天这一天没有」才该劝用户换日期。</p>
 */
const tableEmptyText = computed(() =>
  days.value.length ? '这一天没有会话' : emptyMain.value,
)

const tableEmptyHint = computed(() =>
  days.value.length ? '换一个日期，或确认抓包是否已经结束并落库。' : props.emptyHint,
)

const rhythmCols = computed<CanvasColumn[]>(() => {
  const cols: CanvasColumn[] = [{ key: 'name', label: '会话', width: 'minmax(0, 1.4fr)' }]
  if (showIface.value) cols.push({ key: 'ifaceText', label: '网卡', width: 'minmax(0, 1fr)' })
  cols.push(
    { key: 'statusText', label: '状态', width: '84px' },
    { key: 'startText', label: '开始', width: '124px' },
    { key: 'durationText', label: '时长', width: '84px', align: 'right' },
  )
  return cols
})

// ==================== 交互 ====================

/**
 * 行键
 *
 * @param row 行
 */
function rowKey(row: Record<string, unknown>): number {
  return Number(row.id)
}

/**
 * 模板里把画布给的行还原成展示行
 *
 * <p>画布只认识 `Record<string, unknown>`，这是刻意的边界；页面侧只需要一次断言，
 * 而不是让画布去认识业务类型。</p>
 *
 * @param row 画布行
 */
function viewOf(row: Record<string, unknown>): SessionView {
  return row as unknown as SessionView
}

/**
 * 打开详情
 *
 * @param row 画布行
 * @param tab 目标标签页
 */
function openOf(row: Record<string, unknown>, tab: TsharkTabKey): void {
  emit('open', Number(row.id), tab)
}

/**
 * 切页签
 *
 * @param value 状态档
 */
function onTab(value: string): void {
  filters.status = value
}
</script>

<style scoped>
/* ===== 状态 ===== */
.sstate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.sstate.is-run .pk-dot {
  background: var(--el-color-primary);
}

.sstate.is-err .pk-dot {
  background: var(--el-color-danger);
}

.sstate.is-err {
  color: var(--el-color-danger);
}

.sstate.is-stop {
  color: var(--el-text-color-secondary);
}

.sstate.is-stop .pk-dot {
  background: var(--el-text-color-disabled);
}

/* ===== 日期选择 ===== */
.day-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: none;
}

.day-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  transition: background var(--el-transition-duration-fast, 0.2s);
}

.day-chip:hover {
  background: var(--el-fill-color);
}

.day-chip.is-active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.day-chip:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.day-chip__count {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.day-chip.is-active .day-chip__count {
  color: var(--el-color-primary);
}

/* ===== 时间带标题 ===== */
.band__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.band__title span {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .day-chip {
    transition: none;
  }
}
</style>
