<template>
  <div class="dal">
    <!-- ==================== 顶部：一句话说清「这是什么、现在什么状态」 ==================== -->
    <header class="dal-top">
      <div class="dal-top__main">
        <span class="dal-top__bar" />
        <h2 class="dal-top__title">告警中心</h2>
        <span class="dal-top__count">{{ total }}</span>
        <span class="dal-top__scope">{{ currentDeviceName }}</span>
      </div>
      <div class="dal-top__ops">
        <span v-if="lastQueryAt" class="dal-top__at">查询于 {{ lastQueryAt }}</span>
        <ReButton icon="RefreshRight" layout="square" size="small" tip="重新拉取" :loading="loading" @click="query" />
        <ReButton icon="Download" size="small" :show-text="true" :disabled="!rows.length" @click="onExport">
          导出
        </ReButton>
      </div>
    </header>

    <!-- ==================== 概览：四张卡只回答四个问题 ==================== -->
    <section class="dal-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        class="dal-kpi"
        :class="`is-${k.key}`"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- ==================== 筛选：所有条件压成一行 ==================== -->
    <section class="dal-bar">
      <div class="dal-bar__row">
        <ReSelect
          v-model="filters.deviceId"
          class="dal-f dal-f--device"
          placeholder="全部设备"
          size="small"
          clearable
          filterable
          :options="deviceOptions"
          @change="onFilterChange"
        />
        <el-select v-model="filters.level" class="dal-f dal-f--lv" size="small" @change="onFilterChange">
          <el-option
            v-for="o in levelSegments"
            :key="o.value"
            :label="o.value ? o.label : '全部级别'"
            :value="o.value"
          />
        </el-select>
        <el-select v-model="filters.status" class="dal-f dal-f--st" size="small" @change="onFilterChange">
          <el-option
            v-for="o in statusSegments"
            :key="o.value"
            :label="o.value ? o.label : '全部状态'"
            :value="o.value"
          />
        </el-select>
        <div class="dal-f dal-f--range">
          <el-date-picker
            v-model="filters.range"
            size="small"
            style="width: 100%"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :shortcuts="RANGE_SHORTCUTS"
            @change="onFilterChange"
          />
        </div>
        <ReInput
          v-model="filters.keyword"
          class="dal-f dal-f--kw"
          placeholder="标题 / 详情 / 来源"
          size="small"
          clearable
          @clear="query"
          @keyup.enter="query"
        />
        <span class="dal-grow" />
        <span class="dal-bar__hint">{{ total }} 条</span>
        <ReButton icon="Search" size="small" type="primary" :show-text="true" @click="query">
          查询
        </ReButton>
        <ReButton icon="RefreshLeft" layout="square" size="small" tip="清空筛选" @click="resetFilters" />
      </div>
    </section>

    <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="query" />

    <!-- ==================== 列表：ReTable 自带分页，后端 loader 供数 ==================== -->
    <ReTable
      ref="tableRef"
      class="dal-table"
      :columns="columns"
      :loader="loadAlarms"
      :params="tableParams"
      engine="element"
      table-id="device-alarms"
      row-key="deviceAlarmId"
      :pagination="true"
      :page-size="20"
      :page-sizes="[10, 20, 50, 100]"
      :toolbar="false"
      :layout-table="{ fill: true }"
      @row-click="onRowClick"
    >
      <template #col-occurredAt="{ row }">
        <span class="dal-mono">{{ fmtTime(row.deviceAlarmOccurredAt) }}</span>
      </template>
      <template #col-type="{ row }">
        <ReTag :type="typeMeta(row.deviceAlarmType).tag" size="small" effect="plain">
          {{ typeMeta(row.deviceAlarmType).label }}
        </ReTag>
      </template>
      <template #col-level="{ row }">
        <ReTag :type="levelMeta(row.deviceAlarmLevel).tag" size="small" effect="plain">
          {{ levelMeta(row.deviceAlarmLevel).label }}
        </ReTag>
      </template>
      <template #col-status="{ row }">
        <ReTag :type="statusMeta(row.deviceAlarmStatus).tag" size="small" effect="dark">
          {{ statusMeta(row.deviceAlarmStatus).label }}
        </ReTag>
      </template>
      <template #col-title="{ row }">
        <button type="button" class="dal-title" @click.stop="openDetail(asAlarm(row))">
          <span class="dal-title__main">{{ row.deviceAlarmTitle || '未命名告警' }}</span>
          <span class="dal-title__detail">{{ row.deviceAlarmDetail || '无详情' }}</span>
        </button>
      </template>
      <template #col-device="{ row }">
        <span class="dal-device">{{ deviceNameOf(row.deviceAlarmDeviceId) }}</span>
      </template>
      <template #col-actions="{ row }">
        <div class="dal-actions" @click.stop>
          <ReButton
            v-if="row.deviceAlarmStatus === 'unhandled' || row.deviceAlarmStatus === 'handling'"
            icon="Check"
            layout="square"
            size="small"
            tip="标记已解决"
            @click="handle(asAlarm(row), 'resolved')"
          />
          <ReButton
            v-if="row.deviceAlarmStatus === 'unhandled'"
            icon="Close"
            layout="square"
            size="small"
            tip="忽略这条"
            @click="handle(asAlarm(row), 'ignored')"
          />
          <ReButton
            icon="View"
            layout="square"
            size="small"
            tip="查看详情"
            @click="openDetail(asAlarm(row))"
          />
        </div>
      </template>

      <template #empty>
        <div class="dal-ghost">
          <span class="dal-ghost__icon"><el-icon><Bell /></el-icon></span>
          <p class="dal-ghost__title">{{ hasFilter ? '当前条件下没有告警' : '还没有收到告警' }}</p>
          <p class="dal-ghost__desc">
            {{
              hasFilter
                ? '放宽级别 / 状态 / 时间范围，或清空关键词再查一次。'
                : '外部系统通过 webhook 推送、或设备监听采集后，告警会出现在这里。'
            }}
          </p>
          <ReButton v-if="hasFilter" icon="RefreshLeft" size="small" :show-text="true" @click="resetFilters">
            清空筛选
          </ReButton>
        </div>
      </template>
    </ReTable>

    <!-- ==================== 详情：点标题 / 行 / 操作列都能打开 ==================== -->
    <ReDialog v-model="detailVisible" title="告警详情" width="640px">
      <div v-if="detail" class="dal-detail">
        <header class="dal-detail__head">
          <span class="dal-detail__title">{{ detail.deviceAlarmTitle || '未命名告警' }}</span>
          <ReTag :type="levelMeta(detail.deviceAlarmLevel).tag" size="small" effect="plain">
            {{ levelMeta(detail.deviceAlarmLevel).label }}
          </ReTag>
          <ReTag :type="statusMeta(detail.deviceAlarmStatus).tag" size="small" effect="dark">
            {{ statusMeta(detail.deviceAlarmStatus).label }}
          </ReTag>
        </header>

        <p class="dal-detail__body">{{ detail.deviceAlarmDetail || '无详情' }}</p>

        <dl class="dal-detail__grid">
          <div><dt>设备</dt><dd>{{ deviceNameOf(detail.deviceAlarmDeviceId) }}</dd></div>
          <div><dt>类型</dt><dd>{{ typeMeta(detail.deviceAlarmType).label }}</dd></div>
          <div><dt>通道</dt><dd>{{ detail.deviceAlarmChannelNo ?? '—' }}</dd></div>
          <div><dt>来源</dt><dd>{{ detail.deviceAlarmSource || '—' }}</dd></div>
          <div><dt>发生时间</dt><dd class="dal-mono">{{ fmtTime(detail.deviceAlarmOccurredAt) }}</dd></div>
          <div><dt>入库时间</dt><dd class="dal-mono">{{ fmtTime(detail.deviceAlarmCreatedAt) }}</dd></div>
          <div><dt>处理人</dt><dd>{{ detail.deviceAlarmHandler || '—' }}</dd></div>
          <div><dt>处理时间</dt><dd class="dal-mono">{{ fmtTime(detail.deviceAlarmHandledAt) }}</dd></div>
        </dl>
      </div>

      <template #footer>
        <div class="dal-detail__foot">
          <ReButton @click="detailVisible = false">关闭</ReButton>
          <ReButton
            v-if="detail && detail.deviceAlarmStatus === 'unhandled'"
            icon="Close"
            :show-text="true"
            @click="handle(detail, 'ignored')"
          >
            忽略
          </ReButton>
          <ReButton
            v-if="detail && (detail.deviceAlarmStatus === 'unhandled' || detail.deviceAlarmStatus === 'handling')"
            icon="Check"
            type="primary"
            :show-text="true"
            @click="handle(detail, 'resolved')"
          >
            标记已解决
          </ReButton>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备告警页签 —— 告警列表、详情、处理、导出。
 *
 * <p>这版按实际使用痛点收敛，而不是换皮：</p>
 * <ol>
 *   <li><b>列表交回 ReTable</b>：分页、页大小、加载态都用组件自带的；
 *       数据用 {@code loader} 走后端分页，不再自己写一套 el-pagination。</li>
 *   <li><b>告警可点开详情</b>：标题、整行、操作列的「查看」都能打开详情弹窗，
 *       字段（设备/类型/通道/来源/发生/入库/处理人/处理时间）一次看全，
 *       弹窗里也能直接解决或忽略。</li>
 *   <li><b>未处理置顶</b>：后端已把 unhandled / handling 排在前面，其余按发生时间倒序。</li>
 *   <li><b>顶部留出与页签的距离</b>：页面顶部补 10px 内距，不再顶着页签。</li>
 * </ol>
 *
 * <p>告警只有一张表（{@code device_alarm}），「已解决」是状态位更新，
 * 不另建已解决表；后端 {@code PUT /alarms/{id}/status} 更新状态。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CircleCheck, Tickets, Warning } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReErrorBar from '@repo/ui/re-error-bar'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { RePageResult, ReTableColumn, ReTableLoadParams } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '../api/deviceApi'
import type { DeviceAlarm, DeviceInfo } from '../types/device'

const props = withDefaults(defineProps<{ deviceId?: string }>(), { deviceId: '' })

/** 告警类型（前端展示口径） */
const ALARM_TYPES = [
  { value: 'MOTION', label: '移动侦测', tag: 'primary' },
  { value: 'IO_ALARM', label: 'IO 报警', tag: 'danger' },
  { value: 'ACCESS', label: '门禁事件', tag: 'warning' },
  { value: 'TEMP', label: '温度报警', tag: 'danger' },
  { value: 'NETWORK', label: '网络异常', tag: 'warning' },
  { value: 'OTHER', label: '其他', tag: 'info' },
]

/** 告警级别分片（空串 = 全部） */
const levelSegments = [
  { label: '全部', value: '' },
  { label: '严重', value: 'critical' },
  { label: '重要', value: 'major' },
  { label: '轻微', value: 'minor' },
  { label: '信息', value: 'info' },
]

/** 处理状态分片（空串 = 全部） */
const statusSegments = [
  { label: '全部', value: '' },
  { value: 'unhandled', label: '未处理' },
  { value: 'handling', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'ignored', label: '已忽略' },
]

/** 时间快捷键：就近时段最常用 */
const RANGE_SHORTCUTS = [
  { text: '近 1 小时', value: () => [new Date(Date.now() - 3600 * 1000), new Date()] as [Date, Date] },
  { text: '近 24 小时', value: () => [new Date(Date.now() - 24 * 3600 * 1000), new Date()] as [Date, Date] },
  { text: '近 7 天', value: () => [new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()] as [Date, Date] },
]

/** ReTable 暴露的方法里只用到 reload */
const tableRef = ref<InstanceType<typeof ReTable> | null>(null)

const devices = ref<DeviceInfo[]>([])
const rows = ref<DeviceAlarm[]>([])
const loading = ref(false)
const loadError = ref('')
const total = ref(0)
const lastQueryAt = ref('')
const stats = ref<Record<string, number>>({})

const filters = reactive<{
  deviceId: string
  level: string
  status: string
  keyword: string
  range: [string, string] | null
}>({
  deviceId: props.deviceId || '',
  level: '',
  status: '',
  keyword: '',
  range: null,
})

/** 详情弹窗 */
const detailVisible = ref(false)
const detail = ref<DeviceAlarm | null>(null)

/** 设备下拉：离线设备带标记，避免选到一台根本不发告警的设备还以为是系统坏了 */
const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoId}${d.deviceInfoOnline ? '' : '（离线）'}`,
  })),
)

const currentDeviceName = computed(
  () => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || '全部设备',
)

/** 有任何筛选条件时，空态文案要说「放宽条件」而不是「还没收到告警」 */
const hasFilter = computed(
  () =>
    Boolean(filters.deviceId) ||
    Boolean(filters.level) ||
    Boolean(filters.status) ||
    Boolean(filters.keyword.trim()) ||
    Boolean(filters.range),
)

/** 交给 ReTable 的查询参数（page/pageSize 由组件自己注入，这里不能带） */
const tableParams = computed<Record<string, unknown>>(() => {
  const params: Record<string, unknown> = {}
  if (filters.deviceId) params.deviceId = filters.deviceId
  if (filters.level) params.level = filters.level
  if (filters.status) params.status = filters.status
  if (filters.keyword.trim()) params.keyword = filters.keyword.trim()
  if (filters.range) {
    params.start = filters.range[0]
    params.end = filters.range[1]
  }
  return params
})

/** 四张 KPI：每张只回答一个问题，图标/颜色不重复 */
const kpis = computed(() => [
  {
    key: 'total',
    title: '告警总数',
    value: stats.value.total ?? '--',
    desc: lastQueryAt.value ? `查询于 ${lastQueryAt.value}` : '尚未查询',
    icon: Tickets,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'unhandled',
    title: '未处理',
    value: stats.value.unhandled ?? '--',
    desc: '需要人接手',
    icon: Bell,
    iconColor: 'var(--el-color-warning)',
  },
  {
    key: 'critical',
    title: '严重 / 重要',
    value: stats.value.critical ?? '--',
    desc: 'critical + major',
    icon: Warning,
    iconColor: 'var(--el-color-danger)',
  },
  {
    key: 'today',
    title: '今日新增',
    value: stats.value.today ?? '--',
    desc: '今天 0 点之后',
    icon: CircleCheck,
    iconColor: 'var(--el-color-success)',
  },
])

/** ReTable 的远程 loader：page/pageSize 由组件给，其余条件来自筛选区 */
async function loadAlarms({ page, pageSize }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true
  loadError.value = ''
  try {
    const res = await deviceApi.listAlarms({ ...tableParams.value, pageNo: page, pageSize })
    const list = (res.records ?? res.data ?? []) as DeviceAlarm[]
    rows.value = list
    total.value = res.total ?? list.length
    lastQueryAt.value = new Date().toLocaleTimeString()
    return { total: total.value, records: list as unknown as Array<Record<string, unknown>> }
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

/** 重新拉列表：查询按钮走这里，筛选变化由 ReTable 监听 params 自动刷新 */
function query(): void {
  void refreshStats()
  void tableRef.value?.reload()
}

/** 筛选变化：列表由 ReTable 自己重载，这里只同步 KPI */
function onFilterChange(): void {
  void refreshStats()
}

/** 单独刷新 KPI，避免为四个数字重载整张表 */
async function refreshStats(): Promise<void> {
  try {
    stats.value = (await deviceApi.alarmStats()) ?? {}
  } catch {
    // 统计失败不影响列表
  }
}

/** 清空筛选（设备由外部页签固定时保留设备） */
function resetFilters(): void {
  filters.deviceId = props.deviceId || ''
  filters.level = ''
  filters.status = ''
  filters.keyword = ''
  filters.range = null
  void refreshStats()
}

/** 打开详情弹窗 */
function openDetail(row: DeviceAlarm): void {
  detail.value = row
  detailVisible.value = true
}

/** ReTable 行点击：row 是 Record，取回强类型再开详情 */
function onRowClick(row: Record<string, unknown>): void {
  openDetail(asAlarm(row))
}

/** ReTable 的 row 是 Record，取回强类型 */
function asAlarm(row: Record<string, unknown>): DeviceAlarm {
  return row as unknown as DeviceAlarm
}

/**
 * 处理一条告警。
 *
 * <p>忽略是不可逆的语义（后续不再提醒），先确认再提交；解决则直接执行。</p>
 */
async function handle(row: DeviceAlarm, status: string): Promise<void> {
  if (status === 'ignored') {
    try {
      await ElMessageBox.confirm('忽略后这条告警会进入「已忽略」，不再提醒。确认忽略？', '忽略告警', {
        type: 'warning',
        confirmButtonText: '忽略',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
  }
  try {
    await deviceApi.updateAlarmStatus(row.deviceAlarmId, status, 'admin')
    row.deviceAlarmStatus = status
    if (detail.value?.deviceAlarmId === row.deviceAlarmId) detail.value = { ...row }
    await Promise.all([tableRef.value?.reload(), refreshStats()])
    ElMessage.success(`已标记为 ${statusMeta(status).label}`)
  } catch (err) {
    ElMessage.error('状态更新失败：' + errorText(err))
  }
}

/** 统一错误文案（框架 5xx 会清空 message，这里兜底并带上 HTTP 状态） */
function errorText(err: unknown): string {
  if (!err) return '未知错误（无错误对象）'
  if (typeof err === 'string') return err
  const e = err as {
    response?: { status?: number; data?: unknown }
    code?: string
    msg?: string
    message?: string
  }
  const body = e.response?.data
  const fromBody =
    typeof body === 'string'
      ? body
      : (body as { msg?: string; message?: string; error?: string } | undefined)?.msg
        || (body as { message?: string } | undefined)?.message
        || (body as { error?: string } | undefined)?.error
  if (fromBody) return String(fromBody)
  if (e.code === 'ERR_NETWORK') return '网络异常：请确认后端已启动、代理地址可达'
  if (e.code === 'ERR_CANCELED') return '请求已取消'
  if (e.msg) return e.msg
  if (e.message) return e.message
  if (e.response?.status) return `服务端错误（HTTP ${e.response.status}）`
  return '未知错误'
}

function typeMeta(type: string) {
  const found = ALARM_TYPES.find((t) => t.value === type)
  return {
    label: found?.label ?? type,
    tag: (found?.tag || 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info',
  }
}

function levelMeta(level: string) {
  const meta: Record<string, { label: string; tag: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
    critical: { label: '严重', tag: 'danger' },
    major: { label: '重要', tag: 'warning' },
    minor: { label: '轻微', tag: 'primary' },
    info: { label: '信息', tag: 'info' },
  }
  return meta[level] ?? meta.info
}

function statusMeta(status: string) {
  const meta: Record<string, { label: string; tag: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
    unhandled: { label: '未处理', tag: 'warning' },
    handling: { label: '处理中', tag: 'primary' },
    resolved: { label: '已解决', tag: 'success' },
    ignored: { label: '已忽略', tag: 'danger' },
  }
  return meta[status] ?? meta.unhandled
}

/** 时间只保留到秒：ISO 串里的 T / 毫秒 / 时区对值守的人没有意义 */
function fmtTime(time?: string | null): string {
  if (!time) return '—'
  return time.replace('T', ' ').replace(/\.\d+.*$/, '')
}

/** CSV 单元格转义（RFC 4180）：逗号、引号、换行都必须包起来 */
function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** 导出当前页：带上级别/类型/设备/状态的可读文案，而不是裸 ID */
function onExport(): void {
  if (!rows.value.length) return
  const header = ['告警ID', '级别', '类型', '标题', '详情', '设备', '状态', '发生时间']
  const lines = rows.value.map((r) => [
    r.deviceAlarmId,
    levelMeta(r.deviceAlarmLevel).label,
    typeMeta(r.deviceAlarmType).label,
    r.deviceAlarmTitle,
    r.deviceAlarmDetail,
    deviceNameOf(r.deviceAlarmDeviceId),
    statusMeta(r.deviceAlarmStatus).label,
    fmtTime(r.deviceAlarmOccurredAt),
  ])
  const csv = [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `device-alarm-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function deviceNameOf(deviceId?: string): string {
  const d = devices.value.find((item) => item.deviceInfoId === deviceId)
  if (!d) return deviceId ?? '未知设备'
  return d.deviceInfoName || d.deviceInfoIp || deviceId || '未知设备'
}

/** 列定义：与告警表字段一一对应，标题列自带两行（标题 + 详情） */
const columns: ReTableColumn[] = [
  { prop: 'deviceAlarmTitle', label: '告警标题', slot: 'title', minWidth: 240 },
  { prop: 'deviceAlarmLevel', label: '级别', slot: 'level', width: 96, align: 'center' },
  { prop: 'deviceAlarmType', label: '类型', slot: 'type', width: 120 },
  { prop: 'deviceAlarmOccurredAt', label: '发生时间', slot: 'occurredAt', width: 180 },
  { prop: 'deviceAlarmStatus', label: '状态', slot: 'status', width: 110, align: 'center' },
  { prop: 'deviceAlarmDeviceId', label: '设备', slot: 'device', width: 190 },
  { prop: 'actions', label: '操作', slot: 'actions', width: 140, align: 'center', fixed: 'right' },
]

onMounted(async () => {
  try {
    devices.value = await deviceApi.list()
  } catch (err) {
    // 带上真实原因：库里缺表/字段、后端 500、代理不通都在这里显形
    loadError.value = '加载设备列表失败：' + errorText(err)
  }
  await refreshStats()
})
</script>

<style scoped>
/* ============================================================
   告警中心
   沿用「提供商 / 设备资产」的 Deck 语言：细边卡片、16px 圆角、
   主色只做点缀；严重级别用左侧色条表达，不靠整行染色。
   ============================================================ */
.dal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  /* 顶部留出与页签栏的距离，避免标题条顶在页签上 */
  padding: 10px 2px 0;
  box-sizing: border-box;
  color: var(--el-text-color-primary);
}

/* ---------- 顶部标题条 ---------- */
.dal-top {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dal-top__main {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.dal-top__bar {
  flex: none;
  width: 4px;
  height: 14px;
  border-radius: 999px;
  background: var(--el-color-primary);
}

.dal-top__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.dal-top__count {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dal-top__scope {
  overflow: hidden;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dal-top__ops {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.dal-top__at {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* ---------- 概览卡：用左侧色条区分四个口径 ---------- */
.dal-kpis {
  display: grid;
  flex: none;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.dal-kpi {
  position: relative;
  overflow: hidden;
}

.dal-kpi::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--dal-kpi-color, var(--el-color-primary));
}

.dal-kpi.is-total { --dal-kpi-color: var(--el-color-primary); }
.dal-kpi.is-unhandled { --dal-kpi-color: var(--el-color-warning); }
.dal-kpi.is-critical { --dal-kpi-color: var(--el-color-danger); }
.dal-kpi.is-today { --dal-kpi-color: var(--el-color-success); }

/* ---------- 筛选区：一行放完，窄屏才换行 ---------- */
.dal-bar {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}

.dal-bar__row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.dal-bar__hint {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.dal-grow {
  flex: 1;
  min-width: 0;
}

.dal-f {
  flex: none;
}

/* 一行放得下的前提：设备/级别/状态/时间/关键词各占固定窄宽，
   查询与重置靠右；总宽约 1080px，1440 及以上单行不换行。 */
.dal-f--device { width: 170px; }
.dal-f--lv { width: 108px; }
.dal-f--st { width: 116px; }
.dal-f--range { width: 320px; }
.dal-f--kw { width: 160px; }

/* 时间区间：Element 的 range 编辑器内外两层高度是分开写的，
   `size="small"` 在部分版本只压外层，内层 .el-range-input 仍是 38px，
   于是别的控件都 24px、时间框还高一截。这里两层一起压平。
   选择器要带 `.dal-bar`：Element 自己的 `.el-range-editor.el-input__wrapper`
   是两段类，单写 `.dal-f--range` 会被它压住。 */
.dal-bar .dal-f--range :deep(.el-range-editor) {
  height: 24px;
}

.dal-bar .dal-f--range :deep(.el-range-input) {
  height: 22px;
  font-size: 12px;
  line-height: 22px;
}

.dal-bar .dal-f--range :deep(.el-range-separator) {
  line-height: 24px;
  font-size: 12px;
}

/* ---------- 表格：ReTable 自带壳与分页，这里只负责撑满 ---------- */
.dal-table {
  flex: 1;
  min-height: 0;
  --rt-padding: 0;
  --rt-bg: transparent;
  border: none;
  border-radius: 0;
}

.dal-table :deep(.re-table__main) {
  padding: 0;
}

.dal-mono {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

/* 标题列：上行标题、下行详情，整块可点开详情 */
.dal-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.dal-title__main {
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dal-title__detail {
  overflow: hidden;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dal-title:hover .dal-title__main {
  color: var(--el-color-primary);
}

.dal-device {
  font-size: 12px;
}

.dal-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* ---------- 空态 ---------- */
.dal-ghost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 20px;
  text-align: center;
}

.dal-ghost__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  font-size: 20px;
}

.dal-ghost__title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
}

.dal-ghost__desc {
  max-width: 420px;
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

/* ---------- 详情弹窗 ---------- */
.dal-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dal-detail__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dal-detail__title {
  font-size: 14px;
  font-weight: 600;
}

.dal-detail__body {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
}

.dal-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
  margin: 0;
}

.dal-detail__grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dal-detail__grid dt {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.dal-detail__grid dd {
  margin: 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dal-detail__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ---------- 窄屏 ---------- */
@media (max-width: 1280px) {
  .dal-bar__row { flex-wrap: wrap; }
  .dal-f--range { width: 300px; }
}

@media (max-width: 900px) {
  .dal-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dal-f--device, .dal-f--lv, .dal-f--st, .dal-f--kw, .dal-f--range { width: 100%; }
  .dal-detail__grid { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .dal-kpis { grid-template-columns: 1fr; }
  .dal-top { flex-wrap: wrap; }
  .dal-top__at { display: none; }
}
</style>
