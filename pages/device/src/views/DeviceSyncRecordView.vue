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
        <el-select v-model="autoRefreshSeconds" class="dsr-auto" size="small" title="自动刷新间隔" @change="onAutoRefreshChange">
          <el-option label="手动刷新" :value="0" />
          <el-option label="每 10 秒" :value="10" />
          <el-option label="每 30 秒" :value="30" />
          <el-option label="每 60 秒" :value="60" />
        </el-select>
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

    <!-- ==================== 生命周期回调：清单 + 手工重放 ==================== -->
    <section class="dsr-cb">
      <header class="dsr-cb__head">
        <span class="dsr-cb__title">生命周期回调</span>
        <span class="dsr-cb__meta">已注册 {{ callbacks.length }} 个 · {{ cbOpen ? '点击收起' : '点击展开清单与重放' }}</span>
        <span class="dsr-grow" />
        <el-button link type="primary" size="small" @click="cbOpen = !cbOpen">{{ cbOpen ? '收起' : '展开' }}</el-button>
        <ReButton icon="RefreshRight" layout="square" size="small" tip="刷新回调清单" :loading="cbLoading"
          @click="loadCallbacks" />
      </header>
      <div v-if="cbOpen" class="dsr-cb__body">
        <div class="dsr-cb__list">
          <span class="dsr-cb__label">已注册回调</span>
          <template v-if="callbacks.length">
            <el-tag v-for="c in callbacks" :key="c" size="small" effect="plain">{{ c }}</el-tag>
          </template>
          <span v-else class="dsr-cb__muted">暂无（点右侧刷新按钮拉取）</span>
        </div>
        <el-form class="dsr-cb__form" label-width="84px" size="small">
          <div class="dsr-cb__grid">
            <el-form-item label="事件类型">
              <el-select v-model="cbForm.eventType" filterable allow-create default-first-option
                placeholder="如 ALARM_RECEIVED">
                <el-option v-for="t in EVENT_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item label="阶段">
              <el-select v-model="cbForm.phase">
                <el-option label="SUCCESS" value="SUCCESS" />
                <el-option label="FAILED" value="FAILED" />
              </el-select>
            </el-form-item>
            <el-form-item label="设备 ID">
              <el-input v-model="cbForm.deviceId" placeholder="可空" clearable />
            </el-form-item>
            <el-form-item label="厂商">
              <el-select v-model="cbForm.vendor" clearable filterable placeholder="可空">
                <el-option v-for="v in vendorOptions" :key="v.value" :label="v.label" :value="v.value" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="负载 JSON">
            <el-input v-model="cbForm.payload" type="textarea" :rows="3" placeholder='如 {"channelId":1}，可空' />
          </el-form-item>
          <el-form-item v-if="cbForm.phase === 'FAILED'" label="失败原因">
            <el-input v-model="cbForm.error" placeholder="phase=FAILED 时下发给回调的 error，可空" clearable />
          </el-form-item>
        </el-form>
        <div class="dsr-cb__ops">
          <span class="dsr-cb__muted">向全部已注册回调重放这条事件（联调 / 失败补发），逐回调返回执行结果。</span>
          <span class="dsr-grow" />
          <el-button size="small" type="primary" :loading="cbDispatching" @click="dispatchCallback">重放事件</el-button>
        </div>
        <el-table v-if="cbResults.length" :data="cbResults" size="small" border max-height="220">
          <el-table-column prop="callback" label="回调" min-width="200" show-overflow-tooltip />
          <el-table-column label="结果" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.ok ? 'success' : 'danger'" size="small" effect="plain">
                {{ row.ok ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="说明" min-width="180" show-overflow-tooltip />
          <el-table-column label="耗时" width="90" align="center">
            <template #default="{ row }">{{ row.elapsedMs }}ms</template>
          </el-table-column>
        </el-table>
      </div>
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
            :shortcuts="TIME_SHORTCUTS" @change="onFilterChange" />
        </div>
        <span class="dsr-grow" />
        <span class="dsr-bar__hint">{{ total }} 条</span>
        <ReButton v-if="mode === 'outbox'" icon="Refresh" size="small" :show-text="true" :loading="batchRetrying"
          @click="onRetryFailedBatch">批量重试失败</ReButton>
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
        <button type="button" class="dsr-device-link" title="打开设备详情"
          @click="emit('open-device', String(row.deviceSyncOutboxDeviceId || ''))">
          {{ row.deviceSyncOutboxDeviceId || '—' }}
        </button>
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
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
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
import { TIME_SHORTCUTS } from '../constants/timeShortcuts'
import type { DeviceCallbackResult, DeviceSyncOutbox, SyncRecordsSummary } from '../types/device'

/** 视图形态：执行记录 / 重试队列 */
type ViewMode = 'records' | 'outbox'

/** 行为上抛：队列里的设备 ID 点击后交给宿主打开设备详情页签 */
const emit = defineEmits<{ (e: 'open-device', deviceId: string): void }>()

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

/* ==================== 生命周期回调：清单 + 手工重放 ==================== */
const cbOpen = ref(false)
const cbLoading = ref(false)
const cbDispatching = ref(false)
const callbacks = ref<string[]>([])
const cbResults = ref<DeviceCallbackResult[]>([])
const cbForm = reactive({
  eventType: 'ALARM_RECEIVED',
  phase: 'SUCCESS',
  deviceId: '',
  vendor: '',
  payload: '',
  error: '',
})

/** 常用事件类型（后端 DeviceLifecycleEvent 的 TYPE_* 常量，可手输扩展） */
const EVENT_TYPE_OPTIONS = ['DEVICE_CREATED', 'DEVICE_UPDATED', 'DEVICE_DELETED', 'PERSON_ENROLLED', 'ALARM_RECEIVED']

/** 拉取当前容器内已注册的回调清单 */
async function loadCallbacks(): Promise<void> {
  cbLoading.value = true
  try {
    callbacks.value = (await deviceApi.listCallbacks()) ?? []
  } catch (err) {
    ElMessage.error('回调清单加载失败：' + errorText(err))
  } finally {
    cbLoading.value = false
  }
}

/** 手工重放一条生命周期事件，展示逐回调执行结果 */
async function dispatchCallback(): Promise<void> {
  let payload: Record<string, unknown> = {}
  const text = cbForm.payload.trim()
  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      ElMessage.warning('负载 JSON 不合法')
      return
    }
  }
  cbDispatching.value = true
  try {
    const results = await deviceApi.dispatchCallback({
      eventType: cbForm.eventType,
      phase: cbForm.phase,
      deviceId: cbForm.deviceId || undefined,
      vendor: cbForm.vendor || undefined,
      payload,
      error: cbForm.phase === 'FAILED' ? cbForm.error || undefined : undefined,
    })
    cbResults.value = results ?? []
    const okCount = cbResults.value.filter((r) => r.ok).length
    ElMessage.success(`重放完成：${okCount}/${cbResults.value.length} 个回调成功`)
  } catch (err) {
    ElMessage.error('重放失败：' + errorText(err))
  } finally {
    cbDispatching.value = false
  }
}

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

/* ==================== 自动刷新：进行中的同步不用手动点 ==================== */
const autoRefreshSeconds = ref(0)
let autoTimer: ReturnType<typeof setInterval> | null = null

function onAutoRefreshChange(): void {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
  const sec = autoRefreshSeconds.value
  if (sec > 0) {
    autoTimer = setInterval(() => {
      if (!loading.value) query()
    }, sec * 1000)
  }
}

onUnmounted(() => {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
})

/* ==================== 批量重试：当前筛选下的待重试/失败队列逐台重推 ==================== */
const batchRetrying = ref(false)

/** 单次批量重试上限：写回是逐台调厂商接口，量太大时提示分批 */
const RETRY_BATCH_LIMIT = 50

/** 翻页收集当前筛选下可重试的队列行（failed / pending；sent 与 dead 跳过） */
async function collectRetryCandidates(): Promise<DeviceSyncOutbox[]> {
  const candidates: DeviceSyncOutbox[] = []
  const pageSize = 100
  const params = { ...tableParams.value }
  for (let pageNo = 1; pageNo <= 50; pageNo++) {
    const res = await deviceApi.pageSyncOutbox({ ...params, pageNo, pageSize })
    const list = res.records ?? []
    for (const row of list) {
      if (row.deviceSyncOutboxStatus === 'failed' || row.deviceSyncOutboxStatus === 'pending') {
        candidates.push(row)
      }
    }
    const total = res.total ?? candidates.length
    if (list.length < pageSize || candidates.length >= RETRY_BATCH_LIMIT || pageNo * pageSize >= total) break
  }
  return candidates.slice(0, RETRY_BATCH_LIMIT)
}

/** 批量重试失败队列：确认后逐台重推，按回读状态汇总 */
async function onRetryFailedBatch(): Promise<void> {
  if (batchRetrying.value) return
  batchRetrying.value = true
  try {
    let candidates: DeviceSyncOutbox[]
    try {
      candidates = await collectRetryCandidates()
    } catch (err) {
      ElMessage.error('收集待重试记录失败：' + errorText(err))
      return
    }
    if (!candidates.length) {
      ElMessage.info('当前筛选下没有可重试的记录（已推送 / 不可重试的自动跳过）')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确认重试 ${candidates.length} 条写回失败记录？将逐台推送厂商${candidates.length >= RETRY_BATCH_LIMIT ? '（已达单次上限，可先缩小筛选再试）' : ''}。`,
        '批量重试',
        { type: 'warning', confirmButtonText: '重试', cancelButtonText: '取消' },
      )
    } catch {
      return
    }
    let sent = 0
    let deferred = 0
    let failed = 0
    for (const row of candidates) {
      try {
        const updated = await deviceApi.retrySyncOutbox(row.deviceSyncOutboxId)
        if (updated?.deviceSyncOutboxStatus === 'sent') sent += 1
        else deferred += 1
      } catch {
        failed += 1
      }
    }
    const parts = [`成功 ${sent} 条`]
    if (deferred) parts.push(`按退避推迟 ${deferred} 条`)
    if (failed) parts.push(`失败 ${failed} 条`)
    if (!deferred && !failed) ElMessage.success(`批量重试完成：${parts.join('，')}`)
    else ElMessage.warning(`批量重试完成：${parts.join('，')}`)
    query()
  } finally {
    batchRetrying.value = false
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
  void loadCallbacks()
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

.dsr-auto {
  width: 108px;
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

/* 队列设备 ID：可点开设备详情 */
.dsr-device-link {
  padding: 0;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
  color: var(--el-color-primary);
  background: none;
  border: 0;
  cursor: pointer;
}

.dsr-device-link:hover {
  text-decoration: underline;
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

/* ---------- 生命周期回调 ---------- */
.dsr-cb {
  border: 1px solid var(--el-border-color-lighter, var(--el-border-color));
  border-radius: 12px;
  background: var(--el-bg-color);
}
.dsr-cb__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: default;
}
.dsr-cb__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dsr-cb__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dsr-cb__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 12px 12px;
}
.dsr-cb__list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.dsr-cb__label {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dsr-cb__muted {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.dsr-cb__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0 12px;
}
.dsr-cb__ops {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
