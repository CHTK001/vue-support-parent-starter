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
        <!-- 搜索条右侧：页面标题 + 条数 + 导出 / 登记 / 拉取 -->
        <template #search-title-extra>
          <span class="rec-title">过车记录</span>
          <span class="rec-meta">{{ rows.length }} 条</span>
          <ReButton icon="Download" size="small" :show-text="true" :disabled="!rows.length" @click="exportCsv">导出 CSV</ReButton>
          <ReButton icon="Plus" size="small" :show-text="true" @click="openRecordDialog">登记过车</ReButton>
          <ReButton icon="Refresh" size="small" :show-text="true" @click="openPullDialog">从设备拉取</ReButton>
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
          <el-image
            v-if="row.photoUrl"
            class="dvp-photo"
            :src="row.photoUrl"
            :preview-src-list="[row.photoUrl]"
            preview-teleported
            hide-on-click-modal
            lazy
            fit="cover"
          >
            <template #error>
              <span class="dvp-photo-fallback">加载失败</span>
            </template>
          </el-image>
          <span v-else class="dvp-none">—</span>
        </template>
      </ReTable>
    </section>

    <!-- 从设备拉取过车记录：选车闸设备 + 时间窗，走后端 /barrier/pass/pull -->
    <el-dialog v-model="pullVisible" title="从设备拉取过车记录" width="460px" append-to-body>
      <div class="dvp-pull">
        <span class="dvp-pull__label">车闸设备</span>
        <el-select v-model="pullDeviceId" filterable placeholder="选择车闸设备" style="width: 100%">
          <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
        <span class="dvp-pull__label">时间范围</span>
        <el-date-picker v-model="pullRange" type="datetimerange" style="width: 100%" range-separator="至"
          start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
        <p class="dvp-pull__hint">按时间范围从设备侧拉取过车记录并写入时序库；设备离线或厂商接口不通时会提示失败原因。</p>
      </div>
      <template #footer>
        <el-button @click="pullVisible = false">取消</el-button>
        <el-button type="primary" :loading="pulling" @click="confirmPull">拉取</el-button>
      </template>
    </el-dialog>

    <!-- 登记过车：设备漏报时人工补录一条，走后端 /barrier/pass，与设备上报同库同口径 -->
    <el-dialog v-model="recordVisible" title="登记过车" width="460px" append-to-body>
      <div class="dvp-pull">
        <span class="dvp-pull__label">车牌号 *</span>
        <el-input v-model="recordForm.plateNo" placeholder="如 苏A12345" clearable />
        <span class="dvp-pull__label">车闸设备 *</span>
        <el-select v-model="recordForm.deviceId" filterable placeholder="选择车闸设备" style="width: 100%">
          <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
        <span class="dvp-pull__label">方向</span>
        <el-select v-model="recordForm.direction" style="width: 100%">
          <el-option label="入场" value="in" />
          <el-option label="出场" value="out" />
        </el-select>
        <span class="dvp-pull__label">过车时间</span>
        <el-date-picker v-model="recordForm.time" type="datetime" style="width: 100%"
          value-format="YYYY-MM-DD HH:mm:ss" placeholder="留空按当前时间入库" />
        <span class="dvp-pull__label">车闸 ID</span>
        <el-input v-model="recordForm.gateId" placeholder="厂商侧车闸标识，可留空" clearable />
        <span class="dvp-pull__label">车辆类型</span>
        <el-input v-model="recordForm.vehicleType" placeholder="小型车 / 大型车 / 新能源，可留空" clearable />
        <p class="dvp-pull__hint">人工补录走后端 /barrier/pass，与设备上报落在同一时序口径；设备漏报时用于补数。</p>
      </div>
      <template #footer>
        <el-button @click="recordVisible = false">取消</el-button>
        <el-button type="primary" :loading="recordSaving" @click="confirmRecord">登记</el-button>
      </template>
    </el-dialog>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin, Van } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
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
  plateNo: '',
  gateId: '',
  direction: '',
  range: null,
})

/** 归一后的筛选条件 */
const filters = computed(() => ({
  deviceId: String(searchModel.value.deviceId ?? ''),
  plateNo: String(searchModel.value.plateNo ?? '').trim(),
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

/** 内置搜索区：设备 / 时间走时序查询，车牌 / 车闸 / 方向在页面侧过滤 */
const searchConfig = computed<ReTableSearchConfig>(() => ({
  title: '筛选',
  filters: [
    { key: 'deviceId', label: '设备', type: 'select', placeholder: '全部设备', options: deviceOptions.value },
    { key: 'plateNo', label: '车牌', type: 'input', placeholder: '车牌关键字' },
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
    const { deviceId, plateNo, gateId, direction, range } = filters.value
    const points = await deviceApi.queryVehicleSeries({
      deviceId: deviceId || undefined,
      start: range?.[0] ? dayStart(range[0]) : undefined,
      end: range?.[1] ? dayEnd(range[1]) : undefined,
      limit: 1000,
      order: 'desc',
    })
    let list = (points || []).map(toRow)
    // 车牌 / 车闸 / 方向是时序口径之外的筛选：时序引擎只按分类+设备+键+时间取，
    // 这三个条件在页面侧过滤，避免为了一个下拉框给引擎加一堆参数。
    if (plateNo) list = list.filter((row) => row.plateNo.includes(plateNo))
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
  searchModel.value = { deviceId: '', plateNo: '', gateId: '', direction: '', range: null }
  void loadPasses()
}

/** 错误文本：优先业务原因，其次 HTTP 状态，最后原始消息 */
function errText(e: unknown): string {
  const err = e as { message?: string; response?: { status?: number; data?: { msg?: string; message?: string } } }
  const data = err?.response?.data
  return data?.msg || data?.message || (err?.response?.status ? `请求失败（HTTP ${err.response.status}）` : err?.message) || '未知错误'
}

/* ==================== 从设备拉取过车记录 ==================== */
const pullVisible = ref(false)
const pullDeviceId = ref('')
const pullRange = ref<[string, string] | null>(null)
const pulling = ref(false)

/** Date → yyyy-MM-dd HH:mm:ss（与后端 parseTime 口径一致） */
function fmtDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 打开拉取弹窗：设备默认取当前筛选，时间默认最近 24 小时 */
function openPullDialog(): void {
  pullDeviceId.value = String(filters.value.deviceId || '')
  const now = new Date()
  pullRange.value = [fmtDateTime(new Date(now.getTime() - 24 * 3600 * 1000)), fmtDateTime(now)]
  pullVisible.value = true
}

/** 确认拉取：走 /barrier/pass/pull，成功后回读过车列表 */
async function confirmPull(): Promise<void> {
  if (!pullDeviceId.value) {
    ElMessage.warning('请选择要拉取的车闸设备')
    return
  }
  if (!pullRange.value?.[0] || !pullRange.value?.[1]) {
    ElMessage.warning('请选择拉取时间范围')
    return
  }
  pulling.value = true
  try {
    const count = await deviceApi.pullVehiclePasses(pullDeviceId.value, pullRange.value[0], pullRange.value[1])
    ElMessage.success(`拉取完成：新增 ${Number(count ?? 0)} 条过车记录`)
    pullVisible.value = false
    void loadPasses()
  } catch (e: unknown) {
    ElMessage.error('拉取失败：' + errText(e))
  } finally {
    pulling.value = false
  }
}

/* ==================== 导出当前筛选（CSV） ==================== */

/** CSV 单元格转义：双引号包裹，内部引号翻倍 */
function csvCell(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}

/** 导出当前筛选结果（CSV 带 BOM，方便 Excel 直接打开） */
function exportCsv(): void {
  if (!rows.value.length) {
    ElMessage.warning('当前没有可导出的过车记录')
    return
  }
  const header = ['过车时间', '车牌号', '设备', '车闸 ID', '方向', '车辆类型', '抓拍']
  const body = rows.value.map((r) => [
    r.time,
    r.plateNo,
    deviceName(r.deviceId),
    r.gateId,
    directionText(r.direction),
    r.vehicleType,
    r.photoUrl,
  ])
  const csv = [header, ...body].map((cols) => cols.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `过车记录_${fmtDateTime(new Date()).replace(/[-: ]/g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${rows.value.length} 条记录`)
}

/* ==================== 登记过车（人工补录） ==================== */
const recordVisible = ref(false)
const recordSaving = ref(false)
const recordForm = reactive({ plateNo: '', deviceId: '', direction: 'in', time: '', gateId: '', vehicleType: '' })

/** 打开补录弹窗：设备 / 车闸 / 时间给默认值（时间=当前） */
function openRecordDialog(): void {
  recordForm.plateNo = ''
  recordForm.deviceId = String(filters.value.deviceId || '')
  recordForm.direction = 'in'
  recordForm.time = fmtDateTime(new Date())
  recordForm.gateId = String(filters.value.gateId || '')
  recordForm.vehicleType = ''
  recordVisible.value = true
}

/** 确认补录：POST /barrier/pass，成功后回读列表 */
async function confirmRecord(): Promise<void> {
  if (!recordForm.plateNo.trim()) {
    ElMessage.warning('请填写车牌号')
    return
  }
  if (!recordForm.deviceId) {
    ElMessage.warning('请选择车闸设备')
    return
  }
  recordSaving.value = true
  try {
    await deviceApi.recordVehiclePass({
      deviceVehiclePassPlateNo: recordForm.plateNo.trim(),
      deviceVehiclePassDeviceId: recordForm.deviceId,
      deviceVehiclePassDirection: recordForm.direction,
      deviceVehiclePassTime: recordForm.time || fmtDateTime(new Date()),
      deviceVehiclePassGateId: recordForm.gateId.trim(),
      deviceVehiclePassVehicleType: recordForm.vehicleType.trim(),
    })
    ElMessage.success('过车记录已登记')
    recordVisible.value = false
    void loadPasses()
  } catch (e: unknown) {
    ElMessage.error('登记失败：' + errText(e))
  } finally {
    recordSaving.value = false
  }
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

/* 拉取弹窗表单：两行控件 + 一句口径说明 */
.dvp-pull {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dvp-pull__label {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dvp-pull__hint {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* 抓拍图缩略图：点开大图预览，加载失败给占位 */
.dvp-photo {
  display: block;
  width: 44px;
  height: 32px;
  border-radius: 4px;
  cursor: zoom-in;
}
.dvp-photo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 32px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
