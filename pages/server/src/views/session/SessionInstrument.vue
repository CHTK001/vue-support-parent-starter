<!--
  会话审计 · 方向「仪表」

  这个方向先回答「今天整体怎么样」，再回答「哪一条出问题了」。

  三个取舍：
    ① 遥测条用 1px 缝隙连成一条，而不是四张独立统计卡。四个数字是同一份数据的
       四个切面，分开摆会被读成四个互不相干的对象。
    ② 图表是筛选器，不是装饰。点某根柱 → 该时段成为筛选条件（写进 filters.hourBucket），
       再点同一根取消。为此筛选模型里真的加了 hourBucket 字段，而不是做样子的高亮。
    ③ 中位时长而不是平均时长：审计里常有一两条挂了一整天的会话，平均数会被拉走。

  数据完整性：主机、协议、用户、客户端 IP、连接时间、关闭时间、状态、关闭原因
  八个字段全部可达 —— 表格是紧凑版（少了 IP 与关闭原因），但整行可点进详情，
  详情里八个字段齐全。
-->
<template>
  <div class="pk-bar">
    <div class="pk-seg" role="group" aria-label="按状态筛选">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="pk-seg__btn"
        :class="{ 'is-active': filters.status === tab.value }"
        :aria-pressed="filters.status === tab.value"
        @click="emit('filter', { status: tab.value })"
      >
        {{ tab.label }}<span class="pk-seg__count">{{ tab.count }}</span>
      </button>
    </div>

    <span class="pk-bar__sep" />

    <ReInput
      v-model="keyword"
      placeholder="搜索主机 / 用户 / IP"
      prefix-icon="Search"
      clearable
      style="width: 196px"
    />
    <ReSelect v-model="protocol" :options="protocolOptions" placeholder="协议" style="width: 104px" />

    <span class="pk-bar__spacer" />
    <span class="pk-bar__count">{{ appliedText }}</span>
    <ReButton icon="Refresh" layout="square" tip="刷新会话记录" :loading="loading" @click="emit('refresh')" />
  </div>

  <!-- 遥测条 -->
  <div class="pk-tele">
    <div class="pk-tele__cell">
      <span class="pk-tele__value">{{ stats.total }}</span>
      <span class="pk-tele__label">总连接</span>
    </div>
    <div class="pk-tele__cell" :class="{ 'is-hot': stats.open > 0 }">
      <span class="pk-tele__value">{{ stats.open }}</span>
      <span class="pk-tele__label">进行中</span>
    </div>
    <div class="pk-tele__cell">
      <span class="pk-tele__value">{{ medianText }}</span>
      <span class="pk-tele__label">中位时长</span>
    </div>
    <div class="pk-tele__cell">
      <span class="pk-tele__value">{{ hostCount }}</span>
      <span class="pk-tele__label">涉及主机</span>
    </div>
  </div>

  <!-- 图表：点柱即筛选 -->
  <div class="chart">
    <div class="chart__head">
      <span class="chart__title">
        连接分布
        <span>按开始时刻归入 4 小时时段，堆叠为该时段的协议构成</span>
      </span>
      <span class="pk-band__legend">
        <span v-for="tone in tones" :key="tone.key" class="pk-band__legend-item">
          <i class="pk-band__legend-chip" :style="{ background: tone.color }" />{{ tone.label }}
        </span>
      </span>
    </div>

    <div class="chart__plot" role="group" aria-label="按时段筛选会话">
      <button
        v-for="bucket in buckets"
        :key="bucket.fromHour"
        type="button"
        class="chart__col"
        :class="{ 'is-picked': filters.hourBucket === bucket.fromHour, 'is-empty': bucket.total === 0 }"
        :aria-pressed="filters.hourBucket === bucket.fromHour"
        :title="`${bucket.label}：${bucket.total} 条${filters.hourBucket === bucket.fromHour ? '（点击取消）' : '（点击只看这个时段）'}`"
        @click="pickBucket(bucket.fromHour)"
      >
        <span class="chart__val">{{ bucket.total || '' }}</span>
        <span class="chart__stack">
          <i
            v-for="tone in tones"
            :key="tone.key"
            :style="{ height: `${segHeight(bucket, tone.key)}px`, background: tone.color }"
          />
        </span>
      </button>
    </div>

    <div class="chart__ticks">
      <span v-for="bucket in buckets" :key="bucket.fromHour">{{ bucket.label }}</span>
    </div>
  </div>

  <!-- 紧凑明细 -->
  <div class="pk-table pk-grow">
    <div class="pk-cells pk-hd" :style="cols">
      <span>主机 / 用户</span>
      <span>协议</span>
      <span>连接 → 关闭</span>
      <span>时长</span>
      <span>状态</span>
    </div>

    <div class="pk-table__scroll">
      <div
        v-for="row in rows"
        :key="row.id"
        class="pk-cells pk-tr is-clickable"
        :style="cols"
        tabindex="0"
        role="button"
        :aria-label="`查看 ${row.host} 的会话详情`"
        @click="emit('detail', row)"
        @keydown.enter.prevent="emit('detail', row)"
        @keydown.space.prevent="emit('detail', row)"
      >
        <div style="min-width: 0">
          <div class="pk-strong pk-ellipsis">{{ row.host }}</div>
          <div class="pk-sub pk-ellipsis">{{ row.user }}</div>
        </div>
        <div>
          <span class="pk-proto" :class="`is-${row.protocolTone}`">{{ row.protocol }}</span>
        </div>
        <div class="pk-num pk-dim pk-ellipsis">
          {{ row.connectText.slice(11) }} → {{ row.isOpen ? '现在' : row.closeText.slice(11) }}
        </div>
        <div class="pk-num" :class="{ 'pk-live': row.isOpen }">{{ row.durationText }}</div>
        <div>
          <span class="pk-state">
            <i class="pk-dot" :class="row.isOpen ? 'pk-dot--live' : ''" />
            {{ row.statusText }}
          </span>
        </div>
      </div>

      <div v-if="!rows.length" class="pk-empty">
        <span>{{ loading ? '正在读取会话记录…' : '没有符合条件的会话' }}</span>
        <span v-if="!loading" class="pk-empty__hint">
          点图表上任意一根柱可以只看那个时段；再点一次取消。
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  bucketByProtocol,
  formatDuration,
  medianDuration,
  SESSION_BUCKET_HOURS,
  type ProtocolBucket,
  type SessionFilters,
  type SessionStats,
  type SessionStatusFilter,
  type SessionView,
} from './sessionView'

const props = defineProps<{
  /** 已筛选的会话（展示行） */
  rows: SessionView[]
  /** 全量统计 */
  stats: SessionStats
  /** 加载态 */
  loading: boolean
  /** 当前筛选条件 */
  filters: SessionFilters
  /** 全量展示行：图表画的是总体分布，不跟着表格的筛选一起缩，
   *  否则一点柱就只剩一根柱，用户再也点不回别的时段 */
  allRows: SessionView[]
}>()

const emit = defineEmits<{
  (e: 'filter', patch: Partial<SessionFilters>): void
  (e: 'refresh'): void
  (e: 'detail', row: SessionView): void
}>()

/** 柱高上限（px）：图表高度固定，不随容器拉伸 */
const PLOT_HEIGHT = 62

const cols = {
  '--pk-cols': 'minmax(0, 1.4fr) 56px minmax(0, 1.2fr) 64px 84px',
  '--pk-min-w': '520px',
}

const tones = [
  { key: 'ssh' as const, label: 'SSH', color: 'var(--el-color-primary)' },
  { key: 'rdp' as const, label: 'RDP', color: '#7c3aed' },
  { key: 'vnc' as const, label: 'VNC', color: '#0e7490' },
  { key: 'other' as const, label: '其它', color: 'var(--el-text-color-disabled)' },
]

const tabs = computed<Array<{ label: string; value: SessionStatusFilter; count: number }>>(() => [
  { label: '全部', value: '', count: props.stats.total },
  { label: '进行中', value: 'OPEN', count: props.stats.open },
  { label: '已结束', value: 'CLOSED', count: props.stats.closed },
])

const protocolOptions = [
  { label: '全部协议', value: '' },
  { label: 'SSH', value: 'SSH' },
  { label: 'RDP', value: 'RDP' },
  { label: 'VNC', value: 'VNC' },
]

const keyword = computed({
  get: () => props.filters.keyword,
  set: (v: string) => emit('filter', { keyword: v }),
})
const protocol = computed({
  get: () => props.filters.protocol,
  set: (v: string) => emit('filter', { protocol: v }),
})

/** 图表数据来自全量，不受关键字/状态筛选影响 */
const buckets = computed(() => bucketByProtocol(props.allRows, SESSION_BUCKET_HOURS))

/** 柱高按「最多的那个时段」归一，保证最高柱刚好占满绘图高度 */
const peak = computed(() => Math.max(1, ...buckets.value.map(b => b.total)))

/**
 * 单段柱高。
 *
 * @param bucket 时段桶
 * @param tone   协议
 */
function segHeight(bucket: ProtocolBucket, tone: keyof ProtocolBucket['counts']): number {
  const n = bucket.counts[tone]
  return n > 0 ? Math.max((n / peak.value) * PLOT_HEIGHT, 2) : 0
}

/**
 * 点柱：同一时段再点一次取消。
 *
 * @param fromHour 桶起点
 */
function pickBucket(fromHour: number): void {
  const next = props.filters.hourBucket === fromHour ? null : fromHour
  emit('filter', { hourBucket: next })
}

const medianText = computed(() => {
  const ms = medianDuration(props.allRows)
  return ms === null ? '—' : formatDuration(ms)
})

/** 涉及主机数：去重后的主机名，破折号（主机未知）不计入 */
const hostCount = computed(() => {
  const names = new Set(props.allRows.map(r => r.host).filter(n => n && n !== '—'))
  return names.size
})

const appliedText = computed(() => {
  const shown = props.rows.length
  const total = props.stats.total
  return shown === total ? `共 ${total} 条` : `筛选出 ${shown} / ${total} 条`
})
</script>

<style scoped>
/* ===== 图表 ===== */
.chart {
  flex: none;
  padding: 10px 12px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.chart__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.chart__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart__title span {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.chart__plot {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 62px;
}

/* 柱是可点的按钮：去掉默认外观，焦点环自绘 */
.chart__col {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  gap: 2px;
  height: 100%;
  padding: 0;
  background: none;
  border: 0;
  border-radius: var(--el-radius-xs, 4px);
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s);
}

.chart__col:hover {
  background: var(--el-fill-color-light);
}

.chart__col:focus-visible {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.chart__col.is-picked {
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 0 0 1px var(--el-color-primary);
}

.chart__val {
  height: 13px;
  font-size: 10px;
  line-height: 13px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* 空时段不显示 0：满屏的 0 会视觉噪声化真正有数据的柱子 */
.chart__col.is-empty .chart__val {
  color: transparent;
}

.chart__stack {
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  max-width: 34px;
  margin: 0 auto;
  border-radius: 2px;
  overflow: hidden;
}

.chart__stack i {
  display: block;
  width: 100%;
}

.chart__ticks {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}

.chart__ticks span {
  flex: 1 1 0;
  font-size: 10px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}


@media (prefers-reduced-motion: reduce) {
  .chart__col {
    transition: none;
  }
}
</style>
