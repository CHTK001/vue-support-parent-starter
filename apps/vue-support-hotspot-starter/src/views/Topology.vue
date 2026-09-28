<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">系统拓扑（真实运行值）</span>
        <ReTag v-if="topology" type="success" round>
          {{ topology.center }} · PID {{ topology.jvmPid }}
        </ReTag>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <ReSkeleton :loading="loading" :rows="4" animated v-if="!topology" />

    <template v-else>
      <!-- 中心节点 + 端口/模块 关系图 -->
      <div class="panel graph-panel">
        <div class="panel-head">
          <span>进程网络拓扑</span>
          <span class="panel-sub">中心 = 本机主机，连线 = 监听端口 / 网络接口 / 加载模块（真实值）</span>
        </div>
        <div ref="graphRef" class="graph-body" />
      </div>

      <div class="panel-row">
        <!-- 监听端口 -->
        <div class="panel">
          <div class="panel-head"><span>监听端口</span><span class="panel-sub">{{ topology.ports.length }} 个声明端口</span></div>
          <ReTable
            :data="topology.ports as unknown as Record<string, unknown>[]"
            :columns="portColumns"
            :pagination="false"
            :toolbar="false"
            border

            :loading="loading"
          />
        </div>
        <!-- 网络连接明细 -->
        <div class="panel">
          <div class="panel-head"><span>活动连接</span><span class="panel-sub">{{ topology.connections.length }} 条</span></div>
          <ReTable
            :data="topology.connections as unknown as Record<string, unknown>[]"
            :columns="connColumns"
            :pagination="false"
            :toolbar="false"
            border

            :loading="loading"
          />
        </div>
      </div>

      <!-- 加载模块 -->
      <div class="panel">
        <div class="panel-head"><span>核心模块（classpath 入口）</span><span class="panel-sub">{{ topology.modules.length }} 个</span></div>
        <div class="module-chips">
          <ReTag
            v-for="m in topology.modules.slice(0, 24)"
            :key="m.id"
            type="info"
            effect="plain"
            class="module-chip"
          >
            {{ m.label }}
          </ReTag>
          <ReTag v-if="topology.modules.length > 24" type="info" round>+{{ topology.modules.length - 24 }}</ReTag>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import ReTag from "@repo/ui/re-tag";
import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getSystemTopology } from "../api/apmApi";
import type { SystemTopology } from "../api/apmApi";

const topology = ref<SystemTopology | null>(null);
const loading = ref(false);
const graphRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

const portColumns: ReTableColumn[] = [
  { prop: "port", label: "端口", width: 80, align: "center" },
  { prop: "label", label: "服务", minWidth: 120 },
  { prop: "protocol", label: "协议", width: 90 },
  { prop: "software", label: "软件", minWidth: 100 },
];

const connColumns: ReTableColumn[] = [
  { prop: "iface", label: "接口", width: 110 },
  { prop: "local", label: "本机地址", minWidth: 140 },
  { prop: "mac", label: "MAC", minWidth: 140 },
];

async function load() {
  loading.value = true;
  try {
    topology.value = await getSystemTopology();
    renderGraph();
  } catch {
    /* 后端未就绪时降级 */
  } finally {
    loading.value = false;
  }
}

/** 按端口/协议着色（Agent Shell 橙色、HTTP 绿色、其余紫色） */
function portColor(p: { port: number; protocol: string }): string {
  if (p.port === 4567 || p.protocol === "AGENT") return "#f59e0b";
  if (p.protocol === "HTTP" || p.port === 8080 || p.port === 8890) return "#22c55e";
  return "#8b5cf6";
}

function renderGraph() {
  if (!topology.value || !graphRef.value) return;
  if (!chart) chart = echarts.init(graphRef.value, "dark");
  const t = topology.value;
  const nodes = [
    {
      name: t.center,
      symbolSize: 56,
      itemStyle: { color: "#3b82f6", shadowBlur: 24, shadowColor: "rgba(59,130,246,0.5)" },
      label: { color: "#e6edf7", fontSize: 13, fontWeight: 700 },
    },
    ...t.ports.map((p) => ({
      name: `${p.protocol}:${p.port}`,
      symbolSize: 30,
      itemStyle: { color: portColor(p) },
      label: { color: "#e6edf7", fontSize: 11 },
      category: "port",
    })),
    ...t.modules.slice(0, 12).map((m) => ({
      name: m.label,
      symbolSize: 20,
      itemStyle: { color: "#6b7280" },
      label: { color: "rgba(230,237,247,0.6)", fontSize: 10 },
      category: "module",
    })),
  ];
  const links = [
    ...t.ports.map((p) => ({
      source: t.center,
      target: `${p.protocol}:${p.port}`,
      lineStyle: { color: "#3b82f6", width: 1.5 },
    })),
    ...t.modules.slice(0, 6).map((m, i) => ({
      source: t.center,
      target: m.label,
      lineStyle: { color: "rgba(107,114,128,0.5)", width: 1, type: "dashed" as const },
    })),
  ];
  chart.setOption({
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        force: { repulsion: 360, edgeLength: [90, 180] },
        data: nodes,
        links,
        label: { show: true, position: "bottom" },
        lineStyle: { color: "#6b7280" },
        categories: [
          { name: "center" },
          { name: "port" },
          { name: "module" },
        ],
      },
    ],
  });
}

onMounted(() => {
  load();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  chart?.dispose();
  chart = null;
});

function onResize() {
  chart?.resize();
}
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label {
  font-size: 14px;
  font-weight: 600;
}
.panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px，取最近档 lg */
  padding: 16px;
}
.panel-head {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.panel-sub {
  font-size: 12px;
  color: var(--apm-muted);
  font-weight: 400;
}
.graph-panel {
  min-height: 420px;
  display: flex;
  flex-direction: column;
}
.graph-body {
  flex: 1;
  min-height: 360px;
}
.panel-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.module-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.module-chip {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .panel-row {
    grid-template-columns: 1fr;
  }
}

/* 尊重系统「减少动态效果」偏好：
   本页自身无 transition/animation，需关掉的是骨架屏与 loading 的旋转动画 */
@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
