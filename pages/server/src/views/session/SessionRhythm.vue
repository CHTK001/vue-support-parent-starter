<!--
  会话审计 · 方向「节奏」

  这个方向认为：会话本来就是**区间**，不是行。一天里谁在什么时候连着机器、
  什么时候整片空着，这件事只有画在轴上才能一眼看出来；排成表格要一行一行读时间戳。

  两个取舍：
    ① 轴上每根条是一个会话，按协议分道（同协议依次下沉）。不做「最优区间着色」——
       那要排序加贪心，收益只是省几十像素高度；按协议分道稳定且够读。
    ② 点轴的空白处 = 按该时段筛选。同样的 hourBucket 条件，「仪表」是从柱子上点出来的，
       这里是从轴上点出来的；两个画布共用一套筛选模型，所以切画布不会丢条件。
       轴上点选比柱状图更精确：x 坐标直接换算成小时。

  数据完整性：轴上方与表格共用同一批行。图上画不出来的会话（连接时间无法解析）
  不会从表格里消失 —— 它们只在轴上缺席，表格里仍在，并且时长列显示破折号。
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

  <!-- 时间带 -->
  <div class="pk-band">
    <div class="band__head">
      <span class="band__title">
        今日连接节奏
        <span>{{ plotRows.length }} 个会话落在轴上</span>
      </span>
      <span class="pk-band__legend">
        <span v-for="tone in tones" :key="tone.key" class="pk-band__legend-item">
          <i class="pk-band__legend-chip" :style="{ background: tone.color }" />{{ tone.label }}
        </span>
        <span class="pk-band__legend-item band__hint">点轴空白处按时段筛选</span>
      </span>
    </div>

    <div
      class="pk-band__axis band__axis"
      :style="{ height: `${axisHeight}px` }"
      role="button"
      tabindex="0"
      aria-label="点击空白处按时段筛选会话"
      @click="onAxisClick"
      @keydown.enter.prevent="emit('filter', { hourBucket: filters.hourBucket })"
    >
      <span
        v-for="item in lanes"
        :key="item.view.id"
        class="pk-band__bar"
        :style="{
          left: `${item.geo.leftPercent}%`,
          width: `${item.geo.widthPercent}%`,
          top: `${item.top + 4}px`,
          background: toneColor(item.view.protocolTone),
        }"
        :title="`${item.view.host} · ${item.view.user} · ${item.view.connectText} · ${item.view.durationText}`"
        @click.stop="emit('detail', item.view)"
      />
      <span v-if="nowPercent !== null" class="pk-band__now" :style="{ left: `${nowPercent}%` }" />
    </div>

    <div class="pk-band__ticks">
      <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
    </div>
  </div>

  <!-- 明细 -->
  <div class="pk-table pk-grow">
    <div class="pk-cells pk-hd" :style="cols">
      <span>主机 / 用户</span>
      <span>协议</span>
      <span>连接时间</span>
      <span>时长</span>
      <span>状态</span>
      <span style="text-align: right">操作</span>
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
          <div class="pk-sub pk-ellipsis">{{ row.user }} · {{ row.ip }}</div>
        </div>
        <div>
          <span class="pk-proto" :class="`is-${row.protocolTone}`">{{ row.protocol }}</span>
        </div>
        <div class="pk-num pk-dim">{{ row.connectText }}</div>
        <div class="pk-num" :class="{ 'pk-live': row.isOpen }">{{ row.durationText }}</div>
        <div>
          <span class="pk-state">
            <i class="pk-dot" :class="row.isOpen ? 'pk-dot--live' : ''" />
            {{ row.statusText }}
          </span>
        </div>
        <div class="pk-ops" @click.stop>
          <button type="button" class="pk-link" @click="emit('detail', row)">详情</button>
          <button
            v-if="row.isOpen"
            type="button"
            class="pk-link pk-link--danger"
            @click="emit('close', row)"
          >强制关闭</button>
        </div>
      </div>

      <div v-if="!rows.length" class="pk-empty">
        <span>{{ loading ? '正在读取会话记录…' : '没有符合条件的会话' }}</span>
        <span v-if="!loading" class="pk-empty__hint">
          轴上只画当天有起止时刻的会话；跨天的会话仍在这份列表里。
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  assignLanes,
  bandGeometry,
  hourOfDay,
  SESSION_BUCKET_HOURS,
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
  /** 当前时刻，用于画「现在」竖线与进行中会话的实时位置 */
  now: Date
}>()

const emit = defineEmits<{
  (e: 'filter', patch: Partial<SessionFilters>): void
  (e: 'refresh'): void
  (e: 'detail', row: SessionView): void
  (e: 'close', row: SessionView): void
}>()

const LANE_HEIGHT = 13

const cols = {
  '--pk-cols': 'minmax(0, 1.4fr) 56px minmax(0, 1fr) 64px 86px 112px',
  '--pk-min-w': '620px',
}

const tones = [
  { key: 'ssh' as const, label: 'SSH', color: 'var(--el-color-primary)' },
  { key: 'rdp' as const, label: 'RDP', color: '#7c3aed' },
  { key: 'vnc' as const, label: 'VNC', color: '#0e7490' },
  { key: 'other' as const, label: '其它', color: 'var(--el-text-color-disabled)' },
]

const ticks = ['00', '04', '08', '12', '16', '20', '24']

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

/** 能画到轴上的会话（起止都解析得出） */
const plotRows = computed(() => props.rows.filter(r => r.startHour !== null && r.endHour !== null))

/** 分道 + 几何，两个纯函数组合，画布只负责贴样式 */
const lanes = computed(() =>
  assignLanes(props.rows, LANE_HEIGHT)
    .map(({ view, top }) => {
      const geo = bandGeometry(view)
      return geo ? { view, top, geo } : null
    })
    .filter((v): v is { view: SessionView; top: number; geo: { leftPercent: number; widthPercent: number } } => v !== null),
)

/** 轴高按实际道数撑开：只有 3 个会话时不留下大片空白 */
const axisHeight = computed(() => {
  const maxTop = lanes.value.reduce((m, l) => Math.max(m, l.top), 0)
  return Math.max(maxTop + LANE_HEIGHT + 8, 30)
})

/** 「现在」的位置；不在今天则不出线（避免画在昨天的轴上） */
const nowPercent = computed(() => {
  const hour = hourOfDay(props.now)
  return hour === null ? null : (hour / 24) * 100
})

/** 协议 → 颜色 */
function toneColor(tone: SessionView['protocolTone']): string {
  return tones.find(t => t.key === tone)?.color ?? 'var(--el-color-primary)'
}

/**
 * 点轴空白处：把 x 坐标换算成小时，再落到所属的时段桶。
 *
 * <p>用 offsetX / 元素宽度，而不是 clientX 减 getBoundingClientRect().left：
 * 前者是相对目标元素内边距的坐标，正是这里要的口径，也不必读布局。</p>
 *
 * @param event 鼠标事件
 */
function onAxisClick(event: MouseEvent): void {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return
  const width = el.clientWidth
  if (width <= 0) return
  const ratio = Math.min(Math.max(event.offsetX / width, 0), 0.999)
  const hour = ratio * 24
  const bucket = Math.floor(hour / SESSION_BUCKET_HOURS) * SESSION_BUCKET_HOURS
  emit('filter', { hourBucket: props.filters.hourBucket === bucket ? null : bucket })
}

const appliedText = computed(() => {
  const shown = props.rows.length
  const total = props.stats.total
  return shown === total ? `共 ${total} 条` : `筛选出 ${shown} / ${total} 条`
})
</script>

<style scoped>
.band__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 7px;
}

.band__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.band__title span {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.band__hint {
  color: var(--el-text-color-placeholder);
}

/* 轴本体：cursor 提示这块可点（点空白按时间筛） */
.band__axis {
  cursor: crosshair;
  outline: none;
}

.band__axis:focus-visible {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

/* 轴上的条是可点的：给一点 hover 反馈，否则用户不知道能点 */
.pk-band__axis :deep(.pk-band__bar) {
  cursor: pointer;
}


</style>
