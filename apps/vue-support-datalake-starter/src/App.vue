<template>
  <div class="datalake-app">
    <!-- ===== 顶部导航 ===== -->
    <header class="app-header">
      <div class="header-left">
        <div class="brand-logo">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#00ffff" />
                <stop offset="100%" stop-color="#6366f1" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#lg)" opacity="0.2" />
            <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="url(#lg)" stroke-width="1.5" />
            <text x="16" y="22" text-anchor="middle" fill="url(#lg)" font-size="18" font-weight="700" font-family="Orbitron,sans-serif">D</text>
          </svg>
        </div>
        <div class="brand-text">
          <h1>数据中台</h1>
          <span class="brand-sub">Data Platform</span>
        </div>
        <div class="header-divider" />
        <div class="server-status">
          <span class="status-dot" :class="connected ? 'online' : 'offline'" />
          <span class="status-text">{{ connected ? 'Netty 58081' : '离线' }}</span>
        </div>
      </div>
      <div class="header-right">
        <span class="header-refresh-text">数据更新: {{ lastRefresh }}</span>
        <button class="header-refresh-btn" @click="refreshAll" :disabled="refreshing">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: refreshing }">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {{ refreshing ? '刷新中...' : '刷新' }}
        </button>
      </div>
    </header>

    <!-- ===== Tab 导航 ===== -->
    <nav class="tab-nav">
      <button
        v-for="tab in tabs" :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" class="tab-icon">
          <path :d="tab.icon" />
        </svg>
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <!-- ===== 主内容区 ===== -->
    <main class="app-main">
      <!-- ===== 监控大屏 ===== -->
      <div v-show="activeTab === 'monitor'" class="monitor-dashboard">
        <!-- 统计横幅 -->
        <div class="stats-banner">
          <div class="stat-card" v-for="stat in bannerItems" :key="stat.label">
            <div class="stat-glow" :style="{ '--glow-color': stat.color }" />
            <div class="stat-icon" :style="{ borderColor: stat.color + '40', background: stat.color + '10' }">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" :stroke="stat.color" stroke-width="1.5">
                <path :d="stat.icon" />
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>

        <!-- 数据生命周期 + KPI -->
        <div class="monitor-grid">
          <div class="section-card lifecycle-card">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00ffff" stroke-width="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <span>数据生命周期</span>
              </div>
            </div>
            <div class="lifecycle-flow">
              <div v-for="(stage, i) in lifecycleStages" :key="stage.key" class="lifecycle-node" :style="{ '--sc': stage.color }">
                <div class="lc-connector" v-if="i > 0" />
                <div class="lc-icon" :style="{ borderColor: stage.color, boxShadow: `0 0 12px ${stage.color}40` }">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" :stroke="stage.color" stroke-width="1.5">
                    <path :d="stage.icon" />
                  </svg>
                  <div class="lc-pulse" />
                </div>
                <div class="lc-label">{{ stage.label }}</div>
                <div class="lc-count" :style="{ color: stage.color }">{{ stage.count }}</div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00ffff" stroke-width="1.5">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>关键指标</span>
              </div>
            </div>
            <div class="kpi-grid">
              <div v-for="kpi in kpiCards" :key="kpi.label" class="kpi-card">
                <div class="kpi-icon" :style="{ background: kpi.bg }">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" :style="{ color: kpi.color }">
                    <path :d="kpi.icon" />
                  </svg>
                </div>
                <div class="kpi-info">
                  <div class="kpi-value" :style="{ color: kpi.color }">{{ kpi.formatted }}</div>
                  <div class="kpi-label">{{ kpi.label }}</div>
                </div>
                <div class="kpi-trend" :class="kpi.trend >= 0 ? 'up' : 'down'">
                  {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图表 -->
        <div class="chart-grid">
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#00ffff" stroke-width="1.5">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>吞吐量趋势</span>
              </div>
            </div>
            <div ref="throughputRef" class="chart-box" />
          </div>
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="1.5">
                  <path d="M12 9v2m0 4h.01m-6.93 5h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
                <span>错误率趋势</span>
              </div>
            </div>
            <div ref="errorRef" class="chart-box" />
          </div>
        </div>
      </div>

      <!-- ===== 子页面 ===== -->
      <div v-show="activeTab === 'pipeline'" class="tab-page"><PipelinePage /></div>
      <div v-show="activeTab === 'data'" class="tab-page"><DataPage /></div>
      <div v-show="activeTab === 'subscription'" class="tab-page"><SubscriptionPage /></div>
      <div v-show="activeTab === 'collector'" class="tab-page"><CollectorPage /></div>
      <div v-show="activeTab === 'dlq'" class="tab-page"><DlqPage /></div>
      <div v-show="activeTab === 'settings'" class="tab-page"><SettingsPage /></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import * as echarts from "echarts";
import { ScPanel } from "@repo/components/ScPanel";
import {
  fetchMonitorStats,
  fetchThroughput,
  fetchErrors,
} from "@pages/datalake/api/monitor";
import {
  fetchPipelineList,
  fetchPipelineStatus,
} from "@pages/datalake/api/pipeline";
import type { MonitorStats } from "@pages/datalake/types";
import DatalakePipelinePage from "@pages/datalake/views/pipeline/index.vue";
import DatalakeDataPage from "@pages/datalake/views/data/index.vue";
import DatalakeSubscriptionPage from "@pages/datalake/views/subscription/index.vue";
import DatalakeCollectorPage from "@pages/datalake/views/collector/index.vue";
import DatalakeDlqPage from "@pages/datalake/views/dlq/index.vue";
import DatalakeSettingsPage from "@pages/datalake/views/settings/index.vue";

const PipelinePage = DatalakePipelinePage;
const DataPage = DatalakeDataPage;
const SubscriptionPage = DatalakeSubscriptionPage;
const CollectorPage = DatalakeCollectorPage;
const DlqPage = DatalakeDlqPage;
const SettingsPage = DatalakeSettingsPage;

// === 状态 ===
const activeTab = ref("monitor");
const connected = ref(true);
const refreshing = ref(false);
const lastRefresh = ref("--");
let pollInt: ReturnType<typeof setInterval> | null = null;

const monitorStats = ref<MonitorStats | null>(null);
const tpData = ref<Array<{ time: string; value: number }>>([]);
const errData = ref<Array<{ time: string; value: number }>>([]);
const plCount = ref(0);
const runCount = ref(0);
const pauseCount = ref(0);
const errCount = ref(0);

const throughputRef = ref<HTMLElement>();
const errorRef = ref<HTMLElement>();
let tpChart: echarts.ECharts | null = null;
let errChart: echarts.ECharts | null = null;

// === 横幅 ===
const bannerItems = computed(() => [
  { label: "系统状态", value: "● 运行中", color: "#22c55e", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { label: "活跃 Pipeline", value: String(monitorStats.value?.activePipelines ?? 0), color: "#00ffff", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
  { label: "今日处理", value: (monitorStats.value?.todayProcessed ?? 0).toLocaleString(), color: "#10b981", icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  { label: "吞吐量", value: (monitorStats.value?.throughput ?? 0) + "/s", color: "#f59e0b", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
]);

// === 生命周期 ===
const lifecycleStages = computed(() => [
  { key: "ingest", label: "数据接入", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", color: "#00ffff", count: monitorStats.value?.activePipelines ?? 0 },
  { key: "std", label: "标准化", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", color: "#6366f1", count: plCount.value },
  { key: "route", label: "路由", icon: "M5 12h14M12 5l7 7-7 7", color: "#06b6d4", count: runCount.value },
  { key: "filter", label: "过滤", icon: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z", color: "#f59e0b", count: pauseCount.value },
  { key: "sink", label: "下沉", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", color: "#10b981", count: monitorStats.value?.activeSubscriptions ?? 0 },
  { key: "push", label: "分发", icon: "M22 12h-4l-3 9L9 3l-3 9H2", color: "#ec4899", count: monitorStats.value?.todayProcessed ?? 0 },
]);

// === KPI ===
const kpiCards = computed(() => [
  { label: "活跃 Pipeline", value: monitorStats.value?.activePipelines ?? 0, formatted: String(monitorStats.value?.activePipelines ?? 0), icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", color: "#00ffff", bg: "rgba(0,255,255,0.12)", theme: "primary", trend: 12 },
  { label: "今日处理量", value: monitorStats.value?.todayProcessed ?? 0, formatted: (monitorStats.value?.todayProcessed ?? 0).toLocaleString(), icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", color: "#10b981", bg: "rgba(16,185,129,0.12)", theme: "success", trend: 8 },
  { label: "今日错误", value: monitorStats.value?.todayErrors ?? 0, formatted: String(monitorStats.value?.todayErrors ?? 0), icon: "M12 9v2m0 4h.01m-6.93 5h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z", color: "#ef4444", bg: "rgba(239,68,68,0.12)", theme: "danger", trend: -5 },
  { label: "吞吐量(条/秒)", value: monitorStats.value?.throughput ?? 0, formatted: (monitorStats.value?.throughput ?? 0) + "/s", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", theme: "warning", trend: 23 },
]);

// === Tab ===
const tabs = [
  { key: "monitor", label: "监控大屏", icon: "M4 4v16h16" },
  { key: "pipeline", label: "流水线管理", icon: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" },
  { key: "data", label: "数据查询", icon: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" },
  { key: "subscription", label: "订阅管理", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" },
  { key: "collector", label: "采集管理", icon: "M4 4h16M4 12h16M4 20h16" },
  { key: "dlq", label: "死信队列", icon: "M12 9v2m0 4h.01m-6.93 5h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" },
  { key: "settings", label: "系统配置", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
];

// === 时钟 ===
const fmtDT = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// === 图表 ===
const makeChart = (el: HTMLElement, data: Array<{ time: string; value: number }>, color: string, name: string) => {
  const c = echarts.init(el, "dark");
  c.setOption({
    tooltip: { trigger: "axis", backgroundColor: "rgba(5,10,31,0.9)", borderColor: color, borderWidth: 1, textStyle: { color: "#e2e8f0" } },
    grid: { left: 45, right: 15, top: 20, bottom: 20 },
    xAxis: { type: "category", data: data.map(d => { const t = new Date(d.time); return `${String(t.getHours()).padStart(2, "0")}:00`; }), axisLine: { lineStyle: { color: "rgba(0,255,255,0.15)" } }, axisLabel: { color: "#64748b", fontSize: 10 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(0,255,255,0.06)" } }, axisLabel: { color: "#64748b", fontSize: 10 } },
    series: [{ name, type: "line", smooth: true, data: data.map(d => d.value), symbol: "none", lineStyle: { color, width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + "40" }, { offset: 1, color: color + "02" }]) } }],
  });
  return c;
};

// === 数据 ===
const loadData = async () => {
  try {
    const [sr, tr, er, pr] = await Promise.all([
      fetchMonitorStats(),
      fetchThroughput(),
      fetchErrors(),
      fetchPipelineList(),
    ]);
    monitorStats.value = sr?.data?.data ?? null;
    tpData.value = tr?.data?.data ?? [];
    errData.value = er?.data?.data ?? [];
    const pls = pr?.data?.data ?? [];
    plCount.value = pls.length;
    let r = 0, p = 0, e = 0;
    for (const g of pls) {
      try {
        const { data: st } = await fetchPipelineStatus(g.id);
        const lc = st?.data?.lifecycle;
        if (lc === "RUNNING") r++; else if (lc === "PAUSED") p++; else if (lc === "ERROR") e++;
      } catch { /* skip */ }
    }
    runCount.value = r; pauseCount.value = p; errCount.value = e;
  } catch { /* ignore */ }
};

const refreshAll = async () => {
  refreshing.value = true;
  await loadData();
  await nextTick();
  if (throughputRef.value && tpData.value.length) {
    tpChart?.dispose();
    tpChart = makeChart(throughputRef.value, tpData.value, "#00ffff", "吞吐量");
  }
  if (errorRef.value && errData.value.length) {
    errChart?.dispose();
    errChart = makeChart(errorRef.value, errData.value, "#ef4444", "错误数");
  }
  lastRefresh.value = fmtDT(new Date());
  refreshing.value = false;
};

// === 初始化 ===
onMounted(() => {
  refreshAll();
  pollInt = setInterval(refreshAll, 30000);
});

onUnmounted(() => {
  if (pollInt) clearInterval(pollInt);
  tpChart?.dispose();
  errChart?.dispose();
});
</script>

<style>
/* ===== 全局 — 确保 body 背景正确 ===== */
body {
  margin: 0;
  padding: 0;
  background: url('/images/darkBlue.png') !important;
  background-size: cover !important;
  background-position: center !important;
  background-attachment: fixed !important;
}

/* ===== Stitch 主题变量（ScCard tech layout 依赖） ===== */
:root {
  --stitch-lay-border-hover: #00ffff;
  --stitch-lay-border: rgba(0, 255, 255, 0.25);
  --stitch-lay-shadow-sm: 0 0 16px rgba(0, 255, 255, 0.2);
  --stitch-lay-bg-panel: rgba(5, 10, 31, 0.85);
  --stitch-lay-text-main: #e2e8f0;
  --stitch-lay-text-sub: #94a3b8;
  --stitch-radius-sm: 6px;
  --stitch-radius-md: 10px;
  --stitch-radius-lg: 14px;

  --tech-primary-color: #00ffff;
  --tech-secondary-color: rgba(0, 255, 255, 0.15);
  --tech-glow-color: rgba(0, 255, 255, 0.2);
  --tech-bg-color: rgba(5, 10, 31, 0.85);
  --tech-text-color: #e2e8f0;
  --tech-sub-text-color: #94a3b8;
}

.datalake-app {
  min-height: 100vh;
  background: url('/images/darkBlue.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: #e2e8f0;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}
.datalake-app ::-webkit-scrollbar { width: 5px; height: 5px; }
.datalake-app ::-webkit-scrollbar-track { background: rgba(0,255,255,0.03); }
.datalake-app ::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); border-radius: 3px; }

/* scifi panel 背景填充默认是黑色，改为深蓝半透明透出背景图 */
body .sc-panel.sc-panel--scifi .sfp-svg-bg {
  fill: rgba(5, 10, 31, 0.2);
}
body .sc-panel.sc-panel--scifi .sfp-deco-l,
body .sc-panel.sc-panel--scifi .sfp-deco-r {
  fill: rgba(0, 255, 255, 0.15);
}
</style>

<style scoped>
/* ===== 变量 ===== */
.datalake-app {
  --cyan: #00ffff;
  --cyan-dim: rgba(0,255,255,0.08);
  --cyan-card: rgba(0,255,255,0.04);
  --border: rgba(0,255,255,0.12);
  --border-s: rgba(0,255,255,0.25);
  --text-dim: #94a3b8;
  --text-mute: #64748b;
  --glow: 0 0 20px rgba(0,255,255,0.15);
}

/* ===== 头部 ===== */
.app-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: linear-gradient(135deg, #0a1a3a, #050a1f);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.brand-logo svg { filter: drop-shadow(0 0 6px rgba(0,255,255,0.4)); }
.brand-text h1 {
  margin: 0; font-size: 16px; font-weight: 600;
  background: linear-gradient(90deg, #00ffff, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}
.brand-sub { font-size: 10px; color: var(--text-mute); letter-spacing: 2px; text-transform: uppercase; }
.header-divider { width: 1px; height: 26px; background: var(--border); }
.server-status { display: flex; align-items: center; gap: 6px; }
.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34,197,94,0.6);
  animation: pulse-dot 2s infinite;
}
.status-dot.offline { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.6); }
@keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:.6; transform:scale(1.3) } }
.status-text { font-size: 11px; color: var(--text-dim); font-family: "JetBrains Mono",monospace; }
.header-right { display: flex; align-items: center; gap: 12px; }
.header-refresh-text { font-size: 11px; color: var(--text-mute); }
.header-refresh-btn {
  background: var(--cyan-dim);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 3px 12px;
  color: var(--text-dim);
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all .2s;
  font-family: inherit;
}
.header-refresh-btn:hover { border-color: var(--border-s); color: var(--cyan); }
.header-refresh-btn:disabled { opacity: .5; cursor: not-allowed; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Tab 导航 ===== */
.tab-nav {
  display: flex;
  gap: 2px;
  padding: 0 22px;
  background: rgba(10,26,58,.5);
  border-bottom: 1px solid var(--border);
}
.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  font-size: 12px;
  color: var(--text-mute);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all .25s;
  white-space: nowrap;
  font-family: inherit;
}
.tab-item:hover { color: #e2e8f0; background: var(--cyan-dim); }
.tab-item.active {
  color: var(--cyan);
  border-bottom-color: var(--cyan);
  text-shadow: 0 0 12px rgba(0,255,255,.3);
}
.tab-icon { flex-shrink: 0; }

/* ===== 主内容 ===== */
.app-main {
  padding: 14px 22px 22px;
}
.monitor-dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== 统计横幅 ===== */
.stats-banner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}
.stat-card {
  position: relative;
  background: rgba(5, 10, 31, 0.8);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: all 0.3s;
}
.stat-card:hover { border-color: var(--border-s); box-shadow: var(--glow); }
.stat-glow {
  position: absolute;
  top: -20px; right: -20px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow-color, #00ffff) 0%, transparent 70%);
  opacity: 0.08;
  pointer-events: none;
}
.stat-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.stat-value { font-size: 22px; font-weight: 700; font-family: "JetBrains Mono", monospace; line-height: 1.1; }
.stat-label { font-size: 11px; color: var(--text-dim); }

/* ===== 监控网格 ===== */
.monitor-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

/* ===== 区域卡片 (monitor 内) ===== */
.monitor-dashboard .section-card {
  background: rgba(5, 10, 31, 0.75);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  backdrop-filter: blur(12px);
  overflow: hidden;
}
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border);
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 600; color: #e2e8f0;
}

/* ===== 生命周期 ===== */
.lifecycle-flow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 14px;
}
.lifecycle-node {
  display: flex; flex-direction: column; align-items: center;
  gap: 5px; flex: 1; position: relative;
}
.lifecycle-card .section-header { border-bottom: none; }

/* ===== KPI 网格 ===== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: rgba(255, 255, 255, 0.03);
}
.kpi-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px;
  background: rgba(5, 10, 31, 0.6);
}
.lc-connector {
  position: absolute;
  right: calc(50% + 20px);
  top: 20px;
  left: calc(-50% + 20px);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
}
.lc-icon {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: rgba(5,10,31,.7);
  transition: all .4s;
}
.lc-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid var(--sc, var(--cyan));
  opacity: 0;
  animation: lc-pulse 2s ease-out infinite;
}
@keyframes lc-pulse {
  0% { transform: scale(1); opacity: .4; }
  100% { transform: scale(1.5); opacity: 0; }
}
.lc-label { font-size: 10px; color: var(--text-dim); font-weight: 500; }
.lc-count { font-size: 15px; font-weight: 700; font-family: "JetBrains Mono",monospace; }

/* ===== KPI ===== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.kpi-item { display: flex; align-items: center; gap: 12px; }
.kpi-icon {
  width: 40px; height: 40px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-info { flex: 1; min-width: 0; }
.kpi-value {
  font-size: 18px;
  font-weight: 700;
  font-family: "JetBrains Mono",monospace;
  line-height: 1.2;
}
.kpi-label { font-size: 10px; color: var(--text-mute); margin-top: 1px; }
.kpi-trend {
  font-size: 11px;
  font-weight: 600;
  font-family: "JetBrains Mono",monospace;
  padding: 2px 7px;
  border-radius: 5px;
}
.kpi-trend.up { color: #10b981; background: rgba(16,185,129,.12); }
.kpi-trend.down { color: #ef4444; background: rgba(239,68,68,.12); }

/* ===== 图表 ===== */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.chart-box { height: 250px; width: 100%; }

/* ===== 子页面 ===== */
.tab-page { animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .kpi-grid, .status-banner { grid-template-columns: repeat(2, 1fr); }
  .chart-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .kpi-grid, .status-banner { grid-template-columns: 1fr; }
  .app-header { padding: 0 10px; }
  .brand-sub, .header-divider, .server-status { display: none; }
  .tab-nav { padding: 0 10px; }
  .tab-item { padding: 9px 10px; font-size: 11px; }
}
</style>
