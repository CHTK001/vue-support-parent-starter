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

    <!-- 筛选与操作 -->
    <section class="del-filter">
      <div class="del-field del-field--device">
        <ReSelect
          v-model="filters.deviceId"
          placeholder="选择设备（必选）"
          clearable
          filterable
          :options="deviceOptions"
          @change="query"
        />
      </div>
      <el-segmented v-model="filters.type" :options="typeSegments" class="del-seg" @change="query" />
      <div class="del-field del-field--range">
        <el-date-picker
          v-model="filters.range"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          :shortcuts="RANGE_SHORTCUTS"
          style="width: 100%"
        />
      </div>
      <span class="del-filter__meta">{{ filteredRows.length }} / {{ events.length }} 条</span>
      <div class="del-ops">
        <ReButton icon="RefreshRight" layout="square" tip="重新拉取事件" :loading="loading" :disabled="!filters.deviceId" @click="query" />
        <ReButton icon="Download" :show-text="true" :disabled="!filteredRows.length" @click="onExport">导出 CSV</ReButton>
        <ReButton icon="Search" :show-text="true" type="primary" :disabled="!filters.deviceId" @click="query">
          查询
        </ReButton>
      </div>
    </section>

    <!-- 事件列表 -->
    <section class="del-panel del-panel--fill">
      <header class="del-panel__head">
        <span class="del-panel__bar" />
        <span>设备事件</span>
        <span class="del-panel__count">{{ filteredRows.length }}</span>
        <span class="del-panel__hint">{{ currentDeviceName }}</span>
      </header>

      <div v-if="loadError" class="del-error">
        <span>{{ loadError }}</span>
        <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="query" />
      </div>

      <ReTable
        v-if="filteredRows.length"
        :data="filteredRows"
        :columns="columns"
        engine="element"
        table-id="device-events"
        row-key="deviceEventRecordId"
        :pagination="true"
        :page-size="20"
        :page-sizes="[10, 20, 50, 100]"
        :toolbar="false"
        :layout-table="{ fill: 'auto' }"
        :settings="{ border: false }"
        style="width: 100%"
      >
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

      <!-- 空态：未选设备 / 该时段无事件两套文案 -->
      <article v-else class="del-ghost">
        <span class="del-ghost__icon"><el-icon><Tickets /></el-icon></span>
        <p class="del-ghost__title">{{ filters.deviceId ? '该时段没有事件' : '先选择一台设备' }}</p>
        <p class="del-ghost__desc">
          {{
            filters.deviceId
              ? '事件由设备侧实时返回，只回溯到设备本地存储上限；换个时间段或清空类型再查一次。'
              : '事件按设备拉取：选中设备并给出时间范围后查询。'
          }}
        </p>
      </article>
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
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Connection, OfficeBuilding, Tickets } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '../api/deviceApi'
import type { DeviceEvent, DeviceInfo } from '../types/device'

/** 事件类型（后端 SPI 的取值口径） */
const EVENT_TYPES = [
  { value: 'MOTION', label: '移动侦测' },
  { value: 'IO_ALARM', label: 'IO 报警' },
  { value: 'ACCESS', label: '门禁事件' },
  { value: 'TEMP', label: '温度报警' },
  { value: 'NETWORK', label: '网络异常' },
  { value: 'OTHER', label: '其他' },
]

/** 类型分片：事件类型是闭集，用分片挑；类型过滤在后端做，所以不带计数 */
const typeSegments = [{ label: '全部', value: 'all' }, ...EVENT_TYPES]

const EVENT_TYPE_MAP = new Map<string, { label: string; tag: 'primary' | 'success' | 'warning' | 'danger' | 'info' }>()
EVENT_TYPE_MAP.set('MOTION', { label: '移动侦测', tag: 'primary' })
EVENT_TYPE_MAP.set('IO_ALARM', { label: 'IO 报警', tag: 'danger' })
EVENT_TYPE_MAP.set('ACCESS', { label: '门禁事件', tag: 'warning' })
EVENT_TYPE_MAP.set('TEMP', { label: '温度报警', tag: 'danger' })
EVENT_TYPE_MAP.set('NETWORK', { label: '网络异常', tag: 'warning' })
EVENT_TYPE_MAP.set('OTHER', { label: '其他', tag: 'info' })

/** 时间快捷键：就近时段最常用 */
const RANGE_SHORTCUTS = [
  {
    text: '近 1 小时',
    value: () => [new Date(Date.now() - 3600 * 1000), new Date()] as [Date, Date],
  },
  {
    text: '近 24 小时',
    value: () => [new Date(Date.now() - 24 * 3600 * 1000), new Date()] as [Date, Date],
  },
  {
    text: '近 7 天',
    value: () => [new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()] as [Date, Date],
  },
]

const devices = ref<DeviceInfo[]>([])
const events = ref<DeviceEvent[]>([])
const loading = ref(false)
const loadError = ref('')
const lastQueryAt = ref('')

const filters = reactive<{
  deviceId: string
  type: string
  range: [string, string] | null
}>({
  deviceId: '',
  type: 'all',
  range: null,
})

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
  () => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || '未选择设备（事件按设备拉取）',
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
  if (!filters.deviceId) {
    ElMessage.warning('请先选择设备')
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const params: { deviceId: string; type?: string; start?: string; end?: string } = {
      deviceId: filters.deviceId,
    }
    if (filters.type && filters.type !== 'all') params.type = filters.type
    if (filters.range?.[0]) params.start = filters.range[0]
    if (filters.range?.[1]) params.end = filters.range[1]
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
</script>

<style scoped>
.del {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 左右内边距交给外层布局(main.el-main)：两层叠加会让右侧空隙过大 */
  padding: 10px 0 12px;
  /* 高度够就吃满剩余空间（表格内滚、筛选常驻），不够就自然撑开让主区滚动 */
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.del-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.del-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.del-field {
  width: 160px;
}
.del-seg {
  flex: none;
}
.del-field--device {
  width: 230px;
}
.del-field--range {
  width: 360px;
}
.del-field :deep(.el-input),
.del-field :deep(.el-select) {
  width: 100%;
}
.del-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.del-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
@media (max-width: 1100px) {
  .del-field,
  .del-field--device,
  .del-field--range {
    width: 100%;
  }
  .del-filter__meta {
    margin-left: 0;
  }
  .del-ops {
    padding-left: 0;
    border-left: none;
  }
}

.del-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.del-panel--fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.del-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.del-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.del-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.del-panel__hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.del-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: var(--el-radius-base, 8px);
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

.del-ghost {
  flex: 1;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
}
.del-ghost__icon {
  font-size: 30px;
  color: var(--el-text-color-placeholder);
}
.del-ghost__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.del-ghost__desc {
  margin: 0;
  max-width: 460px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
