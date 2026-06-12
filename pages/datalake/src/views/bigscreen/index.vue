<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import * as echarts from "echarts";
import { connectWs, onWsMessage } from "../../api/ws";
import { fetchMonitorStats } from "../../api/monitor";
import type { MonitorStats } from "../../types";

defineOptions({ name: "DatalakeBigscreenPage" });

const OpaCPT = computed(() => 1);

const wsConnected = ref(false);
const lastUpdateTime = ref("--");
const stats = ref<MonitorStats | null>(null);
const archStatRaw = ref<(number | string)[]>(Array(6).fill("--"));
const nodeStatsData = ref<any[]>([]);
const pipelinesData = ref<any[]>([]);

type ArchitectureNode = {
  name: string;
  detail: string;
  stat: number | string;
  color: string;
  icon: string;
};

const architectureRows = computed<Array<{ label: string; nodes: ArchitectureNode[] }>>(() => {
  const s = stats.value;
  const arch = archStatRaw.value;
  const collectorCount = s?.collectorCount ?? arch[1] ?? "--";
  const pipelineCount = s?.activePipelines ?? arch[2] ?? "--";
  const dlqSize = s?.dlqSize ?? 0;
  const subscriptionCount = s?.activeSubscriptions ?? 0;
  const totalProcessed = s?.totalProcessed ?? 0;

  return [
    {
      label: "入口",
      nodes: [
        { name: "被动采集", detail: "HTTP / TCP / SPI", stat: collectorCount, color: "#00ffff", icon: "M4 4h16M4 12h16M4 20h16" },
        { name: "主动采集", detail: "Kafka / RabbitMQ / ActiveMQ", stat: "SPI", color: "#10b981", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
        { name: "API 服务", detail: "REST :58081 /collect", stat: "AUTH", color: "#38bdf8", icon: "M5 12h14M12 5l7 7-7 7" },
      ],
    },
    {
      label: "核心",
      nodes: [
        { name: "鉴权限流", detail: "TokenService / AuthFilter / RateLimiter", stat: "ON", color: "#64748b", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
        { name: "管线执行", detail: "PipelineManager / OffsetManager", stat: pipelineCount, color: "#8b5cf6", icon: "M22 12h-4l-3 9-4-18-3 9H2" },
        { name: "内部 MQ", detail: "Disruptor + DLQ", stat: dlqSize, color: "#f59e0b", icon: "M3 7h18M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M8 11h8M8 15h5" },
      ],
    },
    {
      label: "输出",
      nodes: [
        { name: "业务 Sink", detail: "Jdbc / Realtime / Log", stat: arch[4] ?? pipelineCount, color: "#06b6d4", icon: "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18" },
        { name: "统计查询", detail: "StatsSink / Calcite / WS", stat: totalProcessed, color: "#3b82f6", icon: "M3 3v18h18M7 15l4-4 3 3 5-7" },
        { name: "订阅客户端", detail: "HTTP / MQ / TCP / WEBHOOK / SPI", stat: subscriptionCount, color: "#ec4899", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" },
      ],
    },
  ];
});

const metrics = computed(() => {
  const s = stats.value;
  if (!s) return Array(6).fill(null).map((_, i) => ({
    label: ["活跃管线","今日处理","今日错误","吞吐量","采集客户端","订阅数"][i],
    value: "0", color: ["#3b82f6","#22c55e","#ef4444","#f59e0b","#00ffff","#8b5cf6"][i],
  }));
  return [
    { label: "活跃管线", value: String(s.activePipelines ?? 0), color: "#3b82f6" },
    { label: "今日处理", value: (s.todayProcessed ?? 0).toLocaleString(), color: "#22c55e" },
    { label: "今日错误", value: String(s.todayErrors ?? 0), color: "#ef4444" },
    { label: "吞吐量", value: (s.throughput ?? 0) + "/s", color: "#f59e0b" },
    { label: "采集客户端", value: String(s.collectorCount ?? 0), color: "#00ffff" },
    { label: "订阅数", value: String(s.activeSubscriptions ?? 0), color: "#8b5cf6" },
  ];
});

function formatVol(v: number): string {
  if (!v && v !== 0) return "--";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(v);
}

function formatStat(value: number | string | undefined): string {
  if (typeof value === "number") return formatVol(value);
  if (value === undefined || value === null || value === "") return "--";
  return String(value);
}

// Charts
const throughputRef = ref<HTMLElement>();
const errorRef = ref<HTMLElement>();
const graphRef = ref<HTMLElement>();
let throughputChart: echarts.ECharts | null = null;
let errorChart: echarts.ECharts | null = null;
let graphChart: echarts.ECharts | null = null;

function initCharts() {
  if (throughputRef.value && !throughputChart) {
    throughputChart = echarts.init(throughputRef.value);
    throughputChart.setOption({
      tooltip: { trigger: "axis", backgroundColor: "rgba(11,15,34,0.9)", borderColor: "#1e2a45", textStyle: { color: "#e2e8f0" } },
      grid: { left: 30, right: 10, top: 10, bottom: 10 },
      xAxis: { type: "category", data: [], axisLine: { lineStyle: { color: "#1e2a45" } }, axisLabel: { color: "#5a6478" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(30,42,69,0.5)" } }, axisLabel: { color: "#5a6478" } },
      series: [{ type: "line", smooth: true, data: [], lineStyle: { color: "#3b82f6", width: 1.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(59,130,246,0.25)" }, { offset: 1, color: "rgba(59,130,246,0.02)" }]) }, itemStyle: { color: "#3b82f6" } }],
    });
  }
  if (errorRef.value && !errorChart) {
    errorChart = echarts.init(errorRef.value);
    errorChart.setOption({
      tooltip: { trigger: "axis", backgroundColor: "rgba(11,15,34,0.9)", borderColor: "#1e2a45", textStyle: { color: "#e2e8f0" } },
      grid: { left: 30, right: 10, top: 10, bottom: 10 },
      xAxis: { type: "category", data: [], axisLine: { lineStyle: { color: "#1e2a45" } }, axisLabel: { color: "#5a6478" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(30,42,69,0.5)" } }, axisLabel: { color: "#5a6478" } },
      series: [{ type: "line", smooth: true, data: [], lineStyle: { color: "#ef4444", width: 1.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(239,68,68,0.25)" }, { offset: 1, color: "rgba(239,68,68,0.02)" }]) }, itemStyle: { color: "#ef4444" } }],
    });
  }
  if (graphRef.value && !graphChart) {
    graphChart = echarts.init(graphRef.value);
    graphChart.setOption({
      tooltip: { backgroundColor: "rgba(11,15,34,0.9)", borderColor: "#1e2a45", textStyle: { color: "#e2e8f0", fontSize: 11 } },
      series: [{ type: "graph", layout: "force", force: { repulsion: 200, edgeLength: 100, gravity: 0.1 }, roam: true, draggable: true, data: [], edges: [], label: { show: true, position: "bottom", color: "#94a3b8", fontSize: 10 } }],
    });
  }
}

function updateChart(chart: echarts.ECharts | null, data: Array<{ time: string; value: number }>) {
  if (!chart || !data?.length) return;
  chart.setOption({
    xAxis: { data: data.map((d) => new Date(d.time).getHours() + ":00") },
    series: [{ data: data.map((d) => d.value) }],
  });
}

function applyMonitorStats(s: MonitorStats) {
  stats.value = s;
  archStatRaw.value = [s.dataSourceCount ?? "--", s.collectorCount ?? "--", s.activePipelines ?? "--", s.messageBusCount ?? "--", s.storageLayerCount ?? "--", s.apiOutputCount ?? "--"];
}

function applyNodeStats(data: any[]) {
  nodeStatsData.value = data;
}

function applyPipelineData(data: any[]) {
  pipelinesData.value = data;
}

function applyGraphData(data: any) {
  if (!data || !data.nodes?.length || !graphChart) return;
  const chartNodes = data.nodes.map((n: any, i: number) => ({
    id: String(n.id ?? i), name: n.name || n.type || "未知", value: n.volume || n.count || 0,
    itemStyle: { color: n.color || "#64748b" },
    symbolSize: Math.max(24, Math.min(64, (n.volume || 50) / 10)), draggable: true,
  }));
  const chartEdges = (data.edges || []).map((e: any, i: number) => ({ source: String(e.source ?? i), target: String(e.target ?? i + 1) }));
  graphChart.setOption({ series: [{ type: "graph", layout: "force", force: { repulsion: 220, edgeLength: 120, gravity: 0.08 }, roam: true, draggable: true, data: chartNodes, edges: chartEdges }] }, { notMerge: true, lazyUpdate: true });
}

function handleWsMessage(data: any) {
  if (!data || !data.type) return;
  wsConnected.value = true;
  lastUpdateTime.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  if (data.type === "monitor_update") { if (data.stats) applyMonitorStats(data.stats); if (data.throughput?.length) updateChart(throughputChart, data.throughput); if (data.errors?.length) updateChart(errorChart, data.errors); }
  if (data.type === "node_update") { if (data.nodes) applyNodeStats(data.nodes); }
  if (data.type === "pipeline_update") { if (data.pipelines) applyPipelineData(data.pipelines); }
  if (data.type === "graph_update") { if (data.data) applyGraphData(data.data); }
}

const portlets = [
  { label: "吞吐量", slotName: "cell-0-0", panelName: "ScifiPanelA1", panelCfg: { rotate: "y" } },
  { label: "实时监控", slotName: "cell-0-1", panelName: "ScifiPanelDV3", panelCfg: { rotate: "y" } },
  { label: "系统架构", slotName: "cell-0-2", panelName: "ScifiPanelB1", panelCfg: { rotate: "y" } },
  { label: "实时数据", slotName: "cell-1-0", panelName: "ScifiPanelDV1", panelCfg: {} },
  { label: "管线拓扑", slotName: "cell-1-2", panelName: "ScifiPanelDV2", panelCfg: {} },
  { label: "系统状态", slotName: "cell-2-0", panelName: "ScifiPanelDV5", panelCfg: {} },
];

let unsubWs: (() => void) | null = null;
let wsCheckTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  initCharts();
  fetchMonitorStats().then(({ data }) => { if (data) applyMonitorStats(data); }).catch(() => {});
  connectWs();
  unsubWs = onWsMessage(handleWsMessage);
  wsCheckTimer = setInterval(() => { wsConnected.value = (window as any).__wsConnected__ === true; }, 3000);
});

onBeforeUnmount(() => {
  if (wsCheckTimer) clearInterval(wsCheckTimer);
  throughputChart?.dispose();
  errorChart?.dispose();
  graphChart?.dispose();
  unsubWs?.();
});
</script>

<template>
  <ScifiHeaderA1 :width="500">数据中台 · 全景大屏</ScifiHeaderA1>

  <TuiGrid class="dash-grid-layout-a" :gap="40" :rows="3" :cols="3"
    :colConfig="[{ size: 1 }, { size: 2 }, { size: 1 }]"
    :rowConfig="[{ size: 1 }, { size: 1.2 }, { size: 1 }]"
    :cellConfig="{ '0-1': { rowSpan: 3, pointerEvent: 'none' }, '1-2': { rowSpan: 2 } }"
  >
    <template v-for="item in portlets" :key="item.slotName" #[item.slotName]>
      <component :is="item.panelName" v-bind="{ ...item.panelCfg, backgroundOpacity: OpaCPT }" :title="item.label">
        <!-- cell-0-0: 吞吐量 -->
        <div ref="throughputRef" class="chart-box" v-if="item.slotName === 'cell-0-0'" />
        <!-- cell-0-1 (span 3 rows): 关系图谱（跨行大面板） -->
        <div ref="graphRef" class="chart-box" v-else-if="item.slotName === 'cell-0-1'" />
        <!-- cell-0-2: 系统架构 -->
        <div class="arch-panel" v-else-if="item.slotName === 'cell-0-2'">
          <div class="arch-map">
            <div v-for="(row, rowIndex) in architectureRows" :key="row.label" class="arch-row">
              <div class="arch-row-label">{{ row.label }}</div>
              <div class="arch-row-nodes">
                <template v-for="(node, nodeIndex) in row.nodes" :key="`${row.label}-${node.name}`">
                  <div class="arch-node" :style="{ '--layer-color': node.color }">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="arch-icon">
                      <path :d="node.icon" />
                    </svg>
                    <span class="arch-name">{{ node.name }}</span>
                    <span class="arch-detail">{{ node.detail }}</span>
                    <span class="arch-stat">{{ formatStat(node.stat) }}</span>
                  </div>
                  <svg v-if="nodeIndex < row.nodes.length - 1" class="arch-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </template>
              </div>
              <div v-if="rowIndex < architectureRows.length - 1" class="arch-down" />
            </div>
          </div>
        </div>
        <!-- cell-1-0: 实时数据 -->
        <div class="realtime-panel" v-else-if="item.slotName === 'cell-1-0'">
          <div class="rt-header">
            <span class="rt-badge" :class="wsConnected ? 'live' : 'offline'">{{ wsConnected ? '● 实时' : '○ 离线' }}</span>
            <span class="rt-time">{{ lastUpdateTime }}</span>
          </div>
          <div class="rt-row" v-for="m in metrics" :key="m.label">
            <span class="rt-label">{{ m.label }}</span>
            <span class="rt-value" :style="{ color: m.color }">{{ m.value }}</span>
          </div>
        </div>
        <!-- cell-1-2 (span 2 rows): 管线拓扑 -->
        <div class="pipe-panel" v-else-if="item.slotName === 'cell-1-2'">
          <div class="pipe-scroll">
            <span class="empty-hint" v-if="pipelinesData.length === 0">等待管线数据推送...</span>
            <div class="pipe-chain" v-for="p in pipelinesData" :key="p.id">
              <div class="pipe-hex"><div class="hex-inner"><span class="hex-label">{{ p.name }}</span><span class="hex-vol">{{ formatVol(p.dataVolume) }}</span></div></div>
              <svg v-for="node in (p.nodes || [])" :key="node.id" viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              <div class="node-hex" v-for="node in (p.nodes || [])" :key="node.id" :style="{ '--hex-color': node.color || '#64748b' }">
                <div class="hex-inner"><span class="hex-label">{{ node.name || node.type }}</span><span class="hex-vol">{{ formatVol(node.volume) }}/s</span></div>
              </div>
            </div>
          </div>
        </div>
        <!-- cell-2-0: 系统状态 -->
        <div class="footer-panel" v-else-if="item.slotName === 'cell-2-0'">
          <span class="status-ok">● 运行正常</span>
          <span>WS: <span :class="wsConnected ? 'status-ok' : 'status-off'">{{ wsConnected ? '已连接' : '断开' }}</span></span>
          <span>{{ lastUpdateTime }}</span>
        </div>
      </component>
    </template>
  </TuiGrid>
</template>

<style lang="less">
.dash-grid-layout-a {
  position: absolute;
  inset: 100px 40px 60px 40px;
  --tui-grid-w: auto;
  --tui-grid-h: auto;
  --tui-grid-item-pd: 0;
  --tui-grid-item-bg: transparent;
  --tui-grid-item-bd: transparent;
}
</style>

<style scoped>
.bigscreen-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  /* do NOT set background - let TuiProvider/tech provide it */
}

.bigscreen-layout--preview {
  /* let TuiProvider provide the background */
}

.bigscreen-theme-toggle {
  position: absolute;
  right: 20px;
  top: 12px;
  z-index: 100;
}

:deep(.tui-grid-item) {
  background: transparent !important;
  border: none !important;
}
</style>

<style scoped>
.chart-box { width: 100%; height: 100%; }
.arch-panel {
  height: 100%;
  padding: 4px 8px;
  overflow: hidden;
}
.arch-map {
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 4px;
  width: 100%;
  height: 100%;
}
.arch-row {
  position: relative;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  align-items: center;
  min-height: 0;
}
.arch-row-label {
  color: rgba(148, 163, 184, 0.72);
  font-size: 9px;
  letter-spacing: 0.08em;
  writing-mode: vertical-rl;
}
.arch-row-nodes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 10px minmax(0, 1fr) 10px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.arch-node {
  position: relative;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 4px;
  min-width: 0;
  min-height: 44px;
  padding: 5px 6px;
  border: 1px solid color-mix(in srgb, var(--layer-color) 34%, transparent);
  border-radius: 6px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--layer-color) 13%, transparent), rgba(2, 6, 23, 0.38));
  box-shadow: inset 0 0 14px color-mix(in srgb, var(--layer-color) 7%, transparent);
}
.arch-icon {
  grid-row: 1 / 3;
  width: 18px;
  height: 18px;
  color: var(--layer-color);
}
.arch-name {
  min-width: 0;
  color: #e2e8f0;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.arch-detail {
  grid-column: 2 / 4;
  min-width: 0;
  color: rgba(148, 163, 184, 0.72);
  font-size: 7px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.arch-stat {
  color: var(--layer-color);
  font-size: 9px;
  font-weight: 700;
  font-family: "Space Mono", monospace;
  line-height: 1;
}
.arch-arrow {
  width: 10px;
  height: 10px;
  color: rgba(56, 189, 248, 0.55);
}
.arch-down {
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 1px;
  height: 6px;
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.6), rgba(56, 189, 248, 0.08));
}
.realtime-panel { padding: 8px 12px; }
.rt-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.rt-badge { font-size: 9px; padding: 0 6px; border-radius: 8px; font-family: "Space Mono", monospace; }
.rt-badge.live { color: #22c55e; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); }
.rt-badge.offline { color: #ef4444; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
.rt-time { font-size: 9px; color: rgba(255,255,255,0.4); margin-left: auto; font-family: "Space Mono", monospace; }
.rt-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.rt-label { font-size: 10px; color: rgba(255,255,255,0.5); }
.rt-value { font-size: 12px; font-weight: 700; font-family: "Space Mono", monospace; }
.topo-panel, .pipe-panel { height: 100%; overflow: hidden; }
.topo-flow, .pipe-scroll { padding: 8px; display: flex; gap: 6px; overflow-x: auto; height: 100%; align-items: center; }
.pipe-chain { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
.empty-hint { display: flex; align-items: center; justify-content: center; padding: 20px; font-size: 10px; color: rgba(255,255,255,0.3); width: 100%; }
.node-hex {
  position: relative;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  width: 44px; height: 48px; flex-shrink: 0;
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--hex-color) 10%, transparent));
  background: color-mix(in srgb, var(--hex-color) 60%, transparent);
}
.hex-inner { position: absolute; top: 1px; left: 1px; right: 1px; bottom: 1px; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; }
.hex-label { font-size: 7px; font-weight: 600; color: inherit; text-align: center; line-height: 1.1; max-width: 40px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hex-count { font-size: 13px; font-weight: 700; color: inherit; font-family: "Space Mono", monospace; line-height: 1; }
.hex-vol { font-size: 6px; color: rgba(255,255,255,0.5); font-family: "Space Mono", monospace; }
.pipe-hex {
  position: relative;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  width: 52px; height: 58px; flex-shrink: 0; background: #8b5cf6;
}
.footer-panel { display: flex; align-items: center; justify-content: space-around; height: 100%; padding: 0 12px; font-family: "Space Mono", monospace; }
.status-ok { color: #22c55e; }
.status-off { color: #ef4444; }
.scroll-text { display: flex; align-items: center; height: 100%; padding: 0 12px; overflow: hidden; }
.scroll-text span { font-size: 13px; font-weight: 600; color: #00f6ff; white-space: nowrap; text-shadow: 0 0 10px rgba(0,246,255,0.5); }
</style>

<style lang="less">
.tui-grid-item {
  background: transparent !important;
  border: none !important;
}
</style>
