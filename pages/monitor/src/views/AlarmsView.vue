<!--
  告警中心 —— 仪表方向。

  **为什么是「仪表」**：告警页最先要回答的不是「有哪些告警」，而是「现在是不是不对」。
  值班的人一进门先看形状：今天从几点开始起量、集中在哪个级别、有没有越线越得离谱的。
  因此聚合（遥测带 + 24 小时柱 + 级别分布）在上，明细被压到最紧凑的一行一条，
  只保留「扫一眼能判断下一条该不该点」的字段。

  **图表是可点的，不是装饰**：
    - 点柱 → 只留那个小时的告警（再点一次取消）；
    - 点级别条 → 只留那个级别（再点一次取消）。
  两处都写进同一个 `filters`，与控制栏的分段/下拉同源 ——
  否则「图上点了、下面没变」比不做交互更糟。

  **口径**：级别归一、时间解析、阈值比例、排序全部在 `alarm/alarmView.ts`。
  阈值条把「阈值」画在 70% 处而不是 100%：真按阈值 = 满格画，越线之后涨多少就看不见了。

  **实时**：SSE 优先（Servlet 长连接，不经消息队列），断开后退到轮询，状态写在控制栏右端。
  新到的 P0/P1 额外弹一次提示 —— 值班时页面可能不在前台，只靠列表里多一行是收不到的。

  **不渲染页头**（`no-head`）：标题在标签页与面包屑里已经说过一遍。动作按钮走 `bar-actions`。
-->
<template>
  <RePageStage
    variant="instrument"
    title="告警中心"
    no-head
    :variant-items="[]"
    :tabs="tabs"
    :tab-value="filters.status"
    :filters="stageFilters"
    :filter-model="filters as unknown as Record<string, string>"
    :count-text="countText"
    :loading="loading"
    refresh-tip="刷新告警"
    @update:tab-value="onTab"
    @filter="onFilter"
    @refresh="refresh"
  >
    <template #bar-actions>
      <span class="live" :class="`is-${liveMode}`" :title="liveTitle">
        <i class="pk-dot" />{{ liveText }}
      </span>
    </template>

    <template #alerts>
      <div v-if="loadError" class="as-error">
        <span>告警读取失败：{{ loadError }}</span>
        <ReButton link type="primary" @click="refresh">重试</ReButton>
      </div>
    </template>

    <template #instrument>
      <ReCanvasTelemetry :cells="teleCells" />

      <div class="inst">
        <section class="pk-surface pk-surface--pad inst__panel">
          <div class="inst__head">
            <span class="pk-strong">近 24 小时告警量</span>
            <button
              v-if="filters.hour !== ''"
              type="button"
              class="chip"
              :title="`取消「只看 ${hourText} 点」`"
              @click="filters.hour = ''"
            >
              只看 {{ hourText }} 点
              <span class="chip__x" aria-hidden="true">×</span>
            </button>
            <span v-else class="pk-faint">{{ trendCaption }}</span>
          </div>
          <div class="bars">
            <button
              v-for="b in trend"
              :key="b.label"
              type="button"
              class="bars__col"
              :class="{
                'is-recent': b.recent,
                'is-empty': !b.count,
                'is-on': filters.hour === String(Number(b.label)),
              }"
              :disabled="!b.count"
              :aria-pressed="filters.hour === String(Number(b.label))"
              :aria-label="`${b.label} 点，${b.count} 条告警`"
              :title="`${b.label}:00 · ${b.count} 条`"
              @click="onBarClick(b)"
            >
              <span
                class="bars__fill"
                :style="{ height: `${b.count ? Math.max(b.percent, 4) : 0}%` }"
              />
              <span v-if="Number(b.label) % 3 === 0" class="bars__tick">{{ b.label }}</span>
            </button>
          </div>
        </section>

        <section class="pk-surface pk-surface--pad inst__panel inst__panel--dist">
          <div class="inst__head">
            <span class="pk-strong">级别分布</span>
            <span class="pk-faint">右侧是响应承诺</span>
          </div>
          <button
            v-for="d in dist"
            :key="d.level"
            type="button"
            class="dist__row"
            :class="{ 'is-on': filters.level === d.level }"
            :aria-pressed="filters.level === d.level"
            :title="`只看 ${d.level} ${d.label}`"
            @click="onLevelClick(d.level)"
          >
            <span class="lv" :class="`is-${d.tone}`">
              <i class="lv__dot" />{{ d.level }}
              <span class="lv__name">{{ d.label }}</span>
            </span>
            <span class="dist__track">
              <span
                class="dist__fill"
                :style="{ width: `${d.percent}%`, background: toneColor(d.tone) }"
              />
            </span>
            <span class="pk-num dist__num">{{ d.count }}</span>
            <span class="pk-faint dist__sla">{{ d.sla }}</span>
          </button>
        </section>
      </div>

      <ReCanvasTable
        :rows="filtered as unknown as Array<Record<string, unknown>>"
        :columns="alarmCols"
        :row-key="rowKey"
        clickable
        :loading="loading"
        :empty-text="emptyText"
        :empty-hint="emptyHint"
        @row-click="openOf"
      >
        <template #cell-timeText="{ row }">
          <span class="pk-num pk-dim" :title="v(row).atFullText">{{ v(row).timeText }}</span>
        </template>
        <template #cell-level="{ row }">
          <span class="lv is-slim" :class="`is-${v(row).tone}`">
            <i class="lv__dot" />{{ v(row).level }}
          </span>
        </template>
        <template #cell-host="{ row }">
          <span class="pk-ellipsis">{{ v(row).host }}</span>
        </template>
        <template #cell-metricText="{ row }">
          <span class="gauge-line">
            <span class="pk-ellipsis">{{ v(row).metricText }}</span>
            <span class="gauge" :title="`当前 ${v(row).value} / 阈值 ${v(row).threshold}`">
              <span
                class="gauge__fill"
                :class="{ 'is-over': v(row).over }"
                :style="{ width: `${v(row).gaugePercent}%` }"
              />
              <span class="gauge__mark" />
            </span>
            <span class="pk-num gauge__value" :class="{ 'is-over': v(row).over }">
              {{ v(row).valueText }}
            </span>
          </span>
        </template>
        <template #cell-statusText="{ row }">
          <span class="st" :class="`is-${v(row).statusTone}`">
            <i class="pk-dot" />{{ v(row).statusText }}
          </span>
        </template>
        <template #row-actions="{ row }">
          <ReButton
            v-if="v(row).status === 'new'"
            link
            type="primary"
            @click="openHandle(v(row))"
          >处理</ReButton>
          <span v-else class="pk-faint">—</span>
        </template>
      </ReCanvasTable>
    </template>
  </RePageStage>

  <!-- 处理弹窗：挂在舞台外面，弹窗不该被画布的滚动容器裁掉 -->
  <ReDialog v-model="handleVisible" title="处理告警事件" width="440px">
    <div v-if="handleTarget" class="dlg-meta">
      <span class="lv" :class="`is-${handleTarget.tone}`">
        <i class="lv__dot" />{{ handleTarget.level }}
        <span class="lv__name">{{ handleTarget.levelText }}</span>
      </span>
      <b>{{ handleTarget.host }}</b>
      <span class="pk-dim">
        {{ handleTarget.metricText }} = {{ handleTarget.value }}（阈值 {{ handleTarget.threshold }}）
      </span>
    </div>
    <ReInput v-model="handleRemark" type="textarea" :rows="3" placeholder="处理备注（可留空）" />
    <ReSwitch v-model="handleFalseAlarm" active-text="标记为误报" style="margin-top: 10px" />
    <template #footer>
      <ReButton @click="handleVisible = false">取消</ReButton>
      <ReButton
        type="primary"
        icon="Check"
        show-text
        :loading="handleSubmitting"
        @click="submitHandle"
      >确认处理</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 告警中心
 *
 * <p>页面只做三件事：拉数据、筛数据、处理单条。怎么排交给 RePageKit 的画布 ——
 * 页面管排什么，画布管怎么排。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { message } from '@repo/core'
import {
  ReCanvasTable,
  ReCanvasTelemetry,
  RePageStage,
} from '@repo/ui/components/RePageKit'
import type {
  CanvasColumn,
  StatCell,
  TabItem,
} from '@repo/ui/components/RePageKit'
import { fetchAlarmEvents, handleAlarmEvent, type AlarmEvent } from '../api/monitorApi'
import { getAlarmTrend, subscribeAlarmStream } from '../api'
import { useDialogPrerender } from '../utils/dialogPrerender'
import { fallbackAfterSseLost, liveModeText, type LiveMode } from './alarm/liveChannel'
import {
  ALARM_LEVELS,
  EMPTY_ALARM_FILTERS,
  LEVEL_META,
  countByLevel,
  countByStatus,
  filterAlarms,
  levelDistribution,
  summarize,
  toAlarmViews,
  trendBuckets,
  trendFromViews,
  type AlarmFilters,
  type AlarmLevelId,
  type AlarmTone,
  type AlarmView,
  type TrendBucket,
} from './alarm/alarmView'

// ==================== 数据 ====================

const loading = ref(false)
const loadError = ref('')
const events = ref<AlarmEvent[]>([])

/**
 * 拉取告警事件。
 *
 * <p>趋势是「锦上添花」，单独一次请求且失败不影响主列表 —— 后端没这个接口时
 * 页面照样能用，图表会自己降级成「按本页已加载的告警分桶」。</p>
 */
async function refresh(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    events.value = (await fetchAlarmEvents()) ?? []
  } catch (e) {
    loadError.value = String((e as Error)?.message ?? e)
  } finally {
    loading.value = false
  }
  await loadTrend()
}

// ==================== 实时通道 ====================

/** 轮询间隔（秒） */
const POLL_SECONDS = 60

const liveMode = ref<LiveMode>('off')
let stream: { close?: () => void } | null = null
let pollTimer: number | null = null

/** 通道文案（与 liveChannel 的纯函数同源，避免两处说法不一） */
const liveText = computed(() => liveModeText(liveMode.value, POLL_SECONDS))

/** 通道提示 */
const liveTitle = computed(() =>
  liveMode.value === 'sse'
    ? 'SSE 长连接已建立，新告警会即时出现在列表里'
    : liveMode.value === 'poll'
      ? `推送不可用，每 ${POLL_SECONDS} 秒重新拉取一次`
      : '正在建立实时通道…',
)

/** 开轮询兜底 */
function startPolling(): void {
  if (pollTimer !== null) return
  pollTimer = window.setInterval(() => void refresh(), POLL_SECONDS * 1000)
}

/** 关轮询 */
function stopPolling(): void {
  if (pollTimer === null) return
  window.clearInterval(pollTimer)
  pollTimer = null
}

/**
 * 推送载荷 → 事件行。
 *
 * <p>推送用短字段名（{@code monitorName} / {@code metricName}），列表用后端列名。
 * 在这里映射一次，而不是让模板认两种形状。</p>
 *
 * @param payload 推送载荷
 */
function normalizePushed(payload: Record<string, unknown>): AlarmEvent | null {
  const id = Number(payload.id)
  if (!Number.isFinite(id) || id <= 0) return null
  return {
    id,
    msMonitorAlarmEventMonitorId: Number(payload.monitorId ?? 0),
    msMonitorAlarmEventMonitorName: String(payload.monitorName ?? ''),
    msMonitorAlarmEventMetricName: String(payload.metricName ?? ''),
    msMonitorAlarmEventAlarmValue: Number(payload.alarmValue ?? 0),
    msMonitorAlarmEventThreshold: Number(payload.threshold ?? 0),
    msMonitorAlarmEventLevel: String(payload.level ?? ''),
    msMonitorAlarmEventStatus: String(payload.status ?? 'NEW'),
    msMonitorAlarmEventTriggerTime: String(payload.triggerTime ?? ''),
  }
}

/**
 * 落地一条推送。
 *
 * <p>同一事件会因「新建」和「已处理」各推一次，因此按 id 去重：
 * 已存在的只更新状态，不重复插入。</p>
 *
 * @param payload 推送载荷
 */
function applyPushed(payload: Record<string, unknown>): void {
  const next = normalizePushed(payload)
  if (!next) return

  const existing = events.value.find(e => e.id === next.id)
  if (existing) {
    existing.msMonitorAlarmEventStatus = next.msMonitorAlarmEventStatus
    return
  }

  events.value = [next, ...events.value]

  // 值班时页面可能不在前台，只靠列表多一行是收不到的
  const level = next.msMonitorAlarmEventLevel.toUpperCase()
  if (level === 'P0' || level === 'P1') {
    message.error(
      `[${level}] ${next.msMonitorAlarmEventMonitorName} ${next.msMonitorAlarmEventMetricName}=${next.msMonitorAlarmEventAlarmValue}`,
    )
  }
}

// ==================== 趋势 ====================

const trendPoints = ref<Array<{ time: string; count: number }>>([])
/** 趋势是否降级成「用本页告警自己分桶」 */
const trendLocal = ref(false)

/** 拉趋势；失败或空则降级 */
async function loadTrend(): Promise<void> {
  try {
    const points = await getAlarmTrend(24, '1h')
    if (points && points.length) {
      trendPoints.value = points
      trendLocal.value = false
      return
    }
  } catch {
    // 趋势接口不在就降级，不打扰用户：主列表已经能用了
  }
  trendPoints.value = []
  trendLocal.value = true
}

// ==================== 派生 ====================

const views = computed(() => toAlarmViews(events.value))
const filtered = computed(() => filterAlarms(views.value, filters))
const summary = computed(() => summarize(views.value))
const statusCounts = computed(() => countByStatus(views.value))
const levelCounts = computed(() => countByLevel(views.value))
const dist = computed(() => levelDistribution(views.value))
const trend = computed(() =>
  trendLocal.value ? trendFromViews(views.value) : trendBuckets(trendPoints.value),
)

/** 趋势图注：说清这张图是「全库」还是「本页」 */
const trendCaption = computed(() =>
  trendLocal.value ? '本页已加载的告警，按小时' : '全部告警，按小时',
)

const teleCells = computed<StatCell[]>(() => {
  const s = summary.value
  const urgent = levelCounts.value.P0 + levelCounts.value.P1
  return [
    { label: '告警总数', value: s.total },
    { label: '未处理', value: s.unhandled, tone: s.unhandled > 0 ? 'bad' : undefined },
    { label: 'P0 + P1', value: urgent, tone: urgent > 0 ? 'warn' : undefined },
    { label: '涉及主机', value: s.hosts },
    { label: '涉及指标', value: s.metrics },
  ]
})

const tabs = computed<TabItem[]>(() => [
  { label: '全部', value: '', count: summary.value.total },
  { label: '未处理', value: 'new', count: statusCounts.value.new },
  { label: '已处理', value: 'processed', count: statusCounts.value.processed },
  { label: '误报', value: 'false', count: statusCounts.value.false },
])

const countText = computed(() =>
  filtered.value.length === views.value.length
    ? `共 ${views.value.length} 条告警`
    : `筛选出 ${filtered.value.length} / ${views.value.length} 条`,
)

/** 小时文案（补零，与柱上的刻度一致） */
const hourText = computed(() =>
  filters.hour === '' ? '' : String(Number(filters.hour)).padStart(2, '0'),
)

/** 是否有任何筛选生效（决定空态该说「没数据」还是「筛没了」） */
const filterActive = computed(
  () =>
    filters.keyword !== '' ||
    filters.level !== '' ||
    filters.status !== '' ||
    filters.hour !== '',
)

/** 空态主文案 */
const emptyText = computed(() =>
  filterActive.value ? '当前筛选下没有告警' : '没有告警事件',
)

/** 空态引导：一条都没有时该去查什么 */
const emptyHint = computed(() =>
  filterActive.value
    ? '当前筛选下没有告警。放宽条件试试，或确认这一小时 / 这个级别确实没有事件。'
    : '告警由监控项的告警策略与规则触发；一条也没有，说明当前没有越线，或还没配策略。',
)

// ==================== 筛选 ====================

const filters = reactive<AlarmFilters>({ ...EMPTY_ALARM_FILTERS })

const stageFilters = computed(() => [
  { key: 'keyword', kind: 'search' as const, placeholder: '搜索主机 / 指标', width: 210 },
  {
    key: 'level',
    kind: 'select' as const,
    placeholder: '级别',
    width: 116,
    options: ALARM_LEVELS.map(lv => ({
      label: `${lv} ${LEVEL_META[lv].label}`,
      value: lv,
    })),
  },
])

/**
 * 筛选项变化
 *
 * @param key   字段
 * @param value 值
 */
function onFilter(key: string, value: string): void {
  if (key === 'keyword') filters.keyword = value
  else if (key === 'level') filters.level = value
}

/**
 * 切状态分段
 *
 * @param value 状态档
 */
function onTab(value: string): void {
  filters.status = value
}

/**
 * 点柱子：只留那个小时；再点一次取消
 *
 * @param bucket 柱子
 */
function onBarClick(bucket: TrendBucket): void {
  const hour = String(Number(bucket.label))
  filters.hour = filters.hour === hour ? '' : hour
}

/**
 * 点级别条：只留那个级别；再点一次取消
 *
 * @param level 级别
 */
function onLevelClick(level: AlarmLevelId): void {
  filters.level = filters.level === level ? '' : level
}

// ==================== 配色 ====================

/**
 * 色档 → 颜色
 *
 * <p>全部走 {@code --el-color-*}：亮暗色都会被主题覆盖，写死色值在暗色下会脏。</p>
 *
 * @param tone 色档
 */
function toneColor(tone: AlarmTone): string {
  if (tone === 'bad') return 'var(--el-color-danger)'
  if (tone === 'warn') return 'var(--el-color-warning)'
  if (tone === 'ok') return 'var(--el-color-success)'
  return 'var(--el-text-color-placeholder)'
}

// ==================== 列 ====================

const alarmCols = computed<CanvasColumn[]>(() => [
  // 92px：跨天时文案会变成 `10-25 22:11`，窄了就会折行
  { key: 'timeText', label: '时刻', width: '92px' },
  { key: 'level', label: '级别', width: '52px' },
  { key: 'host', label: '主机', width: 'minmax(0, 1fr)' },
  { key: 'metricText', label: '指标 · 当前值 / 阈值', width: 'minmax(0, 1.6fr)' },
  { key: 'statusText', label: '状态', width: '92px' },
])

// ==================== 交互 ====================

/**
 * 行键
 *
 * @param row 行
 */
function rowKey(row: Record<string, unknown>): number {
  return Number(row.id)
}

/**
 * 画布行还原成展示行
 *
 * <p>画布只认 {@code Record<string, unknown>}，这是刻意的边界：
 * 页面侧只做一次断言，而不是让画布认识业务类型。</p>
 *
 * @param row 画布行
 */
function v(row: Record<string, unknown>): AlarmView {
  return row as unknown as AlarmView
}

/**
 * 点行：未处理的直接开处理弹窗
 *
 * <p>告警没有「详情页」—— 一条告警的全部信息就是这七八个字段，
 * 点开的动作只可能是「处理它」。已处理的点开无事可做，因此不响应。</p>
 *
 * @param row 画布行
 */
function openOf(row: Record<string, unknown>): void {
  const hit = v(row)
  if (hit.status === 'new') openHandle(hit)
}

// ==================== 处理弹窗 ====================

const handleVisible = ref(false)
useDialogPrerender(handleVisible)
const handleTarget = ref<AlarmView | null>(null)
const handleRemark = ref('')
const handleFalseAlarm = ref(false)
const handleSubmitting = ref(false)

/**
 * 打开处理弹窗
 *
 * @param view 展示行
 */
function openHandle(view: AlarmView): void {
  handleTarget.value = view
  handleRemark.value = ''
  handleFalseAlarm.value = false
  handleVisible.value = true
}

/** 提交处理 */
async function submitHandle(): Promise<void> {
  if (!handleTarget.value) return
  handleSubmitting.value = true
  try {
    await handleAlarmEvent(
      handleTarget.value.id,
      handleRemark.value || (handleFalseAlarm.value ? '误报' : '已处理'),
      handleFalseAlarm.value,
    )
    message.success('处理完成')
    handleVisible.value = false
    await refresh()
  } catch (e) {
    message.error(String((e as Error)?.message ?? e))
  } finally {
    handleSubmitting.value = false
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  void refresh()

  stream = subscribeAlarmStream({
    onOpen: () => {
      liveMode.value = 'sse'
      stopPolling()
    },
    onAlarm: payload => {
      liveMode.value = 'sse'
      applyPushed(payload)
    },
    onError: () => {
      liveMode.value = fallbackAfterSseLost(false)
      startPolling()
    },
    onClose: () => {
      liveMode.value = fallbackAfterSseLost(false)
      startPolling()
    },
  })
})

onBeforeUnmount(() => {
  stopPolling()
  stream?.close?.()
  stream = null
})
</script>

<style scoped>
/* ===== 实时通道 ===== */
.live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}

.live.is-sse .pk-dot {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent);
}

.live.is-poll .pk-dot {
  background: var(--el-color-warning);
}

.live.is-off .pk-dot {
  background: var(--el-text-color-disabled);
}

/* ===== 级别 ===== */
.lv {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.lv__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: var(--el-text-color-placeholder);
}

.lv__name {
  color: var(--el-text-color-secondary);
}

.lv.is-slim .lv__name {
  display: none;
}

.lv.is-bad {
  color: var(--el-color-danger);
}
.lv.is-bad .lv__dot {
  background: var(--el-color-danger);
}
.lv.is-warn {
  color: var(--el-color-warning);
}
.lv.is-warn .lv__dot {
  background: var(--el-color-warning);
}
.lv.is-ok {
  color: var(--el-color-success);
}
.lv.is-ok .lv__dot {
  background: var(--el-color-success);
}

/* ===== 状态 ===== */
.st {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.st.is-bad {
  color: var(--el-color-danger);
}
.st.is-bad .pk-dot {
  background: var(--el-color-danger);
}
.st.is-ok {
  color: var(--el-color-success);
}
.st.is-ok .pk-dot {
  background: var(--el-color-success);
}
.st.is-mute {
  color: var(--el-text-color-secondary);
}
.st.is-mute .pk-dot {
  background: var(--el-text-color-disabled);
}

/* 越过阈值的那一下：数字染红，比加粗更安静也更快被看到 */
.is-over {
  color: var(--el-color-danger);
  font-weight: 600;
}

/* ===== 阈值条（阈值刻度固定在 70%） ===== */
.gauge {
  position: relative;
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.gauge__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 2px;
  background: var(--el-color-primary);
  transition: width 0.25s ease-out;
}

.gauge__fill.is-over {
  background: var(--el-color-danger);
}

/* 阈值刻度线：条子到这儿就是刚越线 */
.gauge__mark {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: 70%;
  width: 1px;
  background: var(--el-text-color-placeholder);
  opacity: 0.7;
}

.gauge__value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* ===== 仪表 ===== */
.inst {
  display: flex;
  gap: 10px;
  flex: none;
  flex-wrap: wrap;
}

.inst__panel {
  flex: 1 1 320px;
  min-width: 0;
}

.inst__panel--dist {
  flex: 0 1 300px;
}

.inst__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
}

.inst__head .pk-faint {
  font-size: 11px;
}

/* 「只看 09 点」的取消胶囊 */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 20px;
  padding: 0 7px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
}

.chip:hover {
  background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.chip__x {
  font-size: 12px;
  line-height: 1;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 104px;
  /* 给刻度留出空间，否则数字会被下一块内容压住 */
  margin-bottom: 16px;
}

.bars__col {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: none;
  border: 0;
  border-radius: 3px;
  cursor: pointer;
  outline: none;
}

.bars__col:disabled {
  cursor: default;
}

.bars__col:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.bars__col:hover:not(:disabled) .bars__fill {
  opacity: 1;
}

.bars__fill {
  width: 100%;
  max-width: 18px;
  border-radius: 2px 2px 0 0;
  background: var(--el-color-primary);
  opacity: 0.72;
  transition: height 0.25s ease-out, opacity 0.15s ease-out;
}

.bars__col.is-recent .bars__fill {
  background: var(--el-color-warning);
  opacity: 1;
}

.bars__col.is-on .bars__fill {
  opacity: 1;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}

.bars__col.is-empty .bars__fill {
  background: var(--el-fill-color-dark);
  opacity: 1;
}

.bars__tick {
  position: absolute;
  bottom: -15px;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

/* 级别分布：整行可点，点一下只看这个级别 */
.dist__row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 26px;
  padding: 0 4px;
  background: none;
  border: 0;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  text-align: left;
  outline: none;
}

.dist__row:hover {
  background: var(--el-fill-color-light);
}

.dist__row.is-on {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.dist__row:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.dist__row .lv {
  width: 76px;
  flex: none;
}

.dist__track {
  flex: 1 1 auto;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.dist__fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.25s ease-out;
}

.dist__num {
  width: 32px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.dist__sla {
  width: 62px;
  flex: none;
  font-size: 11px;
  text-align: right;
}

/* 明细里的「指标」列：名字 + 细阈值条 + 数值，一行说完 */
.gauge-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.gauge-line .gauge {
  flex: 0 0 64px;
}

/* ===== 错误条 ===== */
.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 26%, transparent);
  border-radius: var(--el-radius-sm, 6px);
}

/* ===== 处理弹窗 ===== */
.dlg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .inst__panel,
  .inst__panel--dist {
    flex: 1 1 100%;
  }
}

/* 窄屏放不下「名字 + 条子 + 数值」三件套：留名字和数值，
   条子是补充判断，先让它走 —— 挤在一起会连名字都读不全 */
@media (max-width: 760px) {
  .gauge-line .gauge {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gauge__fill,
  .bars__fill,
  .dist__fill {
    transition: none;
  }
}
</style>
