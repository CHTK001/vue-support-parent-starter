<script setup lang="ts">
/**
 * 批量作业 —— 编排层
 *
 * <p>这一页有两个数据面：任务定义（何时跑、跑什么、跑在哪几台）与执行结果
 * （成功没有、耗时多少）。四个档位各自回答其中一个问题：</p>
 * <ul>
 *   <li><b>三栏指挥台</b>（默认）：分面栏筛类型与启停，中间密集列表，右侧常驻
 *       命令全文与下次触发。最常做的事是「找到那个任务、点执行 / 看日志」。</li>
 *   <li><b>泳道时间墙</b>：一条泳道一个任务，条块从上次运行画到下次运行 ——
 *       条的长度就是任务的周期，一眼分出「每小时」与「每天凌晨」。</li>
 *   <li><b>矩阵热力台</b>：任务 × 时段，哪一格挤满了任务就说明那一时段在扎堆。</li>
 *   <li><b>状态看板</b>：定时·启用 / 定时·停用 / 脚本任务三列，停用的任务自己
 *       浮到中间那列，值班时不用先筛一遍。</li>
 * </ul>
 *
 * <p>「表格 / 卡片」这个旧开关由档位取代：卡片墙就是看板，留着两个记忆开关
 * 只会互相打架（切到看板、下次进来又被旧开关改回表格）。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from '@repo/core'
import { CronExpression } from '@repo/utils'
import { ReCanvasTable } from '@repo/ui/components/RePageKit'
import type { CanvasColumn } from '@repo/ui/components/RePageKit'
import OpsDesk from '../components/opsdesk/OpsDesk.vue'
import type {
  OpsFacetGroup,
  OpsFilterField,
  OpsItem,
  OpsMode,
  OpsModeMeta,
  OpsTone,
} from '../components/opsdesk/types'
import { getExecLogs, getJobs, delJob, queryHosts, runJobNow, saveJob } from '../api'
import {
  EMPTY_EXEC_FILTERS,
  countJobs,
  filterJobs,
  logStatusText,
  logTypeText,
  runStats,
  toJobViews,
  type ExecFilters,
  type JobRow,
  type JobTypeCode,
  type JobView,
  type LogRow,
} from './exec/execView'

/** 工作区页签嵌入：hostId 用于从「主机」出发时的过滤入口（页面内暂不消费，保留占位） */
defineProps<{ hostId?: number }>()

/** 主机选项 */
interface HostOption {
  id: number
  serverHostName: string
  serverHostAddress: string
  /** 主机 OS 类型（相同类型判定依据） */
  serverHostOsType?: string
}

/* ==================== 档位 ==================== */

const MODES: OpsModeMeta[] = [
  { id: 'deck', label: '三栏指挥台', thesis: '分面栏 + 密集列表 + 常驻命令全文，找到即执行' },
  { id: 'lanes', label: '泳道时间墙', thesis: '一个任务一条泳道，条长即周期：上次运行 → 下次运行' },
  { id: 'matrix', label: '矩阵热力台', thesis: '任务 × 时段，哪一格挤满说明任务在扎堆' },
  { id: 'kanban', label: '状态看板', thesis: '定时启用 / 定时停用 / 脚本任务三列，停用的自己浮出来' },
]

/** 档位记忆键（按页持久化） */
const MODE_KEY = 'ops-mode:server.exec-jobs'

/**
 * 读取已存档位。
 *
 * <p>存的旧值可能已不在开放集里，这里收敛而不是直接信任 —— 否则会渲染一个
 * 不存在的档位，页面一片空白。</p>
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

/** 主机台账 */
const hosts = ref<HostOption[]>([])

/** id → 主机名 */
const hostMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {}
  for (const h of hosts.value) map[h.id] = h.serverHostName
  return map
})

/** 计划任务原样行 */
const jobs = ref<JobRow[]>([])
const jobsLoading = ref(false)

/** 最近一次手动执行结果（runJobNow 的返回，不是日志列表） */
const lastResults = ref<LogRow[]>([])

/** 单一筛选状态源；type 由页签驱动 */
const filters = reactive<ExecFilters>({ ...EMPTY_EXEC_FILTERS })

/* ==================== 派生 ==================== */

/** 全量展示行 */
const allViews = computed(() => toJobViews(jobs.value, hostMap.value))

/** 已筛选的展示行 */
const views = computed(() => filterJobs(allViews.value, filters))

/** 计数（全量口径） */
const counts = computed(() => countJobs(allViews.value))

/** 页签 */
const tabs = computed(() => [
  { label: '全部', value: '', count: counts.value.total },
  { label: '定时', value: 'CRON', count: counts.value.cron },
  { label: '脚本', value: 'NONE', count: counts.value.script },
])

/** 控制栏筛选项 */
const FILTER_FIELDS: OpsFilterField[] = [
  { key: 'keyword', kind: 'search', placeholder: '搜索名称 / 命令 / 主机', width: 210 },
  {
    key: 'enabled',
    kind: 'select',
    placeholder: '全部状态',
    width: 108,
    options: [
      { label: '全部状态', value: '' },
      { label: '已启用', value: 'on' },
      { label: '已停用', value: 'off' },
    ],
  },
]

/** 控制栏筛选模型 */
const filterModel = computed<Record<string, string>>(() => ({
  keyword: filters.keyword,
  enabled: filters.enabled,
}))

/**
 * 周期文本。
 *
 * <p>分档是「分钟 / 小时 / 天」：任务的周期跨度从 5 分钟到 7 天，
 * 统一换算成分钟会让「每周一次」读成 10080。</p>
 *
 * @param ms 毫秒
 */
function spanText(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${Math.max(min, 1)} 分钟`
  const hours = Math.round(min / 6) / 10
  if (hours < 24) return `${hours} 小时`
  const days = Math.round((hours / 24) * 10) / 10
  return `${days} 天`
}

/**
 * cron 周期（毫秒）。
 *
 * <p>「周期」不取「上次运行 → 下次运行」：新建任务没有上次运行，手工触发过的任务
 * 上次运行也不在节奏上，两种情况下这个差值都不等于真实周期。这里直接问 cron
 * 表达式要两个相邻触发点，差值就是周期本身。</p>
 *
 * <p>结果按表达式字符串缓存：一次渲染里几十个任务共用同一个表达式时，
 * 不必每个都跑一遍推算。</p>
 *
 * @param cron cron 表达式
 */
const cycleCache = new Map<string, number>()

function cronCycleMs(cron: string): number {
  const key = cron.trim()
  if (!key || key === '—') return 0
  const hit = cycleCache.get(key)
  if (hit !== undefined) return hit
  let cycle = 0
  try {
    const fires = new CronExpression(key).getFireTimes(2, new Date())
    if (fires.length === 2) cycle = fires[1]!.getTime() - fires[0]!.getTime()
  } catch {
    cycle = 0
  }
  cycleCache.set(key, cycle)
  return cycle
}

/**
 * 展示行 → 外壳条目。
 *
 * <p>泳道上条块的长度取「一个周期」，末端的落点就是下次触发时刻 ——
 * 这样同一张时间墙上，每小时任务画成一小时长的条、每周任务画成一周长的条，
 * 疏密一眼可比。推算不出周期（脚本任务、表达式非法）时不画区间，
 * 归到「没有时间区间」的计数里。</p>
 *
 * @param v 展示行
 */
function toItem(v: JobView): OpsItem {
  const lastMs = v.lastRun ? v.lastRun.getTime() : null
  const nextMs = v.nextRun ? v.nextRun.getTime() : null
  const cycle =
    (v.typeCode === 'CRON' ? cronCycleMs(v.cronText) : 0) ||
    (lastMs !== null && nextMs !== null && nextMs > lastMs ? nextMs - lastMs : 0)
  // 末端优先取下次触发；连下次触发都没有就退回上次运行，起止同点由外壳画成标记
  const anchor = nextMs ?? lastMs
  const startMs = anchor === null ? null : cycle > 0 ? anchor - cycle : anchor
  const endMs = anchor
  return {
    id: v.id,
    title: v.name,
    sub: v.commandFirstLine || '（命令为空）',
    tone: v.enabled ? 'ok' : 'mute',
    statusText: v.enabledText,
    badge: v.typeLabel,
    column: v.typeCode === 'CRON' ? (v.enabled ? 'cron-on' : 'cron-off') : 'script',
    lane: v.name,
    startMs,
    endMs,
    startText: v.lastRunText,
    endText: v.nextRunText,
    durationText: cycle ? spanText(cycle) : '',
    meta: [
      { label: '类型', value: v.typeLabel },
      { label: 'cron', value: v.cronText },
      { label: '下次运行', value: v.nextRunText },
      { label: '上次运行', value: v.lastRunText },
      { label: '周期', value: cycle ? spanText(cycle) : '不可知' },
      { label: '超时', value: `${v.timeoutSec} 秒` },
      { label: '目标主机', value: v.hostText },
      { label: '备注', value: v.remark || '—' },
    ],
    code: v.command,
    searchText: `${v.name} ${v.command} ${v.hostText} ${v.remark} ${v.cronText}`,
  }
}

/** 条目 */
const items = computed<OpsItem[]>(() => views.value.map(toItem))

/* ==================== 分面栏 ==================== */

/**
 * 分面栏：类型 + 启停。
 *
 * <p>计数一律用全量口径（不受自身筛选影响），否则点进「定时」后「脚本」的数字
 * 变成 0，用户再也点不回去。</p>
 */
const facets = computed<OpsFacetGroup[]>(() => {
  const all = allViews.value
  const cron = all.filter(v => v.typeCode === 'CRON').length
  const on = all.filter(v => v.enabled).length
  return [
    {
      key: 'type',
      label: '类型',
      options: [
        { value: '', label: '全部', count: all.length },
        { value: 'CRON', label: '定时任务', count: cron, tone: 'brand' as OpsTone },
        { value: 'NONE', label: '脚本任务', count: all.length - cron, tone: 'info' as OpsTone },
      ],
    },
    {
      key: 'enabled',
      label: '启停',
      options: [
        { value: '', label: '全部', count: all.length },
        { value: 'on', label: '已启用', count: on, tone: 'ok' as OpsTone },
        { value: 'off', label: '已停用', count: all.length - on, tone: 'mute' as OpsTone },
      ],
    },
  ]
})

/** 分面模型：与 filters 同一字段，避免两套状态 */
const facetModel = computed<Record<string, string>>(() => ({
  type: filters.type,
  enabled: filters.enabled,
}))

/** 看板列 */
const columns = [
  { key: 'cron-on', label: '定时 · 启用', tone: 'ok' as OpsTone },
  { key: 'cron-off', label: '定时 · 停用', tone: 'warn' as OpsTone },
  { key: 'script', label: '脚本任务', tone: 'info' as OpsTone },
]

/* ==================== 交互 ==================== */

/**
 * 分面筛选变化。
 *
 * @param key   字段（type / enabled）
 * @param value 值
 */
function onFacet(key: string, value: string): void {
  if (key === 'type') filters.type = value
  else if (key === 'enabled') filters.enabled = value
}

/**
 * 页签变化。
 *
 * @param value 类型代码
 */
function onTab(value: string): void {
  filters.type = value
}

/**
 * 控制栏筛选变化。
 *
 * @param key   字段
 * @param value 值
 */
function onFilterField(key: string, value: string): void {
  if (key === 'keyword') filters.keyword = value
  else if (key === 'enabled') filters.enabled = value
}

/**
 * 矩阵格子点击：按任务名 + 时段筛选。
 *
 * @param lane     任务名
 * @param fromHour 时段起点小时
 */
function onCell(lane: string, fromHour: number): void {
  filters.keyword = lane
  message.info(`已按「${lane}」+ ${String(fromHour).padStart(2, '0')}:00 时段筛选`)
}

/** 清除全部条件 */
function clearFilters(): void {
  Object.assign(filters, EMPTY_EXEC_FILTERS)
}

// ==================== 工具 ====================

/**
 * 由展示行找后端原样行（表单需要完整字段）
 *
 * @param view 展示行
 */
function rawOf(view: JobView): JobRow | null {
  return jobs.value.find(r => r.id === view.id) ?? null
}

/**
 * 主机 OS 类型（大写）
 *
 * @param h 主机
 */
function hostOs(h: HostOption): string {
  return (h.serverHostOsType || '').toUpperCase()
}

/**
 * 任务的目标 OS 类型（取首个可识别主机）
 *
 * @param view 任务
 */
function jobOsTypeOf(view: JobView | null): string {
  if (!view) return ''
  for (const id of view.hostIds) {
    const h = hosts.value.find(x => x.id === id)
    if (h && hostOs(h)) return hostOs(h)
  }
  return ''
}

/** OS 类型展示名 */
function osLabel(type: string): string {
  if (!type) return '全部类型'
  const map: Record<string, string> = {
    LINUX: 'Linux',
    WINDOWS: 'Windows',
    MACOS: 'macOS',
    UNIX: 'Unix',
  }
  return map[type] || type
}

// ==================== 数据加载 ====================

/** 加载主机与任务 */
async function refresh(): Promise<void> {
  jobsLoading.value = true
  try {
    const [hostList, jobList] = await Promise.all([queryHosts(), getJobs()])
    hosts.value = (hostList ?? []).map((h: HostOption) => ({
      id: h.id,
      serverHostName: h.serverHostName,
      serverHostAddress: h.serverHostAddress,
      serverHostOsType: h.serverHostOsType,
    }))
    jobs.value = (jobList ?? []) as JobRow[]
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    jobsLoading.value = false
  }
}

/** 重新取任务（保存 / 删除后） */
async function reloadJobs(): Promise<void> {
  try {
    jobs.value = ((await getJobs()) ?? []) as JobRow[]
  } catch (e) {
    message.error((e as Error).message)
  }
}

// ==================== 任务表单 ====================

const jobFormVisible = ref(false)
const editingJobId = ref<number | null>(null)
const jobForm = ref<{
  msExecJobName: string
  msExecJobType: JobTypeCode
  msExecJobCron: string
  msExecJobCommand: string
  hostIdText: string
  msExecJobTimeout: number
}>({
  msExecJobName: '',
  msExecJobType: 'CRON',
  msExecJobCron: '0 0 3 * * ?',
  msExecJobCommand: '',
  hostIdText: '',
  msExecJobTimeout: 60,
})

/**
 * 打开任务表单
 *
 * @param view 编辑中的任务，省略表示新增
 */
function openJobForm(view?: JobView): void {
  const raw = view ? rawOf(view) : null
  editingJobId.value = raw?.id ?? null
  jobForm.value = {
    msExecJobName: raw?.msExecJobName ?? '',
    msExecJobType: view?.typeCode ?? 'CRON',
    msExecJobCron: raw?.msExecJobCron ?? '0 0 3 * * ?',
    msExecJobCommand: raw?.msExecJobCommand ?? '',
    hostIdText: view ? view.hostIds.join(',') : '',
    msExecJobTimeout: raw?.msExecJobTimeout ?? 60,
  }
  jobFormVisible.value = true
}

/** 提交任务表单（含 cron 前端预校验，复用 @repo/utils CronExpression） */
async function submitJob(): Promise<void> {
  const form = jobForm.value
  if (!form.msExecJobName.trim() || !form.msExecJobCommand.trim()) {
    message.warning('任务名称与命令均不能为空')
    return
  }
  if (!form.hostIdText.trim()) {
    message.warning('目标主机ID不能为空')
    return
  }
  if (form.msExecJobType === 'CRON') {
    try {
      new CronExpression(form.msExecJobCron.trim())
    } catch {
      message.warning(`cron 表达式非法: ${form.msExecJobCron}`)
      return
    }
  }
  try {
    await saveJob(editingJobId.value, {
      ...(editingJobId.value ? { id: editingJobId.value } : {}),
      msExecJobName: form.msExecJobName,
      msExecJobType: form.msExecJobType,
      msExecJobCron: form.msExecJobType === 'CRON' ? form.msExecJobCron : '',
      msExecJobCommand: form.msExecJobCommand,
      msExecJobHostIds: JSON.stringify(
        form.hostIdText
          .split(',')
          .map(v => Number(v.trim()))
          .filter(v => Number.isFinite(v) && v > 0),
      ),
      msExecJobTimeout: form.msExecJobTimeout,
      msExecJobEnabled: 1,
    })
    message.success('已保存')
    jobFormVisible.value = false
    await reloadJobs()
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 由条目找展示行（详情栏按钮只拿到 OpsItem）
 *
 * @param item 条目
 */
function viewOf(item: OpsItem): JobView | null {
  return views.value.find(v => v.id === Number(item.id)) ?? null
}

/**
 * 删除任务
 *
 * @param view 任务
 */
async function onDeleteJob(view: JobView): Promise<void> {
  try {
    await message.confirm(`确认删除任务「${view.name}」？`, '删除')
  } catch {
    return
  }
  try {
    await delJob(view.id)
    await reloadJobs()
    message.success('已删除')
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 详情栏删除（条目 → 展示行）
 *
 * @param item 条目
 */
function onDeleteItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) void onDeleteJob(view)
}

/**
 * 详情栏编辑
 *
 * @param item 条目
 */
function onEditItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) openJobForm(view)
}

/**
 * 详情栏执行
 *
 * @param item 条目
 */
function onRunItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) openRunDialog(view)
}

/**
 * 详情栏日志
 *
 * @param item 条目
 */
function onLogItem(item: OpsItem): void {
  const view = viewOf(item)
  if (view) openJobLogs(view)
}

// ==================== 执行（选择服务器） ====================

const runDialogVisible = ref(false)
const runJobView = ref<JobView | null>(null)
const runHostIds = ref<number[]>([])

/** 执行弹窗可选主机：与任务同类型（任务无类型时不过滤） */
const runHostOptions = computed(() => {
  const type = jobOsTypeOf(runJobView.value)
  const list = type ? hosts.value.filter(h => hostOs(h) === type) : hosts.value
  return list.map(h => ({ label: `${h.serverHostName} (${h.serverHostAddress})`, value: h.id }))
})

/**
 * 打开「选择服务器（相同类型）」执行弹窗
 *
 * @param view 任务
 */
function openRunDialog(view: JobView): void {
  runJobView.value = view
  const allowed = new Set(runHostOptions.value.map(o => o.value as number))
  const preset = view.hostIds.filter(id => allowed.has(id))
  runHostIds.value = preset.length ? preset : [...allowed]
  runDialogVisible.value = true
}

/** 确认执行：按所选服务器触发任务 */
async function confirmRun(): Promise<void> {
  const view = runJobView.value
  if (!view) return
  if (!runHostIds.value.length) {
    message.warning('请至少选择一台服务器')
    return
  }
  try {
    lastResults.value = (await runJobNow(view.id, runHostIds.value)) as LogRow[]
    runDialogVisible.value = false
    const stats = runStats(lastResults.value)
    if (stats.failed) message.warning(`${stats.total} 台 · 成功 ${stats.success} · 失败 ${stats.failed}`)
    else message.success(`${stats.total} 台全部成功 · 平均 ${stats.avgCostMs} ms`)
  } catch (e) {
    message.error((e as Error).message)
  }
}

/** 最近一次执行统计 */
const lastStats = computed(() => runStats(lastResults.value))

// ==================== 执行日志抽屉 ====================

const logDrawerVisible = ref(false)
const logJobId = ref<number | null>(null)
const logJobName = ref('')
const historyLogs = ref<LogRow[]>([])
const historyType = ref('')

/** 日志表列 */
const logCols: CanvasColumn[] = [
  { key: 'msExecLogHostName', label: '主机', width: '130px' },
  { key: 'type', label: '类型', width: '84px' },
  { key: 'msExecLogCommand', label: '命令 / 路径', width: 'minmax(0, 1.3fr)' },
  { key: 'status', label: '状态', width: '76px' },
  { key: 'msExecLogOutput', label: '输出', width: 'minmax(0, 1.2fr)' },
  { key: 'msExecLogError', label: '错误', width: 'minmax(0, 1fr)' },
  { key: 'msExecLogEndTime', label: '结束时间', width: '150px' },
  { key: 'msExecLogCostMs', label: '耗时(ms)', width: '84px', align: 'right' },
]

/**
 * 行键
 *
 * @param row 行
 */
function rowKey(row: Record<string, unknown>): number {
  return Number(row.id)
}

/** 读取执行日志 */
async function loadHistory(): Promise<void> {
  try {
    historyLogs.value = ((await getExecLogs(
      historyType.value || undefined,
      undefined,
      logJobId.value ?? undefined,
    )) ?? []) as LogRow[]
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 打开「全部日志」抽屉（按任务过滤）
 *
 * @param view 任务
 */
function openJobLogs(view: JobView): void {
  logJobId.value = view.id
  logJobName.value = view.name
  if (logDrawerVisible.value) void loadHistory()
  else logDrawerVisible.value = true
}

/** 打开「执行日志」抽屉（全部日志，不带任务过滤） */
function openAllLogs(): void {
  logJobId.value = null
  logJobName.value = ''
  if (logDrawerVisible.value) void loadHistory()
  else logDrawerVisible.value = true
}

/** 抽屉打开时拉一次日志 */
watch(logDrawerVisible, open => {
  if (open) void loadHistory()
})

// ==================== 生命周期 ====================

onMounted(refresh)
</script>

<template>
  <OpsDesk
    v-model:mode="mode"
    title="批量作业"
    desc="定时任务按 cron 后台执行，脚本任务仅手动执行；执行结果按主机逐台回传。"
    :modes="MODES"
    :items="items"
    :facets="facets"
    :facet-model="facetModel"
    :tabs="tabs"
    :tab-value="filters.type"
    :filters="FILTER_FIELDS"
    :filter-model="filterModel"
    :columns="columns"
    lane-label="任务"
    lane-hint="条长 = 任务周期（上次运行 → 下次运行）；从未运行过的任务只显示下次触发点 · 点击查看"
    :count-text="items.length === counts.total ? `共 ${counts.total} 个任务` : `筛选出 ${items.length} / ${counts.total} 个`"
    :loading="jobsLoading"
    empty-text="还没有计划任务"
    empty-hint="点右上角「新增任务」创建第一个定时任务。"
    :matrix-buckets="8"
    @update:tab-value="onTab"
    @facet="onFacet"
    @filter="onFilterField"
    @cell="onCell"
    @refresh="refresh"
  >
    <template #actions>
      <span v-if="lastResults.length" class="run-chip is-summary">
        上次执行 {{ lastStats.total }} 台 · 成功
        <b class="is-ok">{{ lastStats.success }}</b>
        <template v-if="lastStats.failed">
          · 失败 <b class="is-fail">{{ lastStats.failed }}</b>
        </template>
        · 平均 {{ lastStats.avgCostMs }} ms
      </span>
      <button v-if="lastResults.length" type="button" class="op-btn" @click="openAllLogs">
        查看日志
      </button>
      <button
        v-if="filters.keyword || filters.type || filters.enabled"
        type="button"
        class="op-btn"
        @click="clearFilters"
      >
        清除筛选
      </button>
      <button type="button" class="op-btn is-primary" @click="openJobForm()">新增任务</button>
    </template>

    <template #row-tail="{ item }">
      <span v-if="item.badge" class="op-dim" style="font-size: 10.5px">{{ item.badge }}</span>
    </template>

    <template #detail="{ item }">
      <button type="button" class="op-btn" @click="onRunItem(item)">执行</button>
      <button type="button" class="op-btn" @click="onLogItem(item)">日志</button>
      <button type="button" class="op-btn" @click="onEditItem(item)">编辑</button>
      <button type="button" class="op-btn is-bad" @click="onDeleteItem(item)">删除</button>
    </template>
  </OpsDesk>

  <!-- 任务表单 -->
  <ReDialog
    v-model="jobFormVisible"
    :title="editingJobId ? '编辑任务' : '新增任务'"
    width="600"
    :height="500"
    confirm-text="保存"
    cancel-text="取消"
    :footer-hidden="false"
    @confirm="submitJob"
    @cancel="jobFormVisible = false"
  >
    <ReForm label-width="100px" label-position="right">
      <ReFormItem label="任务名称" required>
        <ReInput v-model="jobForm.msExecJobName" placeholder="如 每日清理临时文件" />
      </ReFormItem>
      <ReFormItem label="任务类型" required>
        <ReRadioGroup v-model="jobForm.msExecJobType" button capsule>
          <ReRadioButton value="CRON">定时</ReRadioButton>
          <ReRadioButton value="NONE">脚本</ReRadioButton>
        </ReRadioGroup>
      </ReFormItem>
      <ReFormItem v-if="jobForm.msExecJobType === 'CRON'" label="cron 表达式" required>
        <ReInput v-model="jobForm.msExecJobCron" placeholder="6 域：秒 分 时 日 月 周，如 0 0 3 * * ?" />
      </ReFormItem>
      <ReFormItem label="命令" required>
        <ReInput v-model="jobForm.msExecJobCommand" type="textarea" :rows="3" />
      </ReFormItem>
      <ReFormItem label="目标主机ID" required>
        <ReInput v-model="jobForm.hostIdText" placeholder="逗号分隔，如 1,2,3" />
      </ReFormItem>
      <ReFormItem label="超时(秒)">
        <ReInputNumber v-model="jobForm.msExecJobTimeout" :min="5" :max="3600" />
      </ReFormItem>
    </ReForm>
  </ReDialog>

  <!-- 执行：选择服务器（相同类型） -->
  <ReDialog
    v-model="runDialogVisible"
    title="选择服务器（相同类型）"
    width="560"
    confirm-text="执行"
    cancel-text="取消"
    :footer-hidden="false"
    @confirm="confirmRun"
    @cancel="runDialogVisible = false"
  >
    <div class="run-hint">
      任务「<b>{{ runJobView?.name }}</b>」目标类型
      <span class="op-pill t-brand">{{ osLabel(jobOsTypeOf(runJobView)) }}</span>
      —— 仅可选择与该类型一致的服务器。
    </div>
    <ReSelect
      v-model="runHostIds"
      multiple
      filterable
      collapse-tags
      placeholder="选择服务器"
      :data="runHostOptions"
      style="width: 100%"
    />
  </ReDialog>

  <!-- 执行日志抽屉 -->
  <ReDrawer
    v-model="logDrawerVisible"
    :title="logJobId ? `执行日志 · ${logJobName}` : '执行日志'"
    direction="rtl"
    size="62%"
    :footer-hidden="true"
    close-only
    @cancel="logDrawerVisible = false"
  >
    <template #content>
      <div class="log-filter">
        <ReRadioGroup v-model="historyType" button capsule @change="loadHistory">
          <ReRadioButton value="">全部</ReRadioButton>
          <ReRadioButton value="COMMAND">命令</ReRadioButton>
          <ReRadioButton value="FILE">文件</ReRadioButton>
          <ReRadioButton value="JOB">计划任务</ReRadioButton>
        </ReRadioGroup>
      </div>

      <ReCanvasTable
        :rows="historyLogs as unknown as Array<Record<string, unknown>>"
        :columns="logCols"
        :row-key="rowKey"
        empty-text="暂无执行日志"
        empty-hint="任务执行过之后，这里会按主机逐条列出结果。"
      >
        <template #cell-msExecLogHostName="{ row }">
          <span class="op-ellipsis">{{ (row as unknown as LogRow).msExecLogHostName || '—' }}</span>
        </template>
        <template #cell-type="{ row }">
          <span class="op-mono op-dim">{{ logTypeText((row as unknown as LogRow).msExecLogType) }}</span>
        </template>
        <template #cell-msExecLogCommand="{ row }">
          <span class="op-mono op-ellipsis">{{ (row as unknown as LogRow).msExecLogCommand || '—' }}</span>
        </template>
        <template #cell-status="{ row }">
          <span
            class="op-pill"
            :class="logStatusText((row as unknown as LogRow).msExecLogStatus) === '成功' ? 't-ok' : 't-bad'"
          >
            {{ logStatusText((row as unknown as LogRow).msExecLogStatus) }}
          </span>
        </template>
        <template #cell-msExecLogOutput="{ row }">
          <span class="op-ellipsis op-dim" :title="(row as unknown as LogRow).msExecLogOutput">
            {{ (row as unknown as LogRow).msExecLogOutput || '—' }}
          </span>
        </template>
        <template #cell-msExecLogError="{ row }">
          <span class="op-ellipsis is-danger" :title="(row as unknown as LogRow).msExecLogError">
            {{ (row as unknown as LogRow).msExecLogError || '—' }}
          </span>
        </template>
        <template #cell-msExecLogEndTime="{ row }">
          <span class="op-num op-dim">{{ (row as unknown as LogRow).msExecLogEndTime || '—' }}</span>
        </template>
        <template #cell-msExecLogCostMs="{ row }">
          <span class="op-num">{{ (row as unknown as LogRow).msExecLogCostMs ?? '—' }}</span>
        </template>
      </ReCanvasTable>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
@use "../components/opsdesk/_ops-kit.scss";

/* 页头的「上次执行」摘要：一行放得下就不折，窄屏自己折 */
.run-chip.is-summary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 9px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary, #5c6270);
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}

.run-chip b.is-ok {
  color: var(--el-color-success, #2fbf71);
}

.run-chip b.is-fail {
  color: var(--el-color-danger, #e5534b);
}

.op-btn.is-primary {
  color: var(--el-color-primary, #5a4bd9);
  border-color: var(--el-color-primary-light-5, #b3a9fe);
  background: var(--el-color-primary-light-9, #f6f4ff);
  font-weight: 600;
}

.log-filter {
  margin-bottom: 10px;
}

.run-hint {
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary, #5c6270);
}

.is-danger {
  color: var(--el-color-danger, #c9403a);
}
</style>
