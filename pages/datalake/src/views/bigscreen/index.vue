<template>
  <div class="bigscreen">
    <!-- 顶部标题栏 -->
    <div class="bigscreen-header">
      <div class="bigscreen-title">
        <svg class="bigscreen-logo" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span>数据中台 · 全景大屏</span>
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="bigscreen-metrics">
      <template v-for="(m, idx) in metrics" :key="m.label">
        <!-- 六边形指标（前4项） -->
        <div v-if="idx < 4" class="metric-hex-cell" :style="{ '--accent': m.color }">
          <div class="metric-hex-wrap">
            <div class="metric-hex">
              <div class="metric-hex-inner">
                <el-icon :size="18"><component :is="m.icon" /></el-icon>
              </div>
            </div>
          </div>
          <div class="metric-hex-value">{{ m.value }}</div>
          <div class="metric-hex-label">{{ m.label }}</div>
        </div>
        <!-- 普通卡片（后2项） -->
        <div v-else class="metric-card" :style="{ '--accent': m.color }">
          <div class="metric-icon"><el-icon :size="22"><component :is="m.icon" /></el-icon></div>
          <div class="metric-body">
            <div class="metric-value">{{ m.value }}</div>
            <div class="metric-label">{{ m.label }}</div>
          </div>
          <div class="metric-trend" v-if="m.trend != null">
            <span :class="m.trend > 0 ? 'up' : 'down'">{{ m.trend > 0 ? '+' : '' }}{{ m.trend }}%</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 图表区（无 el-card 包装） -->
    <div class="bigscreen-charts">
      <div class="chart-panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#3b82f6" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>吞吐量趋势</span>
        </div>
        <div ref="throughputRef" class="chart-box" />
      </div>
      <div class="chart-panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>错误率趋势</span>
        </div>
        <div ref="errorRef" class="chart-box" />
      </div>
    </div>

    <!-- 架构图（六边形，无 el-card） -->
    <div class="bigscreen-arch">
      <div class="section-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span>系统架构</span>
      </div>
      <div class="arch-flow">
        <template v-for="(layer, idx) in archLayers" :key="layer.name">
          <div class="arch-hex-wrap" :style="{ '--hex-color': layer.color }">
            <div class="arch-hex">
              <div class="arch-hex-inner">
                <div class="arch-icon" :style="{ background: layer.color + '18', color: layer.color }">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path :d="layer.icon" />
                  </svg>
                </div>
                <div class="arch-badge" :style="{ color: layer.color }">{{ layer.badge }}</div>
                <div class="arch-name">{{ layer.name }}</div>
                <div class="arch-stat" :style="{ color: layer.color }">{{ layer.stat ?? '--' }}</div>
              </div>
            </div>
            <div class="hex-glow" />
          </div>
          <div class="arch-connector" v-if="idx < archLayers.length - 1">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.5">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>
        </template>
      </div>
    </div>

    <!-- 节点拓扑（按类型聚合，实时数据驱动大小） -->
    <div class="bigscreen-topology">
      <div class="section-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
        <span>节点拓扑</span>
        <span class="section-badge">{{ nodeStats.length }}</span>
        <span class="section-hint" v-if="wsConnected">实时</span>
        <span class="section-hint offline" v-else>离线</span>
      </div>
      <div class="topology-flow">
        <div v-if="nodeStats.length === 0" class="pipeline-empty">
          <div class="empty-dots"><span /><span /><span /></div>
          <span>等待节点数据推送...</span>
        </div>
        <template v-for="(node, idx) in nodeStats" :key="node.type">
          <div class="arch-connector sm" v-if="idx > 0">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>
          <div
            class="nd-hex-wrap"
            :style="{
              '--hex-color': node.color,
              '--hex-w': node.size + 'px',
              '--hex-h': Math.round(node.size * 1.08) + 'px',
            }"
          >
            <div class="nd-hex">
              <div class="nd-hex-inner">
                <div class="nd-label">{{ node.name }}</div>
                <div class="nd-count">{{ node.count }}</div>
                <div class="nd-stat">{{ formatVol(node.volume) }}/s</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 管线拓扑（六边形流，无 el-card） -->
    <div class="bigscreen-pipelines">
      <div class="section-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="2">
          <polyline points="22 12 16 12 14 16 10 8 8 12 2 12" />
        </svg>
        <span>管线拓扑</span>
        <span class="section-badge">{{ pipelines.length }}</span>
        <span class="section-hint" v-if="wsConnected">实时</span>
        <span class="section-hint offline" v-else>离线</span>
      </div>
      <div class="pipeline-scroll">
        <div v-if="pipelines.length === 0" class="pipeline-empty">
          <div class="empty-dots">
            <span /><span /><span />
          </div>
          <span>等待管线数据推送...</span>
        </div>
        <div v-for="p in pipelines" :key="p.id" class="pipeline-row">
          <!-- 管线名称（大六边形） -->
          <div class="pl-hex-wrap" :style="{ '--hex-color': '#8b5cf6', '--hex-w': '100px', '--hex-h': '110px' }">
            <div class="pl-hex">
              <div class="pl-hex-inner">
                <div class="pl-name">{{ p.name }}</div>
                <div class="pl-vol">{{ formatVol(p.dataVolume) }}</div>
              </div>
            </div>
          </div>
          <!-- 管线节点 -->
          <template v-for="node in p.nodes" :key="node.id">
            <div class="arch-connector sm">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </div>
            <div
              class="nd-hex-wrap"
              :style="{
                '--hex-color': node.color,
                '--hex-w': node.size + 'px',
                '--hex-h': Math.round(node.size * 1.08) + 'px',
              }"
            >
              <div class="nd-hex">
                <div class="nd-hex-inner">
                  <div class="nd-label">{{ node.name }}</div>
                  <div class="nd-stat">{{ formatVol(node.volume) }}/s</div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 节点关系图谱 -->
    <div class="bigscreen-graph">
      <div class="section-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="2">
          <circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" />
          <line x1="9" y1="6" x2="15" y2="6" /><line x1="7" y1="8" x2="11" y2="16" /><line x1="17" y1="8" x2="13" y2="16" />
        </svg>
        <span>节点关系图谱</span>
        <span class="section-badge">{{ graphNodes.length }}</span>
        <span class="section-hint" v-if="wsConnected">实时</span>
        <span class="section-hint offline" v-else>离线</span>
      </div>
      <div ref="graphRef" class="graph-chart-box" />
    </div>

    <!-- 底部状态 -->
    <div class="bigscreen-footer">
      <div class="footer-item">
        <span class="footer-label">系统状态</span>
        <span class="footer-value status-ok">● 运行正常</span>
      </div>
      <div class="footer-item">
        <span class="footer-label">采集节点</span>
        <span class="footer-value">{{ metrics[4].value }}</span>
      </div>
      <div class="footer-item">
        <span class="footer-label">今日处理</span>
        <span class="footer-value">{{ metrics[1].value }}</span>
      </div>
      <div class="footer-item">
        <span class="footer-label">WS 状态</span>
        <span class="footer-value" :class="wsConnected ? 'status-ok' : 'status-off'">{{ wsConnected ? '已连接' : '断开' }}</span>
      </div>
      <div class="footer-item">
        <span class="footer-label">更新时间</span>
        <span class="footer-value">{{ lastUpdateTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { DataBoard, Timer, Warning, Connection, Bell } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { connectWs, disconnectWs, onWsMessage } from "../../api/ws";
import type { MonitorStats } from "../../types";

defineOptions({ name: "DatalakeBigscreenPage" });

// ── WS 连接状态 ──
const wsConnected = ref(false);
const lastUpdateTime = ref("--");

// ── 指标 ──
const stats = ref<MonitorStats | null>(null);
const metrics = ref([
  { label: "活跃管线", value: "0", color: "#3b82f6", icon: DataBoard, trend: null as number | null },
  { label: "今日处理", value: "0", color: "#22c55e", icon: Timer, trend: null as number | null },
  { label: "今日错误", value: "0", color: "#ef4444", icon: Warning, trend: null as number | null },
  { label: "吞吐量", value: "0/s", color: "#f59e0b", icon: Connection, trend: null as number | null },
  { label: "采集客户端", value: "0", color: "#00ffff", icon: DataBoard, trend: null as number | null },
  { label: "订阅数", value: "0", color: "#8b5cf6", icon: Bell, trend: null as number | null },
]);

// ── 架构统计数据（由 WS 推送更新） ──
const archStatRaw = ref<(number | string)[]>(Array(6).fill("--"));

const archLayers = computed(() => {
  const config = [
    { name: "数据源", desc: "外部系统接入", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M9 12h6M12 9v6M2 7h20", color: "#10b981", badge: "SOURCE" },
    { name: "采集层", desc: "多协议采集", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2", color: "#3b82f6", badge: "COLLECT" },
    { name: "管线层", desc: "流式处理引擎", icon: "M22 12h-4l-3 9-4-18-3 9H2", color: "#8b5cf6", badge: "PIPELINE" },
    { name: "消息总线", desc: "异步解耦分发", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", color: "#f59e0b", badge: "EVENT BUS" },
    { name: "存储层", desc: "持久化与归档", icon: "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M3 7h18", color: "#06b6d4", badge: "STORAGE" },
    { name: "API 输出", desc: "订阅与推送", icon: "M5 12h14M12 5l7 7-7 7", color: "#ec4899", badge: "OUTPUT" },
  ];
  return config.map((c, i) => ({ ...c, stat: archStatRaw.value[i] ?? "--" }));
});

// ── 图表 ──
const throughputRef = ref<HTMLElement>();
const errorRef = ref<HTMLElement>();
const graphRef = ref<HTMLElement>();
let throughputChart: echarts.ECharts | null = null;
let errorChart: echarts.ECharts | null = null;
let graphChart: echarts.ECharts | null = null;
const graphNodes = ref<{ name: string; color: string }[]>([]);

const chartTheme = {
  tooltip: {
    trigger: "axis" as const,
    backgroundColor: "rgba(11,15,34,0.9)",
    borderColor: "#1e2a45",
    textStyle: { color: "#e2e8f0" },
  },
  grid: { left: 50, right: 20, top: 25, bottom: 25 },
};

function initCharts() {
  // 初始化图表——无假数据，等待 WS 推送
  if (throughputRef.value) {
    throughputChart = echarts.init(throughputRef.value);
    throughputChart.setOption({
      ...chartTheme,
      xAxis: { type: "category", data: [], axisLine: { lineStyle: { color: "#1e2a45" } }, axisLabel: { color: "#5a6478" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(30,42,69,0.5)" } }, axisLabel: { color: "#5a6478" } },
      series: [{
        type: "line", smooth: true, data: [],
        lineStyle: { color: "#3b82f6", width: 1.5 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(59,130,246,0.25)" },
          { offset: 1, color: "rgba(59,130,246,0.02)" },
        ])},
        itemStyle: { color: "#3b82f6" },
      }],
    });
  }
  if (errorRef.value) {
    errorChart = echarts.init(errorRef.value);
    errorChart.setOption({
      ...chartTheme,
      xAxis: { type: "category", data: [], axisLine: { lineStyle: { color: "#1e2a45" } }, axisLabel: { color: "#5a6478" } },
      yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(30,42,69,0.5)" } }, axisLabel: { color: "#5a6478" } },
      series: [{
        type: "line", smooth: true, data: [],
        lineStyle: { color: "#ef4444", width: 1.5 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(239,68,68,0.25)" },
          { offset: 1, color: "rgba(239,68,68,0.02)" },
        ])},
        itemStyle: { color: "#ef4444" },
      }],
    });
  }
  if (graphRef.value) {
    graphChart = echarts.init(graphRef.value);
    graphChart.setOption({
      tooltip: {
        backgroundColor: "rgba(11,15,34,0.9)",
        borderColor: "#1e2a45",
        textStyle: { color: "#e2e8f0", fontSize: 11 },
        formatter: (params: any) => {
          if (params.dataType === "node") {
            return `<strong>${params.name}</strong><br/>流量: ${params.value ?? "--"}`;
          }
          return "";
        },
      },
      series: [{
        type: "graph",
        layout: "force",
        force: { repulsion: 200, edgeLength: 100, gravity: 0.1 },
        roam: true,
        draggable: true,
        data: [],
        edges: [],
        label: {
          show: true,
          position: "bottom",
          color: "#94a3b8",
          fontSize: 10,
          fontFamily: "Space Mono, monospace",
        },
        lineStyle: { color: "source", curveness: 0.3, opacity: 0.3 },
        emphasis: { focus: "adjacency", lineStyle: { width: 2 } },
      }],
    });
  }
}

// ── 管线拓扑 ──
interface PipelineNode {
  id: string;
  name: string;
  type: string;
  size: number;
  volume: number;
  color: string;
}
interface PipelineInfo {
  id: string;
  name: string;
  dataVolume: number;
  nodes: PipelineNode[];
}

const pipelines = ref<PipelineInfo[]>([]);

const typeColors: Record<string, string> = {
  source: "#10b981", parse: "#3b82f6", clean: "#06b6d4",
  standardize: "#06b6d4", transform: "#8b5cf6", filter: "#f59e0b",
  enrich: "#ec4899", router: "#ef4444", aggregate: "#6366f1",
  script: "#14b8a6", delay: "#f97316", sink: "#64748b",
  "table-structure": "#a855f7",
};

function formatVol(v: number): string {
  if (!v && v !== 0) return "--";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(v);
}

function updateChart(chart: echarts.ECharts | null, data: Array<{ time: string; value: number }>) {
  if (!chart || !data?.length) return;
  chart.setOption({
    xAxis: { data: data.map((d) => { const t = new Date(d.time); return t.getHours() + ":00"; }) },
    series: [{ data: data.map((d) => d.value) }],
  });
}

function applyMonitorStats(s: MonitorStats) {
  stats.value = s;
  metrics.value = [
    { label: "活跃管线", value: String(s.activePipelines ?? 0), color: "#3b82f6", icon: DataBoard, trend: null },
    { label: "今日处理", value: (s.todayProcessed ?? 0).toLocaleString(), color: "#22c55e", icon: Timer, trend: null },
    { label: "今日错误", value: String(s.todayErrors ?? 0), color: "#ef4444", icon: Warning, trend: null },
    { label: "吞吐量", value: (s.throughput ?? 0) + "/s", color: "#f59e0b", icon: Connection, trend: null },
    { label: "采集客户端", value: String(s.collectorCount ?? 0), color: "#00ffff", icon: DataBoard, trend: null },
    { label: "订阅数", value: String(s.activeSubscriptions ?? 0), color: "#8b5cf6", icon: Bell, trend: null },
  ];
}

function applyPipelineData(data: any[]) {
  if (!Array.isArray(data)) return;
  pipelines.value = data.map((p: any) => ({
    id: p.id,
    name: p.name || p.id || "未知管线",
    dataVolume: p.dataVolume || 0,
    nodes: (p.nodes || []).map((n: any, ni: number) => {
      const vol = n.volume || 50;
      return {
        id: n.id || `${p.id}-${ni}`,
        name: n.name || n.type || `节点${ni + 1}`,
        type: n.type || "default",
        size: Math.max(48, Math.min(100, Math.round(vol / 20))),
        volume: vol,
        color: typeColors[n.type] || "#64748b",
      };
    }),
  }));
}

function applyArchStats(arr: (number | string)[]) {
  if (Array.isArray(arr) && arr.length === 6) {
    archStatRaw.value = arr.map((v) => (v ?? "--"));
  }
}

// ── 节点拓扑 ──
interface NodeStatInfo {
  type: string;
  name: string;
  count: number;
  volume: number;
  size: number;
  color: string;
}

const nodeStats = ref<NodeStatInfo[]>([]);

function applyNodeStats(data: any[]) {
  if (!Array.isArray(data)) return;
  nodeStats.value = data.map((n: any) => {
    const vol = n.volume || 0;
    return {
      type: n.type || "unknown",
      name: n.name || n.type || "未知",
      count: n.count ?? 0,
      volume: vol,
      size: Math.max(48, Math.min(100, Math.round(vol / 20))),
      color: typeColors[n.type] || "#64748b",
    };
  });
}

function applyGraphData(data: { nodes?: any[]; edges?: any[] }) {
  if (!data || !data.nodes?.length) return;
  graphNodes.value = data.nodes.map((n: any) => ({
    name: n.name || n.type || "未知",
    color: n.color || typeColors[n.type] || "#64748b",
  }));
  if (!graphChart) return;
  const chartNodes = data.nodes.map((n: any, i: number) => ({
    id: String(i),
    name: n.name || n.type || "未知",
    value: n.volume || n.count || 0,
    itemStyle: { color: n.color || typeColors[n.type] || "#64748b" },
    symbolSize: Math.max(24, Math.min(64, (n.volume || 50) / 10)),
  }));
  const edges = data.edges || [];
  let chartEdges: any[];
  if (edges.length > 0) {
    chartEdges = edges.map((e: any) => ({
      source: String(e.source ?? 0),
      target: String(e.target ?? 1),
      lineStyle: { color: "rgba(255,255,255,0.15)", width: e.width || 1 },
    }));
  } else if (chartNodes.length > 1) {
    chartEdges = [];
    for (let i = 0; i < chartNodes.length - 1; i++) {
      chartEdges.push({ source: String(i), target: String(i + 1), lineStyle: { color: "rgba(255,255,255,0.15)", width: 1 } });
    }
    if (chartNodes.length > 3) {
      chartEdges.push({ source: String(0), target: String(chartNodes.length - 1), lineStyle: { color: "rgba(255,255,255,0.08)", width: 0.5, type: "dashed" as const } });
    }
  } else {
    chartEdges = [];
  }
  graphChart.setOption({ series: [{ data: chartNodes, edges: chartEdges }] });
}

// ── WebSocket 消息处理 ──
function handleWsMessage(data: any) {
  if (!data || !data.type) return;
  wsConnected.value = true;
  lastUpdateTime.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });

  if (data.type === "monitor_update") {
    if (data.stats) applyMonitorStats(data.stats);
    if (data.throughput?.length) updateChart(throughputChart, data.throughput);
    if (data.errors?.length) updateChart(errorChart, data.errors);
    if (data.archStats) applyArchStats(data.archStats);
  }
  if (data.type === "pipeline_update") {
    if (data.pipelines) applyPipelineData(data.pipelines);
  }
  if (data.type === "node_update") {
    if (data.nodes) {
      applyNodeStats(data.nodes);
      applyGraphData(data);
    }
  }
  if (data.type === "graph_update") {
    if (data.data) applyGraphData(data.data);
  }
}

// ── 生命周期 ──
let unsubWs: (() => void) | null = null;

onMounted(() => {
  initCharts();

  // 仅通过 WebSocket 接收数据，无 REST 回退
  connectWs();
  unsubWs = onWsMessage(handleWsMessage);

  // 监控 WS 连接状态
  const wsCheck = setInterval(() => {
    wsConnected.value = (window as any).__wsConnected__ === true;
  }, 3000);

  onBeforeUnmount(() => {
    clearInterval(wsCheck);
  });
});

onBeforeUnmount(() => {
  throughputChart?.dispose();
  errorChart?.dispose();
  graphChart?.dispose();
  unsubWs?.();
});
</script>

<style scoped>
/* ═══════════════════════════════════════════
   数据中台全景大屏 — 暗色科技 · 六边形主题
   ═══════════════════════════════════════════ */
.bigscreen {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 4px;
  font-family: "Space Mono", "Courier New", monospace;
}

/* ── 通用区段标题 ── */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.section-badge {
  font-size: 10px;
  color: #5a6478;
  background: rgba(0, 180, 255, 0.06);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 10px;
  padding: 0 8px;
  font-family: "Space Mono", monospace;
}
.section-hint {
  font-size: 9px;
  color: #22c55e;
  margin-left: auto;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.section-hint.offline {
  color: #ef4444;
}

/* ── 标题栏 ── */
.bigscreen-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: rgba(8, 16, 36, 0.9);
  border: 1px solid rgba(0, 180, 255, 0.12);
  border-radius: 10px;
}
.bigscreen-header::after {
  content: "";
  position: absolute;
  top: -1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
}
.bigscreen-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.06em;
}
.bigscreen-logo {
  color: #38bdf8;
  filter: drop-shadow(0 0 6px rgba(0, 180, 255, 0.4));
}

/* ── 指标卡片 ── */
.bigscreen-metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: rgba(12, 22, 44, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
  border-left: 3px solid var(--accent, #3b82f6);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
}
.metric-card:hover {
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent, #3b82f6) 15%, transparent), inset 0 0 30px color-mix(in srgb, var(--accent, #3b82f6) 3%, transparent);
  transform: translateY(-1px);
}
.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent, #3b82f6) 12%, transparent);
  color: var(--accent, #3b82f6);
  flex-shrink: 0;
}
.metric-body { flex: 1; min-width: 0; }
.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.2;
  font-family: "Space Mono", "Courier New", monospace;
}
.metric-label {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.7);
  margin-top: 2px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.metric-trend {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  font-family: "Space Mono", "Courier New", monospace;
}
.metric-trend .up { color: #22c55e; text-shadow: 0 0 6px rgba(34, 197, 94, 0.3); }
.metric-trend .down { color: #ef4444; text-shadow: 0 0 6px rgba(239, 68, 68, 0.3); }

/* ── 六边形指标 ── */
.metric-hex-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background: rgba(12, 22, 44, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.metric-hex-cell:hover {
  border-color: var(--accent);
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 15%, transparent);
}
.metric-hex-wrap {
  width: 56px;
  height: 62px;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 10%, transparent));
  transition: filter 0.3s;
}
.metric-hex-cell:hover .metric-hex-wrap {
  filter: drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 25%, transparent));
}
.metric-hex {
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: var(--accent);
  position: relative;
}
.metric-hex-inner {
  position: absolute;
  top: 1.5px; left: 1.5px;
  right: 1.5px; bottom: 1.5px;
  background: linear-gradient(160deg, rgba(10, 18, 38, 0.95), rgba(6, 10, 20, 0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}
.metric-hex-value {
  font-size: 16px;
  font-weight: 700;
  color: #e2e8f0;
  margin-top: 6px;
  font-family: "Space Mono", "Courier New", monospace;
  line-height: 1.2;
}
.metric-hex-label {
  font-size: 9px;
  color: rgba(148, 163, 184, 0.6);
  margin-top: 2px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── 图表面板（无 el-card） ── */
.bigscreen-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-height: 0;
}
.chart-panel {
  background: rgba(12, 22, 44, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.chart-box {
  flex: 1;
  min-height: 160px;
  width: 100%;
}
.chart-panel:last-child {
  background: none;
  backdrop-filter: none;
  border: none;
  border-radius: 0;
}

/* ── 架构图 — 六边形流 ── */
.bigscreen-arch {
  background: rgba(12, 22, 44, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}
.arch-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 16px 8px;
}

/* 架构六边形 */
.arch-hex-wrap {
  width: 118px;
  height: 130px;
  flex-shrink: 0;
  position: relative;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--hex-color) 12%, transparent));
  transition: filter 0.3s;
  cursor: default;
}
.arch-hex-wrap:hover {
  filter: drop-shadow(0 0 20px color-mix(in srgb, var(--hex-color) 30%, transparent));
}
.arch-hex {
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: var(--hex-color);
  position: relative;
}
.arch-hex-inner {
  position: absolute;
  top: 1.5px; left: 1.5px;
  right: 1.5px; bottom: 1.5px;
  background: linear-gradient(160deg, rgba(10, 18, 38, 0.95), rgba(6, 10, 20, 0.95));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 4px;
}
.arch-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}
.arch-badge {
  font-size: 6.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0 4px;
  border-radius: 2px;
  line-height: 1.6;
  font-family: "Space Mono", monospace;
}
.arch-name {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.3;
}
.arch-stat {
  font-size: 14px;
  font-weight: 700;
  font-family: "Space Mono", monospace;
  line-height: 1.2;
}
.arch-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
}
.arch-connector.sm {
  width: 16px;
}

/* 内发光 */
.hex-glow {
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  pointer-events: none;
  box-shadow: inset 0 0 20px rgba(0, 180, 255, 0.04);
}

/* ── 节点拓扑 — 六边形流 ── */
.bigscreen-topology {
  background: rgba(12, 22, 44, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}
.topology-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 16px 8px;
  overflow-x: auto;
}
.nd-count {
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  font-family: "Space Mono", monospace;
  line-height: 1.1;
}

/* ── 管线拓扑 — 六边形流 ── */
.bigscreen-pipelines {
  background: rgba(12, 22, 44, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}
.pipeline-scroll {
  overflow-x: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pipeline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.4);
}
.empty-dots {
  display: flex;
  gap: 6px;
}
.empty-dots span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  animation: dotPulse 1.4s ease-in-out infinite;
}
.empty-dots span:nth-child(2) { animation-delay: 0.2s; }
.empty-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.pipeline-row {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

/* 管线名称六边形 */
.pl-hex-wrap {
  width: var(--hex-w, 100px);
  height: var(--hex-h, 110px);
  flex-shrink: 0;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--hex-color) 15%, transparent));
  transition: filter 0.3s;
}
.pl-hex-wrap:hover {
  filter: drop-shadow(0 0 14px color-mix(in srgb, var(--hex-color) 30%, transparent));
}
.pl-hex {
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: var(--hex-color);
  position: relative;
}
.pl-hex-inner {
  position: absolute;
  top: 1.5px; left: 1.5px;
  right: 1.5px; bottom: 1.5px;
  background: linear-gradient(160deg, rgba(10, 18, 38, 0.95), rgba(6, 10, 20, 0.95));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
}
.pl-name {
  font-size: 11px;
  font-weight: 700;
  color: #e2e8f0;
  text-align: center;
  line-height: 1.2;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pl-vol {
  font-size: 9px;
  color: rgba(148, 163, 184, 0.6);
  font-family: "Space Mono", monospace;
}

/* 节点六边形 */
.nd-hex-wrap {
  width: var(--hex-w, 60px);
  height: var(--hex-h, 65px);
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--hex-color) 10%, transparent));
  transition: filter 0.3s, transform 0.2s;
}
.nd-hex-wrap:hover {
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--hex-color) 25%, transparent));
  transform: translateY(-2px);
}
.nd-hex {
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: color-mix(in srgb, var(--hex-color) 60%, transparent);
  position: relative;
}
.nd-hex-inner {
  position: absolute;
  top: 1px; left: 1px;
  right: 1px; bottom: 1px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: rgba(10, 18, 38, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 2px;
}
.nd-label {
  font-size: 9px;
  font-weight: 600;
  color: #e2e8f0;
  text-align: center;
  line-height: 1.15;
  max-width: calc(var(--hex-w) - 10px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nd-stat {
  font-size: 8px;
  color: rgba(148, 163, 184, 0.6);
  font-family: "Space Mono", monospace;
}

/* ── 底部状态栏 ── */
.bigscreen-footer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 10px 20px;
  background: rgba(8, 16, 36, 0.7);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
}
.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-label {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.6);
  letter-spacing: 0.04em;
}
.footer-value {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  font-family: "Space Mono", "Courier New", monospace;
}
.status-ok {
  color: #22c55e;
  text-shadow: 0 0 6px rgba(34, 197, 94, 0.3);
}
.status-off {
  color: #ef4444;
}

/* ── 节点关系图谱 ── */
.bigscreen-graph {
  background: rgba(12, 22, 44, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 180, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}
.graph-chart-box {
  height: 280px;
  width: 100%;
}

/* ── 响应式 ── */
@media (max-width: 1200px) {
  .bigscreen-metrics { grid-template-columns: repeat(3, 1fr); }
  .bigscreen-charts { grid-template-columns: 1fr; }
  .arch-flow { flex-wrap: wrap; gap: 4px; }
  .arch-connector { transform: rotate(90deg); }
}
</style>
