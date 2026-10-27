<template>
  <!--
    变体 A · 航站楼（Terminal）
    —— 用量管理 UI 重构探索

    设计概念：把"实时用量"当机舱实时仪表来呈现。整页骨架是横向三段式：
    · 顶部一条「航行情报条」：实时连接状态（雷达点）、当前区间、速度（tok/分）
      收窄成一条横向带（不再独占一行的 KPI 卡），时间切换/导出钉在最右。
    · 主区「引擎驾驶舱」：四个发动机状态表（KPI 紧凑行）横向排列，数字用等宽码表，
      每台引擎一张"状态名片"，不复用原来占用整行的卡片矩阵。
    · 仪表盘区：左右两扇"转速表"（环形图）加竖排刻度图例 + 下方一条细表格。
      表盘熔入：环形图中心数值 = 表盘指针读数（沿用原 hover 联动，视觉改为表盘灯光）。
    · 轨迹下探：Top5 排行改成「航迹脱出」横向条带（条带即航迹灯），
      每日堆叠柱 = 单日流量剖面，趋势/延迟合成左右两扇"告警灯窗"。
    · 明细表沿用共享 UsageDetailTable，但收进"黑匣子"ui，暗色主题更贴合。

    业务功能 100% 保留：SSE 实时、时间胶囊、导出、KPI、双分布看板（环形+图例+表）、
    Top5、每日堆叠、趋势、延迟、明细（13 列 + 各 popover）。全部来自 useUsageBoard()。
  -->
  <div class="tg-page" data-page="usage" data-variant="a">
    <!-- ── 航行情报条：页头 + 实时状态 ── -->
    <header class="tg-runway">
      <UsagePageHead :board="board" />
    </header>

    <!-- ── 引擎驾驶舱：四个发动机状态表 ── -->
    <div class="tg-deck">
      <section
        v-for="(card, i) in board.statCards" :key="card.key"
        class="tg-engine" :class="`tg-engine--${i + 1}`"
      >
        <div class="tg-eng-head">
          <span class="tg-eng-icon" :class="`is-${card.tone}`">
            <svg v-if="card.key === 'token'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M12 2.8 19 6.4v6.2c0 4.3-2.9 6.7-7 8.6-4.1-1.9-7-4.3-7-8.6V6.4L12 2.8Z M9.2 11.6l2 2 3.8-4" />
            </svg>
            <svg v-else-if="card.key === 'requests'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M2 12h3.2l2.4 7.5 4.2-15 3.3 9.2H14M15 12h7" />
            </svg>
            <svg v-else-if="card.key === 'cost'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 14.5v-7ZM3 9.5h18M15 12h3.2" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7.5V12l3 2" />
            </svg>
          </span>
          <span class="tg-eng-label">{{ card.label }}</span>
        </div>
        <div class="tg-eng-value-row">
          <span class="tg-eng-value">{{ card.value }}</span>
          <span v-if="card.unit" class="tg-eng-unit">{{ card.unit }}</span>
        </div>
        <div class="tg-eng-sub">
          <span v-for="s in card.sub" :key="s" class="tg-eng-sub-item">{{ s }}</span>
        </div>
        <!-- 主引擎（总 Token）带迷你环：输入/输出占比 -->
        <div v-if="card.key === 'token'" class="tg-eng-ring">
          <ReEcharts :option="board.miniRingOption('input')" height="44px" width="72px" notMerge />
        </div>
      </section>
    </div>

    <!-- ── 仪表盘分析：双转速表 + 刻度图例 + 下方细表 ── -->
    <div class="tg-gauges">
      <!-- 左扇：模型用量分析 -->
      <section class="tg-gauge">
        <header class="tg-gauge-head">
          <h3 class="tg-gauge-title">模型用量分析</h3>
          <div class="tg-tabs" role="tablist">
            <button v-for="t in board.boardTabs" :key="t.key" type="button" class="tg-tab"
              role="tab" :class="{ active: board.modelChartType === t.key }"
              :aria-selected="board.modelChartType === t.key"
              @click="board.modelChartType = t.key">{{ t.label }}</button>
          </div>
        </header>
        <div class="tg-gauge-body">
          <div class="tg-dial">
            <ReEcharts :option="board.modelRingOption" height="168px" notMerge
              @mouseover="(p: any) => board.onRingHover('model', p)"
              @mouseout="() => board.onRingHover('model', null)"
              @globalout="() => board.onRingHover('model', null)" />
            <div class="tg-dial-center">
              <span class="tg-dial-pct">{{ board.ringTop(board.modelBoard, board.modelHover).pct }}</span>
              <span class="tg-dial-name" :title="board.ringTop(board.modelBoard, board.modelHover).name">{{ board.ringTop(board.modelBoard, board.modelHover).name }}</span>
            </div>
          </div>
          <ul class="tg-legend">
            <li v-for="it in board.modelBoard.slices" :key="it.name" class="tg-legend-item"
              :class="{ 'is-top': it === board.modelBoard.slices[0], 'is-hover': board.modelHover?.name === it.name, 'is-other': it.color === board.OTHER_SLICE_COLOR }"
              @mouseenter="board.onLegendHover('model', it)" @mouseleave="board.onLegendHover('model', null)">
              <i class="tg-legend-dot" :style="{ background: it.color }" />
              <span class="tg-legend-name" :title="it.name">{{ it.name }}</span>
              <span class="tg-legend-pct">{{ it.pct.toFixed(1) }}%</span>
            </li>
            <li v-if="board.modelBoard.slices.length === 0" class="tg-legend-empty">
              <el-empty description="暂无数据" :image-size="36" />
            </li>
          </ul>
        </div>
        <div class="tg-gauge-table">
          <ReTable
            :data="board.modelDist"
            :columns="board.boardColumns('模型')"
            :show-index="false"
            :stripe="false"
            size="small"
            :pagination="false"
            empty-text="暂无模型用量"
          >
            <template #col-name="{ row }">
              <div class="tg-name-cell" :class="{ 'is-zero': board.isZeroCost(row, board.modelChartType) }">
                <i class="tg-name-dot" :style="{ background: board.boardColorOf(board.modelBoard, row.name) }" />
                <span class="tg-name-text" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
            <template #col-requests="{ row }">
              <span class="tg-num" :class="{ 'is-zero': board.isZeroCost(row, board.modelChartType) }">{{ board.formatNumber(row.requests) }}</span>
            </template>
            <template #col-totalTokens="{ row }">
              <span class="tg-num" :class="{ 'is-zero': board.isZeroCost(row, board.modelChartType) }">{{ board.fmtToken(row.totalTokens) }}</span>
            </template>
            <template #col-cost="{ row }">
              <span class="tg-num" :class="{ 'is-zero': board.isZeroCost(row, board.modelChartType) }">{{ board.money(row.cost) }}</span>
            </template>
            <template #col-percent="{ row }">
              <div class="tg-pct">
                <span class="tg-pct-track">
                  <i class="tg-pct-fill"
                    :style="{ width: board.barWidth(board.percentNum(row, board.modelDist, board.modelChartType)), background: board.boardColorOf(board.modelBoard, row.name) }" />
                </span>
                <span class="tg-pct-text">{{ board.percent(row, board.modelDist, board.modelChartType) }}</span>
              </div>
            </template>
          </ReTable>
        </div>
      </section>

      <!-- 右扇：分组用量分析 -->
      <section class="tg-gauge">
        <header class="tg-gauge-head">
          <h3 class="tg-gauge-title">分组用量分析</h3>
          <div class="tg-tabs" role="tablist">
            <button v-for="t in board.boardTabs" :key="t.key" type="button" class="tg-tab"
              role="tab" :class="{ active: board.groupChartType === t.key }"
              :aria-selected="board.groupChartType === t.key"
              @click="board.groupChartType = t.key">{{ t.label }}</button>
          </div>
        </header>
        <div class="tg-gauge-body">
          <div class="tg-dial">
            <ReEcharts :option="board.groupRingOption" height="168px" notMerge
              @mouseover="(p: any) => board.onRingHover('group', p)"
              @mouseout="() => board.onRingHover('group', null)"
              @globalout="() => board.onRingHover('group', null)" />
            <div class="tg-dial-center">
              <span class="tg-dial-pct">{{ board.ringTop(board.groupBoard, board.groupHover).pct }}</span>
              <span class="tg-dial-name" :title="board.ringTop(board.groupBoard, board.groupHover).name">{{ board.ringTop(board.groupBoard, board.groupHover).name }}</span>
            </div>
          </div>
          <ul class="tg-legend">
            <li v-for="it in board.groupBoard.slices" :key="it.name" class="tg-legend-item"
              :class="{ 'is-top': it === board.groupBoard.slices[0], 'is-hover': board.groupHover?.name === it.name, 'is-other': it.color === board.OTHER_SLICE_COLOR }"
              @mouseenter="board.onLegendHover('group', it)" @mouseleave="board.onLegendHover('group', null)">
              <i class="tg-legend-dot" :style="{ background: it.color }" />
              <span class="tg-legend-name" :title="it.name">{{ it.name }}</span>
              <span class="tg-legend-pct">{{ it.pct.toFixed(1) }}%</span>
            </li>
            <li v-if="board.groupBoard.slices.length === 0" class="tg-legend-empty">
              <el-empty description="暂无数据" :image-size="36" />
            </li>
          </ul>
        </div>
        <div class="tg-gauge-table">
          <ReTable
            :data="board.groupDist"
            :columns="board.boardColumns('分组')"
            :show-index="false"
            :stripe="false"
            size="small"
            :pagination="false"
            empty-text="暂无分组用量"
          >
            <template #col-name="{ row }">
              <div class="tg-name-cell" :class="{ 'is-zero': board.isZeroCost(row, board.groupChartType) }">
                <i class="tg-name-dot" :style="{ background: board.boardColorOf(board.groupBoard, row.name) }" />
                <span class="tg-name-text" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
            <template #col-requests="{ row }">
              <span class="tg-num" :class="{ 'is-zero': board.isZeroCost(row, board.groupChartType) }">{{ board.formatNumber(row.requests) }}</span>
            </template>
            <template #col-totalTokens="{ row }">
              <span class="tg-num" :class="{ 'is-zero': board.isZeroCost(row, board.groupChartType) }">{{ board.fmtToken(row.totalTokens) }}</span>
            </template>
            <template #col-cost="{ row }">
              <span class="tg-num" :class="{ 'is-zero': board.isZeroCost(row, board.groupChartType) }">{{ board.money(row.cost) }}</span>
            </template>
            <template #col-percent="{ row }">
              <div class="tg-pct">
                <span class="tg-pct-track">
                  <i class="tg-pct-fill"
                    :style="{ width: board.barWidth(board.percentNum(row, board.groupDist, board.groupChartType)), background: board.boardColorOf(board.groupBoard, row.name) }" />
                </span>
                <span class="tg-pct-text">{{ board.percent(row, board.groupDist, board.groupChartType) }}</span>
              </div>
            </template>
          </ReTable>
        </div>
      </section>
    </div>

    <!-- ── 航迹下探：Top5 排行（模型 / 应用）── -->
    <div class="tg-tracks">
      <section class="tg-track">
        <header class="tg-track-head">
          <h3 class="tg-track-title">模型排行 Top5</h3>
          <div class="tg-tabs" role="tablist">
            <button v-for="t in board.boardTabs" :key="t.key" type="button" class="tg-tab"
              role="tab" :class="{ active: board.rankMetric === t.key }"
              :aria-selected="board.rankMetric === t.key" @click="board.rankMetric = t.key">{{ t.label }}</button>
          </div>
        </header>
        <ol class="tg-track-list">
          <li v-for="(r, i) in board.modelRankTop5" :key="r.name" class="tg-track-item">
            <span class="tg-rank-no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span class="tg-rank-name" :title="r.name">{{ r.name }}</span>
            <span class="tg-rank-bar">
              <span class="tg-rank-fill" :style="{ width: board.rankBarWidth(r, board.modelRankTop5) }" />
            </span>
            <span class="tg-rank-value">{{ board.rankValue(r) }}</span>
            <span class="tg-rank-pct">{{ board.rankPct(r, board.modelRankTop5) }}</span>
          </li>
        </ol>
        <div v-if="board.modelRankTop5.length === 0" class="tg-track-empty">
          <el-empty description="暂无模型用量" :image-size="48" />
        </div>
      </section>

      <section class="tg-track">
        <header class="tg-track-head">
          <h3 class="tg-track-title">应用排行 Top5</h3>
          <div class="tg-tabs" role="tablist">
            <button v-for="t in board.boardTabs" :key="t.key" type="button" class="tg-tab"
              role="tab" :class="{ active: board.rankMetric === t.key }"
              :aria-selected="board.rankMetric === t.key" @click="board.rankMetric = t.key">{{ t.label }}</button>
          </div>
        </header>
        <ol class="tg-track-list">
          <li v-for="(r, i) in board.appRankTop5" :key="r.name" class="tg-track-item">
            <span class="tg-rank-no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span class="tg-rank-name" :title="r.name">{{ board.appLabel(r.name) }}</span>
            <span class="tg-rank-bar">
              <span class="tg-rank-fill" :style="{ width: board.rankBarWidth(r, board.appRankTop5) }" />
            </span>
            <span class="tg-rank-value">{{ board.rankValue(r) }}</span>
            <span class="tg-rank-pct">{{ board.rankPct(r, board.appRankTop5) }}</span>
          </li>
        </ol>
        <div v-if="board.appRankTop5.length === 0" class="tg-track-empty">
          <el-empty description="暂无应用用量" :image-size="48" />
        </div>
      </section>
    </div>

    <!-- ── 单日流量剖面：每日模型用量堆叠柱 ── -->
    <section class="tg-profile">
      <header class="tg-track-head">
        <h3 class="tg-track-title">每日模型用量</h3>
        <div class="tg-tabs" role="tablist">
          <button v-for="t in board.boardTabs" :key="t.key" type="button" class="tg-tab"
            role="tab" :class="{ active: board.modelBarMetric === t.key }"
            :aria-selected="board.modelBarMetric === t.key" @click="board.modelBarMetric = t.key">{{ t.label }}</button>
        </div>
      </header>
      <div class="tg-profile-body">
        <ReEcharts v-if="board.modelBarDates.length > 0" :option="board.modelBarOption" height="340px" not-merge />
        <div v-else class="tg-chart-empty"><el-empty description="暂无按天模型用量数据" :image-size="64" /></div>
      </div>
    </section>

    <!-- ── 告警灯窗：Token 趋势 + 模型延迟 ── -->
    <div class="tg-windows">
      <section class="tg-window">
        <header class="tg-track-head">
          <h3 class="tg-track-title">Token 趋势</h3>
        </header>
        <div class="tg-window-body">
          <ReEcharts :option="board.trendOption" height="300px" not-merge v-if="board.trendData.length > 0" />
          <div v-else class="tg-chart-empty"><el-empty description="暂无趋势数据" :image-size="64" /></div>
        </div>
      </section>
      <section class="tg-window">
        <header class="tg-track-head">
          <h3 class="tg-track-title">模型延迟</h3>
        </header>
        <div class="tg-window-body">
          <ReEcharts :option="board.latencyOption" height="300px" not-merge v-if="board.latencyDates.length && board.latencyModelCount > 0" />
          <div v-else class="tg-chart-empty"><el-empty description="暂无延迟数据" :image-size="64" /></div>
        </div>
      </section>
    </div>

    <!-- ── 黑匣子：用量明细 ── -->
    <UsageDetailTable :board="board" />
  </div>
</template>

<script setup lang="ts">
/**
 * 变体 A · 航站楼（Terminal）—— 用量管理 UI 重构探索。
 *
 * <p>所有业务逻辑来自共享 {@link useUsageBoard}（SSE 实时 / 数据加载 / 图表 /
 * 明细分页 / 格式化 / 单位设置），本文件只负责版面与视觉。</p>
 */
import { reactive } from 'vue';
import ReEcharts from '@repo/ui/re-echarts';
import ReTable from '@/components/re/ReTable.vue';
import { useUsageBoard } from '@/composables/useUsageBoard';
import UsagePageHead from './UsagePageHead.vue';
import UsageDetailTable from './UsageDetailTable.vue';

const board = reactive(useUsageBoard());
</script>

<style scoped>
/* ============================================================================
   变体 A · 航站楼 —— 视觉体系
   基调：深色驾驶舱 + 等宽码表数字 + 雷达绿/警示橙的状态光。
   全部走 --el-* / --u-* 令牌；暗色模式自动跟随（预计以暗色为主打）。
   ============================================================================ */
.tg-page {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 22px;
}
.tg-page > * { flex-shrink: 0; }

/* 航行情报条：页头照用共享组件，底部压一条雷达分割线 */
.tg-runway { position: relative; }
.tg-runway::after {
  content: '';
  display: block;
  height: 1px;
  margin-top: 10px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--u-primary) 45%, transparent), transparent);
}

/* ── 引擎驾驶舱：四台发动机状态表 ── */
.tg-deck {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.tg-engine {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--u-radius, 8px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease, transform var(--el-transition-duration-fast, 0.2s) ease, box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.tg-engine:hover {
  border-color: color-mix(in srgb, var(--u-primary) 45%, transparent);
  box-shadow: var(--u-hover-lift, 0 6px 18px rgba(15, 23, 42, 0.09));
  transform: translateY(-1px);
}
/* 左上角小角标：模拟发动机编号铭牌 */
.tg-engine::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 26px; height: 3px;
  border-radius: 0 0 4px 0;
  background: var(--u-primary);
}
.tg-eng-head { display: flex; align-items: center; gap: 8px; }
.tg-eng-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  border-radius: 7px;
  color: #fff;
  background: linear-gradient(135deg, var(--u-primary) 0%, color-mix(in srgb, var(--u-primary) 72%, #fff) 100%);
}
.tg-eng-icon svg { width: 15px; height: 15px; }
.tg-eng-icon.is-success { background: linear-gradient(135deg, var(--u-success) 0%, color-mix(in srgb, var(--u-success) 72%, #fff) 100%); }
.tg-eng-icon.is-warning { background: linear-gradient(135deg, var(--u-warning) 0%, color-mix(in srgb, var(--u-warning) 72%, #fff) 100%); }
.tg-eng-label { font-size: 12px; font-weight: 500; color: var(--el-text-color-secondary); }
.tg-eng-value-row { display: flex; align-items: baseline; gap: 5px; }
.tg-eng-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
.tg-eng-unit { font-size: 12px; font-weight: 500; color: var(--el-text-color-placeholder); }
.tg-eng-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.tg-eng-sub-item b { font-weight: 600; color: var(--el-text-color-regular); }
.tg-eng-ring { position: absolute; right: 12px; bottom: 10px; pointer-events: none; }

/* ── 仪表盘：双转速表 ── */
.tg-gauges {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}
.tg-gauge {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--u-radius, 8px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}
.tg-gauge-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
}
.tg-gauge-title, .tg-track-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.tg-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.tg-tab {
  appearance: none; border: 0; cursor: pointer;
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  background: transparent;
  transition: color var(--el-transition-duration-fast, 0.2s) ease, background-color var(--el-transition-duration-fast, 0.2s) ease, box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.tg-tab:hover { color: var(--u-primary); }
.tg-tab.active {
  background: var(--el-bg-color);
  color: var(--u-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 9%, transparent);
}

.tg-gauge-body {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 0 16px 12px;
}
.tg-dial { position: relative; width: 168px; height: 168px; }
.tg-dial-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  pointer-events: none;
  text-align: center;
  padding: 0 20px;
}
.tg-dial-pct {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
.tg-dial-name {
  max-width: 100%;
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tg-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  max-height: 168px;
  overflow-y: auto;
}
.tg-legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 3px 4px;
  border-radius: 6px;
  font-size: 12px;
  min-width: 0;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.tg-legend-item:hover { background: var(--el-fill-color-light); }
.tg-legend-item.is-top .tg-legend-name { font-weight: 600; color: var(--el-text-color-primary); }
.tg-legend-item.is-hover { background: color-mix(in srgb, var(--u-primary) 8%, transparent); }
.tg-legend-item.is-hover .tg-legend-name { color: var(--u-primary); font-weight: 600; }
.tg-legend-item.is-other .tg-legend-name, .tg-legend-item.is-other .tg-legend-pct { color: var(--el-text-color-placeholder); }
.tg-legend-dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 2px; }
.tg-legend-name {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tg-legend-pct {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.tg-legend-empty { padding: 4px 0; }
.tg-legend-empty :deep(.el-empty) { padding: 8px 0; }
.tg-legend-empty :deep(.el-empty__description) { margin-top: 2px; font-size: 12px; }
.tg-legend-empty :deep(.el-empty__description p) { margin: 0; color: var(--el-text-color-placeholder); }

.tg-gauge-table { padding: 0 6px 8px; }
.tg-gauge-table :deep(.re-table-wrapper) { border-radius: 0; }
.tg-gauge-table :deep(.vxe-table--border-line),
.tg-gauge-table :deep(.vxe-table--render-default) { border: 0; }
.tg-gauge-table :deep(.vxe-table--header-wrapper) { background: transparent; }
.tg-gauge-table :deep(.vxe-header--column) {
  background: transparent;
  color: var(--el-text-color-regular);
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.tg-gauge-table :deep(.vxe-body--column) { border-bottom: 1px solid var(--el-border-color-lighter); }
.tg-gauge-table :deep(.vxe-body--row:last-child .vxe-body--column) { border-bottom: 0; }
.tg-gauge-table :deep(.re-table--compact .vxe-body--column) { padding-top: 4px !important; padding-bottom: 4px !important; }
.tg-gauge-table :deep(.vxe-body--column .vxe-cell) { line-height: 1.4; }
.tg-gauge-table :deep(.vxe-header--column) { padding-top: 2px !important; padding-bottom: 2px !important; }
.tg-gauge-table :deep(.vxe-body--row.row--hover),
.tg-gauge-table :deep(.vxe-body--row:hover) { background: color-mix(in srgb, var(--u-primary) 5%, transparent); }

.tg-name-cell { display: flex; align-items: center; gap: 7px; min-width: 0; }
.tg-name-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
.tg-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-size: 12.5px;
}
.tg-num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1; font-size: 12.5px; color: var(--el-text-color-primary); }
.tg-name-cell.is-zero .tg-name-text, .tg-num.is-zero { color: var(--el-text-color-placeholder); }
.tg-pct { display: flex; align-items: center; gap: 8px; }
.tg-pct-track { flex: 1 1 auto; min-width: 30px; height: 5px; border-radius: 999px; background: var(--el-fill-color); overflow: hidden; }
.tg-pct-fill { display: block; height: 100%; border-radius: 999px; transition: width 0.35s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)); }
.tg-pct-text { flex: 0 0 auto; min-width: 42px; text-align: right; font-size: 12px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }

/* ── 航迹下探：Top5 ── */
.tg-tracks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
}
.tg-track, .tg-profile, .tg-window {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--u-radius, 8px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}
.tg-track-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
}
.tg-track-list {
  list-style: none;
  margin: 0;
  padding: 2px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tg-track-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.tg-rank-no {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.tg-rank-no.is-1 { color: #fff; background: #e6a23c; }
.tg-rank-no.is-2 { color: #fff; background: #909399; }
.tg-rank-no.is-3 { color: #fff; background: #b5a08a; }
.tg-rank-name { flex: 0 0 30%; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tg-rank-bar { flex: 1 1 auto; min-width: 40px; height: 6px; border-radius: 999px; background: var(--el-fill-color-light); overflow: hidden; }
.tg-rank-fill { display: block; height: 100%; border-radius: 999px; background: var(--u-primary); transition: width 0.25s ease; }
.tg-rank-value { flex: 0 0 auto; min-width: 78px; text-align: right; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); }
.tg-rank-pct { flex: 0 0 auto; min-width: 48px; text-align: right; font-variant-numeric: tabular-nums; color: var(--el-text-color-secondary); }
.tg-track-empty { padding: 0 16px 14px; }

/* ── 单日流量剖面 ── */
.tg-profile-body, .tg-window-body { padding: 0 12px 14px; }
.tg-chart-empty { display: flex; align-items: center; justify-content: center; min-height: 220px; }

/* ── 告警灯窗 ── */
.tg-windows {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
}

/* ── 响应式 ── */
@media (max-width: 1280px) {
  .tg-deck { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1100px) {
  .tg-gauges, .tg-tracks, .tg-windows { grid-template-columns: minmax(0, 1fr); }
  .tg-gauge-body { grid-template-columns: 160px minmax(0, 1fr); }
  .tg-dial { width: 160px; height: 160px; }
}
@media (max-width: 760px) {
  .tg-page { padding: 14px; gap: 12px; }
  .tg-deck { grid-template-columns: minmax(0, 1fr); }
  .tg-gauge-body { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .tg-legend { width: 100%; max-height: none; }
}

@media (prefers-reduced-motion: reduce) {
  .tg-engine, .tg-tab, .tg-legend-item, .tg-pct-fill { transition: none; animation: none; }
}
</style>