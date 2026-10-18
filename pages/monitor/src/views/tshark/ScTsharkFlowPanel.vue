<!--
  会话流面板

  「Top 会话流」在原来只是一个横条图，看不出具体是哪些流、各占多少。
  这里图表 + 明细并列：图给分布，明细给可读的流标识与占比。
-->
<template>
  <div class="tshark-panel">
    <div class="tshark-panel__tools">
      <span class="tshark-dim flow-hint">按包数排序，最多展示 10 条会话流</span>
      <span class="tshark-panel__spacer"></span>
      <span class="tshark-dim flow-total">本会话共 {{ packetTotal }} 包</span>
    </div>

    <div class="tshark-panel__body">
      <div class="flow-grid">
        <!-- 标题走 header 属性 + #header 插槽，理由见 ScTsharkStatsPanel 同名说明 -->
        <ReCard layout="simple" :radius="14" :padding="14" shadow="never" header="Top 会话流" class="flow-card">
          <template #header><span class="panel-title">Top 会话流</span></template>
          <div v-if="topFlows.length === 0" class="flow-empty">
            <ReEmpty description="当前会话还没有可统计的会话流" layout="modern" />
          </div>
          <div v-else ref="barRef" class="chart-box"></div>
        </ReCard>

        <ReCard layout="simple" :radius="14" :padding="14" shadow="never" header="流明细" class="flow-card">
          <template #header><span class="panel-title">流明细</span></template>
          <div v-if="topFlows.length === 0" class="flow-empty">
            <ReEmpty description="暂无数据" layout="modern" />
          </div>
          <ul v-else class="flow-list">
            <li v-for="(row, i) in topFlows" :key="row.flow + '-' + i" class="flow-row">
              <span class="flow-row__rank tshark-mono">{{ i + 1 }}</span>
              <span class="flow-row__name tshark-mono" :title="row.flow">{{ row.flow }}</span>
              <span class="flow-row__pct tshark-mono">{{ shareOf(row.count) }}%</span>
              <span class="flow-row__count tshark-mono">{{ row.count }}</span>
            </li>
          </ul>
        </ReCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { readChartTheme } from './chartTheme'
import { useEchart } from './useEchart'
import type { TsharkFlow } from './types'

const props = defineProps<{
  topFlows: TsharkFlow[]
  packetTotal: number
  /** 统计版本号，见 ScTsharkStatsPanel 的同名说明 */
  version: number
}>()

const flowTotal = computed(() => props.topFlows.reduce((sum, r) => sum + (r.count || 0), 0))

function shareOf(count: number): string {
  const total = flowTotal.value
  return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
}

/** 纵轴标签压缩：流标识是「源 → 目的」，长了会把绘图区吃掉一半 */
function shorten(flow: string, max = 26): string {
  const s = flow || ''
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

// ==================== 横条图 ====================
const barRef = ref<HTMLElement | null>(null)

const { render } = useEchart(barRef, (chart) => {
  const t = readChartTheme()
  const data = props.topFlows.slice(0, 10)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      borderWidth: 0,
      textStyle: { fontSize: 11, fontFamily: t.font },
    },
    grid: { left: 8, right: 24, top: 6, bottom: 24, containLabel: true },
    xAxis: {
      type: 'value',
      name: '包数',
      nameTextStyle: { fontSize: 10, color: t.tertiary },
      axisLabel: { fontSize: 10, color: t.secondary },
      splitLine: { lineStyle: { color: 'rgba(128,128,128,0.15)' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: data.map(d => shorten(d.flow)),
      axisLabel: { fontSize: 9, color: t.secondary, width: 150, overflow: 'truncate' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.count),
      itemStyle: { borderRadius: [0, 6, 6, 0], color: t.net },
      barWidth: '55%',
    }],
  })
})

watch(() => props.version, () => nextTick(render))
</script>

<style scoped>
.flow-hint, .flow-total { font-size: 12px; }

.flow-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1.2fr) minmax(300px, 1fr);
  gap: 12px;
  align-content: start;
}
@media (max-width: 1024px) {
  .flow-grid { grid-template-columns: 1fr; }
}

/* margin:0 覆盖 koi 主题卡片自带的 5px 6px 外边距，理由见 ScTsharkStatsPanel */
.flow-card {
  margin: 0;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
/* 10 条横向条目 + 轴标签，比协议饼图需要更多纵向空间 */
.chart-box { height: 320px; width: 100%; }
.flow-empty { padding: 24px 0; }

.flow-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow: auto;
}
.flow-row {
  display: grid;
  grid-template-columns: 20px 1fr 52px 68px;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.flow-row:last-child { border-bottom: 0; }
.flow-row__rank {
  color: var(--el-text-color-placeholder);
  text-align: right;
}
.flow-row__name {
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flow-row__pct {
  text-align: right;
  color: var(--el-text-color-secondary);
}
.flow-row__count {
  text-align: right;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
