<script setup lang="ts">
/**
 * 维护计划 —— 窗口期编排
 *
 * <p>这一页的数据本质是区间：一个计划 = 「从某刻到某刻，对这几台主机做这件事」。
 * 重构前它是一张平表，读者要在脑子里把「开始时间 / 结束时间」两列换算成一根线段，
 * 才能回答「这几个窗口撞没撞车」「下周哪天有空档」。</p>
 *
 * <p>四个档位：</p>
 * <ul>
 *   <li><b>三栏指挥台</b>（默认）：分面栏按状态与类型筛，中间列表带窗口与时长，
 *       右侧常驻详情。适合「查某一条计划现在什么状态」。</li>
 *   <li><b>泳道时间墙</b>：一条泳道一台主机，条块就是真实 start → end。
 *       回答「这台机器这周什么时候不能动」。</li>
 *   <li><b>矩阵热力台</b>：主机 × 时段，哪一格挤满了窗口就说明那台机器在
 *       同一时段被排了多个计划。</li>
 *   <li><b>状态看板</b>：待执行 / 执行中 / 已完成 / 已取消四列，
 *       执行中的自己浮到第二列，值班时不用先筛。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { message } from '@repo/core'
import OpsDesk from '../components/opsdesk/OpsDesk.vue'
import type {
  OpsFacetGroup,
  OpsFilterField,
  OpsItem,
  OpsMode,
  OpsModeMeta,
  OpsTone,
} from '../components/opsdesk/types'
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
  countPlans,
  filterPlans,
  toPlanViews,
  type PlanFilters,
  type PlanRow,
  type PlanTypeTone,
  type PlanView,
} from './maintenance/maintenanceView'

/** 工作区页签嵌入：hostId 用于从「主机」出发时的过滤入口（页面内暂不消费，保留占位） */
defineProps<{ hostId?: number }>()

/** 主机台账行 */
interface HostOption {
  id: number
  serverHostName: string
  serverHostAddress: string
}

/* ==================== 档位 ==================== */

const MODES: OpsModeMeta[] = [
  { id: 'deck', label: '三栏指挥台', thesis: '分面栏 + 密集列表 + 常驻详情，查一条计划的状态' },
  { id: 'lanes', label: '泳道时间墙', thesis: '一台主机一条泳道，条块就是真实窗口，撞车一眼可见' },
  { id: 'matrix', label: '矩阵热力台', thesis: '主机 × 时段，哪台机器在同一时段被排了多个计划' },
  { id: 'kanban', label: '状态看板', thesis: '待执行 / 执行中 / 已完成 / 已取消四列，执行中的自己浮出来' },
]

/** 档位记忆键（按页持久化） */
const MODE_KEY = 'ops-mode:server.maintenance'

/**
 * 读取已存档位。
 *
 * <p>存的旧值可能已不在开放集里，这里收敛而不是直接信任。</p>
 */
function readMode(): OpsMode {
  try {
    const raw = localStorage.getItem(MODE_KEY)
    return MODES.some(m => m.id === raw) ? (raw as OpsMode) : 'deck'
  } catch {
    return 'deck'
  }
}

const mode = ref<OpsMode>(readMode())
watch(mode, v => {
  try {
    localStorage.setItem(MODE_KEY, v)
  } catch {
    /* 无痕模式忽略 */
  }
})

/* ==================== 数据 ==================== */

/** 后端原样行 */
const plans = ref<PlanRow[]>([])

/** 主机台账 */
const hosts = ref<HostOption[]>([])

/** id → 主机名 */
const hostMap = ref<Record<number, string>>({})

/** 加载态 */
const loading = ref(false)

/** 错误文案 */
const error = ref('')

/** 单一筛选状态源；status 由页签驱动 */
const filters = reactive<PlanFilters>({ ...EMPTY_PLAN_FILTERS })

/** 当前时刻：让「进行中 / 待执行 / 已结束」与泳道上的位置跟着走 */
const now = ref(new Date())

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

/* ==================== 派生 ==================== */

/** 全量展示行 */
const allViews = computed(() => toPlanViews(plans.value, hostMap.value, now.value))

/** 已筛选的展示行 */
const views = computed(() => filterPlans(allViews.value, filters))

/** 状态计数（全量口径，页签数字不随筛选变化） */
const counts = computed(() => countPlans(allViews.value))

/** 页签 */
const tabs = computed(() => [
  { label: '全部', value: '', count: counts.value.total },
  ...PLAN_STATUS.map(s => ({
    label: s.label,
    value: s.value,
    count: counts.value.byStatus[s.value] ?? 0,
  })),
])

/** 控制栏筛选项 */
const FILTER_FIELDS: OpsFilterField[] = [
  { key: 'keyword', kind: 'search', placeholder: '搜索计划名 / 描述 / 主机', width: 220 },
  {
    key: 'type',
    kind: 'select',
    placeholder: '全部类型',
    width: 112,
    options: [
      { label: '全部类型', value: '' },
      ...PLAN_TYPES.map(t => ({ label: t.label, value: t.value })),
    ],
  },
]

/** 控制栏筛选模型 */
const filterModel = computed<Record<string, string>>(() => ({
  keyword: filters.keyword,
  type: filters.type,
}))

/**
 * 类型 → 色档。
 *
 * @param tone 类型档
 */
function toneOfType(tone: PlanTypeTone): OpsTone {
  switch (tone) {
    case 'maintenance':
      return 'brand'
    case 'upgrade':
      return 'info'
    case 'backup':
      return 'ok'
    case 'reboot':
      return 'warn'
    default:
      return 'mute'
  }
}

/**
 * 状态 → 色档。
 *
 * <p>执行中用 warn 而不是 ok：窗口开着意味着「现在不能动这台机器」，
 * 是需要被看见的状态；绿色会被读成「一切正常，随便操作」。</p>
 *
 * @param status 状态代码
 */
function toneOfStatus(status: string): OpsTone {
  switch (status) {
    case 'RUNNING':
      return 'warn'
    case 'COMPLETED':
      return 'ok'
    case 'CANCELLED':
      return 'mute'
    case 'PENDING':
      return 'info'
    default:
      return 'mute'
  }
}

/**
 * 泳道名：一台计划动几台主机就归到第一台。
 *
 * <p>多主机计划在泳道上只出现一次（挂在首台），不做「一计划多泳道」的重复绘制 ——
 * 那样同一根条会在几条泳道上重复出现，读者会以为排了几个窗口。
 * 完整主机列表在详情里给。</p>
 *
 * @param v 展示行
 */
function laneOf(v: PlanView): string {
  return v.hostNames[0] ?? '未指定主机'
}

/**
 * 展示行 → 外壳条目。
 *
 * @param v 展示行
 */
function toItem(v: PlanView): OpsItem {
  return {
    id: v.id,
    title: v.name,
    sub: `${v.startText} → ${v.endText}`,
    tone: toneOfStatus(v.statusCode),
    // 泳道按「计划类型」上色：一个主机泳道上的 6 个窗口若都按状态上色，
    // 全是「待执行」的灰，看不出哪根是备份、哪根是升级。
    blockTone: toneOfType(v.typeTone),
    statusText: v.statusLabel,
    badge: v.typeLabel,
    column: v.statusCode || '__other',
    lane: laneOf(v),
    startMs: Number.isFinite(v.startMs) ? v.startMs : null,
    endMs: Number.isFinite(v.endMs) ? v.endMs : null,
    startText: v.startText,
    endText: v.endText,
    durationText: v.durationText,
    meta: [
      { label: '类型', value: v.typeLabel },
      { label: '状态', value: v.statusLabel },
      { label: '开始', value: v.startText },
      { label: '结束', value: v.endText },
      { label: '时长', value: v.durationText },
      { label: '目标主机', value: v.hostText },
      { label: '描述', value: v.description || '—' },
    ],
    searchText: `${v.name} ${v.description} ${v.hostText} ${v.typeLabel} ${v.statusLabel}`,
  }
}

/** 条目 */
const items = computed<OpsItem[]>(() => views.value.map(toItem))

/* ==================== 分面栏 ==================== */

/**
 * 分面栏：状态 + 类型。
 *
 * <p>计数用全量口径（不受自身筛选影响），否则点进「升级」后其它类型的数字
 * 变 0，用户再也点不回去。</p>
 */
const facets = computed<OpsFacetGroup[]>(() => {
  const all = allViews.value
  const typeCount = (code: string): number => all.filter(v => v.typeCode === code).length
  return [
    {
      key: 'status',
      label: '状态',
      options: [
        { value: '', label: '全部', count: all.length },
        ...PLAN_STATUS.map(s => ({
          value: s.value,
          label: s.label,
          count: counts.value.byStatus[s.value] ?? 0,
          tone: toneOfStatus(s.value),
        })),
      ],
    },
    {
      key: 'type',
      label: '类型',
      options: [
        { value: '', label: '全部类型', count: all.length },
        ...PLAN_TYPES.map(t => ({
          value: t.value,
          label: t.label,
          count: typeCount(t.value),
          tone: toneOfType(t.tone),
        })),
      ],
    },
  ]
})

/** 分面模型：与 filters 同一字段，避免两套状态 */
const facetModel = computed<Record<string, string>>(() => ({
  status: filters.status,
  type: filters.type,
}))

/** 看板列 */
const columns = PLAN_STATUS.map(s => ({
  key: s.value,
  label: s.label,
  tone: toneOfStatus(s.value),
}))

/* ==================== 交互 ==================== */

/**
 * 分面筛选变化。
 *
 * @param key   字段（status / type）
 * @param value 值
 */
function onFacet(key: string, value: string): void {
  if (key === 'status') filters.status = value
  else if (key === 'type') filters.type = value
}

/**
 * 页签变化。
 *
 * @param value 状态代码
 */
function onTab(value: string): void {
  filters.status = value
}

/**
 * 控制栏筛选变化。
 *
 * @param key   字段
 * @param value 值
 */
function onFilterField(key: string, value: string): void {
  if (key === 'keyword') filters.keyword = value
  else if (key === 'type') filters.type = value
}

/**
 * 矩阵格子点击：按主机 + 时段筛选。
 *
 * @param lane     主机名
 * @param fromHour 时段起点小时
 */
function onCell(lane: string, fromHour: number): void {
  filters.keyword = lane
  message.info(`已按「${lane}」+ ${String(fromHour).padStart(2, '0')}:00 时段筛选`)
}

/** 清除全部条件 */
function clearFilters(): void {
  Object.assign(filters, EMPTY_PLAN_FILTERS)
}

/**
 * 由条目找展示行（详情栏按钮只拿到 OpsItem）
 *
 * @param item 条目
 */
function viewOf(item: OpsItem): PlanView | null {
  return allViews.value.find(v => v.id === Number(item.id)) ?? null
}

/* ==================== 数据加载 ==================== */

/** 加载 */
async function refresh(): Promise<void> {
  loading.value = true
  error.value = ''
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
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

/* ==================== 表单 ==================== */

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

/**
 * 详情栏编辑
 *
 * @param item 条目
 */
function onEditItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) openEdit(view)
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
 * 详情栏删除
 *
 * @param item 条目
 */
function onRemoveItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) void removePlan(view)
}

/* ==================== 生命周期 ==================== */

/** 时钟：30 秒一跳，让「执行中」与泳道位置保持真实 */
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
  <OpsDesk
    v-model:mode="mode"
    title="维护计划"
    desc="维护 / 升级 / 备份 / 重启的窗口期安排：什么时候、动哪几台、占多久。"
    :modes="MODES"
    :items="items"
    :facets="facets"
    :facet-model="facetModel"
    :tabs="tabs"
    :tab-value="filters.status"
    :filters="FILTER_FIELDS"
    :filter-model="filterModel"
    :columns="columns"
    lane-label="主机"
    :count-text="items.length === counts.total ? `共 ${counts.total} 个计划` : `筛选出 ${items.length} / ${counts.total} 个`"
    :loading="loading"
    :error="error"
    empty-text="还没有维护计划"
    empty-hint="点右上角「新建计划」安排第一个窗口。"
    :matrix-buckets="8"
    @update:tab-value="onTab"
    @facet="onFacet"
    @filter="onFilterField"
    @cell="onCell"
    @refresh="refresh"
  >
    <template #actions>
      <button
        v-if="filters.keyword || filters.type || filters.status"
        type="button"
        class="op-btn"
        @click="clearFilters"
      >
        清除筛选
      </button>
      <button type="button" class="op-btn is-primary" @click="openCreate">新建计划</button>
    </template>

    <template #detail="{ item }">
      <button type="button" class="op-btn" @click="onEditItem(item)">编辑</button>
      <button type="button" class="op-btn is-bad" @click="onRemoveItem(item)">删除</button>
      <span class="op-dim" style="font-size: 11px">计划 #{{ item.id }}</span>
    </template>
  </OpsDesk>

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
</template>

<style scoped lang="scss">
@use "../components/opsdesk/_ops-kit.scss";

.op-btn.is-primary {
  color: var(--el-color-primary, #5a4bd9);
  border-color: var(--el-color-primary-light-5, #b3a9fe);
  background: var(--el-color-primary-light-9, #f6f4ff);
  font-weight: 600;
}
</style>
