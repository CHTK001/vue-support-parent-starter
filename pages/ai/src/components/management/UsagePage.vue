<template>
  <!--
    用量管理 —— 构成优先的总览页

    <p>首屏回答的是「钱和 Token 到底堆在哪些模型上」：左侧是一块模型构成
    treemap（面积即用量），右侧是四张核心读数格；实时状态与今日/区间增量
    收进构成卡的页脚，不再单独占一块首屏版面。</p>

    <p>往下依次是模型/分组分布、Token 趋势、每日模型用量、模型延迟、
    模型与应用 Top5、完整用量明细，导出与刷新在顶栏。</p>

    <p>业务数据 100% 来自共享 {@link useUsageBoard}（SSE 实时 / 加载 / 图表 /
    明细 / 单位设置），本文件只负责版面与视觉；treemap 的切片直接复用
    {@code modelBoard.items}，颜色与占比和其他图表完全一致。</p>
  -->
  <div class="usage-page" data-page="usage">
    <!-- ── 顶栏：标题 + 实时胶囊 + 时间筛选 + 操作 ── -->
    <header class="usage-head usage-card">
      <div class="usage-head__lead">
        <h1 class="usage-title">用量管理</h1>
        <span class="usage-range">{{ board.rangeLabel }}</span>
      </div>

      <div class="usage-head__tools">
        <div class="usage-live" :class="`is-${board.liveState}`">
          <span class="usage-live__dot" />
          <span class="usage-live__label">{{ board.liveLabel }}</span>
          <span v-if="board.liveRate > 0" class="usage-live__rate">{{ board.fmtToken(board.liveRate) }}/分</span>
          <button
            type="button"
            class="usage-live__toggle"
            :title="board.liveEnabled ? '暂停实时刷新' : '恢复实时刷新'"
            :aria-label="board.liveEnabled ? '暂停实时刷新' : '恢复实时刷新'"
            @click="board.liveEnabled = !board.liveEnabled"
          >
            <svg v-if="board.liveEnabled" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="7" y="6" width="3.4" height="12" rx="1" />
              <rect x="13.6" y="6" width="3.4" height="12" rx="1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.6a1 1 0 0 1 1.53-.85l8.2 5.4a1 1 0 0 1 0 1.7l-8.2 5.4A1 1 0 0 1 8 18.4Z" />
            </svg>
          </button>
        </div>

        <div class="usage-seg" role="tablist" aria-label="时间范围">
          <button
            v-for="f in board.quickFilters"
            :key="f.key"
            type="button"
            role="tab"
            class="usage-seg__btn"
            :class="{ 'is-on': board.activeFilter === f.key }"
            :aria-selected="board.activeFilter === f.key"
            @click="board.setQuickFilter(f.key)"
          >
            {{ f.label }}
          </button>
        </div>

        <el-date-picker
          v-model="board.customRange"
          class="usage-date"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          @change="board.onCustomRange"
        />

        <el-button
          class="usage-icon"
          text
          circle
          :loading="board.exporting"
          title="导出当前区间用量"
          @click="board.handleExport"
        >
          <el-icon v-if="!board.exporting">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3.5v11M7.6 10.2 12 14.6l4.4-4.4M4.5 19.5h15" />
            </svg>
          </el-icon>
        </el-button>

        <el-button
          class="usage-icon"
          text
          circle
          :loading="board.refreshing"
          title="刷新数据"
          @click="board.refreshAll"
        >
          <el-icon v-if="!board.refreshing">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
            </svg>
          </el-icon>
        </el-button>
      </div>

      <span v-if="board.refreshing" class="usage-head__scan" aria-hidden="true" />
    </header>

    <!-- ── 首屏：左模型构成 treemap，右四张读数格 + 派生效率读数 ── -->
    <section class="usage-hero">
      <article class="usage-compo usage-card">
        <header class="usage-compo__head">
          <div>
            <h2 class="usage-compo__title">模型构成</h2>
            <p class="usage-compo__desc">面积 = 当前口径用量；悬停看精确值</p>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="构成口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.modelChartType === t.key }"
              :aria-selected="board.modelChartType === t.key"
              @click="board.modelChartType = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </header>

        <div class="usage-compo__chart">
          <ReEcharts v-if="treemapData.length" :option="treemapOption" height="320px" notMerge />
          <div v-else class="usage-empty"><el-empty description="暂无模型用量" :image-size="56" /></div>
        </div>

        <footer class="usage-compo__foot">
          <span>共 {{ treemapData.length }} 个模型 · {{ board.modelChartType === 'token' ? '按 Token 面积' : '按费用面积' }}</span>
          <span class="usage-compo__live">
            <i class="usage-compo__dot" :class="`is-${board.liveState}`" />
            今日 {{ board.fmtToken(board.liveTodayTokens) }}
            <span class="usage-compo__sep">/</span>
            区间 {{ board.fmtToken(board.liveRangeTokens) }}
            <span v-if="board.liveRate > 0" class="usage-compo__rate">+{{ board.fmtToken(board.liveRate) }}/分</span>
          </span>
        </footer>
      </article>

      <div class="usage-readouts">
        <div class="usage-kpis">
          <article
            v-for="card in readoutCards"
            :key="card.key"
            class="usage-kpi usage-card"
            :class="[`is-${card.tone}`, { 'usage-kpi--wide': card.wide }]"
          >
            <div class="usage-kpi__head">
              <i class="usage-kpi__mark" />
              <span class="usage-kpi__label">{{ card.label }}</span>
            </div>
            <div class="usage-kpi__value">
              {{ card.value }}<span v-if="card.unit" class="usage-kpi__unit">{{ card.unit }}</span>
            </div>
            <div class="usage-kpi__sub">
              <span v-for="s in card.sub" :key="s">{{ s }}</span>
            </div>
            <div v-if="card.key === 'token'" class="usage-kpi__ring">
              <ReEcharts :option="board.miniRingOption('input')" height="40px" width="60px" notMerge />
            </div>
          </article>
        </div>

        <!-- 派生效率读数：把「用了多少」翻译成「贵不贵」 -->
        <ul class="usage-deriv">
          <li
            v-for="d in derivedReadouts"
            :key="d.key"
            class="usage-deriv__item"
          >
            <span class="usage-deriv__label">{{ d.label }}</span>
            <span
              class="usage-deriv__value"
              :class="{ 'is-good': d.tone === 'good', 'is-warn': d.tone === 'warn' }"
            >{{ d.value }}</span>
            <span class="usage-deriv__hint">{{ d.hint }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── 模型 / 分组分布 ── -->
    <section class="usage-split">
      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div>
            <h2 class="usage-panel__title">模型分布</h2>
            <p class="usage-panel__desc">与上方构成图同口径；逐行可核对请求、Token、费用与占比</p>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="模型口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.modelChartType === t.key }"
              :aria-selected="board.modelChartType === t.key"
              @click="board.modelChartType = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </header>

        <div class="usage-panel__table">
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
              <div class="usage-name" :class="{ 'is-zero': board.isZeroCost(row, board.modelChartType) }">
                <i class="usage-name__dot" :style="{ background: board.boardColorOf(board.modelBoard, row.name) }" />
                <span class="usage-name__text" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
            <template #col-requests="{ row }">
              <span class="usage-num">{{ board.formatNumber(row.requests) }}</span>
            </template>
            <template #col-totalTokens="{ row }">
              <span class="usage-num">{{ board.fmtToken(row.totalTokens) }}</span>
            </template>
            <template #col-cost="{ row }">
              <span class="usage-num">{{ board.money(row.cost) }}</span>
            </template>
            <template #col-percent="{ row }">
              <div class="usage-pct">
                <span class="usage-pct__track">
                  <i
                    class="usage-pct__fill"
                    :style="{
                      width: board.barWidth(board.percentNum(row, board.modelDist, board.modelChartType)),
                      background: board.boardColorOf(board.modelBoard, row.name),
                    }"
                  />
                </span>
                <span class="usage-pct__text">{{ board.percent(row, board.modelDist, board.modelChartType) }}</span>
              </div>
            </template>
          </ReTable>
        </div>
      </article>

      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div>
            <h2 class="usage-panel__title">分组用量</h2>
            <p class="usage-panel__desc">哪个分组在烧钱</p>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="分组口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.groupChartType === t.key }"
              :aria-selected="board.groupChartType === t.key"
              @click="board.groupChartType = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </header>

        <div class="usage-panel__body">
          <div class="usage-dial">
            <ReEcharts
              :option="board.groupRingOption"
              height="164px"
              notMerge
              @mouseover="(p: any) => board.onRingHover('group', p)"
              @mouseout="() => board.onRingHover('group', null)"
              @globalout="() => board.onRingHover('group', null)"
            />
            <div class="usage-dial__center">
              <span class="usage-dial__pct">{{ board.ringTop(board.groupBoard, board.groupHover).pct }}</span>
              <span class="usage-dial__name" :title="board.ringTop(board.groupBoard, board.groupHover).name">
                {{ board.ringTop(board.groupBoard, board.groupHover).name }}
              </span>
            </div>
          </div>

          <ul class="usage-legend">
            <li
              v-for="it in board.groupBoard.slices"
              :key="it.name"
              class="usage-legend__item"
              :class="{ 'is-hover': board.groupHover?.name === it.name }"
              @mouseenter="board.onLegendHover('group', it)"
              @mouseleave="board.onLegendHover('group', null)"
            >
              <i class="usage-legend__dot" :style="{ background: it.color }" />
              <span class="usage-legend__name" :title="it.name">{{ it.name }}</span>
              <span class="usage-legend__pct">{{ it.pct.toFixed(1) }}%</span>
            </li>
            <li v-if="board.groupBoard.slices.length === 0" class="usage-legend__empty">
              <el-empty description="暂无数据" :image-size="36" />
            </li>
          </ul>
        </div>

        <div class="usage-panel__table">
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
              <div class="usage-name" :class="{ 'is-zero': board.isZeroCost(row, board.groupChartType) }">
                <i class="usage-name__dot" :style="{ background: board.boardColorOf(board.groupBoard, row.name) }" />
                <span class="usage-name__text" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
            <template #col-requests="{ row }">
              <span class="usage-num">{{ board.formatNumber(row.requests) }}</span>
            </template>
            <template #col-totalTokens="{ row }">
              <span class="usage-num">{{ board.fmtToken(row.totalTokens) }}</span>
            </template>
            <template #col-cost="{ row }">
              <span class="usage-num">{{ board.money(row.cost) }}</span>
            </template>
            <template #col-percent="{ row }">
              <div class="usage-pct">
                <span class="usage-pct__track">
                  <i
                    class="usage-pct__fill"
                    :style="{
                      width: board.barWidth(board.percentNum(row, board.groupDist, board.groupChartType)),
                      background: board.boardColorOf(board.groupBoard, row.name),
                    }"
                  />
                </span>
                <span class="usage-pct__text">{{ board.percent(row, board.groupDist, board.groupChartType) }}</span>
              </div>
            </template>
          </ReTable>
        </div>
      </article>
    </section>

    <!-- ── Token 趋势（通栏） ── -->
    <article class="usage-panel usage-card usage-full">
      <header class="usage-panel__head">
        <div>
          <h2 class="usage-panel__title">Token 趋势</h2>
          <p class="usage-panel__desc">输入 / 输出 / 缓存读取按日走势</p>
        </div>
      </header>
      <div class="usage-panel__chart">
        <ReEcharts v-if="board.trendData.length" :option="board.trendOption" height="288px" notMerge />
        <div v-else class="usage-empty"><el-empty description="暂无趋势数据" :image-size="56" /></div>
      </div>
    </article>

    <!-- ── 每日模型用量 + 模型延迟 ── -->
    <section class="usage-split usage-split--7-5">
      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div>
            <h2 class="usage-panel__title">每日模型用量</h2>
            <p class="usage-panel__desc">堆叠口径保留最活跃的 8 个模型</p>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="每日模型口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.modelBarMetric === t.key }"
              :aria-selected="board.modelBarMetric === t.key"
              @click="board.modelBarMetric = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </header>
        <div class="usage-panel__chart">
          <ReEcharts v-if="board.modelBarDates.length" :option="board.modelBarOption" height="292px" notMerge />
          <div v-else class="usage-empty"><el-empty description="暂无按天模型用量数据" :image-size="56" /></div>
        </div>
      </article>

      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div>
            <h2 class="usage-panel__title">模型延迟</h2>
            <p class="usage-panel__desc">首字延迟，跨模型可比</p>
          </div>
        </header>
        <div class="usage-panel__chart">
          <ReEcharts
            v-if="board.latencyDates.length && board.latencyModelCount > 0"
            :option="board.latencyOption"
            height="292px"
            notMerge
          />
          <div v-else class="usage-empty"><el-empty description="暂无延迟数据" :image-size="56" /></div>
        </div>
      </article>
    </section>

    <!-- ── 模型 / 应用排行 ── -->
    <section class="usage-ranks">
      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div>
            <h2 class="usage-panel__title">模型排行 Top5</h2>
            <p class="usage-panel__desc">按当前口径排序，条长相对榜首</p>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="排行口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.rankMetric === t.key }"
              :aria-selected="board.rankMetric === t.key"
              @click="board.rankMetric = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </header>
        <ol class="usage-ranks__list">
          <li v-for="(r, i) in board.modelRankTop5" :key="r.name" class="usage-rank">
            <span class="usage-rank__no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span class="usage-rank__name" :title="r.name">{{ r.name }}</span>
            <span class="usage-rank__bar">
              <i :style="{ width: board.rankBarWidth(r, board.modelRankTop5) }" />
            </span>
            <span class="usage-rank__value">{{ board.rankValue(r) }}</span>
            <span class="usage-rank__pct">{{ board.rankPct(r, board.modelRankTop5) }}</span>
          </li>
        </ol>
        <div v-if="board.modelRankTop5.length === 0" class="usage-ranks__empty">
          <el-empty description="暂无模型用量" :image-size="44" />
        </div>
      </article>

      <article class="usage-panel usage-card">
        <header class="usage-panel__head">
          <div>
            <h2 class="usage-panel__title">应用排行 Top5</h2>
            <p class="usage-panel__desc">按使用模型的软件归并</p>
          </div>
          <div class="usage-seg usage-seg--sm" role="tablist" aria-label="排行口径">
            <button
              v-for="t in board.boardTabs"
              :key="t.key"
              type="button"
              role="tab"
              class="usage-seg__btn"
              :class="{ 'is-on': board.rankMetric === t.key }"
              :aria-selected="board.rankMetric === t.key"
              @click="board.rankMetric = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </header>
        <ol class="usage-ranks__list">
          <li v-for="(r, i) in board.appRankTop5" :key="r.name" class="usage-rank">
            <span class="usage-rank__no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <span class="usage-rank__name" :title="board.appLabel(r.name)">{{ board.appLabel(r.name) }}</span>
            <span class="usage-rank__bar">
              <i :style="{ width: board.rankBarWidth(r, board.appRankTop5) }" />
            </span>
            <span class="usage-rank__value">{{ board.rankValue(r) }}</span>
            <span class="usage-rank__pct">{{ board.rankPct(r, board.appRankTop5) }}</span>
          </li>
        </ol>
        <div v-if="board.appRankTop5.length === 0" class="usage-ranks__empty">
          <el-empty description="暂无应用用量" :image-size="44" />
        </div>
      </article>
    </section>

    <!-- ── 明细（通栏） ── -->
    <div class="usage-detail">
      <UsageDetailTable :board="board" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用量管理 · 构成优先的总览页。
 *
 * <p>所有业务逻辑来自共享 {@link useUsageBoard}（SSE 实时 / 数据加载 / 图表 /
 * 明细分页 / 格式化 / 单位设置），本文件只负责版面与视觉。</p>
 *
 * <p>首屏构成图用 ECharts treemap 画：切片直接取 {@code modelBoard.items}，
 * 因此颜色、占比、排序与下方表格、环形图完全一致；占比不足 3% 的块不画标签，
 * 但面积和 tooltip 都保留，避免模型多时名字糊成一团。</p>
 */
import { computed, reactive } from 'vue'
import type { EChartsOption } from 'echarts'
import ReEcharts from '@repo/ui/re-echarts'
import ReTable from '@/components/ui/ReTable.vue'
import { useUsageBoard } from '@/composables/useUsageBoard'
import UsageDetailTable from './UsageDetailTable.vue'

const board = reactive(useUsageBoard())

/** 有效面积切片：0 值模型不进入 treemap（否则会生成不可见的碎块） */
const treemapData = computed(() =>
  board.modelBoard.items
    .filter((it) => Number(it.value) > 0)
    .map((it) => ({
      name: it.name,
      value: Number(it.value),
      pct: Number(it.pct),
      color: it.color,
    })),
)

/**
 * 模型构成面积图。
 *
 * <p>只画一层：模型 = 面积。标签只在占比 ≥ 3% 的块上出现；切换口径时颜色沿用
 * 看板调色板，和下方表格的色点一致，不会跳色。</p>
 */
const treemapOption = computed<EChartsOption>(() => {
  const total = treemapData.value.reduce((s, it) => s + it.value, 0)
  const metricText = (v: number) =>
    board.modelChartType === 'token' ? board.fmtToken(v) : `${board.currencySymbol}${board.money(v)}`
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#E5E6EB',
      borderWidth: 1,
      textStyle: { color: '#1D2129', fontSize: 12 },
      extraCssText: 'box-shadow:0 6px 20px rgba(15,23,42,.12);border-radius:8px;padding:8px 10px;',
      formatter: (p: any) => {
        const pct = total > 0 ? (Number(p.value) / total) * 100 : 0
        return `<span style="font-weight:600">${p.name}</span><br/><b>${metricText(Number(p.value))}</b>&nbsp;&nbsp;<span style="color:#86909C">${pct.toFixed(1)}%</span>`
      },
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        visibleMin: 10,
        itemStyle: {
          borderColor: 'rgba(255,255,255,0.22)',
          borderWidth: 1,
          gapWidth: 2,
          borderRadius: 6,
        },
        label: {
          show: true,
          formatter: (p: any) => {
            const pct = total > 0 ? (Number(p.value) / total) * 100 : 0
            if (pct < 3) return ''
            return `{n|${p.name}}\n{v|${metricText(Number(p.value))}}`
          },
          rich: {
            n: {
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 18,
              color: '#fff',
              textShadowColor: 'rgba(0,0,0,0.28)',
              textShadowBlur: 4,
              padding: [2, 2, 0, 2],
            },
            v: {
              fontSize: 11,
              lineHeight: 15,
              color: 'rgba(255,255,255,0.9)',
              textShadowColor: 'rgba(0,0,0,0.28)',
              textShadowBlur: 4,
            },
          },
        },
        upperLabel: { show: false },
        data: treemapData.value.map((it) => ({
          name: it.name,
          value: it.value,
          itemStyle: { color: it.color },
        })),
      },
    ],
  }
})

interface ReadoutCard {
  key: string
  label: string
  value: string
  unit: string
  sub: string[]
  tone: string
  wide?: boolean
}

/**
 * 首屏五张读数卡：共享的四张核心读数 + 一张「每千 Token 成本」。
 *
 * <p>这张卡由 {@code stats} 现算（{@code totalCost / totalTokens × 1000}），
 * 币种与单位设置跟随 {@code useUsageBoard}；空区间给「—」而不是 ¥0.00。
 * 它是派生读数，所以用中性色并横跨两列，和四张核心读数做出主次差别。</p>
 */
const readoutCards = computed<ReadoutCard[]>(() => {
  const tokens = Number(board.stats.totalTokens) || 0
  const cost = Number(board.stats.totalCost) || 0
  const perK = tokens > 0 ? (cost / tokens) * 1000 : null
  return [
    ...board.statCards,
    {
      key: 'cost-per-k',
      label: '每千 Token 成本',
      value: perK === null ? '—' : `${board.currencySymbol}${board.money(perK)}`,
      unit: '',
      sub: [
        perK === null
          ? '暂无消费'
          : `${board.currencySymbol}${board.money(cost)} / ${board.fmtToken(tokens)} tokens`,
      ],
      tone: 'neutral',
      wide: true,
    },
  ]
})

interface DerivedReadout {
  key: string
  label: string
  value: string
  hint: string
  tone?: 'good' | 'warn'
}

/**
 * 派生效率读数：把「用了多少」翻译成「贵不贵」。
 *
 * <p>每千 Token 成本已提成第 5 张 KPI 卡，这里只留剩下的三项；都由
 * {@code stats} 现算，不额外请求接口。分母为 0 时给「—」而不是 0% / 0 元
 * —— 空区间里 0 是个会骗人的读数。</p>
 */
const derivedReadouts = computed<DerivedReadout[]>(() => {
  const tokens = Number(board.stats.totalTokens) || 0
  const calls = Number(board.stats.totalCalls) || 0
  const cached = Number(board.stats.totalCachedTokens) || 0
  const cost = Number(board.stats.totalCost) || 0
  const standard = Number(board.stats.standardCost) || 0
  // 实际消费低于标准价即为节省，高于则是溢价
  const saving = standard - cost
  const cachePct = tokens > 0 ? (cached / tokens) * 100 : null
  const perReq = calls > 0 ? tokens / calls : null
  const savingPct = standard > 0 ? (Math.abs(saving) / standard) * 100 : null
  return [
    {
      key: 'cache',
      label: '缓存命中率',
      value: cachePct === null ? '—' : `${cachePct.toFixed(1)}%`,
      hint: cachePct === null ? '暂无 Token' : `读取 ${board.fmtToken(cached)}`,
    },
    {
      key: 'per-request',
      label: '每请求 Token',
      value: perReq === null ? '—' : board.fmtToken(Math.round(perReq)),
      hint: perReq === null ? '暂无请求' : `共 ${board.formatNumber(calls)} 次`,
    },
    {
      key: 'vs-standard',
      label: '相对标准价',
      value: standard <= 0
        ? '—'
        : `${saving >= 0 ? '省' : '超'} ${board.currencySymbol}${board.money(Math.abs(saving))}`,
      hint: savingPct === null
        ? '暂无标准价'
        : `${savingPct.toFixed(1)}% ${saving >= 0 ? '低于' : '高于'}标准`,
      tone: standard <= 0 ? undefined : saving >= 0 ? 'good' : 'warn',
    },
  ]
})
</script>

<style scoped>
/* ============================================================================
   用量管理 —— 视觉体系
   基调：沿用控制台既有的令牌与字号，只重排信息主次：
   首屏左侧是模型构成 treemap（面积 = 用量），右侧 2×2 读数格，
   其余图表退为支撑；实时读数收进构成卡页脚。
   记忆点：模型构成的面积图。
   ============================================================================ */
.usage-page {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px 28px;
  background: var(--el-bg-color-page, var(--u-page));
}

.usage-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--u-radius, 8px);
}

/* ── 顶栏 ── */
.usage-head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 18px;
  padding: 13px 16px;
  overflow: hidden;
  flex-shrink: 0;
}
.usage-head__lead { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.usage-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.usage-range { font-size: 12px; color: var(--el-text-color-placeholder); white-space: nowrap; }
.usage-head__tools { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }

.usage-head__scan {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--u-primary, #165dff), transparent);
  transform: translateX(-100%);
  animation: usage-scan 1.15s linear infinite;
}
@keyframes usage-scan {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

/* 实时状态胶囊 */
.usage-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 4px 0 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.usage-live__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--u-success, #00b42a);
}
.usage-live.is-connecting .usage-live__dot { background: var(--u-warning, #ff7d00); animation: usage-blink 1.1s ease-in-out infinite; }
.usage-live.is-paused .usage-live__dot { background: var(--el-text-color-placeholder); }
.usage-live.is-error .usage-live__dot { background: var(--u-danger, #f53f3f); }
.usage-live__label { white-space: nowrap; }
.usage-live__rate { color: var(--u-primary, #165dff); font-weight: 600; font-variant-numeric: tabular-nums; }
.usage-live__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.usage-live__toggle:hover { background: var(--el-fill-color); color: var(--u-primary, #165dff); }
.usage-live__toggle svg { width: 13px; height: 13px; }
@keyframes usage-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 分段控件 */
.usage-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.usage-seg__btn {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  background: transparent;
  transition: color 0.18s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)),
    background-color 0.18s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-seg__btn:hover { color: var(--u-primary, #165dff); }
.usage-seg__btn.is-on { background: var(--u-primary, #165dff); color: #fff; font-weight: 600; }
.usage-seg__btn.is-on:hover { color: #fff; }
.usage-seg--sm .usage-seg__btn { padding: 3px 9px; font-size: 11.5px; }

.usage-date { width: 236px; }
.usage-icon { color: var(--el-text-color-secondary); }
.usage-icon :deep(.el-icon) { font-size: 16px; }
.usage-icon svg { width: 16px; height: 16px; }

/* ── 首屏：模型构成图 + 读数格 ── */
.usage-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.42fr) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}

/* 模型构成：面积即用量，首屏只留这一个强视觉手段 */
.usage-compo {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  animation: usage-rise 0.45s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)) both;
}
.usage-compo__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 8px;
}
.usage-compo__title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
}
.usage-compo__desc {
  margin: 3px 0 0;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
}
.usage-compo__chart {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 12px;
}
.usage-compo__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 8px 16px 12px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

/* 实时读数收进页脚：保留今日/区间增量与速率，但不再占首屏版面 */
.usage-compo__live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.usage-compo__dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--u-success, #00b42a);
}
.usage-compo__dot.is-connecting { background: var(--u-warning, #ff7d00); animation: usage-blink 1.1s ease-in-out infinite; }
.usage-compo__dot.is-paused { background: var(--el-text-color-placeholder); }
.usage-compo__dot.is-error { background: var(--u-danger, #f53f3f); }
.usage-compo__sep { color: var(--el-border-color); }
.usage-compo__rate { color: var(--u-primary, #165dff); font-weight: 600; }

@keyframes usage-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 右侧读数区：2×2 KPI + 一行派生效率读数 */
.usage-readouts {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.usage-kpis {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  /* 前两行是四张核心卡（等高撑满），第三行是横跨两列的派生卡（按内容高） */
  grid-template-rows: repeat(2, minmax(0, 1fr)) auto;
  gap: 14px;
}
.usage-kpi {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 15px;
  overflow: hidden;
  animation: usage-rise 0.45s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)) both;
}
.usage-kpi:nth-child(2) { animation-delay: 0.04s; }
.usage-kpi:nth-child(3) { animation-delay: 0.08s; }
.usage-kpi:nth-child(4) { animation-delay: 0.12s; }
.usage-kpi:nth-child(5) { animation-delay: 0.16s; }
.usage-kpi.is-primary { --usage-tone: var(--u-primary, #165dff); }
.usage-kpi.is-info { --usage-tone: var(--status-info, #3b82f6); }
.usage-kpi.is-success { --usage-tone: var(--u-success, #00b42a); }
.usage-kpi.is-warning { --usage-tone: var(--u-warning, #ff7d00); }
.usage-kpi.is-neutral { --usage-tone: var(--el-text-color-placeholder); }
.usage-kpi__head { display: flex; align-items: center; gap: 7px; }
.usage-kpi__mark { width: 7px; height: 7px; flex-shrink: 0; border-radius: 2px; background: var(--usage-tone); }
.usage-kpi__label { font-size: 12px; font-weight: 500; color: var(--el-text-color-secondary); }
.usage-kpi__value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
.usage-kpi__unit { margin-left: 4px; font-size: 11px; font-weight: 500; color: var(--el-text-color-placeholder); }
.usage-kpi__sub {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.usage-kpi__ring { position: absolute; right: 10px; bottom: 8px; pointer-events: none; opacity: 0.9; }

/* 第 5 张派生卡：横跨两列，标签左、读数右、注解整行，不占一整格高度 */
.usage-kpi--wide {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: 12px;
  row-gap: 3px;
  padding: 11px 15px 12px;
}
.usage-kpi--wide .usage-kpi__value { justify-self: end; font-size: 22px; }
.usage-kpi--wide .usage-kpi__sub {
  grid-column: 1 / -1;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 2px 10px;
}

/* 派生读数：一行三条，安静的一体条带，不抢 KPI 的主次 */
.usage-deriv {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 4px 14px;
  margin: 0;
  padding: 11px 15px 12px;
  list-style: none;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--u-radius, 10px);
  background: var(--el-fill-color-lighter, rgba(247, 248, 250, 0.9));
}
.usage-deriv__item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.usage-deriv__label {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.usage-deriv__value {
  font-size: 15px;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.usage-deriv__value.is-good { color: var(--u-success, #00b42a); }
.usage-deriv__value.is-warn { color: var(--u-warning, #ff7d00); }
.usage-deriv__hint {
  font-size: 10.5px;
  line-height: 1.45;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 面板 ── */
/* align-items: start：左侧「模型分布」只剩表格，不再被右侧环形卡拉高留白 */
.usage-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
.usage-split--7-5 { grid-template-columns: minmax(0, 1.34fr) minmax(0, 1fr); }
.usage-panel { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.usage-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 10px;
}
.usage-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
}
.usage-panel__desc {
  margin: 3px 0 0;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
}
.usage-panel__body {
  display: grid;
  grid-template-columns: 164px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 0 16px 10px;
}
.usage-dial { position: relative; width: 164px; height: 164px; }
.usage-dial__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 0 22px;
  text-align: center;
  pointer-events: none;
}
.usage-dial__pct {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.usage-dial__name {
  max-width: 100%;
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  max-height: 164px;
  overflow-y: auto;
}
.usage-legend__item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 3px 4px;
  border-radius: 6px;
  font-size: 12px;
  min-width: 0;
  transition: background-color 0.18s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
}
.usage-legend__item:hover { background: var(--el-fill-color-light); }
.usage-legend__item.is-hover { background: var(--u-primary-weak, rgba(22, 93, 255, 0.08)); }
.usage-legend__item.is-hover .usage-legend__name { color: var(--u-primary, #165dff); font-weight: 600; }
.usage-legend__dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 2px; }
.usage-legend__name {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.usage-legend__pct { flex: 0 0 auto; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; font-weight: 500; }
.usage-legend__empty { padding: 4px 0; }
.usage-legend__empty :deep(.el-empty) { padding: 8px 0; }
.usage-legend__empty :deep(.el-empty__description p) { margin: 0; font-size: 12px; color: var(--el-text-color-placeholder); }

/* 面板内表格 */
.usage-panel__table { padding: 0 6px 8px; min-width: 0; }
.usage-panel__table :deep(.re-table-wrapper) { border-radius: 0; }
.usage-panel__table :deep(.vxe-table--border-line),
.usage-panel__table :deep(.vxe-table--render-default) { border: 0; }
.usage-panel__table :deep(.vxe-table--header-wrapper) { background: transparent; }
.usage-panel__table :deep(.vxe-header--column) {
  background: transparent;
  color: var(--el-text-color-regular);
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
.usage-panel__table :deep(.vxe-body--column) { border-bottom: 1px solid var(--el-border-color-lighter); }
.usage-panel__table :deep(.vxe-body--row:last-child .vxe-body--column) { border-bottom: 0; }
.usage-panel__table :deep(.re-table--compact .vxe-body--column) { padding-top: 4px !important; padding-bottom: 4px !important; }
.usage-panel__table :deep(.vxe-body--column .vxe-cell) { line-height: 1.4; }
.usage-panel__table :deep(.vxe-body--row.row--hover),
.usage-panel__table :deep(.vxe-body--row:hover) { background: color-mix(in srgb, var(--u-primary, #165dff) 5%, transparent); }

.usage-name { display: flex; align-items: center; gap: 7px; min-width: 0; }
.usage-name__dot { width: 7px; height: 7px; flex-shrink: 0; border-radius: 2px; }
.usage-name__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-size: 12.5px;
}
.usage-num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1; font-size: 12.5px; color: var(--el-text-color-primary); }
.usage-name.is-zero .usage-name__text,
.usage-num.is-zero { color: var(--el-text-color-placeholder); }
.usage-pct { display: flex; align-items: center; gap: 8px; }
.usage-pct__track { flex: 1 1 auto; min-width: 30px; height: 5px; border-radius: 999px; background: var(--el-fill-color); overflow: hidden; }
.usage-pct__fill { display: block; height: 100%; border-radius: 999px; transition: width 0.35s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)); }
.usage-pct__text { flex: 0 0 auto; min-width: 42px; text-align: right; font-size: 12px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }

.usage-panel__chart { padding: 0 12px 12px; min-width: 0; }
.usage-empty { display: flex; align-items: center; justify-content: center; min-height: 200px; }

/* ── 排行 ── */
.usage-ranks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.usage-ranks__list {
  list-style: none;
  margin: 0;
  padding: 2px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.usage-rank { display: flex; align-items: center; gap: 10px; font-size: 12.5px; }
.usage-rank__no {
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
.usage-rank__no.is-1 { color: #fff; background: #e6a23c; }
.usage-rank__no.is-2 { color: #fff; background: #909399; }
.usage-rank__no.is-3 { color: #fff; background: #b5a08a; }
.usage-rank__name { flex: 0 0 30%; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-text-color-primary); }
.usage-rank__bar { flex: 1 1 auto; min-width: 40px; height: 6px; border-radius: 999px; background: var(--el-fill-color-light); overflow: hidden; }
.usage-rank__bar > i { display: block; height: 100%; border-radius: 999px; background: var(--u-primary, #165dff); transition: width 0.25s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1)); }
.usage-rank__value { flex: 0 0 auto; min-width: 66px; text-align: right; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); }
.usage-rank__pct { flex: 0 0 auto; min-width: 46px; text-align: right; font-variant-numeric: tabular-nums; color: var(--el-text-color-secondary); }
.usage-ranks__empty { padding: 0 16px 12px; }

.usage-full { min-width: 0; }
.usage-detail { min-width: 0; }

/* ── 响应式 ── */
@media (max-width: 1180px) {
  .usage-hero { grid-template-columns: minmax(0, 1fr); }
  .usage-split--7-5 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 900px) {
  .usage-split,
  .usage-ranks { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 760px) {
  .usage-page { padding: 12px 14px 22px; gap: 12px; }
  .usage-head__tools { width: 100%; }
  .usage-date { width: 100%; }
  .usage-kpis { grid-template-columns: minmax(0, 1fr); }
  .usage-panel__body { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .usage-legend { width: 100%; max-height: none; }
  .usage-rank__name { flex: 0 0 34%; }
}

@media (prefers-reduced-motion: reduce) {
  .usage-compo,
  .usage-kpi { animation: none; }
  .usage-head__scan,
  .usage-live__dot,
  .usage-compo__dot { animation: none; }
  .usage-seg__btn,
  .usage-rank__bar > i,
  .usage-pct__fill { transition: none; }
}
</style>
