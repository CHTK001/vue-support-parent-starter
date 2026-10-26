<template>
  <div class="view">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <template v-if="topology">
          {{ topology.center }} · PID {{ topology.jvmPid }}
        </template>
        <template v-else>系统拓扑</template>
      </span>
      <div class="view-bar__actions">
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <ReSkeleton :loading="loading" :rows="4" animated v-if="!topology" />

    <template v-else>
      <!-- 中心节点 + 端口/模块 关系图 -->
      <div class="panel graph-panel">
        <div class="panel-head">
          <span>进程网络拓扑</span>
          <span class="panel-sub">中心 = 本机主机，连线 = 监听端口 / 网络接口 / 加载模块</span>
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
            engine="element"
            :layout-table="{ minHeight: 0 }"
            :settings="{ border: false }"
            :loading="loading"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          />
        </div>
        <!-- 网络连接明细 -->
        <div class="panel">
          <div class="panel-head"><span>活动连接</span><span class="panel-sub">{{ topology.connections.length }} 条</span></div>
          <ReTable
            :data="topology.connections as unknown as Record<string, unknown>[]"
            :columns="connColumns"
            engine="element"
            :layout-table="{ minHeight: 0 }"
            :settings="{ border: false }"
            :loading="loading"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
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
import {
  axisLineColor,
  chartCanvas,
  chartColor,
  colorWithAlpha,
  fgColor,
  mutedColor,
  okColor,
  tooltipStyle,
  warningColor,
} from "../styles/chartTheme";

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

/** 按端口/协议着色（Agent Shell 琥珀、HTTP 翡翠、其余靛蓝），全部取自令牌 */
function portColor(p: { port: number; protocol: string }): string {
  if (p.port === 4567 || p.protocol === "AGENT") return warningColor();
  if (p.protocol === "HTTP" || p.port === 8080 || p.port === 8890) return okColor();
  return chartColor(2);
}

function renderGraph() {
  if (!topology.value || !graphRef.value) return;
  if (!chart) chart = echarts.init(graphRef.value, "light");
  const t = topology.value;
  const centerColor = chartColor(0);
  const nodes = [
    {
      name: t.center,
      symbolSize: 56,
      itemStyle: {
        color: centerColor,
        shadowBlur: 24,
        shadowColor: colorWithAlpha(centerColor, 0.5),
      },
      label: { color: fgColor(), fontSize: 13, fontWeight: 700 },
    },
    ...t.ports.map((p) => ({
      name: `${p.protocol}:${p.port}`,
      symbolSize: 30,
      itemStyle: { color: portColor(p) },
      label: { color: fgColor(), fontSize: 11 },
      category: "port",
    })),
    ...t.modules.slice(0, 12).map((m) => ({
      name: m.label,
      symbolSize: 20,
      itemStyle: { color: mutedColor() },
      label: { color: colorWithAlpha(fgColor(), 0.6), fontSize: 10 },
      category: "module",
    })),
  ];
  const links = [
    ...t.ports.map((p) => ({
      source: t.center,
      target: `${p.protocol}:${p.port}`,
      lineStyle: { color: centerColor, width: 1.5 },
    })),
    ...t.modules.slice(0, 6).map((m) => ({
      source: t.center,
      target: m.label,
      lineStyle: {
        color: colorWithAlpha(mutedColor(), 0.5),
        width: 1,
        type: "dashed" as const,
      },
    })),
  ];
  chart.setOption({
    ...chartCanvas(),
    tooltip: { trigger: "item", ...tooltipStyle() },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        force: { repulsion: 360, edgeLength: [90, 180] },
        data: nodes,
        links,
        label: { show: true, position: "bottom" },
        lineStyle: { color: axisLineColor() },
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
/* 骨架（.view / .view-toolbar / .toolbar-left / .toolbar-right / .section-label /
   .panel / .panel-head / .panel-sub / .panel-row）统一由 styles/layout.css 提供，
   此处只留本页独有部分。 */
.graph-panel {
  min-height: 420px;
}
.graph-body {
  flex: 1;
  min-height: 360px;
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
