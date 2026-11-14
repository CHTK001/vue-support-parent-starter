<template>
  <div class="dvp">
    <!-- 概览指标 -->
    <section class="dvp-kpis">
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

    <!-- 过车记录：筛选走 ReTable 自带 ReSearch，标题色条与口径信息都放进搜索条 -->
    <section class="dvp-panel dvp-panel--fill">
      <ReErrorBar v-if="loadError" :message="loadError" retry-text="重试" @retry="loadPasses" />

      <ReTable
        :data="rows"
        :columns="columns"
        :search="searchConfig"
        v-model:search-model="searchModel"
        engine="element"
        table-id="device-vehicle-pass"
        row-key="rid"
        :loading="loading"
        empty-text="没有过车记录"
        :pagination="true"
        :page-size="20"
        :page-sizes="[10, 20, 50, 100]"
        :toolbar="false"
        :layout-table="{ fill: 'auto' }"
        style="width: 100%"
        @search="loadPasses"
        @search-reset="onSearchReset"
      >
        <!-- 「搜索」左侧色条（原来的面板标题条） -->
        <template #search-title-prefix>
          <span class="rec-bar" />
        </template>
        <!-- 搜索条右侧：页面标题 + 条数 -->
        <template #search-title-extra>
          <span class="rec-title">过车记录</span>
          <span class="rec-meta">{{ rows.length }} 条</span>
        </template>
        <!-- 分页左侧：范围与查询时间 -->
        <template #pagination-extra>
          <span class="rec-meta">
            {{ rangeLabel }}<template v-if="lastQueryAt"> · 查询于 {{ lastQueryAt }}</template>
          </span>
        </template>
        <template #col-device="{ row }">
          <span class="dvp-device">{{ deviceName(row.deviceId) }}</span>
        </template>
        <template #col-direction="{ row }">
          <el-tag :type="row.direction === 'in' ? 'success' : 'info'" size="small" effect="plain">
            {{ directionText(row.direction) }}
          </el-tag>
        </template>
        <template #col-photo="{ row }">
          <el-link v-if="row.photoUrl" :href="row.photoUrl" target="_blank" type="primary">查看</el-link>
          <span v-else class="dvp-none">—</span>
        </template>
      </ReTable>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 过车记录页。
 *
 * <p>记录读时序存储（key=车牌号，value=进出方向，extra 带车闸/车型/抓拍），
 * 与门禁记录、传感器记录共用同一套时序契约；换引擎后页面接口不变。
 * 筛选与查询按钮由 ReTable 自带的 ReSearch 提供，页面不再手写筛选栏。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin, Van } from '@element-plus/icons-vue'

import ReErrorBar from '@repo/ui/re-error-bar'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn, ReTableSearchConfig } from '@repo/ui/re-table'

import { deviceApi } from '../api/deviceApi'
import type { DeviceIndexItem, DeviceSeriesPoint } from '../types/device'

const loading = ref(false)
const loadError = ref('')
const lastQueryAt = ref('')
const rows = ref<VehicleRow[]>([])
const devices = ref<DeviceIndexItem[]>([])

/** ReSearch 的筛选值（键与 filters 一致） */
const searchModel = ref<Record<string, unknown>>({
  deviceId: '',
  gateId: '',
  direction: '',
  range: null,
})

/** 归一后的筛选条件 */
const filters = computed(() => ({
  deviceId: String(searchModel.value.deviceId ?? ''),
  gateId: String(searchModel.value.gateId ?? '').trim(),
  direction: String(searchModel.value.direction ?? ''),
  range: (searchModel.value.range as [string, string] | null) ?? null,
}))

/** 表格行（时序点摊平后的展示字段） */
interface VehicleRow {
  rid: string
  plateNo: string
  deviceId: string
  gateId: string
  direction: string
  time: string
  vehicleType: string
  photoUrl: string
}

const columns: ReTableColumn[] = [
  { prop: 'time', label: '过车时间', width: 180 },
  { prop: 'plateNo', label: '车牌号', minWidth: 130 },
  { prop: 'deviceId', label: '设备', minWidth: 180, slot: 'device', showOverflowTooltip: true },
  { prop: 'gateId', label: '车闸 ID', minWidth: 140, showOverflowTooltip: true },
  { prop: 'direction', label: '方向', width: 90, slot: 'direction', align: 'center' },
  { prop: 'vehicleType', label: '车辆类型', width: 120 },
  { prop: 'photoUrl', label: '抓拍', width: 90, slot: 'photo', align: 'center' },
]

const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoCode || d.deviceInfoId}${d.deviceInfoOnline === false ? '（离线）' : ''}`,
  })),
)

/** 内置搜索区：设备 / 时间走时序查询，车闸 / 方向在页面侧过滤 */
const searchConfig = computed<ReTableSearchConfig>(() => ({
  title: '筛选',
  filters: [
    { key: 'deviceId', label: '设备', type: 'select', placeholder: '全部设备', options: deviceOptions.value },
    { key: 'gateId', label: '车闸', type: 'input', placeholder: '车闸 ID' },
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      placeholder: '全部方向',
      options: [
        { label: '全部方向', value: '' },
        { label: '入场', value: 'in' },
        { label: '出场', value: 'out' },
      ],
    },
    {
      key: 'range',
      label: '时间',
      type: 'daterange',
      // 日期组件默认近 350px，会溢出 220px 的网格把右侧按钮盖住，强制收进格子
      attrs: { style: 'width: 100%' },
    },
  ],
}))

const directionText = (value?: string) =>
  value === 'in' ? '入场' : value === 'out' ? '出场' : '—'
const deviceName = (id?: string) =>
  deviceOptions.value.find((d) => d.value === id)?.label ?? (id || '—')

const rangeLabel = computed(() => {
  const r = filters.value.range
  if (r && r[0] && r[1]) return `${r[0].slice(5)} ~ ${r[1].slice(5)}`
  return '最近 1000 条'
})

const inCount = computed(() => rows.value.filter((r) => r.direction === 'in').length)
const outCount = computed(() => rows.value.filter((r) => r.direction === 'out').length)
const gateCount = computed(() => new Set(rows.value.map((r) => r.gateId).filter(Boolean)).size)

const kpis = computed(() => [
  {
    key: 'total',
    title: '过车记录',
    value: rows.value.length,
    desc: lastQueryAt.value ? `查询于 ${lastQueryAt.value}` : '尚未查询',
    icon: Van,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'in',
    title: '入场',
    value: inCount.value,
    desc: '方向 = in',
    icon: Van,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'out',
    title: '出场',
    value: outCount.value,
    desc: '方向 = out',
    icon: Van,
    iconColor: 'var(--el-color-warning)',
  },
  {
    key: 'gate',
    title: '涉及车闸',
    value: gateCount.value,
    desc: '去重后的车闸数',
    icon: Coin,
    iconColor: 'var(--el-color-info)',
  },
])

/** 日期补 00:00:00 / 23:59:59：ReSearch 的日期区间只给日期 */
function dayStart(value: string): string {
  return value.length === 10 ? `${value} 00:00:00` : value
}

function dayEnd(value: string): string {
  return value.length === 10 ? `${value} 23:59:59` : value
}

/** 时序点 → 表格行 */
function toRow(point: DeviceSeriesPoint): VehicleRow {
  const extra = point.extra || {}
  const time = String(point.time ?? '').replace('T', ' ').slice(0, 19)
  const gate = String(extra.gateId ?? point.channel ?? '')
  return {
    rid: `${point.deviceId}-${time}-${gate}-${point.key}`,
    plateNo: point.name || point.key,
    deviceId: point.deviceId,
    gateId: gate,
    direction: String(point.value ?? ''),
    time,
    vehicleType: String(extra.vehicleType ?? ''),
    photoUrl: String(extra.photoUrl ?? ''),
  }
}

async function loadDevices(): Promise<void> {
  try {
    const list = await deviceApi.listIndex()
    devices.value = Array.isArray(list) ? list : []
  } catch {
    devices.value = []
  }
}

async function loadPasses(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const { deviceId, gateId, direction, range } = filters.value
    const points = await deviceApi.queryVehicleSeries({
      deviceId: deviceId || undefined,
      start: range?.[0] ? dayStart(range[0]) : undefined,
      end: range?.[1] ? dayEnd(range[1]) : undefined,
      limit: 1000,
      order: 'desc',
    })
    let list = (points || []).map(toRow)
    // 车闸 / 方向是时序口径之外的筛选：时序引擎只按分类+设备+键+时间取，
    // 这两个条件在页面侧过滤，避免为了一个下拉框给引擎加一堆参数。
    if (gateId) list = list.filter((row) => row.gateId === gateId)
    if (direction) list = list.filter((row) => row.direction === direction)
    rows.value = list
    lastQueryAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch (e: unknown) {
    rows.value = []
    loadError.value = errText(e)
  } finally {
    loading.value = false
  }
}

/** 重置筛选：回到「全部设备 / 最近 1000 条」 */
function onSearchReset(): void {
  searchModel.value = { deviceId: '', gateId: '', direction: '', range: null }
  void loadPasses()
}

/** 错误文本：优先业务原因，其次 HTTP 状态，最后原始消息 */
function errText(e: unknown): string {
  const err = e as { message?: string; response?: { status?: number; data?: { msg?: string; message?: string } } }
  const data = err?.response?.data
  return data?.msg || data?.message || (err?.response?.status ? `请求失败（HTTP ${err.response.status}）` : err?.message) || '未知错误'
}

onMounted(() => {
  void loadDevices()
  void loadPasses()
})
</script>

<style scoped>
.dvp {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 外层间距交给宿主布局（参考设备资产），页面自己不再加内距 */
  padding: 0;
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.dvp-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}

.dvp-panel {
  /* 不画卡面：ReTable 自己就是一张卡，外面再套白底会变成两层边 */
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.dvp-panel--fill {
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

.dvp-device {
  font-weight: 500;
}
.dvp-none {
  color: var(--el-text-color-placeholder);
}
</style>
