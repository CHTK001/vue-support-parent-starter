<template>
  <div class="del">
    <!-- 概览指标 -->
    <section class="del-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- 事件列表：筛选走 ReTable 自带 ReSearch，标题色条与口径信息都放进搜索条 -->
    <section class="del-panel del-panel--fill">
      <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="query" />

      <ReTable
        :data="filteredRows"
        :columns="columns"
        :search="searchConfig"
        v-model:search-model="searchModel"
        engine="element"
        table-id="device-events"
        row-key="deviceEventRecordId"
        :loading="loading"
        :empty-text="filters.deviceId ? '该时段没有事件' : '先选择一台设备'"
        :pagination="true"
        :page-size="20"
        :page-sizes="[10, 20, 50, 100]"
        :toolbar="false"
        :layout-table="{ fill: 'auto' }"
        style="width: 100%"
        @search="query"
        @search-reset="onSearchReset"
      >
        <!-- 「搜索」左侧色条（原来的面板标题条） -->
        <template #search-title-prefix>
          <span class="rec-bar" />
        </template>
        <!-- 搜索条右侧：页面标题 + 条数 + 导出 -->
        <template #search-title-extra>
          <span class="rec-title">设备事件</span>
          <span class="rec-meta">{{ filteredRows.length }} 条</span>
          <ReButton
            icon="Download"
            layout="square"
            tip="导出当前筛选（CSV）"
            :disabled="!filteredRows.length"
            @click="onExport"
          />
        </template>
        <!-- 分页左侧：设备与查询时间 -->
        <template #pagination-extra>
          <span class="rec-meta">
            {{ currentDeviceName }}<template v-if="lastQueryAt"> · 查询于 {{ lastQueryAt }}</template>
          </span>
        </template>
        <template #col-time="{ row }">
          <span class="del-mono">{{ fmtTime(row.deviceEventRecordOccurredAt) }}</span>
        </template>
        <template #col-type="{ row }">
          <ReTag :type="typeMeta(row.deviceEventRecordEventType).tag" size="small" effect="plain">
            {{ typeMeta(row.deviceEventRecordEventType).label }}
          </ReTag>
        </template>
        <template #col-detail="{ row }">
          <span class="del-detail">{{ row.deviceEventRecordDetail || '—' }}</span>
        </template>
        <template #col-device="{ row }">
          <span class="del-device">{{ deviceNameOf(row.deviceEventRecordDeviceId) }}</span>
        </template>
      </ReTable>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备日志 —— 设备事件（移动侦测 / IO 报警 / 门禁 / 温度 / 网络）查询。
 *
 * 数据来自 device-starter 的 `/api/device/events`：
 *   GET /events?deviceId=&type=&start=&end=
 * 设备为必填项：事件由设备侧实时返回，不选设备就没有查询对象。
 * 筛选与查询按钮由 ReTable 自带的 ReSearch 提供，页面不再手写筛选栏。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Connection, OfficeBuilding, Tickets } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn, ReTableSearchConfig } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '../api/deviceApi'
import type { DeviceEvent, DeviceInfo } from '../types/device'

/**
 * 预置设备：从设备资产右键进入时带入目标设备，自动选中并查询事件。
 * 独立打开（无 prop）时保持原有手动选择设备的行为。
 */
const props = withDefaults(defineProps<{ deviceId?: string }>(), { deviceId: '' })

/** 事件类型（后端 SPI 的取值口径） */
const EVENT_TYPES = [
  { value: 'MOTION', label: '移动侦测' },
  { value: 'IO_ALARM', label: 'IO 报警' },
  { value: 'ACCESS', label: '门禁事件' },
  { value: 'TEMP', label: '温度报警' },
  { value: 'NETWORK', label: '网络异常' },
  { value: 'OTHER', label: '其他' },
]

/** 类型筛选项：闭集，直接给下拉 */
const typeOptions = [{ value: 'all', label: '全部类型' }, ...EVENT_TYPES]

const EVENT_TYPE_MAP = new Map<string, { label: string; tag: 'primary' | 'success' | 'warning' | 'danger' | 'info' }>()
EVENT_TYPE_MAP.set('MOTION', { label: '移动侦测', tag: 'primary' })
EVENT_TYPE_MAP.set('IO_ALARM', { label: 'IO 报警', tag: 'danger' })
EVENT_TYPE_MAP.set('ACCESS', { label: '门禁事件', tag: 'warning' })
EVENT_TYPE_MAP.set('TEMP', { label: '温度报警', tag: 'danger' })
EVENT_TYPE_MAP.set('NETWORK', { label: '网络异常', tag: 'warning' })
EVENT_TYPE_MAP.set('OTHER', { label: '其他', tag: 'info' })

const devices = ref<DeviceInfo[]>([])
const events = ref<DeviceEvent[]>([])
const loading = ref(false)
const loadError = ref('')
const lastQueryAt = ref('')

/** ReSearch 的筛选值（键与 filters 一致） */
const searchModel = ref<Record<string, unknown>>({
  deviceId: props.deviceId || '',
  type: 'all',
  range: null,
})

/** 归一后的筛选条件：模板与查询都读这里，避免各写一套默认值 */
const filters = computed(() => ({
  deviceId: String(searchModel.value.deviceId ?? ''),
  type: String(searchModel.value.type ?? 'all'),
  range: (searchModel.value.range as [string, string] | null) ?? null,
}))

/** 内置搜索区：设备必选，类型是闭集，时间按日期区间 */
const searchConfig = computed<ReTableSearchConfig>(() => ({
  title: '筛选',
  filters: [
    {
      key: 'deviceId',
      label: '设备',
      type: 'select',
      placeholder: '选择设备（必选）',
      options: deviceOptions.value,
    },
    { key: 'type', label: '类型', type: 'select', placeholder: '全部类型', options: typeOptions },
    {
      key: 'range',
      label: '时间',
      type: 'daterange',
      // 日期组件默认近 350px，会溢出 220px 的网格把右侧按钮盖住，强制收进格子
      attrs: { style: 'width: 100%' },
    },
  ],
}))

const columns: ReTableColumn[] = [
  { prop: 'deviceEventRecordOccurredAt', label: '发生时间', width: 190, slot: 'time' },
  { prop: 'deviceEventRecordChannelNo', label: '通道', width: 90, align: 'center' },
  { prop: 'deviceEventRecordEventType', label: '事件类型', width: 130, slot: 'type' },
  { prop: 'deviceEventRecordDetail', label: '详情', minWidth: 260, slot: 'detail', showOverflowTooltip: true },
  { prop: 'deviceEventRecordDeviceId', label: '设备', minWidth: 180, slot: 'device' },
]

const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoId}${d.deviceInfoOnline ? '' : '（离线）'}`,
  })),
)

const currentDeviceName = computed(
  () => devices.value.find((d) => d.deviceInfoId === filters.value.deviceId)?.deviceInfoName || '未选择设备（事件按设备拉取）',
)

const filteredRows = computed(() => events.value)

const alarmCount = computed(
  () =>
    events.value.filter((e) => ['IO_ALARM', 'TEMP', 'NETWORK'].includes(e.deviceEventRecordEventType || '')).length,
)

const channelCount = computed(
  () => new Set(events.value.map((e) => e.deviceEventRecordChannelNo).filter((n) => n !== undefined)).size,
)

const latestAt = computed(() => {
  const times = events.value
    .map((e) => new Date(e.deviceEventRecordOccurredAt || '').getTime())
    .filter((t) => !Number.isNaN(t))
  if (!times.length) return null
  return new Date(Math.max(...times))
})

const kpis = computed(() => [
  {
    key: 'total',
    title: '事件记录',
    value: events.value.length,
    desc: lastQueryAt.value ? `查询于 ${lastQueryAt.value}` : '尚未查询',
    icon: Tickets,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'alarm',
    title: '告警事件',
    value: alarmCount.value,
    desc: 'IO / 温度 / 网络',
    icon: Bell,
    iconColor: 'var(--el-color-danger)',
  },
  {
    key: 'channel',
    title: '涉及通道',
    value: channelCount.value,
    desc: '去重后的通道数',
    icon: Connection,
    iconColor: 'var(--metric-disk, var(--el-color-warning))',
  },
  {
    key: 'latest',
    title: '最新事件',
    value: latestAt.value ? latestAt.value.toLocaleDateString('zh-CN') : '—',
    desc: latestAt.value ? latestAt.value.toLocaleTimeString('zh-CN', { hour12: false }) : '暂无记录',
    icon: OfficeBuilding,
    iconColor: 'var(--el-color-info)',
  },
])

/** 日期区间补上时分秒：ReSearch 的 daterange 只给日期，接口按时间比较 */
function dayStart(value: string): string {
  return value.length === 10 ? `${value} 00:00:00` : value
}

function dayEnd(value: string): string {
  return value.length === 10 ? `${value} 23:59:59` : value
}

function typeMeta(value?: string): { label: string; tag: 'primary' | 'success' | 'warning' | 'danger' | 'info' } {
  return EVENT_TYPE_MAP.get(value || '') || { label: value || '—', tag: 'info' }
}

function fmtTime(v?: string): string {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('zh-CN', { hour12: false })
}

function deviceNameOf(id?: string): string {
  if (!id) return '—'
  return devices.value.find((d) => d.deviceInfoId === id)?.deviceInfoName || id
}

async function fetchDevices(): Promise<void> {
  try {
    devices.value = ((await deviceApi.list()) as DeviceInfo[]) || []
  } catch (e: unknown) {
    devices.value = []
    ElMessage.error(`设备清单加载失败：${errText(e)}`)
  }
}

async function query(): Promise<void> {
  if (!filters.value.deviceId) {
    ElMessage.warning('请先选择设备')
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const { deviceId, type, range } = filters.value
    const params: { deviceId: string; type?: string; start?: string; end?: string } = { deviceId }
    if (type && type !== 'all') params.type = type
    if (range?.[0]) params.start = dayStart(range[0])
    if (range?.[1]) params.end = dayEnd(range[1])
    events.value = ((await deviceApi.queryEvents(params)) as DeviceEvent[]) || []
    lastQueryAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch (e: unknown) {
    events.value = []
    loadError.value = errText(e)
    ElMessage.error(`事件加载失败：${loadError.value}`)
  } finally {
    loading.value = false
  }
}

/** 重置筛选：只清条件，不自动查（设备被清空后也没有查询对象） */
function onSearchReset(): void {
  searchModel.value = { deviceId: props.deviceId || '', type: 'all', range: null }
  events.value = []
  lastQueryAt.value = ''
  loadError.value = ''
}

function onExport(): void {
  const header = ['发生时间', '通道', '事件类型', '详情', '设备']
  const body = filteredRows.value.map((e) => [
    fmtTime(e.deviceEventRecordOccurredAt),
    String(e.deviceEventRecordChannelNo ?? ''),
    typeMeta(e.deviceEventRecordEventType).label,
    e.deviceEventRecordDetail || '',
    deviceNameOf(e.deviceEventRecordDeviceId),
  ])
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  // 加 BOM，避免 Excel 打开中文乱码
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `设备事件-${currentDeviceName.value}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function errText(e: unknown): string {
  return (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
}

onMounted(fetchDevices)

watch(
  () => props.deviceId,
  (id) => {
    if (!id) return
    searchModel.value = { ...searchModel.value, deviceId: id }
    query()
  },
  { immediate: true }
)
</script>

<style scoped>
.del {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 外层间距交给宿主布局（参考设备资产），页面自己不再加内距 */
  padding: 0;
  /* 高度够就吃满剩余空间（表格内滚、筛选常驻），不够就自然撑开让主区滚动 */
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.del-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}

.del-panel {
  /* 不画卡面：ReTable 自己就是一张卡，外面再套白底会变成两层边 */
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.del-panel--fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 搜索条里的页面标题与口径（原面板标题行的内容） */
.rec-bar {
  display: inline-block;
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: var(--el-color-primary);
}
.rec-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.rec-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.del-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12.5px;
}
.del-device {
  font-weight: 500;
}
.del-detail {
  color: var(--el-text-color-regular);
}
</style>
