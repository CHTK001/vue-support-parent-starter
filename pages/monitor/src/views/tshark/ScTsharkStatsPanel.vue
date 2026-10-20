<!--
  协议统计面板

  概览三张卡 + 协议分布环形图 + 协议明细（带占比条）。

  明细里每一行可点：点了直接切到「报文」标签并把这个协议填进关键字去筛 ——
  原实现是「看饼图 → 记住协议名 → 回报文表手打关键字」，中间那步纯手工。
-->
<template>
  <div class="tshark-panel">
    <div class="stat-cards">
      <ReStatCard size="compact" title="数据包总数" :value="packetTotal" desc="已入库明细"
        :icon="DataLine" icon-color="var(--metric-cpu)" />
      <ReStatCard size="compact" title="协议种类" :value="protoStats.length" desc="按最高层协议统计"
        :icon="Collection" icon-color="var(--el-color-success)" />
      <ReStatCard size="compact" title="Top 会话流" :value="topFlows.length" desc="按包数排序"
        :icon="TrendCharts" icon-color="var(--el-color-warning)" />
    </div>

    <div class="tshark-panel__body">
      <div class="stats-grid">
        <!-- 标题必须同时给 header 属性与 #header 插槽：
             ReCard 是按主题切换的组件，koi 主题渲染条件是 `header || $slots.header`，
             default 主题是 `v-if="finalHeader"`（只看 header / title 属性）——
             只写插槽在 default 主题下整块标题不渲染，只写属性又放不进加粗/提示。 -->
        <ReCard layout="simple" :radius="14" :padding="14" shadow="never" header="协议分布" class="stats-card">
          <template #header><span class="panel-title">协议分布</span></template>
          <div ref="pieRef" class="chart-box"></div>
        </ReCard>

        <ReCard layout="simple" :radius="14" :padding="14" shadow="never" header="协议明细" class="stats-card">
          <template #header>
            <span class="panel-title">协议明细<em class="panel-title__hint">点击任意协议筛到报文</em></span>
          </template>
          <div v-if="protoStats.length === 0" class="proto-empty">
            <ReEmpty description="当前会话还没有解析出协议" layout="modern" />
          </div>
          <ul v-else class="proto-list">
            <li
              v-for="row in protoStats"
              :key="row.protocol"
              class="proto-row"
              tabindex="0"
              @click="emit('pick-protocol', row.protocol)"
              @keydown.enter="emit('pick-protocol', row.protocol)"
            >
              <span class="proto-row__dot" :style="{ background: colorOf(row.protocol) }"></span>
              <span class="proto-row__name tshark-mono">{{ row.protocol || 'OTHER' }}</span>
              <span class="proto-row__bar">
                <span class="proto-row__bar-fill" :style="{ width: shareOf(row.count) + '%', background: colorOf(row.protocol) }"></span>
              </span>
              <span class="proto-row__pct tshark-mono">{{ shareOf(row.count).toFixed(1) }}%</span>
              <span class="proto-row__count tshark-mono">{{ row.count }}</span>
            </li>
          </ul>
        </ReCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Collection, DataLine, TrendCharts } from '@element-plus/icons-vue'
import { buildProtoColors, readChartTheme } from './chartTheme'
import { useEchart } from './useEchart'
import type { TsharkFlow, TsharkProtocolStat } from './types'

const props = defineProps<{
  protoStats: TsharkProtocolStat[]
  topFlows: TsharkFlow[]
  packetTotal: number
  /** 统计版本号：实时推送到包时会自增，用来触发图表重绘（数组是原地 push 的，引用不变） */
  version: number
}>()

const emit = defineEmits<{ (e: 'pick-protocol', protocol: string): void }>()

/** 饼图与占比条的分母：用协议统计自己的合计，而不是报文总数（后者可能含未归类报文） */
const protoTotal = computed(() => props.protoStats.reduce((sum, r) => sum + (r.count || 0), 0))

/** 当前数据下的「协议 → 颜色」，饼图与明细行共用同一份，保证两处对得上 */
const protoColors = computed(() => {
  const list = props.protoStats.map(r => r.protocol || 'OTHER')
  return buildProtoColors(list, readChartTheme())
})

function colorOf(protocol: string): string {
  // key 与 protoColors 的构建口径保持一致（都按 `protocol || 'OTHER'` 归一），
  // 否则 protocol 为空的那些行查不到颜色、掉到兜底色上，与饼图对不上
  const key = protocol || 'OTHER'
  return protoColors.value[key] || readChartTheme().tertiary
}

function shareOf(count: number): number {
  const total = protoTotal.value
  return total > 0 ? (count / total) * 100 : 0
}

// ==================== 环形图 ====================
const pieRef = ref<HTMLElement | null>(null)

const { render } = useEchart(pieRef, (chart) => {
  const t = readChartTheme()
  const data = props.protoStats.slice(0, 12)
  const colors = buildProtoColors(data.map(d => d.protocol || 'OTHER'), t)
  const hasData = data.length > 0
  chart.setOption({
    tooltip: {
      trigger: 'item',
      borderWidth: 0,
      textStyle: { fontSize: 11, fontFamily: t.font },
    },
    legend: {
      bottom: 0,
      type: 'scroll',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 10, color: t.secondary, fontFamily: t.font },
    },
    series: [{
      type: 'pie',
      radius: ['38%', '66%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 5, borderWidth: 3, borderColor: 'transparent' },
      label: { show: false },
      emphasis: { scaleSize: 4 },
      data: hasData
        ? data.map(d => ({
          name: d.protocol || 'OTHER',
          value: d.count,
          itemStyle: { color: colors[d.protocol || 'OTHER'] },
        }))
        : [{ name: '暂无数据', value: 1, itemStyle: { color: t.tertiary } }],
    }],
  })
})

// 数据或实时推送计数变化后重绘；nextTick 等容器尺寸落定再画
watch(() => props.version, () => nextTick(render))
</script>

<style scoped>
.stat-cards {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* 环形图与明细左右分栏；窄屏堆叠 */
.stats-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.15fr);
  gap: 12px;
  align-content: start;
}
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: 1fr; }
}

/* margin:0 覆盖 koi 主题卡片自带的 5px 6px 外边距：本面板是两列网格，
   卡片自带外边距会让列间距比行间距大一圈，网格对齐就此歪掉。 */
.stats-card {
  margin: 0;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
}
.panel-title {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.panel-title__hint {
  font-style: normal;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}
.chart-box { height: 240px; width: 100%; }

.proto-empty { padding: 24px 0; }

.proto-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow: auto;
}
.proto-row {
  display: grid;
  grid-template-columns: 8px 76px 1fr 52px 64px;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.proto-row:hover { background: var(--el-fill-color-light); }
.proto-row:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}
.proto-row__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.proto-row__name {
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.proto-row__bar {
  height: 6px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.proto-row__bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width var(--el-transition-duration, 0.3s) ease;
}
.proto-row__pct {
  text-align: right;
  color: var(--el-text-color-secondary);
}
.proto-row__count {
  text-align: right;
  color: var(--el-text-color-primary);
}

@media (prefers-reduced-motion: reduce) {
  .proto-row, .proto-row__bar-fill { transition: none; }
}
</style>
