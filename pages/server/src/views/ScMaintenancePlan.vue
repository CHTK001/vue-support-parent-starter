<script setup lang="ts">
/**
 * 维护计划 —— 编排层
 *
 * <p>这一页的数据本质是区间：一个计划 = 「从某刻到某刻，对这几台主机做这件事」。
 * 重构前它是一张平表，读者要在脑子里把「开始时间 / 结束时间」两列换算成一根线段，
 * 才能回答「这几个窗口撞没撞车」「下周哪天有空档」。</p>
 *
 * <p>五个方向全部开放 —— 因为「节奏」方向在这里恰好是主角：它把当天所有窗口画到
 * 一条 24 小时轴上并按重叠分道，撞车与空档一眼可见。默认给「节奏」。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
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
import {
  delMaintenancePlan,
  getMaintenancePlans,
  queryHosts,
  saveMaintenancePlan,
} from '../api'
import {
  EMPTY_PLAN_FILTERS,
  PLAN_STATUS,
  PLAN_TYPES,
  assignLanes,
  countPlans,
  dayLabel,
  filterPlans,
  planDays,
  planGeometry,
  toPlanViews,
  type PlanFilters,
  type PlanRow,
  type PlanTypeTone,
  type PlanView,
} from './maintenance/maintenanceView'

/** 主机台账行 */
interface HostOption {
  id: number
  serverHostName: string
  serverHostAddress: string
}

/** 后端原样行 */
const plans = ref<PlanRow[]>([])

/** 主机台账 */
const hosts = ref<HostOption[]>([])

/** id → 主机名 */
const hostMap = ref<Record<number, string>>({})

/** 加载态 */
const loading = ref(false)

/** 单一筛选状态源；status 由页签驱动，keyword / type 由控制栏驱动 */
const filters = reactive<PlanFilters>({ ...EMPTY_PLAN_FILTERS })

/** 当前时刻：让「进行中 / 待执行 / 已结束」与时间带上的竖线跟着走 */
const now = ref(new Date())

/** 节奏方向当前查看的日期 */
const selectedDay = ref('')

/** 档案柜方向的选中项 */
const pickedId = ref<number | null>(null)

/** 新增 / 编辑弹窗 */
const formVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref({
  planName: '',
  planType: 'MAINTENANCE',
  startTime: '',
  endTime: '',
  targetHostIds: [] as number[],
  description: '',
})

/** 主机下拉选项 */
const hostOptions = computed(() =>
  hosts.value.map(h => ({ label: `${h.serverHostName} (${h.serverHostAddress})`, value: h.id })),
)

/** 开放全部五个方向：区间数据本来就该有「节奏」这一种看法 */
const ALLOWED: PageVariantId[] = ['rhythm', 'console', 'instrument', 'dossier', 'wall']

const { variant, items, dockVisible, setVariant } = usePageVariant({
  pageKey: 'server.maintenance',
  allowed: ALLOWED,
})

/** 全量展示行 */
const allViews = computed(() => toPlanViews(plans.value, hostMap.value, now.value))

/** 已筛选的展示行 */
const views = computed(() => filterPlans(allViews.value, filters))

/** 状态计数（全量口径，页签数字不随筛选变化） */
const counts = computed(() => countPlans(allViews.value))

/** 页签 */
const tabs = computed<TabItem[]>(() => [
  { label: '全部', value: '', count: counts.value.total },
  ...PLAN_STATUS.map(s => ({
    label: s.label,
    value: s.value,
    count: counts.value.byStatus[s.value] ?? 0,
  })),
])

/** 控制栏：关键字 + 类型（状态已由页签承担，不重复放一个下拉） */
const stageFilters = [
  { key: 'keyword', kind: 'search' as const, placeholder: '搜索计划名 / 描述 / 主机', width: 240 },
  {
    key: 'type',
    kind: 'select' as const,
    placeholder: '全部类型',
    width: 112,
    options: [{ label: '全部类型', value: '' }, ...PLAN_TYPES.map(t => ({ label: t.label, value: t.value }))],
  },
]

/** 遥测 */
const teleCells = computed(() => [
  { label: '计划总数', value: counts.value.total },
  { label: '待执行', value: counts.value.byStatus['PENDING'] ?? 0 },
  { label: '执行中', value: counts.value.byStatus['RUNNING'] ?? 0, tone: ((counts.value.byStatus['RUNNING'] ?? 0) > 0 ? 'hot' : undefined) as 'hot' | undefined },
  { label: '已完成', value: counts.value.byStatus['COMPLETED'] ?? 0 },
])

/** 类型分布（仪表图表） */
const typeDist = computed(() => {
  const list = PLAN_TYPES.map(t => ({
    label: t.label,
    tone: t.tone,
    count: allViews.value.filter(v => v.typeCode === t.value).length,
  }))
  const known = PLAN_TYPES.map(t => t.value)
  const other = allViews.value.filter(v => !known.includes(v.typeCode)).length
  if (other > 0) list.push({ label: '其它', tone: 'other' as PlanTypeTone, count: other })
  return list
})

/** 图表峰值 */
const typePeak = computed(() => Math.max(1, ...typeDist.value.map(t => t.count)))

/** 有计划的日期（节奏方向的日期切换条） */
const days = computed(() => planDays(views.value))

/** 当天要画的计划 */
const dayViews = computed(() =>
  selectedDay.value ? views.value.filter(v => v.dayKey === selectedDay.value) : [],
)

/** 当天的分道结果 */
const bandItems = computed<BandItem[]>(() => {
  const out: BandItem[] = []
  for (const { view, top } of assignLanes(dayViews.value, 13)) {
    const geo = planGeometry(view)
    // 时间不可解析的计划画不到轴上，但仍在下面的表格里 —— 不从数据里消失
    if (!geo) continue
    out.push({
      key: view.id,
      left: geo.leftPercent,
      width: geo.widthPercent,
      top: top + 4,
      color: toneColor(view.typeTone),
      title: `${view.name} · ${view.typeLabel} · ${view.startText.slice(11)}–${view.endText.slice(11)} · ${view.durationText}`,
    })
  }
  return out
})

/** 当天轴高：按实际道数撑开，只有一条计划时不留下大片空白 */
const bandHeight = computed(() => {
  const maxTop = bandItems.value.reduce((m, i) => Math.max(m, i.top), 0)
  return Math.max(maxTop + 13 + 6, 30)
})

/** 「现在」的位置；不在所看那天就不画（避免把今天的竖线画到昨天的轴上） */
const nowPercent = computed(() => {
  const hour = now.value.getHours() + now.value.getMinutes() / 60
  const today = `${now.value.getFullYear()}-${String(now.value.getMonth() + 1).padStart(2, '0')}-${String(now.value.getDate()).padStart(2, '0')}`
  return selectedDay.value === today ? (hour / 24) * 100 : null
})

/** 工单台列 */
const consoleCols: CanvasColumn[] = [
  { key: 'name', label: '计划名称', width: 'minmax(0, 1.2fr)' },
  { key: 'type', label: '类型', width: '68px' },
  { key: 'status', label: '状态', width: '82px' },
  { key: 'window', label: '维护窗口', width: 'minmax(0, 1.5fr)' },
  { key: 'hosts', label: '目标主机', width: 'minmax(0, 1fr)' },
]

/** 仪表方向的紧凑列 */
const instrumentCols: CanvasColumn[] = [
  { key: 'name', label: '计划名称', width: 'minmax(0, 1.2fr)' },
  { key: 'type', label: '类型', width: '68px' },
  { key: 'status', label: '状态', width: '82px' },
  { key: 'window', label: '维护窗口', width: 'minmax(0, 1.5fr)' },
]

/** 节奏方向的列（多一列时长，因为它就在轴上量过） */
const rhythmCols: CanvasColumn[] = [
  { key: 'name', label: '计划名称', width: 'minmax(0, 1.2fr)' },
  { key: 'type', label: '类型', width: '68px' },
  { key: 'status', label: '状态', width: '82px' },
  { key: 'window', label: '维护窗口', width: 'minmax(0, 1.5fr)' },
  { key: 'duration', label: '时长', width: '88px', align: 'right' },
]

/** 档案柜分组：按状态分，执行中的一组要先看到 */
const groups = computed<CanvasGroup[]>(() => [
  ...PLAN_STATUS.map(s => ({
    key: s.value,
    label: s.label,
    rows: views.value.filter(v => v.statusCode === s.value) as unknown as CanvasGroup['rows'],
  })),
  {
    key: '__other',
    label: '其它状态',
    rows: views.value.filter(
      v => !PLAN_STATUS.some(s => s.value === v.statusCode),
    ) as unknown as CanvasGroup['rows'],
  },
])

/** 档案柜当前详情 */
const picked = computed(
  () => views.value.find(v => v.id === pickedId.value) ?? views.value[0] ?? null,
)

/** 详情里的时间带几何 */
const pickedGeometry = computed(() => (picked.value ? planGeometry(picked.value) : null))

/**
 * 行键
 *
 * @param row 行
 */
function rowKey(row: Record<string, unknown>): number {
  return Number(row.id)
}

/**
 * 类型配色
 *
 * @param tone 类型档
 */
function toneColor(tone: PlanTypeTone): string {
  switch (tone) {
    case 'maintenance':
      return 'var(--el-color-primary)'
    case 'upgrade':
      return '#7c3aed'
    case 'backup':
      return '#0e7490'
    case 'reboot':
      return 'var(--el-color-warning)'
    default:
      return 'var(--el-text-color-disabled)'
  }
}

/**
 * 控制栏筛选项变化
 *
 * @param key   字段
 * @param value 值
 */
function onFilter(key: string, value: string): void {
  if (key === 'keyword') filters.keyword = value
  else if (key === 'type') filters.type = value
}

/**
 * 页签变化
 *
 * @param value 状态代码
 */
function onTab(value: string): void {
  filters.status = value
}

/** 加载 */
async function refresh(): Promise<void> {
  loading.value = true
  try {
    const [planList, hostList] = await Promise.all([
      getMaintenancePlans(),
      queryHosts().catch(() => [] as HostOption[]),
    ])
    plans.value = planList ?? []
    hosts.value = hostList ?? []
    const map: Record<number, string> = {}
    for (const h of hostList ?? []) map[h.id] = h.serverHostName
    hostMap.value = map
    now.value = new Date()
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

/** 打开新建 */
function openCreate(): void {
  editingId.value = null
  form.value = {
    planName: '',
    planType: 'MAINTENANCE',
    startTime: '',
    endTime: '',
    targetHostIds: [],
    description: '',
  }
  formVisible.value = true
}

/**
 * 打开编辑
 *
 * @param view 展示行
 */
function openEdit(view: PlanView): void {
  editingId.value = view.id
  form.value = {
    planName: view.name === '未命名计划' ? '' : view.name,
    planType: view.typeCode || 'MAINTENANCE',
    startTime: view.startText === '—' ? '' : view.startText.replace(' ', 'T'),
    endTime: view.endText === '—' ? '' : view.endText.replace(' ', 'T'),
    targetHostIds: [...view.hostIds],
    description: view.description,
  }
  formVisible.value = true
}

/** 保存 */
async function submitForm(): Promise<void> {
  if (!form.value.planName.trim()) {
    message.warning('计划名称不能为空')
    return
  }
  if (!form.value.startTime || !form.value.endTime) {
    message.warning('请选择开始和结束时间')
    return
  }
  try {
    await saveMaintenancePlan(editingId.value, {
      ...form.value,
      targetHostIds: JSON.stringify(form.value.targetHostIds),
    })
    message.success('已保存')
    formVisible.value = false
    await refresh()
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 删除
 *
 * @param view 展示行
 */
async function removePlan(view: PlanView): Promise<void> {
  try {
    await message.confirm(`确认删除维护计划「${view.name}」？`, '删除')
  } catch {
    return
  }
  try {
    await delMaintenancePlan(view.id)
    message.success('已删除')
    await refresh()
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 日期切换保持有效。
 *
 * <p>筛选后原来选中的那天可能已经没有计划了 —— 那时自动跳到第一天的第一天，
 * 否则轴会空着一片，看起来像这一页坏了。首选「今天」或最近的未开始日，
 * 因为用户打开这一页最常问的是「接下来有什么」。</p>
 */
watch(
  days,
  list => {
    if (!list.length) {
      selectedDay.value = ''
      return
    }
    if (list.some(d => d.dayKey === selectedDay.value)) return
    const today = `${now.value.getFullYear()}-${String(now.value.getMonth() + 1).padStart(2, '0')}-${String(now.value.getDate()).padStart(2, '0')}`
    const upcoming = list.find(d => d.dayKey >= today)
    selectedDay.value = (upcoming ?? list[0]!).dayKey
  },
  { immediate: true },
)

/** 时钟：30 秒一跳，让「进行中」与竖线保持真实 */
let clock: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
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
    title="维护计划"
    desc="维护 / 升级 / 备份 / 重启的窗口期安排：什么时候、动哪几台、占多久。"
    :variant-items="items"
    :dock-visible="dockVisible"
    :tabs="tabs"
    :tab-value="filters.status"
    :filters="stageFilters"
    :filter-model="filters as unknown as Record<string, string>"
    :count-text="views.length === counts.total ? `共 ${counts.total} 个计划` : `筛选出 ${views.length} / ${counts.total} 个`"
    :loading="loading"
    refresh-tip="刷新维护计划"
    @update:variant="setVariant"
    @update:tab-value="onTab"
    @filter="onFilter"
    @refresh="refresh"
  >
    <template #head-actions>
      <ReButton type="primary" icon="Plus" @click="openCreate">新建计划</ReButton>
    </template>

    <!-- ==================== 节奏：当天窗口画在 24 小时轴上 ==================== -->
    <template #rhythm>
      <div class="pk-bar day-bar">
        <span class="day-bar__label">查看日期</span>
        <div class="day-chips">
          <button
            v-for="d in days"
            :key="d.dayKey"
            type="button"
            class="day-chip"
            :class="{ 'is-active': d.dayKey === selectedDay }"
            :aria-pressed="d.dayKey === selectedDay"
            @click="selectedDay = d.dayKey"
          >
            {{ dayLabel(d.dayKey) }}<span class="day-chip__count">{{ d.count }}</span>
          </button>
        </div>
        <span class="pk-bar__spacer" />
        <span class="pk-bar__count">{{ dayViews.length }} 个窗口落在这一天</span>
      </div>

      <ReCanvasBand
        :items="bandItems"
        :height="bandHeight"
        :ticks="['00', '04', '08', '12', '16', '20', '24']"
        :now-percent="nowPercent"
        :axis-clickable="false"
        @bar-click="(item) => (pickedId = Number(item.key))"
      >
        <template #head>
          <span class="band__title">
            {{ selectedDay || '—' }} 的窗口分布
            <span>按重叠自动分道；一根条就是一个计划，长度即窗口时长</span>
          </span>
          <span class="pk-band__legend">
            <span v-for="t in PLAN_TYPES" :key="t.value" class="pk-band__legend-item">
              <i class="pk-band__legend-chip" :style="{ background: toneColor(t.tone) }" />{{ t.label }}
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
        empty-text="这一天没有维护窗口"
        empty-hint="换个日期看看，或者新建一个计划。"
        @row-click="(r) => openEdit(r as unknown as PlanView)"
      >
        <template #cell-name="{ row }">
          <div class="pk-strong pk-ellipsis">{{ (row as unknown as PlanView).name }}</div>
          <div class="pk-sub pk-ellipsis">{{ (row as unknown as PlanView).hostText }}</div>
        </template>
        <template #cell-type="{ row }">
          <span class="ptype" :class="`is-${(row as unknown as PlanView).typeTone}`">
            {{ (row as unknown as PlanView).typeLabel }}
          </span>
        </template>
        <template #cell-status="{ row }">
          <span class="pstate" :class="`is-${(row as unknown as PlanView).statusTone}`">
            <i class="pk-dot" :class="(row as unknown as PlanView).windowState === 'active' ? 'pk-dot--live' : ''" />
            {{ (row as unknown as PlanView).statusLabel }}
          </span>
        </template>
        <template #cell-window="{ row }">
          <span class="pk-num pk-dim pk-ellipsis">
            {{ (row as unknown as PlanView).startText.slice(5) }} → {{ (row as unknown as PlanView).endText.slice(5) }}
          </span>
        </template>
        <template #cell-duration="{ row }">
          <span class="pk-num">{{ (row as unknown as PlanView).durationText }}</span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 工单台：一屏尽量多的计划 ==================== -->
    <template #console>
      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="consoleCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="还没有维护计划"
        empty-hint="点右上角「新建计划」安排第一个窗口。"
        @row-click="(r) => openEdit(r as unknown as PlanView)"
      >
        <template #cell-name="{ row }">
          <div class="pk-strong pk-ellipsis">{{ (row as unknown as PlanView).name }}</div>
          <div class="pk-sub pk-ellipsis">{{ (row as unknown as PlanView).description || '无描述' }}</div>
        </template>
        <template #cell-type="{ row }">
          <span class="ptype" :class="`is-${(row as unknown as PlanView).typeTone}`">
            {{ (row as unknown as PlanView).typeLabel }}
          </span>
        </template>
        <template #cell-status="{ row }">
          <span class="pstate" :class="`is-${(row as unknown as PlanView).statusTone}`">
            <i class="pk-dot" :class="(row as unknown as PlanView).windowState === 'active' ? 'pk-dot--live' : ''" />
            {{ (row as unknown as PlanView).statusLabel }}
          </span>
        </template>
        <template #cell-window="{ row }">
          <div class="pk-num pk-ellipsis">{{ (row as unknown as PlanView).startText }}</div>
          <div class="pk-num pk-sub pk-ellipsis">→ {{ (row as unknown as PlanView).endText }} · {{ (row as unknown as PlanView).durationText }}</div>
        </template>
        <template #cell-hosts="{ row }">
          <span class="pk-ellipsis" :title="(row as unknown as PlanView).hostText">
            {{ (row as unknown as PlanView).hostText }}
          </span>
        </template>
        <template #row-actions="{ row }">
          <button type="button" class="pk-link" @click="openEdit(row as unknown as PlanView)">编辑</button>
          <button type="button" class="pk-link pk-link--danger" @click="removePlan(row as unknown as PlanView)">删除</button>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 仪表：先看整体盘子 ==================== -->
    <template #instrument>
      <ReCanvasTelemetry :cells="teleCells" />

      <div class="dist">
        <div class="dist__head">
          <span class="dist__title">计划类型分布</span>
          <span class="dist__note">维护 / 升级 / 备份 / 重启各占多少 · 全量口径，不随筛选变化</span>
        </div>
        <div class="dist__bars">
          <div v-for="b in typeDist" :key="b.label" class="dist__col">
            <span class="dist__val">{{ b.count || '' }}</span>
            <span
              class="dist__bar"
              :style="{
                height: `${b.count ? Math.max((b.count / typePeak) * 52, 3) : 0}px`,
                background: toneColor(b.tone),
              }"
            />
            <span class="dist__label">{{ b.label }}</span>
          </div>
        </div>
      </div>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="instrumentCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        empty-text="还没有维护计划"
        @row-click="(r) => openEdit(r as unknown as PlanView)"
      >
        <template #cell-name="{ row }">
          <span class="pk-strong pk-ellipsis">{{ (row as unknown as PlanView).name }}</span>
        </template>
        <template #cell-type="{ row }">
          <span class="ptype" :class="`is-${(row as unknown as PlanView).typeTone}`">
            {{ (row as unknown as PlanView).typeLabel }}
          </span>
        </template>
        <template #cell-status="{ row }">
          <span class="pstate" :class="`is-${(row as unknown as PlanView).statusTone}`">
            <i class="pk-dot" :class="(row as unknown as PlanView).windowState === 'active' ? 'pk-dot--live' : ''" />
            {{ (row as unknown as PlanView).statusLabel }}
          </span>
        </template>
        <template #cell-window="{ row }">
          <span class="pk-num pk-dim pk-ellipsis">
            {{ (row as unknown as PlanView).startText }} → {{ (row as unknown as PlanView).endText }}
          </span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 档案柜：左栏按状态分组，右栏常驻详情 ==================== -->
    <template #dossier>
      <ReCanvasSplit
        :rows="views as unknown as Array<Record<string, unknown>>"
        :groups="groups"
        :row-key="rowKey"
        :active-key="picked?.id ?? null"
        :rail-width="252"
        :loading="loading"
        empty-text="没有匹配的维护计划"
        empty-hint="清掉搜索词或换一个状态页签试试。"
        @pick="(k) => (pickedId = Number(k))"
      >
        <template #rail-item="{ row }">
          <span class="pk-rail__title">
            <i class="pk-dot" :class="(row as unknown as PlanView).windowState === 'active' ? 'pk-dot--live' : ''" />
            <span class="pk-ellipsis">{{ (row as unknown as PlanView).name }}</span>
          </span>
          <span class="pk-rail__meta">
            <span class="pk-num">{{ (row as unknown as PlanView).startText.slice(5) }}</span>
            <span class="rail__type">{{ (row as unknown as PlanView).typeLabel }}</span>
          </span>
        </template>

        <template #detail-head="{ row }">
          <div style="min-width: 0">
            <div class="detail__title pk-ellipsis">{{ (row as unknown as PlanView).name }}</div>
            <div class="pk-sub">
              <span class="ptype" :class="`is-${(row as unknown as PlanView).typeTone}`">
                {{ (row as unknown as PlanView).typeLabel }}
              </span>
              <span class="detail__gap">{{ (row as unknown as PlanView).durationText }}</span>
            </div>
          </div>
          <span class="pstate" :class="`is-${(row as unknown as PlanView).statusTone}`" style="margin-left: auto">
            {{ (row as unknown as PlanView).statusLabel }}
          </span>
        </template>

        <template #detail="{ row }">
          <div class="pk-kv">
            <span class="pk-kv__label">开始</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as PlanView).startText }}</span>
            <span class="pk-kv__label">结束</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as PlanView).endText }}</span>
            <span class="pk-kv__label">时长</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as PlanView).durationText }}</span>
            <span class="pk-kv__label">目标主机</span>
            <span class="pk-kv__value">{{ (row as unknown as PlanView).hostText }}</span>
            <span class="pk-kv__label">描述</span>
            <span class="pk-kv__value">{{ (row as unknown as PlanView).description || '—' }}</span>
          </div>

          <div class="detail__band">
            <div class="detail__band-label">
              <span>窗口在当天的位置</span>
              <span class="pk-num">{{ (row as unknown as PlanView).dayKey }}</span>
            </div>
            <div v-if="pickedGeometry" class="pk-band__axis" style="height: 22px">
              <span
                class="pk-band__bar"
                :style="{
                  left: `${pickedGeometry.leftPercent}%`,
                  width: `${pickedGeometry.widthPercent}%`,
                  top: '6px',
                  background: toneColor((row as unknown as PlanView).typeTone),
                }"
              />
            </div>
            <div v-else class="detail__band-empty">开始时刻无法解析，这一条画不到时间轴上。</div>
            <div v-if="pickedGeometry" class="pk-band__ticks">
              <span v-for="t in ['00', '04', '08', '12', '16', '20', '24']" :key="t">{{ t }}</span>
            </div>
          </div>
        </template>

        <template #detail-actions="{ row }">
          <ReButton @click="openEdit(row as unknown as PlanView)">编辑</ReButton>
          <ReButton type="danger" @click="removePlan(row as unknown as PlanView)">删除</ReButton>
        </template>
      </ReCanvasSplit>
    </template>

    <!-- ==================== 卡片墙：计划的全部字段摊在卡上 ==================== -->
    <template #wall>
      <ReCanvasCards
        :rows="views as unknown as Array<Record<string, unknown>>"
        :row-key="rowKey"
        :min-width="268"
        clickable
        :loading="loading"
        empty-text="还没有维护计划"
        empty-hint="点右上角「新建计划」安排第一个窗口。"
        @row-click="(r) => openEdit(r as unknown as PlanView)"
      >
        <template #card="{ row }">
          <header class="pk-card__head">
            <span class="pk-card__title">{{ (row as unknown as PlanView).name }}</span>
            <span class="ptype" :class="`is-${(row as unknown as PlanView).typeTone}`">
              {{ (row as unknown as PlanView).typeLabel }}
            </span>
          </header>

          <div class="card__fields">
            <span class="card__k">状态</span>
            <span class="card__v pk-state">
              <i class="pk-dot" :class="(row as unknown as PlanView).windowState === 'active' ? 'pk-dot--live' : ''" />
              {{ (row as unknown as PlanView).statusLabel }}
            </span>

            <span class="card__k">开始</span>
            <span class="card__v pk-num">{{ (row as unknown as PlanView).startText }}</span>

            <span class="card__k">结束</span>
            <span class="card__v pk-num">{{ (row as unknown as PlanView).endText }}</span>

            <span class="card__k">时长</span>
            <span class="card__v pk-num">{{ (row as unknown as PlanView).durationText }}</span>

            <span class="card__k">主机</span>
            <span class="card__v" :title="(row as unknown as PlanView).hostText">
              {{ (row as unknown as PlanView).hostText }}
            </span>

            <span class="card__k">描述</span>
            <span class="card__v card__desc">{{ (row as unknown as PlanView).description || '—' }}</span>
          </div>

          <footer class="pk-card__foot">
            <span class="pk-faint">{{ (row as unknown as PlanView).dayKey }}</span>
            <span class="card__ops">
              <button type="button" class="pk-link" @click.stop="openEdit(row as unknown as PlanView)">编辑</button>
              <button type="button" class="pk-link pk-link--danger" @click.stop="removePlan(row as unknown as PlanView)">删除</button>
            </span>
          </footer>
        </template>
      </ReCanvasCards>
    </template>

    <!-- 新建 / 编辑 -->
    <ReDialog
      v-model="formVisible"
      :title="editingId ? '编辑计划' : '新建计划'"
      width="600"
      :height="560"
      confirm-text="保存"
      cancel-text="取消"
      :footer-hidden="false"
      @confirm="submitForm"
      @cancel="formVisible = false"
    >
      <ReForm label-width="96px" label-position="right">
        <ReFormItem label="计划名称" required>
          <ReInput v-model="form.planName" placeholder="如 核心服务升级" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReSelect v-model="form.planType" :data="PLAN_TYPES" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="开始时间" required>
          <ReDatePicker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </ReFormItem>
        <ReFormItem label="结束时间" required>
          <ReDatePicker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </ReFormItem>
        <ReFormItem label="目标主机">
          <ReSelect v-model="form.targetHostIds" multiple filterable :data="hostOptions" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="描述">
          <ReInput v-model="form.description" type="textarea" :rows="2" />
        </ReFormItem>
      </ReForm>
    </ReDialog>
  </RePageStage>
</template>

<style scoped>
/* ===== 日期切换条 ===== */
.day-bar {
  flex: none;
}

.day-bar__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex: none;
}

.day-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.day-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid transparent;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  outline: none;
  font-variant-numeric: tabular-nums;
}

.day-chip:hover {
  background: var(--el-fill-color);
}

.day-chip:focus-visible {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.day-chip.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.day-chip__count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.day-chip.is-active .day-chip__count {
  color: var(--el-color-primary);
}

/* ===== 类型徽标 ===== */
.ptype {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 19px;
  padding: 0 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
  border-radius: var(--el-radius-xs, 4px);
  white-space: nowrap;
}

.ptype.is-maintenance {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.ptype.is-upgrade {
  color: #7c3aed;
  background: color-mix(in srgb, #7c3aed 12%, transparent);
}

.ptype.is-backup {
  color: #0e7490;
  background: color-mix(in srgb, #0e7490 12%, transparent);
}

.ptype.is-reboot {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}

/* ===== 状态 ===== */
.pstate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.pstate.is-running {
  color: var(--el-color-warning);
  font-weight: 600;
}

.pstate.is-completed {
  color: var(--el-color-success);
}

.pstate.is-cancelled {
  color: var(--el-text-color-placeholder);
}

/* ===== 类型分布图 ===== */
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
  margin-bottom: 6px;
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
  gap: 10px;
  padding-top: 14px;
}

.dist__col {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.dist__val {
  height: 13px;
  font-size: 10px;
  line-height: 13px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.dist__bar {
  width: 100%;
  max-width: 52px;
  border-radius: 2px 2px 0 0;
  transition: height var(--el-transition-duration-fast, 0.2s);
}

.dist__label {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
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
.rail__type {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
}

.detail__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail__gap {
  margin-left: 8px;
  font-variant-numeric: tabular-nums;
}

.detail__band {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail__band-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.detail__band-empty {
  padding: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ===== 卡片 ===== */
.card__fields {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
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

.card__desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
  line-height: 1.45;
}

.card__ops {
  display: inline-flex;
  gap: 10px;
  flex: none;
}

@media (prefers-reduced-motion: reduce) {
  .dist__bar {
    transition: none;
  }
}
</style>
