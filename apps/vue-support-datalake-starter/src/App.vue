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
        @click="switchTab(tab.key)"
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

        <!-- 数据生命周期 -->
        <div class="monitor-grid">
          <ScPanel class="section-card lifecycle-card scifi-section" skin="scifi" tech-theme="A1" padding="0">
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
          </ScPanel>
        </div>

        <!-- 架构图 + 知识图谱 -->
        <div class="architecture-grid">
          <ScPanel class="section-card architecture-card scifi-section" skin="scifi" tech-theme="A2" padding="0">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00ffff" stroke-width="1.5">
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                </svg>
                <span>系统架构图</span>
              </div>
            </div>
            <div class="architecture-flow">
              <div class="arch-lane">
                <template v-for="(node, index) in businessArchitectureNodes" :key="`biz-${node.label}`">
                  <div class="arch-node" :style="{ '--node-color': node.color }">
                    <div class="arch-code">{{ node.code }}</div>
                    <div class="arch-label">{{ node.label }}</div>
                    <div class="arch-value">{{ node.value }}</div>
                  </div>
                  <div v-if="index < businessArchitectureNodes.length - 1" class="arch-line" />
                </template>
              </div>
              <div class="arch-branch">
                <div class="branch-stem"><span>管线完成事件</span></div>
                <div class="arch-lane arch-lane--compact">
                  <template v-for="(node, index) in statsArchitectureNodes" :key="`stats-${node.label}`">
                    <div class="arch-node" :style="{ '--node-color': node.color }">
                      <div class="arch-code">{{ node.code }}</div>
                      <div class="arch-label">{{ node.label }}</div>
                      <div class="arch-value">{{ node.value }}</div>
                    </div>
                    <div v-if="index < statsArchitectureNodes.length - 1" class="arch-line arch-line--branch" />
                  </template>
                </div>
              </div>
            </div>
          </ScPanel>
        </div>

        <ScPanel class="section-card knowledge-card knowledge-card--full scifi-section" skin="scifi" tech-theme="B1" padding="0">
          <div class="section-header">
            <div class="section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00ffff" stroke-width="1.5">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="12" cy="18" r="3" />
                <path d="M9 6h6M7.4 8.4l3.2 7.2M16.6 8.4l-3.2 7.2" />
              </svg>
              <span>知识图谱</span>
            </div>
            <span class="graph-hint">滚轮缩放 · 拖拽移动</span>
          </div>
          <div class="knowledge-graph knowledge-graph--large">
            <div ref="knowledgeGraphRef" class="knowledge-graph-canvas knowledge-graph-canvas--large" />
          </div>
        </ScPanel>

        <!-- 图表 -->
        <div class="chart-grid">
          <ScPanel class="section-card scifi-section" skin="scifi" tech-theme="DV1" padding="0">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#00ffff" stroke-width="1.5">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>吞吐量趋势</span>
              </div>
            </div>
            <div ref="throughputRef" class="chart-box" />
          </ScPanel>
          <ScPanel class="section-card scifi-section" skin="scifi" tech-theme="DV2" padding="0">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="1.5">
                  <path d="M12 9v2m0 4h.01m-6.93 5h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
                <span>错误率趋势</span>
              </div>
            </div>
            <div ref="errorRef" class="chart-box" />
          </ScPanel>
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
import { fetchCollectorList, type CollectorClientInfo } from "@pages/datalake/api/collector";
import { fetchSubscriberList, type SubscriberInfo } from "@pages/datalake/api/subscriber";
import type { MonitorStats, ScGraph, ScGraphNode } from "@pages/datalake/types";
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
const pipelines = ref<ScGraph[]>([]);
const pipelineLifecycleMap = ref<Record<string, string>>({});
const collectorClients = ref<CollectorClientInfo[]>([]);
const subscriberInfos = ref<SubscriberInfo[]>([]);
const plCount = ref(0);
const collectorClientCount = ref(0);
const subscriberCount = ref(0);
const runCount = ref(0);
const pauseCount = ref(0);
const errCount = ref(0);

const throughputRef = ref<HTMLElement>();
const errorRef = ref<HTMLElement>();
let tpChart: echarts.ECharts | null = null;
let errChart: echarts.ECharts | null = null;
const knowledgeGraphRef = ref<HTMLElement>();
let knowledgeChart: echarts.ECharts | null = null;

// === 横幅 ===
const bannerItems = computed(() => [
  { label: "系统状态", value: "● 运行中", color: "#22c55e", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { label: "数据总量", value: (monitorStats.value?.totalProcessed ?? 0).toLocaleString(), color: "#06b6d4", icon: "M3 7h18M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M8 11h8M8 15h5" },
  { label: "今日数据", value: (monitorStats.value?.todayProcessed ?? 0).toLocaleString(), color: "#00ffff", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
  { label: "今日错误", value: (monitorStats.value?.todayErrors ?? 0).toLocaleString(), color: "#ef4444", icon: "M12 9v2m0 4h.01m-6.93 5h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" },
  { label: "吞吐量", value: (monitorStats.value?.throughput ?? 0) + "/s", color: "#f59e0b", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
]);

// === 生命周期 ===
const lifecycleStages = computed(() => [
  { key: "ingest", label: "数据接入", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", color: "#00ffff", count: monitorStats.value?.activePipelines ?? 0 },
  { key: "std", label: "标准化", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", color: "#6366f1", count: plCount.value },
  { key: "route", label: "路由", icon: "M5 12h14M12 5l7 7-7 7", color: "#06b6d4", count: runCount.value },
  { key: "filter", label: "过滤", icon: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z", color: "#f59e0b", count: pauseCount.value },
  { key: "sink", label: "下沉", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", color: "#10b981", count: monitorStats.value?.activeSubscriptions ?? 0 },
  { key: "push", label: "分发", icon: "M22 12h-4l-3 9L9 3l-3 9H2", color: "#ec4899", count: monitorStats.value?.todayErrors ?? 0 },
]);

// === 架构与图谱 ===
const businessArchitectureNodes = computed(() => [
  { code: "COLLECT", label: "采集层", value: collectorClientCount.value, color: "#00ffff" },
  { code: "AUDIT", label: "审计层", value: 1, color: "#64748b" },
  { code: "PIPELINE", label: "管线层", value: activePipelines.value.length, color: "#3b82f6" },
  { code: "MQ", label: "内部MQ", value: 1, color: "#f59e0b" },
  { code: "SINK", label: "业务Sink", value: activeSinkCount.value || monitorStats.value?.sinkCount || 0, color: "#10b981" },
  { code: "SUBSCRIBE", label: "订阅层", value: subscriberCount.value, color: "#ec4899" },
]);

const statsArchitectureNodes = computed(() => [
  { code: "STATS", label: "StatsSink", value: 1, color: "#06b6d4" },
  { code: "SNAPSHOT", label: "统计快照", value: monitorStats.value?.totalProcessed ?? 0, color: "#8b5cf6" },
]);

type KnowledgeNode = {
  name: string;
  label: string;
  value: number;
  x: number;
  y: number;
  color: string;
  size?: number;
};

type KnowledgeEdge = {
  source: string;
  target: string;
};

const activePipelines = computed(() =>
  pipelines.value.filter((pipeline) => getPipelineLifecycle(pipeline) === "RUNNING")
);

const activeSinkCount = computed(() => {
  const names = new Set<string>();
  for (const pipeline of activePipelines.value) {
    (pipeline.nodes || []).forEach((node, index) => {
      if (isSinkNode(node)) names.add(`${pipeline.id}:node:${index}:${node.spi}`);
    });
    Object.keys(pipeline.sinks || {}).forEach((sinkName) => names.add(`${pipeline.id}:sink:${sinkName}`));
  }
  return names.size;
});

const GLOBAL_MQ_NODE = "mq:global";
const GLOBAL_AUDIT_NODE = "audit:global";
const GLOBAL_STATS_NODE = "stats:global";
const GLOBAL_STATS_SNAPSHOT_NODE = "stats:snapshot";

const knowledgeGraphNodes = computed<KnowledgeNode[]>(() => {
  if (!activePipelines.value.length) {
    return [{ name: "empty", label: "暂无运行管线", value: 0, x: 0, y: 0, color: "#5a6478", size: 54 }];
  }

  const nodes: KnowledgeNode[] = [
    { name: GLOBAL_AUDIT_NODE, label: "审计层", value: 1, x: -430, y: 0, color: "#64748b", size: 50 },
    { name: GLOBAL_MQ_NODE, label: "内部MQ", value: 1, x: 260, y: 0, color: "#f59e0b", size: 50 },
    { name: GLOBAL_STATS_NODE, label: "StatsSink", value: 1, x: 360, y: -120, color: "#06b6d4", size: 46 },
    { name: GLOBAL_STATS_SNAPSHOT_NODE, label: "统计快照", value: monitorStats.value?.totalProcessed ?? 0, x: 500, y: -120, color: "#8b5cf6", size: 46 },
  ];

  collectorClients.value.forEach((collector, collectorIndex) => {
    nodes.push({
      name: getCollectorNodeName(collector, collectorIndex),
      label: collector.clientId || "采集器",
      value: 1,
      x: -600,
      y: (collectorIndex - (collectorClients.value.length - 1) / 2) * 80,
      color: "#3b82f6",
      size: 44,
    });
  });

  activePipelines.value.forEach((pipeline, rowIndex) => {
    const pipelineNodes = pipeline.nodes || [];
    const processEntries = pipelineNodes
      .map((node, index) => ({ node, index }))
      .filter((entry) => !isSinkNode(entry.node));
    const sinkEntries = pipelineNodes
      .map((node, index) => ({ node, index }))
      .filter((entry) => isSinkNode(entry.node));
    const baseY = (rowIndex - (activePipelines.value.length - 1) / 2) * 190;
    const pipelineName = `pipeline:${pipeline.id}`;

    nodes.push({
      name: pipelineName,
      label: pipeline.name || pipeline.id,
      value: pipelineNodes.length,
      x: -260,
      y: baseY,
      color: "#00ffff",
      size: 54,
    });

    processEntries.forEach((entry, nodeIndex) => {
      nodes.push({
        name: getPipelineNodeName(pipeline.id, entry.index, entry.node),
        label: getPipelineNodeLabel(entry.node),
        value: 1,
        x: -90 + nodeIndex * Math.min(92, Math.max(72, 280 / Math.max(processEntries.length, 1))),
        y: baseY,
        color: getPipelineNodeColor(entry.node),
        size: 42,
      });
    });

    sinkEntries.forEach((entry, sinkIndex) => {
      nodes.push({
        name: getPipelineNodeName(pipeline.id, entry.index, entry.node),
        label: getPipelineNodeLabel(entry.node),
        value: 1,
        x: 390,
        y: baseY + (sinkIndex - (sinkEntries.length - 1) / 2) * 58,
        color: "#10b981",
        size: 46,
      });
    });

    Object.entries(pipeline.sinks || {}).forEach(([sinkName, sinkConfig], sinkIndex) => {
      nodes.push({
        name: getGraphSinkName(pipeline.id, sinkName),
        label: getSinkLabel(sinkName, sinkConfig),
        value: 1,
        x: 450,
        y: baseY + (sinkIndex + sinkEntries.length - (Object.keys(pipeline.sinks || {}).length + sinkEntries.length - 1) / 2) * 58,
        color: "#10b981",
        size: 46,
      });
    });

    if ((monitorStats.value?.dlqSize ?? 0) > 0) {
      nodes.push({ name: `dlq:${pipeline.id}`, label: "DLQ", value: monitorStats.value?.dlqSize ?? 0, x: 360, y: baseY + 88, color: "#ef4444", size: 42 });
    }
  });

  subscriberInfos.value.forEach((subscriber, subscriberIndex) => {
    nodes.push({
      name: getSubscriberNodeName(subscriber, subscriberIndex),
      label: subscriber.name || subscriber.label || `${subscriber.protocol || "HTTP"} 订阅器`,
      value: 1,
      x: 600,
      y: (subscriberIndex - (subscriberInfos.value.length - 1) / 2) * 80,
      color: "#ec4899",
      size: 42,
    });
  });

  return nodes;
});

const knowledgeGraphEdges = computed<KnowledgeEdge[]>(() => {
  const edges: KnowledgeEdge[] = [];

  collectorClients.value.forEach((collector, collectorIndex) => {
    edges.push({ source: getCollectorNodeName(collector, collectorIndex), target: GLOBAL_AUDIT_NODE });
  });
  edges.push({ source: GLOBAL_MQ_NODE, target: GLOBAL_STATS_NODE });
  edges.push({ source: GLOBAL_STATS_NODE, target: GLOBAL_STATS_SNAPSHOT_NODE });

  activePipelines.value.forEach((pipeline) => {
    const pipelineNodes = pipeline.nodes || [];
    const processEntries = pipelineNodes
      .map((node, index) => ({ node, index }))
      .filter((entry) => !isSinkNode(entry.node));
    const sinkEntries = pipelineNodes
      .map((node, index) => ({ node, index }))
      .filter((entry) => isSinkNode(entry.node));
    const realtimeSinkEntries = sinkEntries.filter((entry) => {
      const text = `${entry.node.type || ""} ${entry.node.spi || ""}`.toLowerCase();
      return text.includes("realtime") || text.includes("实时");
    });
    const pipelineName = `pipeline:${pipeline.id}`;
    const firstProcess = processEntries[0];
    const lastProcess = processEntries[processEntries.length - 1];

    edges.push({ source: GLOBAL_AUDIT_NODE, target: pipelineName });
    edges.push({ source: pipelineName, target: firstProcess ? getPipelineNodeName(pipeline.id, firstProcess.index, firstProcess.node) : GLOBAL_MQ_NODE });

    for (let i = 0; i < processEntries.length - 1; i++) {
      edges.push({
        source: getPipelineNodeName(pipeline.id, processEntries[i].index, processEntries[i].node),
        target: getPipelineNodeName(pipeline.id, processEntries[i + 1].index, processEntries[i + 1].node),
      });
    }

    pipelineNodes.forEach((node, sourceIndex) => {
      if (isSinkNode(node)) return;
      (node.conditions || []).forEach((condition) => {
        const targetIndex = pipelineNodes.findIndex((targetNode, idx) => idx !== sourceIndex && (condition.target === targetNode.spi || condition.target === targetNode.type));
        if (targetIndex >= 0 && !isSinkNode(pipelineNodes[targetIndex])) {
          edges.push({ source: getPipelineNodeName(pipeline.id, sourceIndex, node), target: getPipelineNodeName(pipeline.id, targetIndex, pipelineNodes[targetIndex]) });
        }
      });
    });

    edges.push({
      source: lastProcess ? getPipelineNodeName(pipeline.id, lastProcess.index, lastProcess.node) : pipelineName,
      target: GLOBAL_MQ_NODE,
    });

    sinkEntries.forEach((entry) => {
      edges.push({ source: GLOBAL_MQ_NODE, target: getPipelineNodeName(pipeline.id, entry.index, entry.node) });
    });

    Object.keys(pipeline.sinks || {}).forEach((sinkName) => {
      edges.push({ source: GLOBAL_MQ_NODE, target: getGraphSinkName(pipeline.id, sinkName) });
    });

    const subscriberSources = realtimeSinkEntries.length ? realtimeSinkEntries : sinkEntries.filter((entry) => getPipelineNodeLabel(entry.node).includes("实时"));
    subscriberSources.forEach((entry) => {
      subscriberInfos.value.forEach((subscriber, subscriberIndex) => {
        edges.push({ source: getPipelineNodeName(pipeline.id, entry.index, entry.node), target: getSubscriberNodeName(subscriber, subscriberIndex) });
      });
    });

    if ((monitorStats.value?.dlqSize ?? 0) > 0) edges.push({ source: GLOBAL_MQ_NODE, target: `dlq:${pipeline.id}` });
  });

  return edges;
});


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

const switchTab = async (tab: string) => {
  activeTab.value = tab;
  if (tab === "monitor") {
    await renderMonitorCharts();
  }
};

// === 时钟 ===
const fmtDT = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

type TimePoint = { time: string; value: number };

const unwrapPayload = <T,>(payload: any): T => {
  return (payload?.data ?? payload) as T;
};

const normalizeSeries = (payload: any): TimePoint[] => {
  const raw = unwrapPayload<any>(payload);
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((item) => ({
      time: String(item?.time ?? item?.timestamp ?? ""),
      value: Number(item?.value ?? item?.count ?? 0),
    }))
    .filter((item) => item.time);
};

const formatChartTime = (value: string): string => {
  if (/^\d{1,2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const getStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
};

const getPipelineLifecycle = (pipeline: ScGraph): string => {
  return pipelineLifecycleMap.value[pipeline.id] || (pipeline as any).status || "STOPPED";
};

const isSinkNode = (node: ScGraphNode): boolean => {
  const text = `${node.type || ""} ${node.spi || ""}`.toLowerCase();
  return text.includes("sink") || text.includes("下沉");
};

function isRealtimeSink(node: ScGraphNode): boolean {
  const text = `${node.type || ""} ${node.spi || ""}`.toLowerCase();
  return text.includes("realtime") || text.includes("实时");
}

const belongsToPipeline = (collector: CollectorClientInfo, pipeline: ScGraph, pipelineTopics: string[]): boolean => {
  if (collector.pipelineId && collector.pipelineId === pipeline.id) return true;
  const collectorTopics = getStringList((collector as any).topics);
  return pipelineTopics.length > 0 && collectorTopics.some((topic) => pipelineTopics.includes(topic));
};

const getPipelineNodeName = (pipelineId: string, index: number, node: ScGraphNode): string => {
  return `node:${pipelineId}:${index}:${node.spi || node.type || "unknown"}`;
};

const getPipelineNodeLabel = (node: ScGraphNode): string => {
  if (node.spi === "数据结构") return "表结构";
  if (node.spi === "RealtimeSink") return "实时分发";
  return node.spi || node.type || "未命名节点";
};

const getPipelineNodeColor = (node: ScGraphNode): string => {
  if (isSinkNode(node)) return "#10b981";
  const text = `${node.type || ""} ${node.spi || ""}`.toLowerCase();
  if (text.includes("parser") || text.includes("parse")) return "#3b82f6";
  if (text.includes("filter") || text.includes("clean")) return "#f59e0b";
  if (text.includes("结构") || text.includes("table")) return "#06b6d4";
  return "#6366f1";
};

const getGraphSinkName = (pipelineId: string, sinkName: string): string => {
  return `sink:${pipelineId}:${sinkName}`;
};

function getCollectorNodeName(collector: CollectorClientInfo, index: number): string {
  return `collector:${collector.clientId || index}`;
}

function getSubscriberNodeName(subscriber: SubscriberInfo, index: number): string {
  return `subscriber:${subscriber.protocol || index}:${subscriber.port || ""}`;
}

const getSinkLabel = (sinkName: string, config: Record<string, any>): string => {
  return config?.tableName || config?.name || sinkName;
};

// === 图表 ===
const makeChart = (el: HTMLElement, data: TimePoint[], color: string, name: string) => {
  const c = echarts.init(el, "dark");
  c.setOption({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", backgroundColor: "rgba(5,10,31,0.9)", borderColor: color, borderWidth: 1, textStyle: { color: "#e2e8f0" } },
    grid: { left: 45, right: 15, top: 20, bottom: 20 },
    xAxis: { type: "category", data: data.map((d) => formatChartTime(d.time)), axisLine: { lineStyle: { color: "rgba(0,255,255,0.15)" } }, axisLabel: { color: "#64748b", fontSize: 10 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(0,255,255,0.06)" } }, axisLabel: { color: "#64748b", fontSize: 10 } },
    series: [{ name, type: "line", smooth: true, data: data.map(d => d.value), symbol: "circle", symbolSize: data.length <= 1 ? 8 : 5, showSymbol: true, lineStyle: { color, width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + "40" }, { offset: 1, color: color + "02" }]) } }],
  });
  return c;
};

const makeKnowledgeChart = (el: HTMLElement) => {
  const c = echarts.init(el, "dark");
  c.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(5,10,31,0.9)",
      borderColor: "rgba(0,255,255,0.25)",
      borderWidth: 1,
      textStyle: { color: "#e2e8f0" },
    },
    series: [
      {
        type: "graph",
        layout: "none",
        roam: true,
        draggable: true,
        zoom: 0.82,
        scaleLimit: { min: 0.35, max: 2.5 },
        label: { show: true, color: "#e2e8f0", fontSize: 12 },
        edgeSymbol: ["none", "arrow"],
        edgeSymbolSize: 12,
        lineStyle: { color: "rgba(56,189,248,0.58)", width: 2.2, opacity: 0.9 },
        data: knowledgeGraphNodes.value.map((node) => ({
          name: node.name,
          value: node.value,
          x: node.x,
          y: node.y,
          symbolSize: node.size ?? Math.max(42, 28 + Math.min(node.value, 8) * 4),
          label: { formatter: node.label },
          itemStyle: { color: node.color, shadowBlur: 18, shadowColor: `${node.color}55` },
        })),
        edges: knowledgeGraphEdges.value,
      },
    ],
  });
  return c;
};

// === 数据 ===
const loadData = async () => {
  try {
    const [sr, tr, er, pr, cr, subr] = await Promise.all([
      fetchMonitorStats(),
      fetchThroughput(),
      fetchErrors(),
      fetchPipelineList(),
      fetchCollectorList(),
      fetchSubscriberList(),
    ]);
    monitorStats.value = unwrapPayload<MonitorStats | null>(sr) ?? null;
    tpData.value = normalizeSeries(tr);
    errData.value = normalizeSeries(er);
    collectorClients.value = unwrapPayload<CollectorClientInfo[]>(cr) || [];
    subscriberInfos.value = unwrapPayload<SubscriberInfo[]>(subr) || [];
    collectorClientCount.value = collectorClients.value.length;
    subscriberCount.value = subscriberInfos.value.length;
    const pls = unwrapPayload<ScGraph[]>(pr) || [];
    pipelines.value = pls;
    plCount.value = pls.length;
    runCount.value = 0;
    pauseCount.value = 0;
    errCount.value = 0;
    const lifecycleMap: Record<string, string> = {};
    for (const g of pls) {
      try {
        const statusRes = await fetchPipelineStatus(g.id);
        const st = unwrapPayload<{ id: string; lifecycle: string }>(statusRes);
        const lc = st?.lifecycle || (g as any).status || "STOPPED";
        lifecycleMap[g.id] = lc;
        if (lc === "RUNNING") runCount.value++;
        else if (lc === "PAUSED") pauseCount.value++;
        else if (lc === "ERROR") errCount.value++;
      } catch {
        const lc = (g as any).status || "STOPPED";
        lifecycleMap[g.id] = lc;
        if (lc === "RUNNING") runCount.value++;
        else if (lc === "PAUSED") pauseCount.value++;
        else if (lc === "ERROR") errCount.value++;
      }
    }
    pipelineLifecycleMap.value = lifecycleMap;
  } catch { /* ignore */ }
};

const renderMonitorCharts = async () => {
  await nextTick();
  if (activeTab.value !== "monitor") return;
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      if (throughputRef.value) {
        tpChart?.dispose();
        tpChart = tpData.value.length ? makeChart(throughputRef.value, tpData.value, "#00ffff", "吞吐量") : null;
      }
      if (errorRef.value) {
        errChart?.dispose();
        errChart = errData.value.length ? makeChart(errorRef.value, errData.value, "#ef4444", "错误数") : null;
      }
      if (knowledgeGraphRef.value) {
        knowledgeChart?.dispose();
        knowledgeChart = makeKnowledgeChart(knowledgeGraphRef.value);
      }
      tpChart?.resize();
      errChart?.resize();
      knowledgeChart?.resize();
      resolve();
    });
  });
};

const refreshAll = async () => {
  refreshing.value = true;
  await loadData();
  if (activeTab.value === "monitor") {
    await renderMonitorCharts();
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
  knowledgeChart?.dispose();
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

html,
body,
#app {
  height: 100%;
}

.datalake-app {
  height: 100vh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: url('/images/darkBlue.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: #e2e8f0;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 22px 22px;
  overflow: hidden;
}
.monitor-dashboard {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== 统计横幅 ===== */
.stats-banner {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.architecture-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.knowledge-card--full {
  margin-bottom: 14px;
}

.knowledge-graph.knowledge-graph--large {
  min-height: 420px;
}

.knowledge-graph-canvas.knowledge-graph-canvas--large {
  height: 420px;
}

.section-card {
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
.graph-hint {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.72);
  font-family: "JetBrains Mono", monospace;
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

/* ===== 架构图 + 知识图谱 ===== */
.architecture-card,
.knowledge-card {
  min-height: 260px;
}
.architecture-flow {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 18px;
  padding: 26px 18px;
  min-height: 282px;
  overflow-x: auto;
}
.arch-lane {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: max-content;
}
.arch-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: max-content;
}
.branch-stem {
  position: relative;
  height: 34px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  color: rgba(148, 163, 184, 0.76);
  font-size: 10px;
  letter-spacing: .12em;
  font-family: "JetBrains Mono", monospace;
}
.branch-stem::before {
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
  height: 22px;
  background: linear-gradient(180deg, rgba(245,158,11,.78), rgba(6,182,212,.2));
}
.branch-stem::after {
  content: "";
  position: absolute;
  top: 18px;
  width: 7px;
  height: 7px;
  border-right: 1px solid rgba(6,182,212,.7);
  border-bottom: 1px solid rgba(6,182,212,.7);
  transform: rotate(45deg);
}
.arch-lane--compact .arch-node {
  width: 108px;
  height: 116px;
}
.arch-node {
  width: 112px;
  height: 124px;
  flex-shrink: 0;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: linear-gradient(160deg, color-mix(in srgb, var(--node-color) 28%, rgba(5,10,31,.92)), rgba(5,10,31,.92));
  border: 1px solid color-mix(in srgb, var(--node-color) 36%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-shadow: 0 0 20px color-mix(in srgb, var(--node-color) 18%, transparent);
}
.arch-code {
  font-size: 8px;
  letter-spacing: .12em;
  color: var(--node-color);
  font-family: "JetBrains Mono", monospace;
}
.arch-label {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}
.arch-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--node-color);
  font-family: "JetBrains Mono", monospace;
}
.arch-line {
  width: 34px;
  height: 1px;
  flex-shrink: 0;
  background: linear-gradient(90deg, rgba(0,255,255,.08), rgba(0,255,255,.42), rgba(0,255,255,.08));
  position: relative;
}
.arch-line--branch {
  background: linear-gradient(90deg, rgba(6,182,212,.08), rgba(139,92,246,.52), rgba(6,182,212,.08));
}
.arch-line--branch::after {
  border-color: rgba(139,92,246,.68);
}
.arch-line::after {
  content: "";
  position: absolute;
  right: -2px;
  top: -3px;
  width: 7px;
  height: 7px;
  border-top: 1px solid rgba(0,255,255,.5);
  border-right: 1px solid rgba(0,255,255,.5);
  transform: rotate(45deg);
}
.knowledge-graph {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(0,255,255,.12), transparent 34%),
    linear-gradient(135deg, rgba(0,255,255,.035), rgba(99,102,241,.035));
}
.knowledge-graph-canvas {
  width: 100%;
  height: 220px;
  cursor: grab;
}
.knowledge-graph-canvas:active {
  cursor: grabbing;
}

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
.tab-page {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  animation: fadeIn .3s ease;
}
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
