<script setup lang="ts">
/**
 * 批量作业 —— 编排层
 *
 * <p>计划任务与最近执行结果。这一页有两个数据面：任务定义（何时跑、跑什么、跑在哪几台）
 * 与执行结果（成功没有、耗时多少）。五个方向都把「下次触发落在一昼夜的哪个位置」
 * 提到可见处 —— 原先只有一列原始时间戳，读者看不出「凌晨 3 点这一堆任务全挤在一起」。</p>
 *
 * <p>关于「表格 / 卡片」这个旧开关：它由方向坞取代（卡片墙即是原来的卡片布局）。
 * 两个开关同时存在会互相打架 —— 切到卡片墙、下次进来又被旧开关改回表格，
 * 因此这个开关连同它的 localStorage 键一起删掉，记忆统一交给方向坞。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from '@repo/core'
import { CronExpression } from '@repo/utils'
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
import { getExecLogs, getJobs, delJob, queryHosts, runJobNow, saveJob } from '../api'
import {
  EMPTY_EXEC_FILTERS,
  countJobs,
  filterJobs,
  hourHistogram,
  logStatusText,
  logTypeText,
  runStats,
  toJobViews,
  triggerTicks,
  type ExecFilters,
  type JobRow,
  type JobTypeCode,
  type JobView,
  type LogRow,
} from './exec/execView'

/** 主机选项 */
interface HostOption {
  id: number
  serverHostName: string
  serverHostAddress: string
  /** 主机 OS 类型（相同类型判定依据） */
  serverHostOsType?: string
}

// ==================== 数据 ====================

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

/** 档案柜方向的选中项 */
const pickedId = ref<number | null>(null)

// ==================== 方向 ====================

/**
 * 开放全部五个方向。
 *
 * <p>顺序即默认：第一个是「工单台」，因为这一页最常做的事是「找到某个任务、点执行 /
 * 看日志」，密集列表比任何聚合视图都快。原先那个「表格 / 卡片」开关由方向坞取代 ——
 * 卡片墙就是原来的卡片布局，留着两个记忆开关只会互相打架（切到卡片墙、下次进来
 * 又被旧开关改回表格）。</p>
 */
const ALLOWED: PageVariantId[] = ['console', 'rhythm', 'instrument', 'dossier', 'wall']

const { variant, items, dockVisible, setVariant } = usePageVariant({
  pageKey: 'server.exec-jobs',
  allowed: ALLOWED,
})

// ==================== 派生 ====================

/** 全量展示行 */
const allViews = computed(() => toJobViews(jobs.value, hostMap.value))

/** 已筛选的展示行 */
const views = computed(() => filterJobs(allViews.value, filters))

/** 计数（全量口径） */
const counts = computed(() => countJobs(allViews.value))

/** 页签 */
const tabs = computed<TabItem[]>(() => [
  { label: '全部', value: '', count: counts.value.total },
  { label: '定时', value: 'CRON', count: counts.value.cron },
  { label: '脚本', value: 'NONE', count: counts.value.script },
])

/** 控制栏 */
const stageFilters = [
  { key: 'keyword', kind: 'search' as const, placeholder: '搜索名称 / 命令 / 主机', width: 240 },
  {
    key: 'enabled',
    kind: 'select' as const,
    placeholder: '全部状态',
    width: 108,
    options: [
      { label: '全部状态', value: '' },
      { label: '已启用', value: 'on' },
      { label: '已停用', value: 'off' },
    ],
  },
]

/** 遥测 */
const teleCells = computed(() => [
  { label: '任务总数', value: counts.value.total },
  { label: '定时任务', value: counts.value.cron },
  { label: '脚本任务', value: counts.value.script },
  {
    label: '已启用',
    value: counts.value.enabled,
    tone: (counts.value.disabled > 0 ? 'warn' : undefined) as 'warn' | undefined,
  },
])

/** 一昼夜触发分布（仪表图表） */
const histogram = computed(() => hourHistogram(allViews.value))

/** 分布峰值 */
const histogramPeak = computed(() => Math.max(1, ...histogram.value.map(h => h.count)))

/** 脚本任务数（无下次运行时刻，画不到时间轴上） */
const untimedCount = computed(() => allViews.value.filter(v => v.nextPercent === null).length)

/** 24 小时轴上的触发刻度 */
const ticks = computed(() => triggerTicks(views.value, 13))

/** 轴高：按实际道数撑开 */
const axisHeight = computed(() => {
  const maxTop = ticks.value.reduce((m, t) => Math.max(m, t.top), 0)
  return Math.max(maxTop + 13 + 6, 30)
})

/** 时间带上的条 */
const bandItems = computed<BandItem[]>(() =>
  ticks.value.map(t => ({
    key: t.id,
    left: t.leftPercent,
    width: 1.2,
    top: t.top,
    color: t.typeLabel === '脚本' ? 'var(--el-text-color-disabled)' : 'var(--el-color-primary)',
    title: `${t.name} · ${t.typeLabel} · 下次 ${t.nextRunText}`,
  })),
)

/** 「现在」在 24 小时轴上的位置 */
const nowPercent = computed(() => {
  const d = new Date()
  return ((d.getHours() + d.getMinutes() / 60) / 24) * 100
})

/** 手动执行结果统计 */
const lastStats = computed(() => runStats(lastResults.value))

/** 工单台列 */
const consoleCols: CanvasColumn[] = [
  { key: 'name', label: '任务名称 / 命令', width: 'minmax(0, 1.4fr)' },
  { key: 'type', label: '类型', width: '62px' },
  { key: 'cron', label: 'cron', width: '118px' },
  { key: 'nextRun', label: '下次运行', width: '118px' },
  { key: 'hosts', label: '主机', width: '64px', align: 'right' },
  { key: 'enabled', label: '状态', width: '70px' },
]

/** 仪表方向的紧凑列 */
const instrumentCols: CanvasColumn[] = [
  { key: 'name', label: '任务名称', width: 'minmax(0, 1.4fr)' },
  { key: 'type', label: '类型', width: '62px' },
  { key: 'nextRun', label: '下次运行', width: '118px' },
  { key: 'enabled', label: '状态', width: '70px' },
]

/** 节奏方向的列 */
const rhythmCols: CanvasColumn[] = [
  { key: 'name', label: '任务名称', width: 'minmax(0, 1.4fr)' },
  { key: 'type', label: '类型', width: '62px' },
  { key: 'cron', label: 'cron', width: '118px' },
  { key: 'nextRun', label: '下次运行', width: '150px' },
]

/** 档案柜分组：按类型 */
const groups = computed<CanvasGroup[]>(() => [
  {
    key: 'CRON',
    label: '定时任务',
    rows: views.value.filter(v => v.typeCode === 'CRON') as unknown as CanvasGroup['rows'],
  },
  {
    key: 'NONE',
    label: '脚本任务',
    rows: views.value.filter(v => v.typeCode === 'NONE') as unknown as CanvasGroup['rows'],
  },
])

/** 档案柜当前详情 */
const picked = computed(
  () => views.value.find(v => v.id === pickedId.value) ?? views.value[0] ?? null,
)

/** 计划任务表列（抽屉里的执行日志） */
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

// ==================== 工具 ====================

/**
 * 行键
 *
 * @param row 行
 */
function rowKey(row: Record<string, unknown>): number {
  return Number(row.id)
}

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
  const map: Record<string, string> = { LINUX: 'Linux', WINDOWS: 'Windows', MACOS: 'macOS', UNIX: 'Unix' }
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
    const logs = await runJobNow(view.id, runHostIds.value)
    lastResults.value = normalizeLogs(logs as LogRow[])
    runDialogVisible.value = false
    message.success('已触发，结果见页头')
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 归一化后端日志
 *
 * @param logs 后端日志数组
 */
function normalizeLogs(logs?: LogRow[] | null): LogRow[] {
  return (logs ?? []).map(l => ({ ...l }))
}

// ==================== 执行日志抽屉 ====================

const logDrawerVisible = ref(false)
const historyLogs = ref<LogRow[]>([])
const historyType = ref('')
const logJobId = ref<number | null>(null)
const logJobName = ref('')

watch(logDrawerVisible, show => {
  if (show) void loadHistory()
})

/** 加载历史执行日志（抽屉打开、类型切换或按任务过滤时调用） */
async function loadHistory(): Promise<void> {
  try {
    historyLogs.value = (await getExecLogs(
      historyType.value || undefined,
      undefined,
      logJobId.value ?? undefined,
    )) as LogRow[]
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

// ==================== 生命周期 ====================

onMounted(refresh)
</script>

<template>
  <RePageStage
    :variant="variant"
    title="批量作业"
    desc="定时任务按 cron 后台执行，脚本任务仅手动执行；执行结果按主机逐台回传。"
    :variant-items="items"
    :dock-visible="dockVisible"
    :tabs="tabs"
    :tab-value="filters.type"
    :filters="stageFilters"
    :filter-model="filters as unknown as Record<string, string>"
    :count-text="views.length === counts.total ? `共 ${counts.total} 个任务` : `筛选出 ${views.length} / ${counts.total} 个`"
    :loading="jobsLoading"
    refresh-tip="刷新任务列表"
    @update:variant="setVariant"
    @update:tab-value="(v) => (filters.type = v)"
    @filter="(k, v) => (filters[k as 'keyword' | 'enabled'] = v)"
    @refresh="refresh"
  >
    <template #head-actions>
      <ReButton show-text icon="Document" @click="openAllLogs">执行日志</ReButton>
      <ReButton show-text icon="Plus" type="primary" @click="openJobForm()">新增任务</ReButton>
    </template>

    <!-- 最近一次手动执行结果：紧凑一条，详细内容在「执行日志」抽屉里 -->
    <template #alerts>
      <div v-if="lastResults.length" class="run-strip">
        <div class="run-strip__left">
          <span class="run-strip__title">最近一次执行</span>
          <span class="run-strip__stat">
            {{ lastStats.total }} 台 · 成功 <b class="is-ok">{{ lastStats.success }}</b>
            <template v-if="lastStats.failed"> · 失败 <b class="is-fail">{{ lastStats.failed }}</b></template>
            · 平均 {{ lastStats.avgCostMs }} ms
          </span>
        </div>
        <div class="run-strip__hosts">
          <span
            v-for="l in lastResults.slice(0, 6)"
            :key="l.id"
            class="run-chip"
            :class="String(l.msExecLogStatus).toUpperCase() === 'SUCCESS' ? 'is-ok' : 'is-fail'"
            :title="`${l.msExecLogHostName ?? ''} · ${l.msExecLogOutput || l.msExecLogError || '无输出'}`"
          >
            <i class="pk-dot" />{{ l.msExecLogHostName || `#${l.id}` }}
          </span>
          <span v-if="lastResults.length > 6" class="pk-faint">等 {{ lastResults.length }} 台</span>
        </div>
        <button type="button" class="pk-link" @click="openAllLogs">查看日志</button>
      </div>
    </template>

    <!-- ==================== 节奏：一昼夜的触发分布 ==================== -->
    <template #rhythm>
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
            下次触发在一天中的位置
            <span>每根条是一个定时任务的下次触发时刻，撞在一起说明那一刻会同时压上去</span>
          </span>
          <span class="pk-band__legend">
            <span class="pk-band__legend-item">
              <i class="pk-band__legend-chip" style="background: var(--el-color-primary)" />定时
            </span>
            <span v-if="untimedCount" class="pk-band__legend-item pk-faint">
              {{ untimedCount }} 个脚本任务无下次触发，未画在轴上
            </span>
          </span>
        </template>
      </ReCanvasBand>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="rhythmCols"
        :row-key="rowKey"
        clickable
        :loading="jobsLoading"
        empty-text="还没有计划任务"
        empty-hint="点右上角「新增任务」创建第一个定时任务。"
        @row-click="(r) => openJobForm(r as unknown as JobView)"
      >
        <template #cell-name="{ row }">
          <div class="pk-strong pk-ellipsis">{{ (row as unknown as JobView).name }}</div>
          <div class="pk-sub pk-ellipsis pk-mono-sm">{{ (row as unknown as JobView).commandFirstLine }}</div>
        </template>
        <template #cell-type="{ row }">
          <span class="jtype" :class="`is-${(row as unknown as JobView).typeCode.toLowerCase()}`">
            {{ (row as unknown as JobView).typeLabel }}
          </span>
        </template>
        <template #cell-cron="{ row }">
          <span class="pk-mono-sm pk-dim">{{ (row as unknown as JobView).cronText }}</span>
        </template>
        <template #cell-nextRun="{ row }">
          <span class="pk-num">{{ (row as unknown as JobView).nextRunText }}</span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 工单台：一屏尽量多的任务 ==================== -->
    <template #console>
      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="consoleCols"
        :row-key="rowKey"
        clickable
        :loading="jobsLoading"
        empty-text="还没有计划任务"
        empty-hint="点右上角「新增任务」创建第一个定时任务。"
        @row-click="(r) => openJobForm(r as unknown as JobView)"
      >
        <template #cell-name="{ row }">
          <div class="pk-strong pk-ellipsis">{{ (row as unknown as JobView).name }}</div>
          <div class="pk-sub pk-ellipsis pk-mono-sm">{{ (row as unknown as JobView).commandFirstLine }}</div>
        </template>
        <template #cell-type="{ row }">
          <span class="jtype" :class="`is-${(row as unknown as JobView).typeCode.toLowerCase()}`">
            {{ (row as unknown as JobView).typeLabel }}
          </span>
        </template>
        <template #cell-cron="{ row }">
          <span class="pk-mono-sm pk-dim pk-ellipsis">{{ (row as unknown as JobView).cronText }}</span>
        </template>
        <template #cell-nextRun="{ row }">
          <span class="pk-num pk-ellipsis">{{ (row as unknown as JobView).nextRunText }}</span>
        </template>
        <template #cell-hosts="{ row }">
          <span class="pk-num pk-dim" :title="(row as unknown as JobView).hostText">
            {{ (row as unknown as JobView).hostCount || '—' }}
          </span>
        </template>
        <template #cell-enabled="{ row }">
          <span class="jstate" :class="(row as unknown as JobView).enabled ? 'is-on' : 'is-off'">
            <i class="pk-dot" />{{ (row as unknown as JobView).enabledText }}
          </span>
        </template>
        <template #row-actions="{ row }">
          <button type="button" class="pk-link" @click="openRunDialog(row as unknown as JobView)">执行</button>
          <button type="button" class="pk-link" @click="openJobLogs(row as unknown as JobView)">日志</button>
          <button type="button" class="pk-link" @click="openJobForm(row as unknown as JobView)">编辑</button>
          <button type="button" class="pk-link pk-link--danger" @click="onDeleteJob(row as unknown as JobView)">
            删除
          </button>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 仪表：调度密度先看整体 ==================== -->
    <template #instrument>
      <ReCanvasTelemetry :cells="teleCells" />

      <div class="dist">
        <div class="dist__head">
          <span class="dist__title">一昼夜触发分布</span>
          <span class="dist__note">按下次触发的小时归档 · 某一格特别高说明任务扎堆在同一时刻</span>
        </div>
        <div class="dist__bars">
          <div v-for="h in histogram" :key="h.hour" class="dist__col" :title="`${h.hour} 点 · ${h.count} 个任务`">
            <span
              class="dist__bar"
              :style="{
                height: `${h.count ? Math.max((h.count / histogramPeak) * 52, 3) : 0}px`,
                background: h.count ? 'var(--el-color-primary)' : 'transparent',
              }"
            />
            <span class="dist__tick">{{ h.hour % 4 === 0 ? h.hour : '' }}</span>
          </div>
        </div>
      </div>

      <ReCanvasTable
        :rows="views as unknown as Array<Record<string, unknown>>"
        :columns="instrumentCols"
        :row-key="rowKey"
        clickable
        :loading="jobsLoading"
        empty-text="还没有计划任务"
        @row-click="(r) => openJobForm(r as unknown as JobView)"
      >
        <template #cell-name="{ row }">
          <span class="pk-strong pk-ellipsis">{{ (row as unknown as JobView).name }}</span>
        </template>
        <template #cell-type="{ row }">
          <span class="jtype" :class="`is-${(row as unknown as JobView).typeCode.toLowerCase()}`">
            {{ (row as unknown as JobView).typeLabel }}
          </span>
        </template>
        <template #cell-nextRun="{ row }">
          <span class="pk-num">{{ (row as unknown as JobView).nextRunText }}</span>
        </template>
        <template #cell-enabled="{ row }">
          <span class="jstate" :class="(row as unknown as JobView).enabled ? 'is-on' : 'is-off'">
            <i class="pk-dot" />{{ (row as unknown as JobView).enabledText }}
          </span>
        </template>
      </ReCanvasTable>
    </template>

    <!-- ==================== 档案柜：左栏按类型，右栏常驻任务定义 ==================== -->
    <template #dossier>
      <ReCanvasSplit
        :rows="views as unknown as Array<Record<string, unknown>>"
        :groups="groups"
        :row-key="rowKey"
        :active-key="picked?.id ?? null"
        :rail-width="252"
        :loading="jobsLoading"
        empty-text="没有匹配的计划任务"
        empty-hint="清掉搜索词或换一个状态页签试试。"
        @pick="(k) => (pickedId = Number(k))"
      >
        <template #rail-item="{ row }">
          <span class="pk-rail__title">
            <i class="pk-dot" :class="(row as unknown as JobView).enabled ? 'pk-dot--live' : ''" />
            <span class="pk-ellipsis">{{ (row as unknown as JobView).name }}</span>
          </span>
          <span class="pk-rail__meta">
            <span class="pk-mono-sm pk-dim">{{ (row as unknown as JobView).cronText }}</span>
          </span>
        </template>

        <template #detail-head="{ row }">
          <div style="min-width: 0">
            <div class="detail__title pk-ellipsis">{{ (row as unknown as JobView).name }}</div>
            <div class="pk-sub">
              <span class="jtype" :class="`is-${(row as unknown as JobView).typeCode.toLowerCase()}`">
                {{ (row as unknown as JobView).typeLabel }}
              </span>
              <span class="detail__gap">{{ (row as unknown as JobView).hostCount }} 台主机</span>
            </div>
          </div>
          <span class="jstate" :class="(row as unknown as JobView).enabled ? 'is-on' : 'is-off'" style="margin-left: auto">
            {{ (row as unknown as JobView).enabledText }}
          </span>
        </template>

        <template #detail="{ row }">
          <pre class="cmd">{{ (row as unknown as JobView).command || '（命令为空）' }}</pre>

          <div class="pk-kv">
            <span class="pk-kv__label">cron</span>
            <span class="pk-kv__value pk-mono-sm">{{ (row as unknown as JobView).cronText }}</span>
            <span class="pk-kv__label">下次运行</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as JobView).nextRunText }}</span>
            <span class="pk-kv__label">上次运行</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as JobView).lastRunText }}</span>
            <span class="pk-kv__label">超时</span>
            <span class="pk-kv__value pk-num">{{ (row as unknown as JobView).timeoutSec }} 秒</span>
            <span class="pk-kv__label">目标主机</span>
            <span class="pk-kv__value">{{ (row as unknown as JobView).hostText }}</span>
            <span class="pk-kv__label">备注</span>
            <span class="pk-kv__value">{{ (row as unknown as JobView).remark || '—' }}</span>
          </div>
        </template>

        <template #detail-actions="{ row }">
          <ReButton type="primary" @click="openRunDialog(row as unknown as JobView)">执行</ReButton>
          <ReButton @click="openJobLogs(row as unknown as JobView)">全部日志</ReButton>
          <ReButton @click="openJobForm(row as unknown as JobView)">编辑</ReButton>
          <ReButton type="danger" @click="onDeleteJob(row as unknown as JobView)">删除</ReButton>
        </template>
      </ReCanvasSplit>
    </template>

    <!-- ==================== 卡片墙：命令全文摊在卡上 ==================== -->
    <template #wall>
      <ReCanvasCards
        :rows="views as unknown as Array<Record<string, unknown>>"
        :row-key="rowKey"
        :min-width="288"
        clickable
        :loading="jobsLoading"
        empty-text="还没有计划任务"
        empty-hint="点右上角「新增任务」创建第一个定时任务。"
        @row-click="(r) => openJobForm(r as unknown as JobView)"
      >
        <template #card="{ row }">
          <header class="pk-card__head">
            <span class="pk-card__title">{{ (row as unknown as JobView).name }}</span>
            <span class="jtype" :class="`is-${(row as unknown as JobView).typeCode.toLowerCase()}`">
              {{ (row as unknown as JobView).typeLabel }}
            </span>
          </header>

          <pre class="cmd cmd--card">{{ (row as unknown as JobView).commandFirstLine || '（命令为空）' }}</pre>

          <div class="card__fields">
            <span class="card__k">cron</span>
            <span class="card__v pk-mono-sm">{{ (row as unknown as JobView).cronText }}</span>

            <span class="card__k">下次</span>
            <span class="card__v pk-num">{{ (row as unknown as JobView).nextRunText }}</span>

            <span class="card__k">上次</span>
            <span class="card__v pk-num">{{ (row as unknown as JobView).lastRunText }}</span>

            <span class="card__k">主机</span>
            <span class="card__v" :title="(row as unknown as JobView).hostText">
              {{ (row as unknown as JobView).hostCount ? `${(row as unknown as JobView).hostCount} 台` : '—' }}
            </span>

            <span class="card__k">超时</span>
            <span class="card__v pk-num">{{ (row as unknown as JobView).timeoutSec }} 秒</span>
          </div>

          <footer class="pk-card__foot">
            <span class="jstate" :class="(row as unknown as JobView).enabled ? 'is-on' : 'is-off'">
              <i class="pk-dot" />{{ (row as unknown as JobView).enabledText }}
            </span>
            <span class="card__ops">
              <button type="button" class="pk-link" @click.stop="openRunDialog(row as unknown as JobView)">执行</button>
              <button type="button" class="pk-link" @click.stop="openJobLogs(row as unknown as JobView)">日志</button>
              <button type="button" class="pk-link" @click.stop="openJobForm(row as unknown as JobView)">编辑</button>
              <button type="button" class="pk-link pk-link--danger" @click.stop="onDeleteJob(row as unknown as JobView)">
                删除
              </button>
            </span>
          </footer>
        </template>
      </ReCanvasCards>
    </template>

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
        <span class="jtype is-cron">{{ osLabel(jobOsTypeOf(runJobView)) }}</span>
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
            <span class="pk-ellipsis">{{ (row as unknown as LogRow).msExecLogHostName || '—' }}</span>
          </template>
          <template #cell-type="{ row }">
            <span class="pk-mono-sm pk-dim">{{ logTypeText((row as unknown as LogRow).msExecLogType) }}</span>
          </template>
          <template #cell-msExecLogCommand="{ row }">
            <span class="pk-mono-sm pk-ellipsis">{{ (row as unknown as LogRow).msExecLogCommand || '—' }}</span>
          </template>
          <template #cell-status="{ row }">
            <span class="jstate" :class="logStatusText((row as unknown as LogRow).msExecLogStatus) === '成功' ? 'is-on' : 'is-off'">
              <i class="pk-dot" />{{ logStatusText((row as unknown as LogRow).msExecLogStatus) }}
            </span>
          </template>
          <template #cell-msExecLogOutput="{ row }">
            <span class="pk-ellipsis pk-dim" :title="(row as unknown as LogRow).msExecLogOutput">
              {{ (row as unknown as LogRow).msExecLogOutput || '—' }}
            </span>
          </template>
          <template #cell-msExecLogError="{ row }">
            <span class="pk-ellipsis pk-danger-text" :title="(row as unknown as LogRow).msExecLogError">
              {{ (row as unknown as LogRow).msExecLogError || '—' }}
            </span>
          </template>
          <template #cell-msExecLogEndTime="{ row }">
            <span class="pk-num pk-dim">{{ (row as unknown as LogRow).msExecLogEndTime || '—' }}</span>
          </template>
          <template #cell-msExecLogCostMs="{ row }">
            <span class="pk-num">{{ (row as unknown as LogRow).msExecLogCostMs ?? '—' }}</span>
          </template>
        </ReCanvasTable>
      </template>
    </ReDrawer>
  </RePageStage>
</template>

<style scoped>
/* ===== 最近一次执行结果（页头告示位） ===== */
.run-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 11px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
}

.run-strip__left {
  display: flex;
  align-items: baseline;
  gap: 9px;
  flex-wrap: wrap;
}

.run-strip__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.run-strip__stat {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.run-strip__stat b.is-ok {
  color: var(--el-color-success);
}

.run-strip__stat b.is-fail {
  color: var(--el-color-danger);
}

.run-strip__hosts {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.run-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 7px;
  font-size: 11px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
}

.run-chip .pk-dot {
  background: var(--el-color-success);
}

.run-chip.is-fail .pk-dot {
  background: var(--el-color-danger);
}

/* ===== 类型徽标 ===== */
.jtype {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 19px;
  padding: 0 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  border-radius: var(--el-radius-xs, 4px);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
}

.jtype.is-cron {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.jtype.is-none {
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-dark, var(--el-fill-color));
}

/* ===== 启用状态 ===== */
.jstate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.jstate.is-on .pk-dot {
  background: var(--el-color-success);
}

.jstate.is-off {
  color: var(--el-text-color-placeholder);
}

.jstate.is-off .pk-dot {
  background: var(--el-text-color-disabled);
}

/* ===== 命令块 ===== */
.cmd {
  margin: 0;
  padding: 8px 10px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow: auto;
}

.cmd--card {
  -webkit-line-clamp: 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
  overflow: hidden;
  max-height: 44px;
}

/* ===== 触发分布图 ===== */
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
  gap: 2px;
  padding-top: 12px;
}

.dist__col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dist__bar {
  width: 100%;
  border-radius: 1px 1px 0 0;
  transition: height var(--el-transition-duration-fast, 0.2s);
}

.dist__tick {
  height: 12px;
  font-size: 9px;
  line-height: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
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

/* ===== 抽屉 ===== */
.log-filter {
  margin-bottom: 10px;
}

.run-hint {
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.run-hint b {
  color: var(--el-text-color-primary);
}

.pk-danger-text {
  color: var(--el-color-danger);
}

@media (prefers-reduced-motion: reduce) {
  .dist__bar {
    transition: none;
  }
}
</style>
