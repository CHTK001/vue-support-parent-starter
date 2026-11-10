<template>
  <div class="dal">
    <!-- 概览指标 -->
    <section class="dal-kpis">
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
    <section class="dal-filter">
      <div class="dal-field dal-field--device">
        <ReSelect
          v-model="filters.deviceId"
          placeholder="全部设备（可选）"
          clearable
          filterable
          :options="deviceOptions"
          @change="query"
        />
      </div>
      <el-segmented v-model="filters.level" :options="levelSegments" class="dal-seg" @change="query" />
      <el-segmented v-model="filters.status" :options="statusSegments" class="dal-seg" @change="query" />
      <div class="dal-field dal-field--range">
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
      <div class="dal-field dal-field--kw">
        <ReInput v-model="filters.keyword" placeholder="关键词（标题 / 详情 / 来源）" clearable @clear="query" />
      </div>
      <span class="dal-query__meta">{{ total }} 条</span>
      <div class="dal-ops">
        <ReButton icon="RefreshRight" layout="square" tip="重新拉取" :loading="loading" @click="query" />
        <ReButton icon="Download" :show-text="true" :disabled="!rows.length" @click="onExport">导出 CSV</ReButton>
        <ReButton icon="Search" :show-text="true" type="primary" @click="query">
          查询
        </ReButton>
      </div>
    </section>

    <!-- 告警列表 -->
    <section class="dal-panel dal-panel--fill">
      <header class="dal-panel__head">
        <span class="dal-panel__bar" />
        <span>设备告警</span>
        <span class="dal-panel__count">{{ total }}</span>
        <span class="dal-panel__hint">{{ currentDeviceName }}</span>
      </header>

      <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="query" />

      <ReTable
        v-if="rows.length"
        :data="rows"
        :columns="columns"
        engine="element"
        table-id="device-alarms"
        row-key="deviceAlarmId"
        :pagination="true"
        :page-size="20"
        :page-sizes="[10, 20, 50, 100]"
        :toolbar="false"
        :layout-table="{ fill: 'auto' }"
        :settings="{ border: false }"
        style="width: 100%"
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
            {{ levelMeta(row.deviceAlarmLevel).level }}
          </ReTag>
        </template>
        <template #col-status="{ row }">
          <ReTag :type="statusMeta(row.deviceAlarmStatus).tag" size="small" effect="dark">
            {{ statusMeta(row.deviceAlarmStatus).label }}
          </ReTag>
        </template>
        <template #col-title="{ row }">
          <div class="dal-title">
            <div class="dal-title__main">{{ row.deviceAlarmTitle }}</div>
            <div class="dal-title__detail">{{ row.deviceAlarmDetail }}</div>
          </div>
        </template>
        <template #col-device="{ row }">
          <span class="dal-device">{{ deviceNameOf(row.deviceAlarmDeviceId) }}</span>
        </template>
        <template #col-actions="{ row }">
          <div class="dal-actions">
            <ReButton v-show="row.deviceAlarmStatus !== 'resolved' && row.deviceAlarmStatus !== 'ignored'" icon="Check" layout="square" size="small" tip="解决" @click="handle(row, 'resolved')" />
            <ReButton v-show="row.deviceAlarmStatus === 'unhandled'" icon="Close" layout="square" size="small" tip="忽略" @click="handle(row, 'ignored')" />
          </div>
        </template>
      </ReTable>

      <!-- 空态：查询无结果 -->
      <article v-else class="dal-ghost">
        <span class="dal-ghost__icon"><el-icon><Bell /></el-icon></span>
        <p class="dal-ghost__title">还没有收到告警</p>
        <p class="dal-ghost__desc">
          外部系统通过 webhook 推送后会出现在这里；也可以放宽级别 / 状态 / 时间筛选再查一次。
        </p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备告警页签 —— 设备告警列表、处理、导出。
 *
 * 数据来自 device-starter 的 `/api/device/alarms` / `/api/device/alarms/stats`：
 *   GET /alarms?deviceId=&type=&level=&status=&keyword=&start=&end=&pageNo=&pageSize=
 *   POST /alarms/{id}/status?status=resolved&handler=xxx
 * 设备为必填项：告警按设备分拣入库，不选设备就没有查询对象。
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Tickets } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReSelect from '@repo/ui/re-select'
import ReInput from '@repo/ui/re-input'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import type { ReTableColumn } from '@repo/ui/re-table'

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

const devices = ref<DeviceInfo[]>([])
const rows = ref<DeviceAlarm[]>([])
const loading = ref(false)
const loadError = ref('')
const total = ref(0)
const lastQueryAt = ref('')

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

/** 设备告警页面 / alarm 行都走设备界面 JSONArray → 数值契约 */
const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoId}${d.deviceInfoOnline ? '' : '（离线）'}`,
  })),
)

const currentDeviceName = computed(
  () => devices.value.find((d) => d.deviceInfoId === filters.deviceId)?.deviceInfoName || '全部设备（告警按来源推送）',
)

function deviceNameOf(deviceId?: string): string {
  const d = devices.value.find((item) => item.deviceInfoId === deviceId)
  if (!d) return deviceId ?? ''
  return d.deviceInfoName || d.deviceInfoIp || deviceId || ''
}

const columns: ReTableColumn[] = [
  { prop: 'deviceAlarmTitle', label: '告警标题', slot: 'title', minWidth: 220 },
  { prop: 'deviceAlarmLevel', label: '级别', slot: 'level', width: 110, align: 'center' },
  { prop: 'deviceAlarmType', label: '告警类型', slot: 'type', width: 130 },
  { prop: 'deviceAlarmOccurredAt', label: '发生时间', slot: 'occurredAt', width: 190 },
  { prop: 'deviceAlarmStatus', label: '处理状态', slot: 'status', width: 130, align: 'center' },
  { prop: 'deviceAlarmDeviceId', label: '设备', slot: 'device', width: 200 },
  { prop: 'actions', label: '操作', slot: 'actions', width: 120, align: 'center', fixed: 'right' },
]

const kpis = computed(() => [
  { key: 'total', title: '告警总数', value: stats.value.total ?? '--', desc: lastQueryAt.value ? `查询于 ${lastQueryAt.value}` : '尚未查询', icon: Tickets, iconColor: 'var(--el-color-primary)' },
  { key: 'unhandled', title: '未处理', value: stats.value.unhandled ?? '--', desc: '待处理的告警', icon: Bell, iconColor: 'var(--el-color-warning)' },
  { key: 'critical', title: '严重/重要', value: stats.value.critical ?? '--', desc: 'critical / major', icon: Bell, iconColor: 'var(--el-color-danger)' },
  { key: 'today', title: '今日新增', value: stats.value.today ?? '--', desc: '今天收到的告警', icon: Tickets, iconColor: 'var(--el-color-success)' },
])

const stats = ref<Record<string, number>>({})

/** 请求以下拉设备列表 + 告警 + 统计 */
async function query() {
  loading.value = true
  loadError.value = ''
  try {
    const params: Record<string, unknown> = {
      pageNo: 1,
      pageSize: 20,
    }
    if (filters.deviceId) params.deviceId = filters.deviceId
    if (filters.level) params.level = filters.level
    if (filters.status) params.status = filters.status
    if (filters.keyword.trim()) params.keyword = filters.keyword.trim()
    if (filters.range) {
      params.start = filters.range[0]
      params.end = filters.range[1]
    }
    const [alarms, res] = await Promise.all([
      deviceApi.listAlarms(params),
      deviceApi.alarmStats(),
    ])
    rows.value = alarms.records ?? alarms.data ?? []
    total.value = alarms.total ?? 0
    stats.value = res ?? {}
    lastQueryAt.value = new Date().toLocaleTimeString()
  } catch (err) {
    loadError.value = errorText(err)
    ElMessage.error(loadError.value)
  } finally {
    loading.value = false
  }
}

/** 处理操作：unhandled→resolved/ignored、其他→handling */
async function handle(row: DeviceAlarm, status: string) {
  try {
    await deviceApi.updateAlarmStatus(row.deviceAlarmId, status, 'admin')
    ElMessage.success(`已标记为 ${statusMeta(status).label}`)
    await query()
  } catch (err) {
    ElMessage.error('状态更新失败：' + errorText(err))
  }
}

/** 统一错误文案（框架 5xx 会清空 message，这里兜底） */
function errorText(err: unknown): string {
  const e = err as { msg?: string; message?: string } | undefined
  return e?.msg || e?.message || String(err ?? '未知错误')
}

function typeMeta(type: string) {
  const found = ALARM_TYPES.find((t) => t.value === type)
  return { label: found?.label ?? type, tag: (found?.tag || 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info' }
}

function levelMeta(level: string) {
  const meta: Record<string, { label: string; tag: 'primary' | 'success' | 'warning' | 'danger' | 'info'; level: string }> = {
    critical: { label: '严重', tag: 'danger', level: '严重' },
    major: { label: '重要', tag: 'warning', level: '重要' },
    minor: { label: '轻微', tag: 'primary', level: '轻微' },
    info: { label: '信息', tag: 'info', level: '信息' },
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

function fmtTime(time?: string): string {
  if (!time) return '-'
  return time.replace('T', ' ')
}

function onExport() {
  if (!rows.value.length) return
  const header = ['告警ID','级别','类型','标题','设备','状态','发生时间']
  const csvRows = rows.value.map((r) => [r.deviceAlarmId, levelMeta(r.deviceAlarmLevel).level, typeMeta(r.deviceAlarmType).label,
    r.deviceAlarmTitle, deviceNameOf(r.deviceAlarmDeviceId), statusMeta(r.deviceAlarmStatus).label, r.deviceAlarmOccurredAt])
  const csv = [header, ...csvRows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `device-alarm-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

onMounted(async () => {
  try {
    devices.value = await deviceApi.list()
  } catch (err) {
    loadError.value = '加载设备列表失败'
  }
  // 全局告警流：不依赖必须先选设备，打开页签即拉真实数据
  await query()
})
</script>

<style scoped>
.dal { display: flex; flex-direction: column; gap: 16px; height: 100%; padding-right: 4px; }
.dal-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.dal-filter {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.dal-field { display: flex; align-items: center; }
.dal-field--device { width: 260px; }
.dal-field--range { flex: 1; min-width: 420px; }
.dal-field--kw { width: 220px; }
.dal-query__meta { color: var(--el-text-color-regular); font-size: 13px; }
.dal-ops { display: flex; gap: 8px; }
.dal-panel { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.dal-panel__head {
  display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600;
  padding: 8px 0 12px; border-bottom: 1px solid var(--el-border-color);
}
.dal-panel__bar { width: 4px; height: 16px; background: var(--el-color-primary); border-radius: 2px; }
.dal-panel__count { color: var(--el-text-color-secondary); font-size: 13px; font-weight: 400; }
.dal-panel__hint { flex: 1; color: var(--el-text-color-regular); font-size: 13px; }
.dal-mono { font-family: var(--el-font-family-code); font-variant-numeric: tabular-nums; }
.dal-title { display: flex; flex-direction: column; gap: 4px; }
.dal-title__main { font-weight: 500; line-height: 1.5; }
.dal-title__detail { font-size: 12px; color: var(--el-text-color-regular); line-height: 1.4; }
.dal-device { font-family: var(--el-font-family-code); font-size: 13px; }
.dal-actions { display: flex; gap: 6px; justify-content: center; }
.dal-ghost {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 64px 0; color: var(--el-text-color-secondary);
}
.dal-ghost__icon { font-size: 40px; opacity: .45; color: var(--el-color-primary); margin-bottom: 16px; }
.dal-ghost__title { font-size: 15px; margin-bottom: 8px; }
.dal-ghost__desc { font-size: 13px; color: var(--el-text-color-placeholder); }
</style>
