<template>
  <div class="dsr">
    <!-- ==================== 顶部：这是什么 + 刷新 ==================== -->
    <header class="dsr-top">
      <div class="dsr-top__main">
        <span class="dsr-top__bar" />
        <h2 class="dsr-top__title">同步记录</h2>
        <span class="dsr-top__count">{{ total }}</span>
        <span class="dsr-top__scope">{{ mode === 'records' ? '每次拉取 / 写回一行' : '写回失败的设备待重试清单' }}</span>
      </div>
      <div class="dsr-top__ops">
        <span v-if="lastQueryAt" class="dsr-top__at">查询于 {{ lastQueryAt }}</span>
        <ReButton icon="RefreshRight" layout="square" size="small" tip="重新拉取" :loading="loading" @click="query" />
      </div>
    </header>

    <!-- ==================== 概览：四张卡只回答四个问题 ==================== -->
    <section class="dsr-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        class="dsr-kpi"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- ==================== 视图切换 + 筛选 ==================== -->
    <section class="dsr-bar">
      <div class="dsr-bar__row">
        <el-radio-group v-model="mode" size="small" @change="onModeChange">
          <el-radio-button value="records">执行记录</el-radio-button>
          <el-radio-button value="outbox">重试队列</el-radio-button>
        </el-radio-group>
        <el-select v-model="filters.vendor" class="dsr-f dsr-f--vendor" size="small" clearable filterable
          placeholder="全部厂商" @change="onFilterChange">
          <el-option v-for="v in vendorOptions" :key="v.value" :label="v.label" :value="v.value" />
        </el-select>
        <template v-if="mode === 'records'">
          <el-select v-model="filters.mode" class="dsr-f dsr-f--mode" size="small" clearable placeholder="全部方向"
            @change="onFilterChange">
            <el-option v-for="o in MODE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-select v-model="filters.phase" class="dsr-f dsr-f--phase" size="small" clearable placeholder="全部阶段"
            @change="onFilterChange">
            <el-option v-for="o in PHASE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </template>
        <template v-else>
          <el-select v-model="filters.action" class="dsr-f dsr-f--mode" size="small" clearable placeholder="全部动作"
            @change="onFilterChange">
            <el-option v-for="o in ACTION_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <ReInput v-model="filters.deviceId" class="dsr-f dsr-f--device" placeholder="设备 ID" size="small" clearable
            @clear="query" @keyup.enter="query" />
        </template>
        <el-select v-model="filters.status" class="dsr-f dsr-f--status" size="small" clearable placeholder="全部状态"
          @change="onFilterChange">
          <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <div v-if="mode === 'records'" class="dsr-f dsr-f--range">
          <el-date-picker v-model="filters.range" size="small" style="width: 100%" type="datetimerange"
            range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss"
            :shortcuts="RANGE_SHORTCUTS" @change="onFilterChange" />
        </div>
        <span class="dsr-grow" />
        <span class="dsr-bar__hint">{{ total }} 条</span>
        <ReButton icon="Search" size="small" type="primary" :show-text="true" @click="query">查询</ReButton>
        <ReButton icon="RefreshLeft" layout="square" size="small" tip="清空筛选" @click="resetFilters" />
      </div>
    </section>

    <ReErrorBar v-if="loadError" :message="loadError" retry-text="重试" @retry="query" />

    <!-- ==================== 列表：ReTable 自带分页，后端 loader 供数 ==================== -->
    <ReTable ref="tableRef" class="dsr-table" :columns="columns" :loader="loadPage" :params="tableParams"
      engine="element" table-id="device-sync-records" :row-key="mode === 'records' ? 'deviceSyncRecordId' : 'deviceSyncOutboxId'"
      :pagination="true" :page-size="20" :page-sizes="[10, 20, 50, 100]" :toolbar="false"
      :layout-table="{ fill: true }">
      <!-- 执行记录列 -->
      <template #col-phase="{ row }">
        <ReTag size="small" effect="plain">{{ phaseText(row.deviceSyncRecordPhase) }}</ReTag>
      </template>
      <template #col-mode="{ row }">
        <ReTag :type="row.deviceSyncRecordMode === 'push' ? 'warning' : 'info'" size="small" effect="plain">
          {{ modeText(row.deviceSyncRecordMode) }}
        </ReTag>
      </template>
      <template #col-task="{ row }">
        <span class="dsr-mono">{{ row.deviceSyncRecordTaskId || '—' }}</span>
      </template>
      <template #col-counts="{ row }">
        <span class="dsr-counts">
          <em class="is-add">+{{ row.deviceSyncRecordAdded ?? 0 }}</em>
          <em class="is-upd">~{{ row.deviceSyncRecordUpdated ?? 0 }}</em>
          <em class="is-del">-{{ row.deviceSyncRecordRemoved ?? 0 }}</em>
          <em class="is-fail" :class="{ 'is-zero': !row.deviceSyncRecordFailed }">!{{ row.deviceSyncRecordFailed ?? 0 }}</em>
        </span>
      </template>
      <template #col-status="{ row }">
        <ReTag :type="statusMeta(recordStatus(row)).tag" size="small" :effect="mode === 'records' ? 'dark' : 'plain'">
          {{ statusMeta(recordStatus(row)).label }}
        </ReTag>
      </template>
      <template #col-message="{ row }">
        <span class="dsr-msg" :title="recordMessage(row) || ''">{{ recordMessage(row) || '—' }}</span>
      </template>
      <template #col-startedAt="{ row }">
        <span class="dsr-mono">{{ fmtTime(row.deviceSyncRecordStartedAt) }}</span>
      </template>
      <template #col-finishedAt="{ row }">
        <span class="dsr-mono">{{ fmtTime(row.deviceSyncRecordFinishedAt) }}</span>
      </template>
      <!-- 重试队列列 -->
      <template #col-device="{ row }">
        <span class="dsr-mono">{{ row.deviceSyncOutboxDeviceId || '—' }}</span>
      </template>
      <template #col-action="{ row }">
        <ReTag :type="row.deviceSyncOutboxAction === 'delete' ? 'danger' : 'info'" size="small" effect="plain">
          {{ actionText(row.deviceSyncOutboxAction) }}
        </ReTag>
      </template>
      <template #col-retry="{ row }">
        <span class="dsr-mono">{{ row.deviceSyncOutboxRetry ?? 0 }} 次</span>
      </template>
      <template #col-nextAt="{ row }">
        <span class="dsr-mono">{{ fmtTime(row.deviceSyncOutboxNextAt) }}</span>
      </template>
      <template #col-createdAt="{ row }">
        <span class="dsr-mono">{{ fmtTime(row.deviceSyncOutboxCreatedAt) }}</span>
      </template>
      <template #col-outboxActions="{ row }">
        <ReButton size="small" :show-text="true" :disabled="row.deviceSyncOutboxStatus === 'sent'"
          @click="onRetry(asOutbox(row))">
          重试
        </ReButton>
      </template>
    </ReTable>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Clock, Refresh, Warning } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReErrorBar from '@repo/ui/re-error-bar'
import ReInput from '@repo/ui/re-input'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { RePageResult, ReTableColumn, ReTableLoadParams } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '../api/deviceApi'
import type { DeviceSyncOutbox, SyncRecordsSummary } from '../types/device'

/** 视图形态：执行记录 / 重试队列 */
type ViewMode = 'records' | 'outbox'

/** 时间快捷项（与告警中心同口径） */
const RANGE_SHORTCUTS = [
  { text: '近 1 小时', value: () => [new Date(Date.now() - 3600 * 1000), new Date()] as [Date, Date] },
  { text: '近 24 小时', value: () => [new Date(Date.now() - 24 * 3600 * 1000), new Date()] as [Date, Date] },
  { text: '近 7 天', value: () => [new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()] as [Date, Date] },
]

/** 方向字典 */
const MODE_OPTIONS = [
  { value: 'pull', label: '拉取' },
  { value: 'push', label: '写回' },
]

/** 阶段字典 */
const PHASE_OPTIONS = [
  { value: 'devices', label: '设备目录' },
  { value: 'organizations', label: '组织' },
  { value: 'persons', label: '人员' },
  { value: 'device', label: '单台写回' },
  { value: 'device-delete', label: '删除远端' },
]

/** 队列动作字典 */
const ACTION_OPTIONS = [
  { value: 'create', label: '新增' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
]

/** 记录状态字典 */
const RECORD_STATUS_OPTIONS = [
  { value: 'running', label: '进行中' },
  { value: 'success', label: '成功' },
  { value: 'partial', label: '部分失败' },
  { value: 'failed', label: '失败' },
]

/** 队列状态字典 */
const OUTBOX_STATUS_OPTIONS = [
  { value: 'pending', label: '待重试' },
  { value: 'sent', label: '已推送' },
  { value: 'failed', label: '失败' },
  { value: 'dead', label: '不可重试' },
]

const tableRef = ref<InstanceType<typeof ReTable> | null>(null)

const mode = ref<ViewMode>('records')
const vendorOptions = ref<Array<{ label: string; value: string }>>([])
const rows = ref<Array<Record<string, unknown>>>([])
const loading = ref(false)
const loadError = ref('')
const total = ref(0)
const lastQueryAt = ref('')
const summary = ref<SyncRecordsSummary | null>(null)

const filters = reactive<{
  vendor: string
  mode: string
  phase: string
  action: string
  status: string
  deviceId: string
  range: [string, string] | null
}>({
  vendor: '',
  mode: '',
  phase: '',
  action: '',
  status: '',
  deviceId: '',
  range: null,
})

/** 状态下拉随视图形态切换 */
const statusOptions = computed(() => (mode.value === 'records' ? RECORD_STATUS_OPTIONS : OUTBOX_STATUS_OPTIONS))

/** 表格列随视图形态切换 */
const columns = computed<ReTableColumn[]>(() => {
  if (mode.value === 'records') {
    return [
      { prop: 'deviceSyncRecordStartedAt', label: '开始时间', slot: 'startedAt', width: 165 },
      { prop: 'deviceSyncRecordPhase', label: '阶段', slot: 'phase', width: 96 },
      { prop: 'deviceSyncRecordMode', label: '方向', slot: 'mode', width: 76, align: 'center' },
      { prop: 'deviceSyncRecordVendor', label: '厂商', width: 90 },
      { prop: 'deviceSyncRecordTaskId', label: '任务', slot: 'task', minWidth: 150 },
      { prop: 'counts', label: '增/改/删/败', slot: 'counts', width: 130, align: 'center' },
      { prop: 'deviceSyncRecordStatus', label: '状态', slot: 'status', width: 96, align: 'center' },
      { prop: 'deviceSyncRecordMessage', label: '说明', slot: 'message', minWidth: 180 },
      { prop: 'deviceSyncRecordFinishedAt', label: '结束时间', slot: 'finishedAt', width: 165 },
    ]
  }
  return [
    { prop: 'deviceSyncOutboxCreatedAt', label: '入队时间', slot: 'createdAt', width: 165 },
    { prop: 'deviceSyncOutboxDeviceId', label: '设备', slot: 'device', minWidth: 150 },
    { prop: 'deviceSyncOutboxVendor', label: '厂商', width: 90 },
    { prop: 'deviceSyncOutboxAction', label: '动作', slot: 'action', width: 76, align: 'center' },
    { prop: 'deviceSyncOutboxStatus', label: '状态', slot: 'status', width: 96, align: 'center' },
    { prop: 'deviceSyncOutboxRetry', label: '已重试', slot: 'retry', width: 84, align: 'center' },
    { prop: 'deviceSyncOutboxNextAt', label: '下次重试', slot: 'nextAt', width: 165 },
    { prop: 'deviceSyncOutboxMessage', label: '失败原因', slot: 'message', minWidth: 180 },
    { prop: 'actions', label: '操作', slot: 'outboxActions', width: 90, align: 'center', fixed: 'right' },
  ]
})

/** 交给 ReTable 的查询参数（page/pageSize 由组件注入） */
const tableParams = computed<Record<string, unknown>>(() => {
  const params: Record<string, unknown> = {}
  if (filters.vendor) params.vendor = filters.vendor
  if (mode.value === 'records') {
    if (filters.mode) params.mode = filters.mode
    if (filters.phase) params.phase = filters.phase
    if (filters.range) {
      params.start = filters.range[0]
      params.end = filters.range[1]
    }
  } else {
    if (filters.action) params.action = filters.action
    if (filters.deviceId.trim()) params.deviceId = filters.deviceId.trim()
  }
  if (filters.status) params.status = filters.status
  return params
})

/** 四张 KPI：同步结果 + 队列积压 */
const kpis = computed(() => [
  {
    key: 'success',
    title: '同步成功',
    value: summary.value?.records?.success ?? '--',
    desc: '近段拉取 / 写回全量成功',
    icon: CircleCheck,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'partial',
    title: '部分失败',
    value: summary.value?.records?.partial ?? '--',
    desc: '有条目没同步上',
    icon: Warning,
    iconColor: 'var(--el-color-warning)',
  },
  {
    key: 'failed',
    title: '完全失败',
    value: summary.value?.records?.failed ?? '--',
    desc: '整次同步未成功',
    icon: Clock,
    iconColor: 'var(--el-color-danger)',
  },
  {
    key: 'pending',
    title: '待重试',
    value: summary.value?.outbox?.pending ?? '--',
    desc: '写回失败在队列等重试',
    icon: Refresh,
    iconColor: 'var(--el-color-primary)',
  },
])

/** ReTable 的远程 loader：按当前视图形态调对应分页接口 */
async function loadPage({ page, pageSize }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true
  loadError.value = ''
  try {
    if (mode.value === 'records') {
      const res = await deviceApi.pageSyncRecords({ ...tableParams.value, pageNo: page, pageSize })
      const list = (res.records ?? []) as unknown as Array<Record<string, unknown>>
      rows.value = list
      total.value = res.total ?? list.length
    } else {
      const res = await deviceApi.pageSyncOutbox({ ...tableParams.value, pageNo: page, pageSize })
      const list = (res.records ?? []) as unknown as Array<Record<string, unknown>>
      rows.value = list
      total.value = res.total ?? list.length
    }
    lastQueryAt.value = new Date().toLocaleTimeString()
    return { total: total.value, records: rows.value }
  } catch (err) {
    rows.value = []
    total.value = 0
    loadError.value = errorText(err)
    ElMessage.error(loadError.value)
    return { total: 0, records: [] }
  } finally {
    loading.value = false
  }
}

/** 查询按钮：KPI + 列表都重拉 */
function query(): void {
  void refreshSummary()
  void tableRef.value?.reload()
}

/** 筛选变化：列表由 ReTable 监听 params 自动重载，这里只同步 KPI */
function onFilterChange(): void {
  void refreshSummary()
}

/** 切换视图形态：状态筛选语义不同，清掉避免脏条件 */
function onModeChange(): void {
  filters.status = ''
  query()
}

function resetFilters(): void {
  filters.vendor = ''
  filters.mode = ''
  filters.phase = ''
  filters.action = ''
  filters.status = ''
  filters.deviceId = ''
  filters.range = null
  query()
}

/** 单独刷新 KPI，避免为四个数字重载整张表 */
async function refreshSummary(): Promise<void> {
  try {
    summary.value = (await deviceApi.syncRecordsSummary()) ?? null
  } catch {
    // 统计失败不影响列表
  }
}

/** 重试一条队列记录：确认后走后端写回，成功失败都回读队列 */
async function onRetry(row: DeviceSyncOutbox): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认重试这台设备的写回吗？成功置「已推送」，失败按退避推迟下次重试。`,
      '重试写回',
      { type: 'warning', confirmButtonText: '重试', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    const updated = await deviceApi.retrySyncOutbox(row.deviceSyncOutboxId)
    if (updated?.deviceSyncOutboxStatus === 'sent') {
      ElMessage.success('重试成功，设备已写回厂商')
    } else {
      ElMessage.warning(updated?.deviceSyncOutboxMessage || '重试未成功，已按退避推迟下次重试')
    }
  } catch (err) {
    ElMessage.error(errorText(err))
  }
  query()
}

/** 执行记录 / 队列行统一取状态与说明字段 */
function recordStatus(row: Record<string, unknown>): string {
  return String(
    mode.value === 'records' ? row.deviceSyncRecordStatus : row.deviceSyncOutboxStatus,
  )
}

function recordMessage(row: Record<string, unknown>): string {
  return String(
    mode.value === 'records' ? row.deviceSyncRecordMessage : row.deviceSyncOutboxMessage,
  )
}

function asOutbox(row: Record<string, unknown>): DeviceSyncOutbox {
  return row as unknown as DeviceSyncOutbox
}

/** 状态 → 展示（tag 类型 + 中文） */
function statusMeta(status: string): { label: string; tag: 'success' | 'warning' | 'danger' | 'info' | 'primary' } {
  switch (status) {
    case 'success':
    case 'sent':
      return { label: status === 'sent' ? '已推送' : '成功', tag: 'success' }
    case 'partial':
      return { label: '部分失败', tag: 'warning' }
    case 'failed':
      return { label: '失败', tag: 'danger' }
    case 'running':
      return { label: '进行中', tag: 'primary' }
    case 'pending':
      return { label: '待重试', tag: 'warning' }
    case 'dead':
      return { label: '不可重试', tag: 'info' }
    default:
      return { label: status || '—', tag: 'info' }
  }
}

function phaseText(phase: string): string {
  return PHASE_OPTIONS.find((o) => o.value === phase)?.label ?? phase ?? '—'
}

function modeText(value: string): string {
  return MODE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '—'
}

function actionText(action: string): string {
  return ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action ?? '—'
}

/** 时间显示：2026-11-19T12:00:00 → 11-19 12:00:00 */
function fmtTime(value?: string | null): string {
  if (!value) return '—'
  const text = String(value).replace('T', ' ')
  return text.length >= 16 ? text.slice(5, 19) : text
}

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return '请求失败'
  }
}

onMounted(async () => {
  try {
    const vendors = await deviceApi.listVendors()
    vendorOptions.value = (vendors ?? []).map((v) => ({ label: v.name || v.vendor, value: v.vendor }))
  } catch {
    // 厂商字典失败不阻塞列表
  }
  void refreshSummary()
})
</script>

<style scoped>
/* ============================================================
   同步记录
   沿用「告警中心」的 Deck 语言：细边卡片、16px 圆角、
   主色只做点缀；方向用 tag 表达，计数用四段彩色数字。
   ============================================================ */
.dsr {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 10px 2px 0;
  box-sizing: border-box;
  color: var(--el-text-color-primary);
}

/* ---------- 顶部标题条 ---------- */
.dsr-top {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-sm));
}

.dsr-top__main {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.dsr-top__bar {
  flex: none;
  width: 4px;
  height: 14px;
  border-radius: 999px;
  background: var(--el-color-primary);
}

.dsr-top__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.dsr-top__count {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dsr-top__scope {
  overflow: hidden;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsr-top__ops {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.dsr-top__at {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

/* ---------- 概览卡 ---------- */
.dsr-kpis {
  display: grid;
  flex: none;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

/* ---------- 筛选条 ---------- */
.dsr-bar {
  flex: none;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.dsr-bar__row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dsr-f--vendor {
  width: 128px;
}

.dsr-f--mode {
  width: 108px;
}

.dsr-f--phase {
  width: 116px;
}

.dsr-f--status {
  width: 116px;
}

.dsr-f--device {
  width: 170px;
}

.dsr-f--range {
  width: 330px;
}

.dsr-bar__hint {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.dsr-grow {
  flex: 1 1 auto;
}

/* ---------- 列表 ---------- */
.dsr-table {
  flex: 1 1 auto;
  min-height: 0;
}

.dsr-mono {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
}

.dsr-msg {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

/* 增/改/删/败 四段计数：颜色固定语义，失败为 0 时弱化 */
.dsr-counts {
  display: inline-flex;
  gap: 6px;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
}

.dsr-counts em {
  font-style: normal;
}

.dsr-counts .is-add {
  color: var(--el-color-success);
}

.dsr-counts .is-upd {
  color: var(--el-color-primary);
}

.dsr-counts .is-del {
  color: var(--el-color-info);
}

.dsr-counts .is-fail {
  color: var(--el-color-danger);
  font-weight: 600;
}

.dsr-counts .is-fail.is-zero {
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

@media (max-width: 900px) {
  .dsr-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dsr-f--range {
    width: 100%;
  }
}
</style>
