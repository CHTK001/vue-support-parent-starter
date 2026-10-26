<!--
  会话列表的五个方向 —— 抓包分析与 PCAP 分析共用的画布集。

  **抽出来的理由**：这两页看的是同一类数据（一次抓包或一次导入就是一个会话），
  差别只在「来源」与「能做什么」。如果各自写五套画布，就是 2 × 5 = 10 套，
  键盘可达性、空态引导、分道算法会立刻分叉 —— 正是这次重构要消灭的东西。
  两页各自只保留自己的动作按钮（新增会话 / 导入）与会话详情弹层。

  筛选项由这个组件持有：会话名 / 网卡关键字是两页共同的唯一筛法，
  塞进页面再传进来只会多一层透传。页面若想知道当前筛选结果，用 `filters-change`。

  **不渲染页头**（`no-head`）：两页的标题在标签页与面包屑里已经说过一遍，
  再顶一行「大标题 + 一句说明」只是把控制栏往下推。标题仍然作为方向坞的
  无障碍标签传下去，只是不再画出来。页面的动作按钮走 `bar-actions`，
  与控制栏同处一张卡 —— 这是 RePageStage 约定的位置，页头右侧不再挂按钮。
-->
<template>
  <RePageStage
    :variant="variant"
    :title="title"
    no-head
    :variant-items="items"
    :dock-visible="dockVisible"
    :tabs="tabs"
    :tab-value="filters.status"
    :filters="stageFilters"
    :filter-model="filters as unknown as Record<string, string>"
    :count-text="countText"
    :loading="loading"
    refresh-tip="刷新列表"
    @update:variant="setVariant"
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
        <span v-if="!days.length" class="pk-faint">还没有带时间的会话</span>
      </div>

      <ReCanvasBand
        :items="bandItems"
        :height="axisHeight"
        :ticks="['00', '04', '08', '12', '16', '20', '24']"
        :now-percent="nowPercent"
        :axis-clickable="false"
        @bar-click="(item) => (pickedId = Number(item.key))"
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

      <ReCanvasTable
        :rows="dayViews as unknown as Array<Record<string, unknown>>"
        :columns="rhythmCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="这一天没有会话"
        empty-hint="换一个日期，或确认抓包是否已经结束并落库。"
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
      </ReCanvasTable>
    </template>

    <!-- ==================== 工单台：一屏尽量多的会话 ==================== -->
    <template #console>
      <ReCanvasTable
        :rows="filtered as unknown as Array<Record<string, unknown>>"
        :columns="consoleCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        :empty-text="emptyMain"
        :empty-hint="emptyHint"
        @row-click="(r) => openOf(r, 'packet')"
      >
        <template #cell-name="{ row }">
          <div class="pk-strong pk-ellipsis">{{ viewOf(row).name }}</div>
          <div class="pk-sub pk-ellipsis">{{ viewOf(row).rangeText }}</div>
        </template>
        <template #cell-ifaceText="{ row }">
          <span class="pk-dim pk-ellipsis" :title="viewOf(row).iface">{{ viewOf(row).ifaceText }}</span>
        </template>
        <template #cell-statusText="{ row }">
          <span class="sstate" :class="`is-${viewOf(row).statusTone}`">
            <i class="pk-dot" />{{ statusTextOf(viewOf(row)) }}
          </span>
        </template>
        <template #cell-packetCount="{ row }">
          <span class="pk-num">{{ viewOf(row).packetCount.toLocaleString() }}</span>
        </template>
        <template #cell-sizeText="{ row }">
          <span class="pk-num pk-dim" :title="viewOf(row).sizeTitle">{{ viewOf(row).sizeText }}</span>
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

    <!-- ==================== 仪表：先看总量与状态分布 ==================== -->
    <template #instrument>
      <ReCanvasTelemetry :cells="teleCells" />

      <div class="dist">
        <div class="dist__head">
          <span class="dist__title">状态分布</span>
          <span class="dist__note">{{ noun }}按状态归档 · 异常计数不为 0 说明有抓包进程没正常收尾</span>
        </div>
        <div class="dist__rows">
          <div v-for="row in distRows" :key="row.label" class="dist__row">
            <span class="dist__label">
              <i class="pk-dot" :style="{ background: row.color }" />{{ row.label }}
            </span>
            <span class="dist__track">
              <span
                class="dist__fill"
                :style="{ width: `${row.percent}%`, background: row.color }"
              />
            </span>
            <span class="dist__value pk-num">{{ row.count }}</span>
          </div>
        </div>
      </div>

      <ReCanvasTable
        :rows="filtered as unknown as Array<Record<string, unknown>>"
        :columns="instrumentCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        :empty-text="emptyMain"
        @row-click="(r) => openOf(r, 'stats')"
      >
        <template #cell-name="{ row }">
          <span class="pk-strong pk-ellipsis">{{ viewOf(row).name }}</span>
        </template>
        <template #cell-statusText="{ row }">
          <span class="sstate" :class="`is-${viewOf(row).statusTone}`">
            <i class="pk-dot" />{{ statusTextOf(viewOf(row)) }}
          </span>
        </template>
        <template #cell-packetCount="{ row }">
          <span class="pk-num">{{ viewOf(row).packetCount.toLocaleString() }}</span>
        </template>
        <template #cell-sizeText="{ row }">
          <span class="pk-num pk-dim">{{ viewOf(row).sizeText }}</span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 档案柜：左栏列会话，右栏常驻会话参数 ==================== -->
    <template #dossier>
      <ReCanvasSplit
        :rows="filtered as unknown as Array<Record<string, unknown>>"
        :groups="groups"
        :row-key="rowKey"
        :active-key="picked?.id ?? null"
        :rail-width="250"
        :loading="loading"
        :empty-text="emptyMain"
        :empty-hint="emptyHint || '清掉搜索词或换一个状态页签试试。'"
        @pick="(k) => (pickedId = Number(k))"
      >
        <template #rail-item="{ row }">
          <span class="pk-rail__title">
            <i class="pk-dot" :class="viewOf(row).running ? 'pk-dot--live' : ''" />
            <span class="pk-ellipsis">{{ viewOf(row).name }}</span>
          </span>
          <span class="pk-rail__meta pk-num">{{ viewOf(row).startText }}</span>
        </template>

        <template #detail-head="{ row }">
          <div style="min-width: 0">
            <div class="detail__title pk-ellipsis">{{ viewOf(row).name }}</div>
            <div class="pk-sub">
              <span class="sstate" :class="`is-${viewOf(row).statusTone}`">
                <i class="pk-dot" />{{ statusTextOf(viewOf(row)) }}
              </span>
              <span class="detail__gap">{{ viewOf(row).packetCount.toLocaleString() }} 条报文</span>
            </div>
          </div>
        </template>

        <template #detail="{ row }">
          <div class="pk-kv">
            <span class="pk-kv__label">网卡</span>
            <span class="pk-kv__value pk-ellipsis" :title="viewOf(row).iface">{{ viewOf(row).ifaceText }}</span>
            <span class="pk-kv__label">开始</span>
            <span class="pk-kv__value pk-num">{{ viewOf(row).startText }}</span>
            <span class="pk-kv__label">结束</span>
            <span class="pk-kv__value pk-num">{{ viewOf(row).endText }}</span>
            <span class="pk-kv__label">时长</span>
            <span class="pk-kv__value pk-num">{{ viewOf(row).durationText }}</span>
            <span class="pk-kv__label">报文</span>
            <span class="pk-kv__value pk-num">{{ viewOf(row).packetCount.toLocaleString() }}</span>
            <span class="pk-kv__label">大小</span>
            <span class="pk-kv__value pk-num" :title="viewOf(row).sizeTitle">{{ viewOf(row).sizeText }}</span>
            <span class="pk-kv__label">来源</span>
            <span class="pk-kv__value">{{ viewOf(row).source === 'import' ? '导入文件' : '网卡实时' }}</span>
            <span class="pk-kv__label">状态说明</span>
            <span class="pk-kv__value" :class="{ 'is-err': viewOf(row).lastError }">
              {{ viewOf(row).lastError || '—' }}
            </span>
          </div>
        </template>

        <template #detail-actions="{ row }">
          <TsharkSessionActions
            :session="viewOf(row)"
            :can-stop="canStop"
            mode="full"
            @open="(tab) => openOf(row, tab)"
            @download="emit('download', viewOf(row).id, viewOf(row).name)"
            @stop="emit('stop', viewOf(row).id)"
            @remove="emit('remove', viewOf(row).id)"
          />
        </template>
      </ReCanvasSplit>
    </template>

    <!-- ==================== 卡片墙：会话参数直接摊在卡上 ==================== -->
    <template #wall>
      <ReCanvasCards
        :rows="filtered as unknown as Array<Record<string, unknown>>"
        :row-key="rowKey"
        :min-width="286"
        clickable
        :loading="loading"
        :empty-text="emptyMain"
        :empty-hint="emptyHint"
        @row-click="(r) => openOf(r, 'packet')"
      >
        <template #card="{ row }">
          <header class="pk-card__head">
            <span class="pk-card__title">{{ viewOf(row).name }}</span>
            <span class="sstate" :class="`is-${viewOf(row).statusTone}`">
              <i class="pk-dot" />{{ statusTextOf(viewOf(row)) }}
            </span>
          </header>

          <span class="pk-card__payload pk-ellipsis" :title="viewOf(row).iface">
            {{ viewOf(row).ifaceText }}
          </span>

          <div class="card__fields">
            <span class="card__k">报文</span>
            <span class="card__v pk-num">{{ viewOf(row).packetCount.toLocaleString() }}</span>

            <span class="card__k">大小</span>
            <span class="card__v pk-num" :title="viewOf(row).sizeTitle">{{ viewOf(row).sizeText }}</span>

            <span class="card__k">开始</span>
            <span class="card__v pk-num">{{ viewOf(row).startText }}</span>

            <span class="card__k">时长</span>
            <span class="card__v pk-num">{{ viewOf(row).durationText }}</span>
          </div>

          <footer class="pk-card__foot">
            <span class="pk-faint pk-num">{{ viewOf(row).endText === '—' ? '进行中' : `止于 ${viewOf(row).endText}` }}</span>
            <TsharkSessionActions
              :session="viewOf(row)"
              :can-stop="canStop"
              @open="(tab) => openOf(row, tab)"
              @download="emit('download', viewOf(row).id, viewOf(row).name)"
              @stop="emit('stop', viewOf(row).id)"
              @remove="emit('remove', viewOf(row).id)"
            />
          </footer>
        </template>
      </ReCanvasCards>
    </template>
  </RePageStage>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { usePageVariant } from '@repo/ui/components/RePageKit/usePageVariant'
import {
  ReCanvasBand,
  ReCanvasCards,
  ReCanvasSplit,
  ReCanvasTable,
  ReCanvasTelemetry,
  RePageStage,
} from '@repo/ui/components/RePageKit'
import type {
  BandItem,
  CanvasColumn,
  CanvasGroup,
  PageVariantId,
  TabItem,
} from '@repo/ui/components/RePageKit'
import type { TsharkTabKey } from './types'
import TsharkSessionActions from './TsharkSessionActions.vue'
import {
  EMPTY_SESSION_FILTERS,
  countSessions,
  dayLabel,
  filterSessions,
  formatSize,
  sessionDays,
  sessionTicks,
  toSessionViews,
  totalBytes,
  type SessionFilters,
  type SessionRow,
  type SessionView,
  type SessionTone,
} from './sessionView'

const props = withDefaults(
  defineProps<{
    /** 后端会话行（该来源的全量） */
    rows: SessionRow[]
    /** 方向记忆键 */
    pageKey: string
    /** 页面标题（不再画在页头，仅作为方向坞的无障碍标签） */
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

/** 方向：默认「工单台」—— 这一页最常做的事是找到某个会话点进去看报文 */
const ALLOWED: PageVariantId[] = ['console', 'rhythm', 'instrument', 'dossier', 'wall']

const { variant, items, dockVisible, setVariant } = usePageVariant({
  pageKey: props.pageKey,
  allowed: ALLOWED,
})

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

const teleCells = computed(() => [
  { label: `${props.noun}总数`, value: counts.value.total },
  {
    label: props.runningLabel,
    value: counts.value.running,
    tone: (counts.value.running > 0 ? 'hot' : undefined) as 'hot' | undefined,
  },
  { label: '报文累计', value: counts.value.packets.toLocaleString() },
  { label: '已落盘', value: formatSize(totalBytes(props.rows)) },
])

/** 状态档配色（图例、分布条、时间带共用一份，免得三处颜色跑偏） */
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

/** 状态分布（仪表方向） */
const distRows = computed(() => {
  const total = Math.max(1, counts.value.total)
  return [
    { label: props.runningLabel, count: counts.value.running, color: runColor },
    { label: '已停止', count: counts.value.stopped, color: stopColor },
    { label: '异常', count: counts.value.error, color: errColor },
  ].map(row => ({ ...row, percent: Math.round((row.count / total) * 100) }))
})

// ==================== 时间轴 ====================

const activeDay = ref('')

const days = computed(() => sessionDays(filtered.value))

// 数据变了以后选中的那天可能已经不在列表里（换了筛选、或当天会话被删），
// 这时退到最近的一天，而不是留着一个空轴
watch(
  days,
  list => {
    if (!list.length) {
      activeDay.value = ''
      return
    }
    if (!list.some(d => d.dayKey === activeDay.value)) {
      activeDay.value = list[list.length - 1]!.dayKey
    }
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

const consoleCols = computed<CanvasColumn[]>(() => {
  const cols: CanvasColumn[] = [
    { key: 'name', label: '会话 / 时间范围', width: 'minmax(0, 1.5fr)' },
  ]
  if (showIface.value) cols.push({ key: 'ifaceText', label: '网卡', width: 'minmax(0, 1fr)' })
  cols.push(
    { key: 'statusText', label: '状态', width: '84px' },
    { key: 'packetCount', label: '报文', width: '84px', align: 'right' },
    { key: 'sizeText', label: '大小', width: '78px', align: 'right' },
    { key: 'durationText', label: '时长', width: '84px', align: 'right' },
  )
  return cols
})

const instrumentCols: CanvasColumn[] = [
  { key: 'name', label: '会话', width: 'minmax(0, 1.6fr)' },
  { key: 'statusText', label: '状态', width: '84px' },
  { key: 'packetCount', label: '报文', width: '84px', align: 'right' },
  { key: 'sizeText', label: '大小', width: '84px', align: 'right' },
]

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

const pickedId = ref<number | null>(null)

/** 档案柜当前详情：选中项不在了就退回第一条 */
const picked = computed<SessionView | null>(() => {
  const hit = filtered.value.find(v => v.id === pickedId.value)
  return hit ?? filtered.value[0] ?? null
})

/** 档案柜分组：按状态档 */
const groups = computed<CanvasGroup[]>(() => [
  {
    key: 'run',
    label: props.runningLabel,
    rows: filtered.value.filter(v => v.statusCode === 1) as unknown as CanvasGroup['rows'],
  },
  {
    key: 'err',
    label: '异常',
    rows: filtered.value.filter(v => v.statusCode === 2) as unknown as CanvasGroup['rows'],
  },
  {
    key: 'stop',
    label: '已停止',
    rows: filtered.value.filter(v => v.statusCode !== 1 && v.statusCode !== 2) as unknown as CanvasGroup['rows'],
  },
])

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

/* ===== 状态分布 ===== */
.dist {
  flex: none;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.dist__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.dist__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dist__note {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dist__rows {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.dist__row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) 46px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.dist__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
}

.dist__track {
  height: 6px;
  background: var(--el-fill-color-light);
  border-radius: 3px;
  overflow: hidden;
}

.dist__fill {
  display: block;
  height: 100%;
  border-radius: 3px;
}

.dist__value {
  text-align: right;
  color: var(--el-text-color-primary);
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

/* ===== 档案柜 ===== */
.detail__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail__gap {
  margin-left: 8px;
  font-variant-numeric: tabular-nums;
}

.pk-kv__value.is-err {
  color: var(--el-color-danger);
}

/* ===== 卡片 ===== */
.card__fields {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 5px 10px;
  font-size: 12px;
  align-items: baseline;
}

.card__k {
  color: var(--el-text-color-placeholder);
}

.card__v {
  min-width: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .day-chip {
    transition: none;
  }
}
</style>
