<script setup lang="ts">
/**
 * 传感器记录（环境指标历史读数）。
 *
 * <p>最新快照仍存在 `device_metric_latest`（每节点一行），历史读数只进时序引擎：
 * 气象站按分钟上报，历史行落明细会很快把设备库撑大，所以这里按
 * 「设备 + 时间窗」从时序存储取，前端再按节点画曲线与列表。</p>
 *
 * <p>引擎可切换（`plugin.device.timeseries.engine`），页面只依赖统一口径：
 * key=节点标识、value=读数、unit=单位。筛选走 ReTable 自带的 ReSearch。</p>
 *
 * @author CH
 * @since 4.0.0.55
 */
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Histogram, Odometer, Timer, TrendCharts } from '@element-plus/icons-vue'

import ReErrorBar from '@repo/ui/re-error-bar'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn, ReTableSearchConfig } from '@repo/ui/re-table'

import deviceApi from '../api/deviceApi'
import type { DeviceIndexItem, DeviceSeriesEngineInfo, DeviceSeriesPoint } from '../types/device'

/** 一次取多少历史点：够画近一天的分钟级曲线，又不至于把浏览器拖慢 */
const FETCH_LIMIT = 2000

/** 表格行：时序点 + 稳定行键（ReTable 分页要） */
interface MetricRow extends DeviceSeriesPoint {
  rid: string
}

const rows = ref<MetricRow[]>([])
const loading = ref(false)
const loadError = ref('')
const lastQueryAt = ref('')
const engineInfo = ref<DeviceSeriesEngineInfo | null>(null)
const devices = ref<DeviceIndexItem[]>([])

/** ReSearch 的筛选值（键与 filters 一致） */
const searchModel = ref<Record<string, unknown>>({ deviceId: '', key: '', range: null })

/** 归一后的筛选条件 */
const filters = computed(() => ({
  deviceId: String(searchModel.value.deviceId ?? ''),
  key: String(searchModel.value.key ?? ''),
  range: (searchModel.value.range as [string, string] | null) ?? null,
}))

const columns: ReTableColumn[] = [
  { prop: 'time', label: '时间', width: 180, slot: 'time' },
  { prop: 'name', label: '节点', minWidth: 140, slot: 'name' },
  { prop: 'value', label: '读数', width: 150, slot: 'value' },
  { prop: 'key', label: '节点标识', minWidth: 160, showOverflowTooltip: true },
  { prop: 'channel', label: '通道', width: 100 },
]

const deviceOptions = computed(() =>
  devices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName || d.deviceInfoCode || d.deviceInfoId}${d.deviceInfoOnline === false ? '（离线）' : ''}`,
  })),
)

/** 节点标识清单（按本次拉到的记录聚合，避免写死温度/湿度） */
const keyOptions = computed(() => {
  const set = new Set<string>()
  rows.value.forEach((row) => {
    if (row.key) set.add(row.key)
  })
  return [...set].sort().map((key) => ({ value: key, label: key }))
})

/** 内置搜索区：设备 + 时间走时序查询，节点在页面侧过滤 */
const searchConfig = computed<ReTableSearchConfig>(() => ({
  title: '筛选',
  filters: [
    { key: 'deviceId', label: '设备', type: 'select', placeholder: '选择设备', options: deviceOptions.value },
    { key: 'key', label: '节点', type: 'select', placeholder: '全部节点', options: keyOptions.value },
    {
      key: 'range',
      label: '时间',
      type: 'daterange',
      // 日期组件默认近 350px，会溢出 220px 的网格把右侧按钮盖住，强制收进格子
      attrs: { style: 'width: 100%' },
    },
  ],
}))

/** 当前展示的节点序列（选中节点则只看它，未选则全部） */
const currentSeries = computed(() => {
  const key = filters.value.key
  const list = key ? rows.value.filter((row) => row.key === key) : rows.value
  return [...list].sort((a, b) => timeOf(a.time) - timeOf(b.time))
})

/** 表格行：最新在前 */
const tableRows = computed(() => [...rows.value].sort((a, b) => timeOf(b.time) - timeOf(a.time)))

const keyCount = computed(() => keyOptions.value.length)

const latest = computed(() => {
  const list = currentSeries.value
  return list.length ? list[list.length - 1] : null
})

const first = computed(() => (currentSeries.value.length ? currentSeries.value[0] : null))

const rangeLabel = computed(() => {
  const r = filters.value.range
  if (r && r[0] && r[1]) return `${r[0].slice(5)} ~ ${r[1].slice(5)}`
  return first.value ? `${fmtTime(first.value.time)} 起` : '最近 2000 条'
})

const kpis = computed(() => [
  {
    key: 'rows',
    title: '历史记录',
    value: rows.value.length,
    desc: lastQueryAt.value ? `查询于 ${lastQueryAt.value}` : `最多取最近 ${FETCH_LIMIT} 条`,
    icon: Odometer,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'keys',
    title: '节点数',
    value: keyCount.value,
    desc: filters.value.key ? `当前只看 ${filters.value.key}` : '温度 / 湿度 / 雨量等',
    icon: Histogram,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'latest',
    title: '最新读数',
    value: latest.value ? `${latest.value.value ?? '—'}${latest.value.unit || ''}` : '—',
    desc: latest.value ? `${latest.value.name || latest.value.key} · ${fmtTime(latest.value.time)}` : '暂无数据',
    icon: TrendCharts,
    iconColor: 'var(--el-color-warning)',
  },
  {
    key: 'span',
    title: '覆盖时段',
    value: first.value ? fmtTime(first.value.time) : '—',
    desc: latest.value ? `至 ${fmtTime(latest.value.time)}` : '换个时间范围再试',
    icon: Timer,
    iconColor: 'var(--el-color-info)',
  },
])

/**
 * 曲线点集：把当前序列降采样成不超过 200 个点后映射到 640×180 的画布。
 *
 * @returns line 折线点串、area 面积点串、min/max 数值范围、count 参与绘制的点数
 */
const chart = computed(() => {
  const list = currentSeries.value.filter((row) => Number.isFinite(Number(row.value)))
  if (list.length < 2) {
    return { line: '', area: '', min: 0, max: 0, count: list.length }
  }
  const stride = Math.ceil(list.length / 200)
  const sampled = list.filter((_, index) => index % stride === 0)
  const values = sampled.map((row) => Number(row.value))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = 640 / Math.max(sampled.length - 1, 1)
  const points = sampled.map((row, index) => {
    const y = 170 - ((Number(row.value) - min) / span) * 150
    return `${(index * stepX).toFixed(1)},${y.toFixed(1)}`
  })
  return {
    line: points.join(' '),
    area: `0,175 ${points.join(' ')} 640,175`,
    min,
    max,
    count: sampled.length,
  }
})

/**
 * 本地时间文本 → 毫秒（后端给的是不带时区的 ISO 文本）。
 *
 * @param value 时间文本
 * @returns 毫秒时间戳；无法解析返回 0
 */
function timeOf(value?: string | null): number {
  if (!value) return 0
  const time = new Date(value.replace(' ', 'T')).getTime()
  return Number.isFinite(time) ? time : 0
}

/**
 * 展示时间：去掉 ISO 的 T 与毫秒尾巴。
 *
 * @param value 时间文本
 * @returns 展示文本
 */
function fmtTime(value?: string | null): string {
  if (!value) return '—'
  return value.replace('T', ' ').slice(0, 19)
}

/** 日期补 00:00:00 / 23:59:59：ReSearch 的日期区间只给日期 */
function dayStart(value: string): string {
  return value.length === 10 ? `${value} 00:00:00` : value
}

function dayEnd(value: string): string {
  return value.length === 10 ? `${value} 23:59:59` : value
}

/** 加载设备清单（选设备用） */
async function loadDevices(): Promise<void> {
  try {
    const list = await deviceApi.listIndex()
    devices.value = Array.isArray(list) ? list : []
  } catch (e: unknown) {
    devices.value = []
    ElMessage.error(`设备清单加载失败：${errText(e)}`)
  }
}

/** 加载引擎信息（存储类型与不可用原因） */
async function loadEngine(): Promise<void> {
  try {
    engineInfo.value = await deviceApi.seriesEngine()
  } catch {
    // 引擎信息拿不到不影响查数据，顶部徽标留空即可
    engineInfo.value = null
  }
}

/** 查询历史读数 */
async function query(): Promise<void> {
  if (!filters.value.deviceId) {
    rows.value = []
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const { deviceId, range } = filters.value
    const list = await deviceApi.metricHistory(deviceId, {
      start: range?.[0] ? dayStart(range[0]) : undefined,
      end: range?.[1] ? dayEnd(range[1]) : undefined,
      limit: FETCH_LIMIT,
      order: 'asc',
    })
    rows.value = Array.isArray(list)
      ? list.map((point) => ({ ...point, rid: `${point.key}#${point.time ?? ''}` }))
      : []
    lastQueryAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch (e: unknown) {
    rows.value = []
    loadError.value = errText(e)
  } finally {
    loading.value = false
  }
}

/** 重置筛选：清条件与结果（节点选项来自结果，所以一并清空） */
function onSearchReset(): void {
  searchModel.value = { deviceId: '', key: '', range: null }
  rows.value = []
  lastQueryAt.value = ''
  loadError.value = ''
}

/** 错误文本：优先业务原因，其次 HTTP 状态，最后原始消息 */
function errText(e: unknown): string {
  const err = e as { message?: string; response?: { status?: number; data?: { msg?: string; message?: string; error?: string } } }
  const data = err?.response?.data
  const business = data?.msg || data?.message || data?.error
  if (business) return String(business)
  if (err?.response?.status) return `请求失败（HTTP ${err.response.status}）`
  return err?.message || '未知错误'
}

onMounted(async () => {
  await Promise.all([loadDevices(), loadEngine()])
})
</script>

<template>
  <div class="dmh">
    <el-alert
      v-if="engineInfo && !engineInfo.available"
      class="dmh-alert"
      type="warning"
      :closable="false"
      show-icon
      :title="`时序引擎不可用：${engineInfo.reason || '未配置'}`"
      description="历史读数无法查询；最新快照（设备详情 / 环境指标）不受影响。"
    />

    <section class="dmh-kpis">
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

    <section v-if="chart.line" class="dmh-chart">
      <header class="dmh-chart__head">
        <span class="dmh-chart__title">{{ filters.key || '全部节点' }} 走势</span>
        <span class="dmh-chart__meta">
          {{ chart.count }} 点 · 最小 {{ chart.min }} · 最大 {{ chart.max }}（单位见列表）
        </span>
      </header>
      <svg class="dmh-chart__svg" viewBox="0 0 640 180" preserveAspectRatio="none" role="img" aria-label="读数走势">
        <polygon :points="chart.area" fill="var(--el-color-primary-light-8)" />
        <polyline
          :points="chart.line"
          fill="none"
          stroke="var(--el-color-primary)"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          stroke-linejoin="round"
        />
      </svg>
    </section>

    <!-- 历史读数：筛选走 ReTable 自带 ReSearch，标题色条与口径信息都放进搜索条 -->
    <section class="dmh-panel dmh-panel--fill">
      <ReErrorBar v-if="loadError" :message="loadError" retry-text="重试" @retry="query" />

      <ReTable
        :data="tableRows"
        :columns="columns"
        :search="searchConfig"
        v-model:search-model="searchModel"
        engine="element"
        table-id="device-metric-history"
        row-key="rid"
        :loading="loading"
        :empty-text="filters.deviceId ? '该时间范围内没有历史读数' : '先选一台设备再查询'"
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
        <!-- 搜索条右侧：页面标题 + 条数 -->
        <template #search-title-extra>
          <span class="rec-title">历史读数</span>
          <span class="rec-meta">{{ rows.length }} 条</span>
        </template>
        <!-- 分页左侧：覆盖时段与查询时间 -->
        <template #pagination-extra>
          <span class="rec-meta">
            {{ rangeLabel }}<template v-if="lastQueryAt"> · 查询于 {{ lastQueryAt }}</template>
          </span>
        </template>
        <template #col-time="{ row }">
          <span class="dmh-mono">{{ fmtTime(row.time) }}</span>
        </template>
        <template #col-name="{ row }">
          {{ row.name || row.key }}
        </template>
        <template #col-value="{ row }">
          <span class="dmh-value">{{ row.value ?? '—' }}</span>
          <span v-if="row.unit" class="dmh-unit">{{ row.unit }}</span>
        </template>
      </ReTable>
    </section>
  </div>
</template>

<style scoped>
.dmh {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 外层间距交给宿主布局（参考设备资产），页面自己不再加内距 */
  padding: 0;
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.dmh-alert {
  padding: 6px 10px;
}

.dmh-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}

.dmh-chart {
  /* 不画卡面：与表格面板一致，走势图直接浮在页面底色上 */
  padding: 0 4px;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.dmh-chart__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dmh-chart__title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dmh-chart__svg {
  display: block;
  width: 100%;
  height: 150px;
}

.dmh-panel {
  /* 不画卡面：ReTable 自己就是一张卡，外面再套白底会变成两层边 */
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.dmh-panel--fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.dmh-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13.5px;
  font-weight: 600;
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

.dmh-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12.5px;
}
.dmh-value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.dmh-unit {
  margin-left: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
