<template>
  <div class="dar">
    <!-- 概览指标 -->
    <section class="dar-kpis">
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

    <!-- 门禁点位：选定单台设备时出现，可就地远程开门 -->
    <section v-if="filters.deviceId && doors.length" class="dar-panel">
      <header class="dar-panel__head">
        <span class="dar-panel__bar" />
        <span>门禁点位</span>
        <span class="dar-panel__count">{{ doors.length }}</span>
        <span class="dar-panel__hint">{{ selectedDevice?.deviceInfoName || filters.deviceId }}</span>
        <div class="dar-panel__ops">
          <ReButton
            icon="RefreshRight"
            layout="square"
            tip="刷新点位状态"
            :loading="doorLoading"
            @click="loadDoors(filters.deviceId)"
          />
        </div>
      </header>
      <div class="dar-doors">
        <article v-for="door in doors" :key="door.deviceDoorNo" class="dar-door">
          <div class="dar-door__main">
            <span class="dar-door__icon"><el-icon><Lock /></el-icon></span>
            <div class="dar-door__text">
              <span class="dar-door__name">{{ door.deviceDoorName || `门 ${door.deviceDoorNo}` }}</span>
              <span class="dar-door__meta">
                门号 {{ door.deviceDoorNo }} · 本时段记录 {{ doorRecordCount(door) }} 条
              </span>
            </div>
          </div>
          <div class="dar-door__ops">
            <ReTag :type="doorStatusType(door.deviceDoorStatus)" size="small">
              {{ door.deviceDoorStatus || '未知' }}
            </ReTag>
            <ReButton
              icon="Unlock"
              :show-text="true"
              type="primary"
              :loading="unlocking === door.deviceDoorNo"
              @click="onUnlock(door)"
            >
              远程开门
            </ReButton>
          </div>
        </article>
      </div>
    </section>

    <!-- 门禁记录：筛选走 ReTable 自带 ReSearch，标题色条与口径信息都放进搜索条 -->
    <section class="dar-panel dar-panel--plain dar-panel--fill">
      <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="query" />

      <ReTable
        :data="tableData"
        :columns="columns"
        :search="searchConfig"
        v-model:search-model="searchModel"
        engine="element"
        table-id="device-access-records"
        row-key="rid"
        :loading="loading"
        empty-text="所选条件下没有门禁记录"
        :pagination="true"
        :page-size="20"
        :page-sizes="[10, 20, 50, 100]"
        :toolbar="false"
        :layout-table="{ fill: 'auto' }"
        style="width: 100%"
        @search="query"
        @search-reset="resetFilters"
      >
        <!-- 「搜索」左侧色条（原来的面板标题条） -->
        <template #search-title-prefix>
          <span class="rec-bar" />
        </template>
        <!-- 搜索条右侧：页面标题 + 条数 + 导出 -->
        <template #search-title-extra>
          <span class="rec-title">门禁记录</span>
          <span class="rec-meta">{{ filteredRows.length }} 条</span>
          <ReButton
            icon="Download"
            layout="square"
            tip="导出当前筛选（CSV）"
            :disabled="!filteredRows.length"
            @click="exportCsv"
          />
        </template>
        <!-- 分页左侧：进 / 出、范围与查询时间 -->
        <template #pagination-extra>
          <span class="rec-meta">
            进 {{ inCount }} / 出 {{ outCount }} · {{ rangeLabel }}<template v-if="lastQueryAt"> · 查询于 {{ lastQueryAt }}</template>
          </span>
        </template>
        <template #col-photo="{ row }">
          <el-image
            v-if="row.photoUrl"
            :src="String(row.photoUrl)"
            :preview-src-list="[String(row.photoUrl)]"
            :preview-teleported="true"
            :hide-on-click-modal="true"
            fit="cover"
            class="dar-photo"
          >
            <template #error>
              <span class="dar-photo__none" title="抓拍加载失败">
                <el-icon><Picture /></el-icon>
              </span>
            </template>
          </el-image>
          <span v-else class="dar-photo__none" title="厂商未回传抓拍">
            <el-icon><Picture /></el-icon>
          </span>
        </template>
        <template #col-time="{ row }">
          <span class="dar-mono">{{ row.time }}</span>
        </template>
        <template #col-device="{ row }">
          <span class="dar-device">{{ row.deviceName }}</span>
        </template>
        <template #col-direction="{ row }">
          <ReTag
            :type="row.direction === 'in' ? 'primary' : row.direction === 'out' ? 'warning' : 'info'"
            size="small"
            effect="plain"
          >
            {{ row.directionLabel }}
          </ReTag>
        </template>
        <template #col-eventType="{ row }">
          <ReTag :type="row.abnormal ? 'danger' : 'success'" size="small">
            {{ row.eventType || '—' }}
          </ReTag>
        </template>
        <template #col-verdict="{ row }">
          <span :class="['dar-verdict', row.abnormal ? 'is-bad' : 'is-ok']">
            {{ row.abnormal ? '异常' : '正常通行' }}
          </span>
        </template>
      </ReTable>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 门禁记录 —— 门禁/门口机设备的通行记录与远程开门。
 *
 * 记录读时序存储（`/api/device/series/access`）：门禁抽取任务与 webhook 推送
 * 落库的同时写一份时序点（key=卡号或人员，value=事件类型，extra 带门点/方向/抓拍），
 * 因此这里查的是「已落库的记录」，不再逐台实时向设备侧拉。
 * 远程开门仍走 `/api/device/access/unlock`。
 * 事件类型由厂商自由文本给出，这里按关键字归一成「正常通行 / 异常」两档做统计与筛选。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Lock, Picture, Tickets, Warning } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn, ReTableSearchConfig } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '../api/deviceApi'
import type { DeviceCategory, DeviceDoor, DeviceInfo, DeviceSeriesPoint } from '../types/device'
import type { DirectionKey } from '../utils/accessDirection'
import { directionOf } from '../utils/accessDirection'

/** 门禁相关设备类别：门禁一体机 / 门口机 */
const ACCESS_CATEGORIES: DeviceCategory[] = ['accessControl', 'intercom']

/** 异常关键字：命中即判为异常通行（厂商事件名不统一，这里做归一） */
const ABNORMAL_KEYWORDS = [
  '失败',
  '拒绝',
  '非法',
  '强行',
  '胁迫',
  '超时',
  '异常',
  '报警',
  'denied',
  'fail',
  'forced',
  'alarm',
]

/**
 * 方向档位：门禁记录天生带方向（进 / 出）。
 *
 * 取值归一与「进/出/未标注」口径放在 @/utils/accessDirection，设备详情
 * 「门禁」页签复用同一份，避免两处映射不一致。
 */

/** 表格行（记录 + 归一后的展示字段） */
interface AccessRow {
  rid: string
  time: string
  deviceId: string
  deviceName: string
  doorName: string
  userName: string
  cardNo: string
  eventType: string
  abnormal: boolean
  /** 方向归一档位：in / out / unknown */
  direction: DirectionKey
  /** 方向展示文案（未知时回显厂商原值） */
  directionLabel: string
  /** 抓拍照片地址 */
  photoUrl: string
}

const rows = ref<AccessRow[]>([])
const loading = ref(false)
const loadError = ref('')
const lastQueryAt = ref('')

const allDevices = ref<DeviceInfo[]>([])
const doors = ref<DeviceDoor[]>([])
const doorLoading = ref(false)
const unlocking = ref(0)

const filters = reactive<{
  deviceId: string
  range: [string, string] | null
  eventType: string
  verdict: string
  direction: string
  keyword: string
}>({
  deviceId: '',
  range: null,
  eventType: '',
  verdict: 'all',
  direction: 'all',
  keyword: '',
})

/**
 * ReSearch 的筛选值 ↔ 页面 filters 的双向桥。
 *
 * <p>筛选逻辑（分段计数、区间文案、关键词匹配）都读 filters，不想为了换控件再抄一份；
 * 这里只做键名映射，ReTable 改动模型时写回 filters。</p>
 */
const searchModel = computed<Record<string, unknown>>({
  get: () => ({
    deviceId: filters.deviceId,
    range: filters.range,
    eventType: filters.eventType,
    direction: filters.direction,
    verdict: filters.verdict,
    keyword: filters.keyword,
  }),
  set: (value) => {
    filters.deviceId = String(value.deviceId ?? '')
    filters.range = (value.range as [string, string] | null) ?? null
    filters.eventType = String(value.eventType ?? '')
    filters.direction = String(value.direction ?? 'all')
    filters.verdict = String(value.verdict ?? 'all')
    filters.keyword = String(value.keyword ?? '')
  },
})

/** 内置搜索区：设备 / 时间走时序查询，事件 / 方向 / 结果 / 关键词在页面侧过滤 */
const searchConfig = computed<ReTableSearchConfig>(() => ({
  title: '筛选',
  filters: [
    {
      key: 'deviceId',
      label: '设备',
      type: 'select',
      placeholder: '全部门禁设备',
      options: deviceOptions.value,
    },
    { key: 'eventType', label: '事件', type: 'select', placeholder: '全部事件', options: eventTypeOptions.value },
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      placeholder: '全部方向',
      options: [
        { label: '全部方向', value: 'all' },
        { label: '进', value: 'in' },
        { label: '出', value: 'out' },
        { label: '未标注', value: 'unknown' },
      ],
    },
    {
      key: 'verdict',
      label: '结果',
      type: 'select',
      placeholder: '全部结果',
      options: [
        { label: '全部结果', value: 'all' },
        { label: '正常通行', value: 'ok' },
        { label: '异常', value: 'bad' },
      ],
    },
    { key: 'keyword', label: '关键词', type: 'input', placeholder: '人员 / 卡号 / 门' },
    {
      key: 'range',
      label: '时间',
      type: 'daterange',
      // 日期组件默认近 350px，会溢出 220px 的网格把右侧按钮盖住，强制收进格子
      attrs: { style: 'width: 100%' },
    },
  ],
}))

/** 门禁类设备（含带门点的设备，避免类别没配上就查不了） */
const accessDevices = computed(() =>
  allDevices.value.filter(
    (d) => ACCESS_CATEGORIES.includes(d.deviceInfoCategory) || (d.doors?.length ?? 0) > 0,
  ),
)

const selectedDevice = computed(() =>
  allDevices.value.find((d) => d.deviceInfoId === filters.deviceId),
)

const deviceOptions = computed(() =>
  accessDevices.value.map((d) => ({
    value: d.deviceInfoId,
    label: `${d.deviceInfoName}${d.deviceInfoOnline ? '' : '（离线）'}`,
  })),
)

/** 事件类型下拉：取本次已拉到的记录里的类型，避免写死厂商文案 */
const eventTypeOptions = computed(() => {
  const set = new Set<string>()
  rows.value.forEach((r) => {
    if (r.eventType) set.add(r.eventType)
  })
  return [...set].sort().map((t) => ({ value: t, label: t }))
})

/**
 * 分段计数口径：先套上除「方向 / 结果」以外的筛选，
 * 这样两排分片的计数只看其它条件，不会自己把自己筛没。
 */
const baseRows = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (filters.eventType && r.eventType !== filters.eventType) return false
    if (!kw) return true
    return [r.userName, r.cardNo, r.doorName, r.deviceName, r.eventType]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(kw))
  })
})

const filteredRows = computed(() =>
  baseRows.value.filter((r) => {
    if (filters.direction !== 'all' && r.direction !== filters.direction) return false
    if (filters.verdict === 'ok' && r.abnormal) return false
    if (filters.verdict === 'bad' && !r.abnormal) return false
    return true
  }),
)

const okCount = computed(() => filteredRows.value.filter((r) => !r.abnormal).length)
const badCount = computed(() => filteredRows.value.filter((r) => r.abnormal).length)
/** 方向计数：只统计设备侧明确回传了方向的记录 */
const inCount = computed(() => filteredRows.value.filter((r) => r.direction === 'in').length)
const outCount = computed(() => filteredRows.value.filter((r) => r.direction === 'out').length)

const rangeLabel = computed(() => {
  const r = filters.range
  if (r && r[0] && r[1]) return `${r[0].slice(5)} ~ ${r[1].slice(5)}`
  return '今日 00:00 至今'
})

const kpis = computed(() => [
  {
    key: 'devices',
    title: '门禁设备',
    value: accessDevices.value.length,
    desc: `在线 ${accessDevices.value.filter((d) => d.deviceInfoOnline).length} 台`,
    icon: Lock,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'records',
    title: '记录条数',
    value: filteredRows.value.length,
    desc: rows.value.length === filteredRows.value.length ? rangeLabel.value : `原始 ${rows.value.length} 条`,
    icon: Tickets,
    iconColor: 'var(--el-color-info)',
  },
  {
    key: 'ok',
    title: '正常通行',
    value: okCount.value,
    desc: '刷卡 / 人脸 / 远程放行',
    icon: CircleCheck,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'bad',
    title: '异常事件',
    value: badCount.value,
    desc: '强行 / 胁迫 / 拒绝等',
    icon: Warning,
    iconColor: 'var(--el-color-danger)',
  },
])

const columns: ReTableColumn[] = [
  { prop: 'photoUrl', label: '抓拍', width: 76, slot: 'photo', align: 'center' },
  { prop: 'time', label: '时间', width: 170, slot: 'time' },
  { prop: 'deviceName', label: '设备', minWidth: 160, slot: 'device', showOverflowTooltip: true },
  { prop: 'doorName', label: '门 / 点位', minWidth: 130, showOverflowTooltip: true },
  { prop: 'directionLabel', label: '方向', width: 88, slot: 'direction', align: 'center' },
  { prop: 'userName', label: '人员', width: 120, showOverflowTooltip: true },
  { prop: 'cardNo', label: '卡号', minWidth: 130, showOverflowTooltip: true },
  { prop: 'eventType', label: '事件', width: 150, slot: 'eventType' },
  { prop: 'abnormal', label: '结果', width: 110, slot: 'verdict' },
]
const tableData = computed(() => filteredRows.value as unknown as Record<string, unknown>[])

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function fmtLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function defaultRange(): [string, string] {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0)
  return [fmtLocal(start), fmtLocal(end)]
}

/** 查询用的时间区间：没选就用「今日」；ReSearch 的日期区间只给日期，这里补时分秒 */
function effectiveRange(): [string, string] {
  const r = filters.range
  if (r && r[0] && r[1]) return [dayStart(r[0]), dayEnd(r[1])]
  return defaultRange()
}

/** 日期补 00:00:00 */
function dayStart(value: string): string {
  return value.length === 10 ? `${value} 00:00:00` : value
}

/** 日期补 23:59:59 */
function dayEnd(value: string): string {
  return value.length === 10 ? `${value} 23:59:59` : value
}

/** 后端给的时间可能是 ISO，也可能是 'yyyy-MM-dd HH:mm:ss'，统一成后者 */
function fmtTime(v: unknown): string {
  const s = String(v ?? '').replace('T', ' ')
  return s.length > 19 ? s.slice(0, 19) : s
}

function isAbnormal(type?: string): boolean {
  const t = (type || '').toLowerCase()
  return ABNORMAL_KEYWORDS.some((k) => t.includes(k.toLowerCase()))
}

function errText(e: unknown): string {
  return (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
}

/**
 * 时序点 → 表格行。
 *
 * <p>时序口径：key=卡号（无卡号时是人员姓名）、value=事件类型；
 * 门点/方向/抓拍在 extra 里。</p>
 *
 * @param point 时序点
 * @returns 表格行
 */
function toRow(point: DeviceSeriesPoint): AccessRow {
  const extra = point.extra || {}
  const device = allDevices.value.find((d) => d.deviceInfoId === point.deviceId)
  const doorId = String(extra.doorId ?? point.channel ?? '')
  const door = (device?.doors || []).find((d) => String(d.deviceDoorNo) === doorId)
  const time = fmtTime(point.time)
  const cardNo = String(extra.cardNo ?? '') || (point.key === 'unknown' ? '' : point.key)
  const userName = String(extra.userName ?? point.name ?? '') || (point.key === 'unknown' ? '—' : point.key)
  const dir = directionOf(extra.direction)
  return {
    rid: `${point.deviceId}-${time}-${doorId}-${cardNo}`,
    time,
    deviceId: point.deviceId,
    deviceName: device?.deviceInfoName || '—',
    doorName: door?.deviceDoorName || (doorId ? `门 ${doorId}` : '—'),
    userName,
    cardNo: cardNo || '—',
    eventType: String(point.value ?? ''),
    abnormal: isAbnormal(String(point.value ?? '')),
    direction: dir.key,
    directionLabel: dir.label,
    photoUrl: String(extra.photoUrl ?? '') || '',
  }
}

async function loadDevices(): Promise<void> {
  try {
    allDevices.value = ((await deviceApi.list()) as DeviceInfo[]) || []
  } catch (e: unknown) {
    allDevices.value = []
    ElMessage.error(`设备列表加载失败：${errText(e)}`)
  }
}

async function loadDoors(deviceId?: string): Promise<void> {
  if (!deviceId) {
    doors.value = []
    return
  }
  doorLoading.value = true
  try {
    const detail = (await deviceApi.get(deviceId)) as DeviceInfo
    doors.value = detail?.doors?.length ? detail.doors : selectedDevice.value?.doors || []
  } catch {
    doors.value = selectedDevice.value?.doors || []
  } finally {
    doorLoading.value = false
  }
}

/** 拉取记录：走时序存储（key=卡号或人员，value=事件类型，extra 带门点/方向/抓拍） */
async function query(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const [start, end] = effectiveRange()
    const list = await deviceApi.queryAccessSeries({
      deviceId: filters.deviceId || undefined,
      start,
      end,
      limit: 1000,
      order: 'desc',
    })
    rows.value = (list || []).map((point) => toRow(point))
    lastQueryAt.value = new Date().toLocaleTimeString()
  } catch (e: unknown) {
    rows.value = []
    loadError.value = errText(e)
  } finally {
    loading.value = false
  }
}

async function onUnlock(door: DeviceDoor): Promise<void> {
  if (!filters.deviceId) return
  const label = door.deviceDoorName || `门 ${door.deviceDoorNo}`
  try {
    await ElMessageBox.confirm(`确认远程开启「${label}」？`, '远程开门确认', {
      type: 'warning',
      confirmButtonText: '远程开门',
    })
  } catch {
    return
  }
  unlocking.value = door.deviceDoorNo
  try {
    await deviceApi.unlock(filters.deviceId, door.deviceDoorNo)
    ElMessage.success(`已向「${label}」下发开门指令`)
    // 开门动作通常几秒内落一条记录，稍后自动回读一次
    setTimeout(() => void query(), 1500)
  } catch (e: unknown) {
    ElMessage.error(`开门失败：${errText(e)}`)
  } finally {
    unlocking.value = 0
  }
}

function doorRecordCount(door: DeviceDoor): number {
  return rows.value.filter((r) => r.doorName === (door.deviceDoorName || `门 ${door.deviceDoorNo}`)).length
}

function doorStatusType(status?: string): 'success' | 'warning' | 'danger' | 'info' {
  const s = (status || '').toLowerCase()
  if (['open', 'normal', 'online', 'idle', 'closed'].includes(s)) return 'success'
  if (['alarm', 'forced', 'held'].includes(s)) return 'danger'
  if (['offline', 'unknown'].includes(s)) return 'warning'
  return 'info'
}

function csvCell(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}

function exportCsv(): void {
  if (!filteredRows.value.length) return
  const header = ['时间', '设备', '门/点位', '方向', '人员', '卡号', '事件', '结果', '抓拍']
  const body = filteredRows.value.map((r) => [
    r.time,
    r.deviceName,
    r.doorName,
    r.directionLabel,
    r.userName,
    r.cardNo,
    r.eventType,
    r.abnormal ? '异常' : '正常通行',
    r.photoUrl,
  ])
  const csv = [header, ...body].map((cols) => cols.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `门禁记录_${fmtLocal(new Date()).replace(/[: ]/g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${filteredRows.value.length} 条记录`)
}

/** 重置筛选：回到「全部门禁设备 + 今日」（设备变化由 watch 触发重查） */
function resetFilters(): void {
  filters.deviceId = ''
  filters.range = null
  filters.eventType = ''
  filters.verdict = 'all'
  filters.direction = 'all'
  filters.keyword = ''
  loadError.value = ''
}

/** 切换设备：点位跟着刷新，记录也重查（记录本来就是按设备取的） */
watch(
  () => filters.deviceId,
  (id) => {
    void loadDoors(id)
    void query()
  },
)

onMounted(async () => {
  await loadDevices()
  await query()
})
</script>

<style scoped>
.dar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.dar-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}

.dar-panel {
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dar-panel--fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* 表格面板不画卡面：ReTable 自己就是一张卡，外面再套白底会变成两层边 */
.dar-panel--plain {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.dar-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dar-panel__bar {
  width: 6px;
  height: 15px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dar-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.dar-panel__hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.dar-panel__ops {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 搜索条里的页面标题与口径（原记录面板标题行的内容） */
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

.dar-doors {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.dar-door {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-text-color-primary) 2.5%, transparent);
  transition: box-shadow 0.16s ease, border-color 0.16s ease;
}
.dar-door:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}
.dar-door__main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dar-door__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dar-door__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.dar-door__name {
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dar-door__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dar-door__ops {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dar-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
}
/* 抓拍缩略图：点开看大图（preview-teleported 避免被表格裁剪） */
.dar-photo {
  width: 48px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
  cursor: zoom-in;
  display: block;
  margin: 0 auto;
}
.dar-photo__none {
  display: grid;
  place-items: center;
  width: 48px;
  height: 36px;
  margin: 0 auto;
  border-radius: 6px;
  border: 1px dashed var(--el-border-color);
  color: var(--el-text-color-placeholder);
  font-size: 15px;
}
.dar-device {
  font-size: 13px;
}
.dar-verdict {
  font-size: 12.5px;
  font-weight: 600;
}
.dar-verdict.is-ok {
  color: var(--el-color-success);
}
.dar-verdict.is-bad {
  color: var(--el-color-danger);
}
</style>
