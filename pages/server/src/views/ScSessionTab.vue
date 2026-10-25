<script setup lang="ts">
/**
 * 会话审计 —— 编排层
 *
 * <p>终端连接流水：谁在什么时候登过哪台主机、开了多久、怎么结束的。这一页的数据形状是
 * **区间**（连接 → 关闭），而原先只有一种排法：平表。平表能回答「哪一条」，回答不了
 * 「今天什么时候在连、空了哪几段」，也把关闭原因这类字段浪费在抽屉里。五个方向是五种
 * 对「这一页该为谁服务」的回答，由使用者在真实数据上挑。</p>
 *
 * <p>与另外六个管理页共用 {@link RePageStage}：页头 + 控制栏渲染一次，五个方向只换画布。
 * 所以「从仪表点柱子设下的时段条件，切到工单台后仍然生效、仍然能清」——
 * 条件若归画布所有，切一次就丢一次，用户会以为筛选自己坏了。</p>
 *
 * <p>算的部分全在 {@link sessionView} 的纯函数里（分道、区间几何、协议归桶、时长中位数），
 * 页面只负责把它们贴到画布上。这样同一批会话在五个方向里显示的是同一个时长、
 * 同一个状态文案、同一套空值兜底。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { message } from '@repo/core'
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
import { closeSession, getSessions, queryHosts } from '../api'
import {
  EMPTY_SESSION_FILTERS,
  SESSION_BUCKET_HOURS,
  assignLanes,
  bandGeometry,
  bucketByProtocol,
  countByStatus,
  filterSessions,
  formatDuration,
  medianDuration,
  toSessionViews,
  type SessionFilters,
  type SessionRow,
  type SessionView,
} from './session/sessionView'

/** 方向：默认「工单台」—— 审计最常做的事是「找到那一条、看它怎么结束的」 */
const ALLOWED: PageVariantId[] = ['console', 'rhythm', 'instrument', 'dossier', 'wall']

const { variant, items, dockVisible, setVariant } = usePageVariant({
  pageKey: 'server.session-audit',
  allowed: ALLOWED,
})

/** 单道高度（含间距） */
const LANE_HEIGHT = 13

/** 协议色档：图例、时间带、协议标签共用一份，免得三处颜色跑偏 */
const TONES = [
  { key: 'ssh' as const, label: 'SSH', color: 'var(--el-color-primary)' },
  { key: 'rdp' as const, label: 'RDP', color: '#7c3aed' },
  { key: 'vnc' as const, label: 'VNC', color: '#0e7490' },
  { key: 'other' as const, label: '其它', color: 'var(--el-text-color-disabled)' },
]

// ==================== 数据 ====================

/** 会话列表（后端原样） */
const sessions = ref<SessionRow[]>([])

/** 加载态 */
const loading = ref(false)

/** 主机台账：id → 主机名；后端没填主机名时兜底 */
const hostMap = ref<Record<number, string>>({})

/** 筛选条件：唯一状态源，五个方向共用 */
const filters = reactive<SessionFilters>({ ...EMPTY_SESSION_FILTERS })

/** 当前时刻：让「进行中」的时长与时间带上的「现在」跟着走 */
const now = ref(new Date())

/** 档案柜方向的选中项 */
const pickedId = ref<number | null>(null)

/** 详情抽屉（档案柜的详情常驻右栏，不弹抽屉） */
const detailVisible = ref(false)
const detailView = ref<SessionView | null>(null)

// ==================== 派生 ====================

/**
 * 全量展示行。
 *
 * <p>仪表的总体分布用它：统计不能跟着表格的筛选一起缩，否则一点柱子就只剩一根，
 * 而且页签上的数字会跟着筛选变，用户再也点不回「全部」。</p>
 */
const allViews = computed(() => toSessionViews(sessions.value, hostMap.value, now.value))

/** 全量统计（页签上的数字口径） */
const stats = computed(() => countByStatus(sessions.value))

/** 已筛选的展示行 */
const views = computed(() =>
  toSessionViews(filterSessions(sessions.value, filters, hostMap.value), hostMap.value, now.value),
)

/** 页签 */
const tabs = computed<TabItem[]>(() => [
  { label: '全部', value: '', count: stats.value.total },
  { label: '进行中', value: 'OPEN', count: stats.value.open },
  { label: '已结束', value: 'CLOSED', count: stats.value.closed },
])

/** 控制栏 */
const stageFilters = [
  { key: 'keyword', kind: 'search' as const, placeholder: '搜索主机 / 用户', width: 210 },
  {
    key: 'protocol',
    kind: 'select' as const,
    placeholder: '全部协议',
    width: 108,
    options: [
      { label: '全部协议', value: '' },
      { label: 'SSH', value: 'SSH' },
      { label: 'RDP', value: 'RDP' },
      { label: 'VNC', value: 'VNC' },
    ],
  },
  { key: 'ip', kind: 'search' as const, placeholder: '客户端 IP', width: 150 },
]

/** 是否有任何生效的条件（页头「清除筛选」） */
const hasFilter = computed(
  () =>
    Boolean(filters.keyword.trim()) ||
    Boolean(filters.protocol) ||
    Boolean(filters.ip) ||
    Boolean(filters.status) ||
    filters.hourBucket !== null,
)

/** 时段条件的中文说明 */
const bucketText = computed(() => {
  if (filters.hourBucket === null) return ''
  const from = filters.hourBucket
  const to = Math.min(from + SESSION_BUCKET_HOURS, 24)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${p(from)}:00–${p(to)}:00`
})

/** 遥测：进行中只算筛选后的，还是全量？—— 全量，与页签口径一致 */
const teleCells = computed(() => [
  { label: '会话总数', value: stats.value.total },
  {
    label: '进行中',
    value: stats.value.open,
    tone: (stats.value.open > 0 ? 'hot' : undefined) as 'hot' | undefined,
  },
  { label: '已结束', value: stats.value.closed },
  { label: '时长中位数', value: formatDuration(medianDuration(views.value)) },
])

/** 时间带上的会话（起止都解析得出） */
const plotCount = computed(() => views.value.filter(v => v.startHour !== null && v.endHour !== null).length)

/** 分道 + 区间几何 */
const lanes = computed(() =>
  assignLanes(views.value, LANE_HEIGHT)
    .map(({ view, top }) => {
      const geo = bandGeometry(view)
      return geo ? { view, top, geo } : null
    })
    .filter(
      (v): v is { view: SessionView; top: number; geo: { leftPercent: number; widthPercent: number } } =>
        v !== null,
    ),
)

/** 时间带上的条 */
const bandItems = computed<BandItem[]>(() =>
  lanes.value.map(l => ({
    key: l.view.id,
    left: l.geo.leftPercent,
    width: l.geo.widthPercent,
    top: l.top,
    color: toneColor(l.view.protocolTone),
    title: `${l.view.host} · ${l.view.protocol} · ${l.view.user} · ${l.view.connectText} → ${
      l.view.isOpen ? '进行中' : l.view.closeText
    } · ${l.view.durationText}`,
  })),
)

/** 轴高按实际道数撑开：只有三条会话时不留下大片空白 */
const axisHeight = computed(() => {
  const maxTop = lanes.value.reduce((m, l) => Math.max(m, l.top), 0)
  return Math.max(maxTop + LANE_HEIGHT + 8, 30)
})

/** 「现在」的位置 */
const nowPercent = computed(() => {
  const d = now.value
  return ((d.getHours() + d.getMinutes() / 60) / 24) * 100
})

/** 时段分布（按开始时刻归桶，桶内再按协议分层） */
const buckets = computed(() => bucketByProtocol(allViews.value, SESSION_BUCKET_HOURS))

/** 桶高的基准 */
const bucketPeak = computed(() => Math.max(1, ...buckets.value.map(b => b.total)))

/** 工单台列 */
const consoleCols: CanvasColumn[] = [
  { key: 'host', label: '主机', width: 'minmax(0, 1.2fr)' },
  { key: 'protocol', label: '协议', width: '64px' },
  { key: 'user', label: '用户', width: 'minmax(0, 1fr)' },
  { key: 'ip', label: '客户端 IP', width: '124px' },
  { key: 'connectText', label: '连接时间', width: '150px' },
  { key: 'durationText', label: '时长', width: '72px', align: 'right' },
  { key: 'statusText', label: '状态', width: '88px' },
]

/** 仪表 / 节奏的紧凑列 */
const compactCols: CanvasColumn[] = [
  { key: 'host', label: '主机', width: 'minmax(0, 1.4fr)' },
  { key: 'protocol', label: '协议', width: '64px' },
  { key: 'user', label: '用户', width: 'minmax(0, 1fr)' },
  { key: 'connectText', label: '连接时间', width: '150px' },
  { key: 'durationText', label: '时长', width: '72px', align: 'right' },
]

/**
 * 协议 → 颜色
 *
 * @param tone 协议色档
 */
function toneColor(tone: SessionView['protocolTone']): string {
  return TONES.find(t => t.key === tone)?.color ?? 'var(--el-color-primary)'
}

/** 档案柜当前详情：选中项不在了就退回第一条 */
const picked = computed<SessionView | null>(() => {
  const hit = views.value.find(v => v.id === pickedId.value)
  return hit ?? views.value[0] ?? null
})

/** 档案柜分组：进行中 / 已结束 */
const groups = computed<CanvasGroup[]>(() => [
  {
    key: 'OPEN',
    label: '进行中',
    rows: views.value.filter(v => v.isOpen) as unknown as CanvasGroup['rows'],
  },
  {
    key: 'CLOSED',
    label: '已结束',
    rows: views.value.filter(v => !v.isOpen) as unknown as CanvasGroup['rows'],
  },
])

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
 * 画布给的行还原成展示行
 *
 * @param row 画布行
 */
function viewOf(row: Record<string, unknown>): SessionView {
  return row as unknown as SessionView
}

/**
 * 应用筛选补丁
 *
 * @param patch 条件补丁
 */
function onFilter(patch: Partial<SessionFilters>): void {
  Object.assign(filters, patch)
}

/** 清除全部条件 —— 页头那个按钮用它，避免用户逐个回退 */
function clearFilters(): void {
  Object.assign(filters, EMPTY_SESSION_FILTERS)
}

/**
 * 点时间轴空白处：把位置换算成时段条件。
 *
 * <p>按 `SESSION_BUCKET_HOURS` 对齐到桶起点，与仪表里那几根柱子的口径一致 ——
 * 否则「点柱子」和「点轴」会给出两个相近但不同的条件，用户会以为筛得不准。</p>
 *
 * @param ratio 轴上的相对位置（0~1）
 */
function onAxisClick(ratio: number): void {
  const hour = ratio * 24
  const bucket = Math.floor(hour / SESSION_BUCKET_HOURS) * SESSION_BUCKET_HOURS
  onFilter({ hourBucket: bucket })
}

/**
 * 控制栏字段变化
 *
 * <p>控制栏给的键是字符串，这里逐项收敛成 SessionFilters 的字段，
 * 而不是用计算属性名硬塞一个对象 —— 那样类型上只能靠断言过去，写错键名也不会报错。</p>
 *
 * @param key   字段
 * @param value 值
 */
function onField(key: string, value: string): void {
  if (key === 'keyword') onFilter({ keyword: value })
  else if (key === 'protocol') onFilter({ protocol: value })
  else if (key === 'ip') onFilter({ ip: value })
}

/**
 * 点时间带上某根条
 *
 * @param item 条
 */
function onBarClick(item: BandItem): void {
  const hit = lanes.value.find(l => l.view.id === Number(item.key))
  if (hit) openDetail(hit.view)
}

/**
 * 打开详情抽屉
 *
 * @param view 展示行
 */
function openDetail(view: SessionView): void {
  detailView.value = view
  detailVisible.value = true
}

/** 刷新会话记录 */
async function refresh(): Promise<void> {
  loading.value = true
  try {
    const audit = await getSessions()
    sessions.value = audit ?? []
    now.value = new Date()
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

/**
 * 强制关闭会话
 *
 * @param view 展示行
 */
async function onForceClose(view: SessionView): Promise<void> {
  try {
    await message.confirm(`确认强制关闭「${view.host}」的会话？`, '强制关闭')
  } catch {
    return
  }
  try {
    await closeSession(view.id)
    message.success('已关闭')
    detailVisible.value = false
    await refresh()
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 时钟：30 秒一跳。
 *
 * <p>只在有进行中会话时才需要它（时长与「现在」都在动），但常驻一个 30 秒定时器的成本
 * 远低于「有没有开着的会话」这个判断本身的复杂度 —— 而且它顺带让时间带上的「现在」
 * 竖线也在走。</p>
 */
let clock: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  const hosts = await queryHosts().catch(() => [])
  for (const h of hosts ?? []) hostMap.value[h.id] = h.serverHostName
  await refresh()
  clock = setInterval(() => {
    now.value = new Date()
  }, 30_000)
})

onUnmounted(() => {
  if (clock) clearInterval(clock)
  clock = null
})
</script>

<template>
  <RePageStage
    :variant="variant"
    title="会话审计"
    desc="终端连接流水：谁在什么时候登过哪台主机、开了多久、怎么结束的。"
    :variant-items="items"
    :dock-visible="dockVisible"
    :tabs="tabs"
    :tab-value="filters.status"
    :filters="stageFilters"
    :filter-model="filters as unknown as Record<string, string>"
    :count-text="views.length === stats.total ? `共 ${stats.total} 条会话` : `筛选出 ${views.length} / ${stats.total} 条`"
    :loading="loading"
    refresh-tip="刷新会话记录"
    @update:variant="setVariant"
    @update:tab-value="(v) => onFilter({ status: v as SessionFilters['status'] })"
    @filter="onField"
    @refresh="refresh"
  >
    <!-- 生效中的条件：可能是别的方向设下的，必须一眼看见、一键清除 -->
    <template #head-actions>
      <button
        v-if="filters.hourBucket !== null"
        type="button"
        class="cond"
        title="清除时段条件"
        @click="onFilter({ hourBucket: null })"
      >
        时段 {{ bucketText }}<span class="cond__x">×</span>
      </button>
      <button v-if="hasFilter" type="button" class="pk-link" @click="clearFilters">清除筛选</button>
    </template>

    <!-- ==================== 节奏：一昼夜的连接区间 ==================== -->
    <template #rhythm>
      <ReCanvasBand
        :items="bandItems"
        :height="axisHeight"
        :ticks="['00', '04', '08', '12', '16', '20', '24']"
        :now-percent="nowPercent"
        axis-label="点击轴上某一段，按该时段筛选"
        @axis-click="onAxisClick"
        @bar-click="onBarClick"
      >
        <template #head>
          <span class="band__title">
            一昼夜的连接区间
            <span>
              按开始时刻归入时段，条长是连接持续时长；{{ plotCount }} 条会话有起止时间
            </span>
          </span>
          <span class="pk-band__legend">
            <span v-for="t in TONES" :key="t.key" class="pk-band__legend-item">
              <i class="pk-band__legend-chip" :style="{ background: t.color }" />{{ t.label }}
            </span>
          </span>
        </template>
      </ReCanvasBand>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="compactCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="还没有会话记录"
        empty-hint="终端连接过之后，这里会按连接时刻列出。"
        @row-click="(r) => openDetail(viewOf(r))"
      >
        <template #cell-host="{ row }">
          <span class="pk-strong pk-ellipsis">{{ viewOf(row).host }}</span>
        </template>
        <template #cell-protocol="{ row }">
          <span class="pk-proto" :class="`is-${viewOf(row).protocolTone}`">{{ viewOf(row).protocol }}</span>
        </template>
        <template #cell-user="{ row }">
          <span class="pk-ellipsis pk-dim">{{ viewOf(row).user }}</span>
        </template>
        <template #cell-connectText="{ row }">
          <span class="pk-num">{{ viewOf(row).connectText }}</span>
        </template>
        <template #cell-durationText="{ row }">
          <span class="pk-num" :class="viewOf(row).isOpen ? 'is-live' : ''">{{ viewOf(row).durationText }}</span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 工单台：一屏尽量多的会话 ==================== -->
    <template #console>
      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="consoleCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="还没有会话记录"
        empty-hint="终端连接过之后，这里会按连接时刻列出。"
        @row-click="(r) => openDetail(viewOf(r))"
      >
        <template #cell-host="{ row }">
          <div class="pk-strong pk-ellipsis">{{ viewOf(row).host }}</div>
          <div class="pk-sub pk-ellipsis">{{ viewOf(row).closeReason || '未记录关闭原因' }}</div>
        </template>
        <template #cell-protocol="{ row }">
          <span class="pk-proto" :class="`is-${viewOf(row).protocolTone}`">{{ viewOf(row).protocol }}</span>
        </template>
        <template #cell-user="{ row }">
          <span class="pk-ellipsis">{{ viewOf(row).user }}</span>
        </template>
        <template #cell-ip="{ row }">
          <span class="pk-num pk-ellipsis">{{ viewOf(row).ip }}</span>
        </template>
        <template #cell-connectText="{ row }">
          <span class="pk-num">{{ viewOf(row).connectText }}</span>
        </template>
        <template #cell-durationText="{ row }">
          <span class="pk-num" :class="viewOf(row).isOpen ? 'is-live' : ''">{{ viewOf(row).durationText }}</span>
        </template>
        <template #cell-statusText="{ row }">
          <span class="pk-state">
            <i class="pk-dot" :class="viewOf(row).isOpen ? 'pk-dot--live' : ''" />
            {{ viewOf(row).statusText }}
          </span>
        </template>
        <template #row-actions="{ row }">
          <button type="button" class="pk-link" @click="openDetail(viewOf(row))">详情</button>
          <button
            v-if="viewOf(row).isOpen"
            type="button"
            class="pk-link pk-link--danger"
            @click="onForceClose(viewOf(row))"
          >
            强制关闭
          </button>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 仪表：先看总量与时段分布 ==================== -->
    <template #instrument>
      <ReCanvasTelemetry :cells="teleCells" />

      <div class="dist">
        <div class="dist__head">
          <span class="dist__title">时段分布（按开始时刻）</span>
          <span class="dist__note">点一根柱子按该时段筛选 · 长会话只计入它开始的那一格</span>
        </div>

        <div class="dist__bars">
          <button
            v-for="b in buckets"
            :key="b.fromHour"
            type="button"
            class="dist__col"
            :class="{ 'is-active': filters.hourBucket === b.fromHour }"
            :aria-pressed="filters.hourBucket === b.fromHour"
            :title="`${b.label} · ${b.total} 条`"
            @click="onFilter({ hourBucket: filters.hourBucket === b.fromHour ? null : b.fromHour })"
          >
            <span class="dist__stack">
              <span
                v-for="t in TONES"
                :key="t.key"
                class="dist__seg"
                :style="{
                  height: `${(b.counts[t.key] / bucketPeak) * 56}px`,
                  background: t.color,
                }"
              />
            </span>
            <span class="dist__value pk-num">{{ b.total }}</span>
            <span class="dist__tick">{{ b.label }}</span>
          </button>
        </div>
      </div>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="compactCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="当前条件下没有会话"
        empty-hint="清掉筛选条件或点一次页头的「清除筛选」。"
        @row-click="(r) => openDetail(viewOf(r))"
      >
        <template #cell-host="{ row }">
          <span class="pk-strong pk-ellipsis">{{ viewOf(row).host }}</span>
        </template>
        <template #cell-protocol="{ row }">
          <span class="pk-proto" :class="`is-${viewOf(row).protocolTone}`">{{ viewOf(row).protocol }}</span>
        </template>
        <template #cell-user="{ row }">
          <span class="pk-ellipsis pk-dim">{{ viewOf(row).user }}</span>
        </template>
        <template #cell-connectText="{ row }">
          <span class="pk-num">{{ viewOf(row).connectText }}</span>
        </template>
        <template #cell-durationText="{ row }">
          <span class="pk-num">{{ viewOf(row).durationText }}</span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 档案柜：左栏列会话，右栏常驻详情 ==================== -->
    <template #dossier>
      <ReCanvasSplit
        :rows="views as unknown as Array<Record<string, unknown>>"
        :groups="groups"
        :row-key="rowKey"
        :active-key="picked?.id ?? null"
        :rail-width="256"
        :loading="loading"
        empty-text="没有匹配的会话"
        empty-hint="清掉搜索词或换一个状态页签试试。"
        @pick="(k) => (pickedId = Number(k))"
      >
        <template #rail-item="{ row }">
          <span class="pk-rail__title">
            <i class="pk-dot" :class="viewOf(row).isOpen ? 'pk-dot--live' : ''" />
            <span class="pk-ellipsis">{{ viewOf(row).host }}</span>
          </span>
          <span class="pk-rail__meta">
            <span class="pk-proto" :class="`is-${viewOf(row).protocolTone}`">{{ viewOf(row).protocol }}</span>
            <span class="pk-num">{{ viewOf(row).connectText.slice(5) }}</span>
          </span>
        </template>

        <template #detail-head="{ row }">
          <div style="min-width: 0">
            <div class="detail__title pk-ellipsis">{{ viewOf(row).host }}</div>
            <div class="pk-sub">
              <span class="pk-proto" :class="`is-${viewOf(row).protocolTone}`">{{ viewOf(row).protocol }}</span>
              <span class="detail__gap">{{ viewOf(row).durationText }}</span>
            </div>
          </div>
          <span class="pk-state" style="margin-left: auto">
            <i class="pk-dot" :class="viewOf(row).isOpen ? 'pk-dot--live' : ''" />
            {{ viewOf(row).statusText }}
          </span>
        </template>

        <template #detail="{ row }">
          <div class="pk-kv">
            <span class="pk-kv__label">用户</span>
            <span class="pk-kv__value">{{ viewOf(row).user }}</span>
            <span class="pk-kv__label">客户端 IP</span>
            <span class="pk-kv__value pk-num">{{ viewOf(row).ip }}</span>
            <span class="pk-kv__label">连接时间</span>
            <span class="pk-kv__value pk-num">{{ viewOf(row).connectText }}</span>
            <span class="pk-kv__label">关闭时间</span>
            <span class="pk-kv__value pk-num">
              {{ viewOf(row).isOpen ? '— 会话仍在' : viewOf(row).closeText }}
            </span>
            <span class="pk-kv__label">持续时长</span>
            <span class="pk-kv__value pk-num">{{ viewOf(row).durationText }}</span>
            <span class="pk-kv__label">关闭原因</span>
            <span class="pk-kv__value">
              {{ viewOf(row).closeReason || (viewOf(row).isOpen ? '—' : '未记录') }}
            </span>
          </div>
        </template>

        <template #detail-actions="{ row }">
          <ReButton v-if="viewOf(row).isOpen" type="danger" @click="onForceClose(viewOf(row))">
            强制关闭
          </ReButton>
        </template>
      </ReCanvasSplit>
    </template>

    <!-- ==================== 卡片墙：一条会话一张卡 ==================== -->
    <template #wall>
      <ReCanvasCards
        :rows="views as unknown as Array<Record<string, unknown>>"
        :row-key="rowKey"
        :min-width="280"
        clickable
        :loading="loading"
        empty-text="还没有会话记录"
        empty-hint="终端连接过之后，这里会按连接时刻列出。"
        @row-click="(r) => openDetail(viewOf(r))"
      >
        <template #card="{ row }">
          <header class="pk-card__head">
            <span class="pk-card__title">{{ viewOf(row).host }}</span>
            <span class="pk-proto" :class="`is-${viewOf(row).protocolTone}`">{{ viewOf(row).protocol }}</span>
          </header>

          <span class="pk-card__payload pk-ellipsis">
            {{ viewOf(row).user }} · {{ viewOf(row).ip }}
          </span>

          <div class="card__fields">
            <span class="card__k">连接</span>
            <span class="card__v pk-num">{{ viewOf(row).connectText }}</span>

            <span class="card__k">关闭</span>
            <span class="card__v pk-num">
              {{ viewOf(row).isOpen ? '进行中' : viewOf(row).closeText }}
            </span>

            <span class="card__k">时长</span>
            <span class="card__v pk-num">{{ viewOf(row).durationText }}</span>

            <span class="card__k">原因</span>
            <span class="card__v" :title="viewOf(row).closeReason">
              {{ viewOf(row).closeReason || (viewOf(row).isOpen ? '—' : '未记录') }}
            </span>
          </div>

          <footer class="pk-card__foot">
            <span class="pk-state">
              <i class="pk-dot" :class="viewOf(row).isOpen ? 'pk-dot--live' : ''" />
              {{ viewOf(row).statusText }}
            </span>
            <span class="card__ops">
              <button type="button" class="pk-link" @click.stop="openDetail(viewOf(row))">详情</button>
              <button
                v-if="viewOf(row).isOpen"
                type="button"
                class="pk-link pk-link--danger"
                @click.stop="onForceClose(viewOf(row))"
              >
                强制关闭
              </button>
            </span>
          </footer>
        </template>
      </ReCanvasCards>
    </template>

    <!-- 详情抽屉：档案柜不需要它（详情常驻右栏） -->
    <ReDrawer
      v-model="detailVisible"
      title="会话详情"
      direction="rtl"
      size="460px"
      destroy-on-close
      close-only
      :footer-hidden="true"
    >
      <template #content>
        <ReDescriptions v-if="detailView" :column="1" border>
          <ReDescriptionsItem label="主机">{{ detailView.host }}</ReDescriptionsItem>
          <ReDescriptionsItem label="协议">{{ detailView.protocol }}</ReDescriptionsItem>
          <ReDescriptionsItem label="用户">{{ detailView.user }}</ReDescriptionsItem>
          <ReDescriptionsItem label="客户端 IP">{{ detailView.ip }}</ReDescriptionsItem>
          <ReDescriptionsItem label="连接时间">{{ detailView.connectText }}</ReDescriptionsItem>
          <ReDescriptionsItem label="关闭时间">
            {{ detailView.isOpen ? '— 会话仍在' : detailView.closeText }}
          </ReDescriptionsItem>
          <ReDescriptionsItem label="持续时长">{{ detailView.durationText }}</ReDescriptionsItem>
          <ReDescriptionsItem label="状态">
            <span class="pk-state">
              <i class="pk-dot" :class="detailView.isOpen ? 'pk-dot--live' : ''" />
              {{ detailView.statusText }}
            </span>
          </ReDescriptionsItem>
          <ReDescriptionsItem label="关闭原因">
            {{ detailView.closeReason || (detailView.isOpen ? '—' : '未记录') }}
          </ReDescriptionsItem>
        </ReDescriptions>
        <div v-if="detailView?.isOpen" class="drawer-actions">
          <ReButton type="danger" @click="onForceClose(detailView)">强制关闭</ReButton>
        </div>
      </template>
    </ReDrawer>
  </RePageStage>
</template>

<style scoped>
/* 生效中的条件胶囊 */
.cond {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 6px 0 10px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  outline: none;
}

.cond:hover {
  background: var(--el-color-primary-light-8);
}

.cond:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.cond__x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

/* 进行中的时长用信号色：它是唯一会自己变的数字 */
.pk-num.is-live {
  color: var(--el-color-primary);
}

/* ===== 时段分布：堆叠柱 ===== */
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

.dist__bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.dist__col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px 0 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  outline: none;
}

.dist__col:hover {
  background: var(--el-fill-color-light);
}

.dist__col.is-active {
  border-color: var(--el-color-primary);
}

.dist__col:focus-visible {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.dist__stack {
  display: flex;
  flex-direction: column-reverse;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  min-height: 2px;
}

.dist__seg {
  width: 100%;
}

.dist__value {
  font-size: 11px;
  color: var(--el-text-color-primary);
}

.dist__tick {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
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

.card__ops {
  display: inline-flex;
  gap: 10px;
  flex: none;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
