<template>
  <section class="spider-overview">
    <!-- Background layers -->
    <div class="spider-overview__bg">
      <div class="spider-overview__grid" />
      <div class="spider-overview__scanline" />
      <div class="spider-overview__particles" />
      <div class="spider-overview__glow spider-overview__glow--cyan" />
      <div class="spider-overview__glow spider-overview__glow--blue" />
      <div class="spider-overview__glow spider-overview__glow--purple" />
    </div>

    <div class="spider-overview__content">
      <!-- Header -->
      <header class="spider-overview__header">
        <div class="spider-overview__header-left">
          <div class="spider-overview__title-badge">
            <span class="spider-overview__badge-dot" />
            DASHBOARD
          </div>
          <h1 class="spider-overview__title">
            <span class="spider-overview__title-gradient">总览仪表盘</span>
          </h1>
          <p class="spider-overview__subtitle">Spider Dashboard · 实时监控爬虫集群运行状态</p>
        </div>
        <div class="spider-overview__header-right">
          <span class="spider-overview__live-indicator" :class="{ 'is-active': !loading }">
            <span class="spider-overview__live-dot" />
            <span class="spider-overview__live-text">{{ loading ? '同步中' : 'LIVE' }}</span>
          </span>
          <button type="button" class="spider-overview__refresh-btn" :class="{ 'is-spinning': loading }" @click="loadSummary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </header>
      <div class="spider-overview__header-accent" />

      <!-- Stats Cards -->
      <div class="spider-overview__stats">
        <article
          v-for="(item, idx) in stats"
          :key="item.label"
          class="stat-card"
          :style="{ '--idx': idx, '--accent': item.accent }"
        >
          <div class="stat-card__glow" />
          <div class="stat-card__deco" />
          <div class="stat-card__icon">
            <span v-html="item.icon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ item.label }}</span>
            <div class="stat-card__value-row">
              <strong class="stat-card__value">{{ item.display }}</strong>
            </div>
          </div>
          <div class="stat-card__footer">
            <span class="stat-card__trend">{{ item.trend }}</span>
          </div>
          <div class="stat-card__bar">
            <div class="stat-card__bar-fill" :style="{ width: item.pct + '%' }" />
          </div>
        </article>
      </div>

      <!-- Main 2-col -->
      <div class="spider-overview__main">
        <!-- Trend Chart -->
        <article class="glass-card glass-card--trend">
          <div class="glass-card__accent-bar" />
          <div class="glass-card__border" />
          <div class="glass-card__inner">
            <div class="glass-card__head">
              <div class="glass-card__title-group">
                <div class="glass-card__title-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                  趋势分析
                </div>
                <span class="glass-card__desc">最近 7 天解析与结果数据</span>
              </div>
              <div class="glass-card__tabs">
                <button v-for="item in trendTabs" :key="item.value" type="button" :class="{ 'is-active': trendTab === item.value }" @click="trendTab = item.value">{{ item.label }}</button>
              </div>
            </div>
            <div v-if="trendPoints.length" class="trend-body">
              <ScEcharts v-if="trendTab !== 'table'" :option="trendChartOption" height="260px" />
              <div v-else class="trend-table">
                <table>
                  <thead><tr><th>日期</th><th>解析</th><th>结果</th></tr></thead>
                  <tbody><tr v-for="point in trendPoints" :key="point.spiderDateLabel"><td>{{ point.spiderDateLabel }}</td><td><span class="trend-badge trend-badge--parse">{{ point.spiderParseCount }}</span></td><td><span class="trend-badge trend-badge--result">{{ point.spiderResultCount }}</span></td></tr></tbody>
                </table>
              </div>
            </div>
            <div v-else class="glass-card__empty">{{ loading ? '加载中...' : '暂无趋势数据' }}</div>
          </div>
        </article>

        <!-- Site Portrait -->
        <article class="glass-card glass-card--portrait">
          <div class="glass-card__accent-bar" />
          <div class="glass-card__border" />
          <div class="glass-card__inner">
            <div class="glass-card__head">
              <div class="glass-card__title-group">
                <div class="glass-card__title-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  站点画像
                </div>
                <span class="glass-card__desc">{{ sitePortraits.length }} 个活跃站点</span>
              </div>
            </div>
            <div v-if="sitePortraits.length" class="site-portrait-list">
              <div v-for="item in sitePortraits" :key="item.siteHost" class="site-portrait-card">
                <div class="site-portrait-card__top">
                  <div class="site-portrait-card__host">
                    <span class="site-portrait-card__favicon">{{ item.siteHost.charAt(0).toUpperCase() }}</span>
                    <div>
                      <strong>{{ item.siteHost }}</strong>
                      <span class="site-portrait-card__status">
                        <span class="status-pulse" :class="item.spiderRunningCount > 0 ? 'is-running' : ''" />
                        {{ item.spiderRunningCount > 0 ? '运行中' : '待机' }}
                      </span>
                    </div>
                  </div>
                  <div v-if="item.spiderWarningCount > 0" class="site-portrait-card__alert">告警 {{ item.spiderWarningCount }}</div>
                </div>
                <div class="site-portrait-card__metrics">
                  <div class="s-metric"><span class="s-metric__v">{{ item.spiderUrlCount }}</span><span class="s-metric__l">地址</span></div>
                  <div class="s-metric"><span class="s-metric__v">{{ item.spiderResultCount }}</span><span class="s-metric__l">结果</span></div>
                  <div class="s-metric"><span class="s-metric__v">{{ item.spiderRunningCount }}</span><span class="s-metric__l">运行</span></div>
                </div>
                <div class="site-portrait-card__progress">
                  <div class="site-portrait-card__progress-bar" :style="{ width: Math.min(100, item.spiderResultCount / (item.spiderUrlCount || 1) * 100) + '%' }" />
                </div>
              </div>
            </div>
            <div v-else class="glass-card__empty">{{ loading ? '加载中...' : '暂无站点数据' }}</div>
          </div>
        </article>
      </div>

      <!-- Status Bar -->
      <article class="glass-card glass-card--status">
        <div class="glass-card__accent-bar" />
        <div class="glass-card__border" />
        <div class="glass-card__inner">
          <div class="glass-card__head">
            <div class="glass-card__title-group">
              <div class="glass-card__title-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                运行状态
              </div>
              <span class="glass-card__desc">系统概览</span>
            </div>
          </div>
          <div class="status-metrics">
            <div v-for="s in statusMetrics" :key="s.label" class="s-item" :style="{'--c': s.color}">
              <div class="s-item__icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path :d="s.iconPath"/></svg></div>
              <div class="s-item__body">
                <span class="s-item__label">{{ s.label }}</span>
                <strong class="s-item__value">{{ s.value }}</strong>
              </div>
              <div class="s-item__bar">
                <div class="s-item__bar-fill" :style="{ width: s.pct + '%' }" />
              </div>
            </div>
          </div>
          <p v-if="errorMessage" class="glass-card__error">{{ errorMessage }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive, watch } from "vue";
import * as echarts from "echarts";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import { loadSpiderDashboardSummary } from "../../../api/spider";
import type { SpiderDashboardSummary } from "../../../types/orchestration";

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

type TrendTab = "line" | "bar" | "table";

interface StatItem {
  label: string; display: string; icon: string; accent: string; trend: string; pct: number;
}

interface StatusItem {
  label: string; value: number; color: string; iconPath: string; pct: number;
}

const trendTabs: Array<{ value: TrendTab; label: string }> = [
  { value: "line", label: "折线" },
  { value: "bar", label: "柱状" },
  { value: "table", label: "表格" },
];

const loading = ref(false);
const errorMessage = ref("");
const trendTab = ref<TrendTab>("line");
const summary = ref<SpiderDashboardSummary>({
  spiderTotalCount: 0, spiderRunningCount: 0, spiderUrlCount: 0,
  spiderParsedUrlCount: 0, spiderResultCount: 0, spiderRemainingUrlCount: 0,
  spiderSitePortraits: [], spiderTimeTrends: [],
});

const safe = (v: number | undefined | null) => Math.max(0, v ?? 0);

// ── Counter animation ──
const animVal = reactive({
  total: 0, urls: 0, parsed: 0, result: 0, pending: 0, running: 0,
});

function animateTo(target: typeof animVal) {
  const start = { ...animVal };
  const dur = 700;
  const t0 = performance.now();
  const next = () => {
    const p = Math.min((performance.now() - t0) / dur, 1);
    const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    (Object.keys(target) as (keyof typeof animVal)[]).forEach(k => {
      animVal[k] = Math.round(start[k] + (target[k] - start[k]) * e);
    });
    if (p < 1) requestAnimationFrame(next);
  };
  requestAnimationFrame(next);
}

watch(summary, (s) => {
  animateTo({
    total: safe(s.spiderTotalCount),
    urls: safe(s.spiderUrlCount),
    parsed: safe(s.spiderParsedUrlCount),
    result: safe(s.spiderResultCount),
    pending: safe(s.spiderRemainingUrlCount),
    running: safe(s.spiderRunningCount),
  });
}, { immediate: true });

const total = computed(() => safe(summary.value.spiderTotalCount));

const maxStat = computed(() => Math.max(
  safe(summary.value.spiderTotalCount),
  safe(summary.value.spiderUrlCount),
  safe(summary.value.spiderParsedUrlCount),
  safe(summary.value.spiderResultCount),
  safe(summary.value.spiderRemainingUrlCount),
  1,
));

const stats = computed<StatItem[]>(() => {
  const s = summary.value;
  const p = (v: number) => Math.round((v / maxStat.value) * 100);
  return [
    { label: "爬虫总数", display: `${animVal.total}`, icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></svg>', accent: "var(--el-color-info)", trend: `运行 ${animVal.running}`, pct: p(safe(s.spiderTotalCount)) },
    { label: "地址总量", display: `${animVal.urls}`, icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', accent: "var(--el-color-info)", trend: "累计入队", pct: p(safe(s.spiderUrlCount)) },
    { label: "解析完成", display: `${animVal.parsed}`, icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>', accent: "var(--el-color-info)", trend: "已解析 URL", pct: p(safe(s.spiderParsedUrlCount)) },
    { label: "解析结果", display: `${animVal.result}`, icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', accent: "var(--el-color-success)", trend: "中间表累计", pct: p(safe(s.spiderResultCount)) },
    { label: "待处理", display: `${animVal.pending}`, icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', accent: "var(--el-color-warning)", trend: "待处理地址", pct: p(safe(s.spiderRemainingUrlCount)) },
  ];
});

const maxStatus = computed(() => Math.max(
  safe(summary.value.spiderRunningCount),
  safe(summary.value.spiderRemainingUrlCount),
  safe(summary.value.spiderParsedUrlCount),
  safe(summary.value.spiderResultCount),
  1,
));

const statusMetrics = computed<StatusItem[]>(() => {
  const s = summary.value;
  const p = (v: number) => Math.round((v / maxStatus.value) * 100);
  return [
    { label: "运行中爬虫", value: animVal.running, color: "var(--el-color-success)", iconPath: "M5 3l14 9-14 9V3z", pct: p(safe(s.spiderRunningCount)) },
    { label: "待处理地址", value: animVal.pending, color: "var(--el-color-warning)", iconPath: "M12 2v20M2 12h20", pct: p(safe(s.spiderRemainingUrlCount)) },
    { label: "已解析地址", value: animVal.parsed, color: "var(--el-color-info)", iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", pct: p(safe(s.spiderParsedUrlCount)) },
    { label: "解析结果", value: animVal.result, color: "var(--el-color-primary)", iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", pct: p(safe(s.spiderResultCount)) },
  ];
});

const sitePortraits = computed(() => summary.value.spiderSitePortraits || []);
const trendPoints = computed(() => summary.value.spiderTimeTrends || []);

const trendChartOption = computed(() => {
  const x = trendPoints.value.map(i => i.spiderDateLabel);
  const p = trendPoints.value.map(i => i.spiderParseCount || 0);
  const r = trendPoints.value.map(i => i.spiderResultCount || 0);
  const bar = trendTab.value === "bar";
  const base = { smooth: true, symbol: "circle", symbolSize: 6 };
  return {
    animationDuration: 300, backgroundColor: "transparent",
    tooltip: { trigger: "axis", backgroundColor: cssVar("--lay-chart-tooltip-bg", "rgba(8, 12, 24, 0.95)"), borderWidth: 0, textStyle: { color: cssVar("--lay-chart-tooltip-color", "var(--el-text-color-primary)") } },
    legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: cssVar("--lay-chart-legend-color", "var(--el-text-color-secondary)"), fontSize: 12 } },
    grid: { top: 36, left: 8, right: 8, bottom: 8, containLabel: true },
    xAxis: { type: "category", data: x, boundaryGap: bar, axisTick: { show: false }, axisLine: { lineStyle: { color: cssVar("--el-border-color-light", "rgba(148,163,184,0.12)") } }, axisLabel: { color: cssVar("--lay-chart-label-color", "var(--el-text-color-secondary)"), fontSize: 11 } },
    yAxis: { type: "value", splitNumber: 4, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: cssVar("--lay-chart-grid-color", "rgba(148,163,184,0.06)") } }, axisLabel: { color: cssVar("--lay-chart-label-color", "var(--el-text-color-secondary)"), fontSize: 11 } },
    color: bar ? ["var(--el-color-info)", "var(--el-color-primary)"] : ["var(--el-color-info)", "var(--el-color-primary)"],
    series: bar
      ? [
          { name: "解析", type: "bar", barMaxWidth: 20, data: p, itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"var(--el-color-info)"},{offset:1,color:"var(--el-color-info)"}]) } },
          { name: "结果", type: "bar", barMaxWidth: 20, data: r, itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"var(--el-color-primary-light-3)"},{offset:1,color:"var(--el-color-primary-dark-2)"}]) } },
        ]
      : [
          { ...base, name: "解析", type: "line", data: p, lineStyle: { width: 2.5, color: "var(--el-color-info)" }, itemStyle: { color: "var(--el-color-info)" }, areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"rgba(20,184,166,0.2)"},{offset:1,color:"rgba(20,184,166,0.01)"}]) } },
          { ...base, name: "结果", type: "line", data: r, lineStyle: { width: 2.5, color: "var(--el-color-primary)" }, itemStyle: { color: "var(--el-color-primary)" }, areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:"rgba(59,130,246,0.15)"},{offset:1,color:"rgba(59,130,246,0.01)"}]) } },
        ],
  };
});

const loadSummary = async () => {
  loading.value = true; errorMessage.value = "";
  try { summary.value = await loadSpiderDashboardSummary(); }
  catch (e) { errorMessage.value = `总览接口失败：${String(e)}`; }
  finally { loading.value = false; }
};
onMounted(() => { loadSummary(); });
</script>

<style scoped lang="scss">
.spider-overview {
  background: var(--el-bg-color);
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
}

// ── Background layers ───────────────────────
.spider-overview__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

// Grid
.spider-overview__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(6, 182, 212, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.035) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at 50% 0%, black 40%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 0%, black 40%, transparent 70%);
}

// Scanlines
.spider-overview__scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(6, 182, 212, 0.008) 2px,
    rgba(6, 182, 212, 0.008) 4px
  );
  pointer-events: none;
}

// Particles
.spider-overview__particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(6,182,212,0.4), transparent),
    radial-gradient(1px 1px at 30% 60%, rgba(59,130,246,0.3), transparent),
    radial-gradient(1.5px 1.5px at 50% 10%, rgba(20,184,166,0.4), transparent),
    radial-gradient(1px 1px at 70% 40%, rgba(139,92,246,0.3), transparent),
    radial-gradient(1.5px 1.5px at 85% 70%, rgba(6,182,212,0.35), transparent),
    radial-gradient(1px 1px at 15% 85%, rgba(59,130,246,0.3), transparent),
    radial-gradient(1px 1px at 60% 90%, rgba(20,184,166,0.25), transparent),
    radial-gradient(1.5px 1.5px at 90% 15%, rgba(139,92,246,0.3), transparent),
    radial-gradient(1px 1px at 40% 40%, rgba(6,182,212,0.2), transparent);
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

// Gold
.spider-overview__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.5;
  &--cyan { top: -12%; left: -8%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(6,182,212,0.3), transparent 70%); animation: glow-float 10s ease-in-out infinite; }
  &--blue { bottom: -20%; right: -8%; width: 650px; height: 650px; background: radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%); animation: glow-float 12s ease-in-out infinite reverse; }
  &--purple { top: 25%; left: 45%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); animation: glow-float 8s ease-in-out infinite; }
}

// ── Content ─────────────────────────────────
.spider-overview__content {
  position: relative;
  z-index: 1;
  padding: 20px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── Header ──────────────────────────────────
.spider-overview__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.spider-overview__header-left {
  display: grid;
  gap: 6px;
}

.spider-overview__title-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  color: var(--el-color-primary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  width: fit-content;
}

.spider-overview__badge-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--el-color-primary);
  box-shadow: 0 0 6px color-mix(in srgb, var(--el-color-primary) 60%, transparent);
}

.spider-overview__title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.spider-overview__title-gradient {
  background: linear-gradient(135deg, var(--el-text-color-primary) 30%, var(--el-color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

// Header accent bar
.spider-overview__header-accent {
  height: 2px;
  background: linear-gradient(90deg, var(--el-color-primary), transparent 80%);
  border-radius: 999px;
  opacity: 0.3;
  margin-top: -8px;
}

.spider-overview__subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.spider-overview__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

// Live indicator
.spider-overview__live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--el-bg-color-bg);
  border: 1px solid var(--el-border-color-light);

  &.is-active .spider-overview__live-dot {
    background: var(--el-color-success);
    box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-success) 50%, transparent);
    animation: live-pulse 1.5s infinite;
  }
}

.spider-overview__live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--el-text-color-secondary); transition: all 0.3s; }
.spider-overview__live-text { font-size: 11px; font-weight: 700; color: var(--lay-text-muted); letter-spacing: 0.05em; }

.spider-overview__refresh-btn {
  display: grid;
  place-items: center;
  width: 34px; height: 34px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent); color: var(--el-text-color-primary); background: var(--el-bg-color-bg); }
  &.is-spinning svg { animation: spin 1s linear infinite; }
}

// ════════════════════════════════════════════
// Stats Cards - Premium Redesign
// ════════════════════════════════════════════
.spider-overview__stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  padding: 20px 18px 16px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--accent) 8%, var(--el-border-color-light));
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 2%, var(--el-bg-color)), var(--lay-card-bg) 60%);
  backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: stat-in 0.5s ease both;
  animation-delay: calc(var(--idx) * 0.07s);
  cursor: default;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 2px; height: 0;
    background: linear-gradient(180deg, var(--accent), transparent);
    transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 0 0 2px 2px;
  }

  &:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: color-mix(in srgb, var(--accent) 25%, transparent);
    box-shadow: 0 20px 60px color-mix(in srgb, var(--accent) 8%, rgba(0,0,0,0.12)), 0 0 80px color-mix(in srgb, var(--accent) 6%, transparent);
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 5%, var(--el-bg-color)), var(--lay-card-bg) 50%);
    &::before { height: 40px; }
  }
}

// Decorative shape (abstract dot pattern)
.stat-card__deco {
  position: absolute;
  top: -20px; right: -20px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%);
  pointer-events: none;
  transition: all 0.5s;
  .stat-card:hover & {
    width: 120px; height: 120px;
    background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%);
  }
}

.stat-card__glow {
  position: absolute;
  bottom: -30%;
  left: -20%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent), transparent);
  pointer-events: none;
  transition: all 0.5s;
  .stat-card:hover & {
    width: 160px; height: 160px;
    background: radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent);
  }
}

.stat-card__icon {
  display: grid;
  place-items: center;
  width: 38px; height: 38px;
  border-radius: 10px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent) 6%, transparent));
  color: var(--accent);
  transition: all 0.3s;
  .stat-card:hover & {
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 25%, transparent), color-mix(in srgb, var(--accent) 10%, transparent));
    box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 12%, transparent);
    transform: scale(1.05);
  }
}

.stat-card__body {
  display: grid;
  gap: 4px;
}

.stat-card__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: color 0.3s;
  .stat-card:hover & { color: color-mix(in srgb, var(--accent) 70%, var(--el-text-color-placeholder)); }
}

.stat-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-card__value {
  font-size: 30px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  line-height: 1;
  letter-spacing: -0.03em;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-variant-numeric: tabular-nums;
  .stat-card:hover & { color: var(--accent); text-shadow: 0 0 40px color-mix(in srgb, var(--accent) 25%, transparent); }
}

.stat-card__footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--accent) 6%, var(--el-border-color));
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.3s;
  .stat-card:hover & { border-color: color-mix(in srgb, var(--accent) 12%, transparent); }
}

.stat-card__trend {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  font-weight: 500;
  transition: color 0.3s;
  .stat-card:hover & { color: color-mix(in srgb, var(--accent) 70%, var(--el-text-color-placeholder)); }
}

.stat-card__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: color-mix(in srgb, var(--accent) 4%, var(--el-border-color));
}

.stat-card__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 30%, transparent));
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  .stat-card:hover & { background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 50%, transparent)); }
}

// ════════════════════════════════════════════
// Glass Card
// ════════════════════════════════════════════
.glass-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

// Top accent bar
.glass-card__accent-bar {
  position: absolute;
  top: 0; left: 24px; right: 24px;
  height: 2px;
  background: linear-gradient(90deg, var(--el-color-primary), transparent);
  border-radius: 0 0 2px 2px;
  opacity: 0.4;
  z-index: 2;
  pointer-events: none;
}

.glass-card__border {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  border: 1px solid var(--el-border-color-light);
  pointer-events: none;
  transition: border-color 0.4s;
  .glass-card:hover & { border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent); }
}

// Gradient border glow on hover (pseudo-element overlay)
.glass-card::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s;
  background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 30%, transparent), transparent 40%, transparent 60%, color-mix(in srgb, var(--el-color-primary) 15%, transparent));
  z-index: 0;
}
.glass-card:hover::after { opacity: 1; }

// Shine sweep on hover
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 70%);
  background-size: 300% 100%;
  opacity: 0;
  z-index: 2;
  transition: opacity 0.6s;
  .glass-card:hover & { opacity: 1; animation: glass-shine 1.2s ease-out; }
}

.glass-card__inner {
  position: relative;
  padding: 20px;
  background: var(--lay-card-bg);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  z-index: 1;
  transition: background 0.4s;
  .glass-card:hover & { background: color-mix(in srgb, var(--lay-card-bg) 95%, var(--el-color-primary)); }
}

.glass-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.glass-card__title-group {
  display: grid;
  gap: 3px;
}

.glass-card__title-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;

  svg { color: var(--el-color-primary); }
}

.glass-card__desc {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.glass-card__tabs {
  display: flex;
  gap: 3px;
  padding: 3px;
  border-radius: 8px;
  background: var(--el-bg-color-bg);

  button {
    height: 26px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
    font-weight: 500;

    &.is-active {
      background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
      color: var(--el-color-primary);
    }
    &:hover:not(.is-active) { color: var(--lay-text-muted); }
  }
}

.glass-card__empty {
  min-height: 80px;
  display: grid;
  place-items: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.glass-card__error {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--lay-error-bg);
  border: 1px solid var(--lay-error-border);
  color: var(--lay-error);
  font-size: 12px;
}

// ── Main 2-col ──────────────────────────────
.spider-overview__main {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 12px;
}

// ── Trend ───────────────────────────────────
.trend-body { min-height: 0; }

.trend-table table { width: 100%; border-collapse: collapse; }
.trend-table th, .trend-table td { padding: 8px 12px; border-bottom: 1px solid var(--el-border-color); text-align: left; font-size: 12px; }
.trend-table th { color: var(--el-text-color-placeholder); font-weight: 600; }
.trend-table td { color: var(--lay-text-muted); }

.trend-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  &--parse { background: var(--lay-trend-parse-bg); color: var(--lay-trend-parse); }
  &--result { background: var(--lay-trend-result-bg); color: var(--lay-trend-result); }
}

// ── Site Portrait ───────────────────────────
.site-portrait-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-portrait-card {
  padding: 14px;
  border-radius: 12px;
  background: var(--el-bg-color-bg);
  border: 1px solid var(--el-border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: stat-in 0.4s ease both;
  &:hover { background: var(--el-bg-color-bg); border-color: color-mix(in srgb, var(--el-color-primary) 18%, transparent); transform: translateX(4px); }
}

.site-portrait-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.site-portrait-card__host {
  display: flex;
  align-items: center;
  gap: 10px;
  > div { display: grid; gap: 2px; }
  strong { font-size: 13px; font-weight: 700; color: var(--el-text-color-primary); }
}

.site-portrait-card__favicon {
  flex-shrink: 0;
  width: 34px; height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 25%, transparent), color-mix(in srgb, var(--el-color-primary) 8%, transparent));
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 800;
  transition: all 0.3s;
  .site-portrait-card:hover & { background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 35%, transparent), color-mix(in srgb, var(--el-color-primary) 12%, transparent)); transform: scale(1.05); }
}

.site-portrait-card__status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.status-pulse {
  width: 6px; height: 6px; border-radius: 50%; background: var(--el-text-color-secondary);
  &.is-running { background: var(--el-color-success); box-shadow: 0 0 6px color-mix(in srgb, var(--el-color-success) 50%, transparent); animation: live-pulse 2s infinite; }
}

.site-portrait-card__alert {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--lay-error-bg);
  color: var(--lay-error);
  font-size: 10px;
  font-weight: 600;
}

.site-portrait-card__metrics {
  display: flex;
  gap: 20px;
}

.s-metric { display: grid; gap: 1px; }
.s-metric__v { font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); }
.s-metric__l { font-size: 10px; color: var(--el-text-color-placeholder); }

.site-portrait-card__progress {
  margin-top: 10px;
  height: 3px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-border-color) 90%, transparent);
  overflow: hidden;
}
.site-portrait-card__progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 60%));
  transition: width 1.5s cubic-bezier(0.4,0,0.2,1);
  opacity: 0.5;
  .site-portrait-card:hover & { opacity: 0.8; }
}

// ── Status ──────────────────────────────────
.status-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.s-item {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--el-bg-color-alt);
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  &:hover { background: var(--el-bg-color-bg); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
}

.s-item__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px; height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 12%, transparent);
  color: var(--c);
  transition: all 0.3s;
  .s-item:hover & { background: color-mix(in srgb, var(--c) 20%, transparent); box-shadow: 0 0 16px color-mix(in srgb, var(--c) 12%, transparent); }
}

.s-item__body {
  display: grid;
  gap: 2px;
  flex: 1;
}

.s-item__label {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  font-weight: 500;
}

.s-item__value {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  color: var(--c);
  font-variant-numeric: tabular-nums;
}

.s-item__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: color-mix(in srgb, var(--el-border-color) 60%, transparent);
}
.s-item__bar-fill {
  height: 100%;
  background: var(--c);
  transition: width 1.2s cubic-bezier(0.4,0,0.2,1);
  opacity: 0.3;
}

// ── Animations ──────────────────────────────
@keyframes stat-in {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.8); }
}
@keyframes glow-float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
  33% { transform: translate(30px, -40px) scale(1.15); opacity: 0.4; }
  66% { transform: translate(-20px, 30px) scale(0.9); opacity: 0.45; }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes glass-shine {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ── Responsive ──────────────────────────────
@media (max-width: 1280px) {
  .spider-overview__stats { grid-template-columns: repeat(3, 1fr); }
  .spider-overview__main { grid-template-columns: 1fr; }
  .status-metrics { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .spider-overview__content { padding: 12px; }
  .spider-overview__stats { grid-template-columns: 1fr 1fr; }
  .spider-overview__header { flex-direction: column; align-items: flex-start; }
  .status-metrics { grid-template-columns: 1fr; }
}
</style>
