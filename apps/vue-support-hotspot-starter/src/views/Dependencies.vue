<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">依赖拓扑</span>
        <el-radio-group v-model="mode" size="small">
          <el-radio-button value="graph">图形</el-radio-button>
          <el-radio-button value="table">列表</el-radio-button>
        </el-radio-group>
      </div>
      <el-button size="small" round :loading="loading" @click="load">
        <el-icon class="mr-1"><Refresh /></el-icon>刷新
      </el-button>
    </div>

    <!-- 图形视图 -->
    <div v-if="mode === 'graph'" ref="graphRef" class="graph-panel" />

    <!-- 列表视图 -->
    <div v-else class="table-panel">
      <el-table
        :data="edges"
        class="apm-table"
        empty-text="暂无依赖关系"
      >
        <el-table-column label="源端" min-width="180">
          <template #default="{ row }">
            <span class="mono">{{ row.source }}</span>
          </template>
        </el-table-column>
        <el-table-column label="目标" min-width="180">
          <template #default="{ row }">
            <span class="mono target">{{ row.target }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="protocol" label="协议" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.protocol" size="small" effect="plain" round>{{ row.protocol }}</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="callCount" label="调用次数" width="100" align="center" />
        <el-table-column label="错误" width="80" align="center">
          <template #default="{ row }">
            <span :class="['mono', row.errorCount > 0 ? 'err' : 'muted']">{{ row.errorCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="平均耗时" width="110" align="center">
          <template #default="{ row }">
            <span class="mono">{{ row.avgDurationMs.toFixed(1) }} ms</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getDependencies } from "../api/apmApi";
import type { DependencyEdge } from "../api/apmApi";

const mode = ref<"graph" | "table">("graph");
const edges = ref<DependencyEdge[]>([]);
const loading = ref(false);
const graphRef = ref<HTMLElement | null>(null);

let chart: echarts.ECharts | null = null;

/** 依赖边 → 图形节点（去重） */
const graphNodes = computed(() => {
  const seen = new Map<string, number>();
  for (const e of edges.value) {
    seen.set(e.source, (seen.get(e.source) || 0) + e.callCount);
    seen.set(e.target, (seen.get(e.target) || 0) + e.callCount);
  }
  return Array.from(seen.entries()).map(([id, totalCalls]) => ({
    name: id,
    symbolSize: Math.max(24, Math.min(60, 24 + totalCalls / 50)),
  }));
});

async function load() {
  loading.value = true;
  try {
    const res = await getDependencies();
    edges.value = res.items;
    renderGraph();
  } catch {
    ElMessage.error("加载依赖拓扑失败");
  } finally {
    loading.value = false;
  }
}

function renderGraph() {
  if (!graphRef.value || mode.value !== "graph") return;
  if (!chart) {
    chart = echarts.init(graphRef.value, "dark");
  }
  const nodeNames = new Set<string>();
  const links: { source: string; target: string; value: number; lineStyle: object }[] = [];
  for (const e of edges.value) {
    nodeNames.add(e.source);
    nodeNames.add(e.target);
    links.push({
      source: e.source,
      target: e.target,
      value: e.callCount,
      lineStyle: {
        width: Math.max(1, Math.min(4, e.errorCount > 0 ? 2.5 : 1.2)),
        color: e.errorCount > 0 ? "#ef4444" : "#3b82f6",
        curveness: 0.15,
      },
    });
  }
  const nodes = Array.from(nodeNames).map((name) => ({
    name,
    symbolSize: 32,
    itemStyle: { color: "#3b82f6" },
  }));
  chart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (p: { name?: string; data?: { value?: number } }) =>
        p.data?.value !== undefined ? `调用 ${p.data.value} 次` : String(p.name ?? ""),
    },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        force: { repulsion: 400, edgeLength: [120, 200] },
        label: { show: true, color: "#e6edf7", fontSize: 11 },
        lineStyle: { color: "#6b7280" },
        data: nodes,
        links,
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
});

function onResize() {
  chart?.resize();
}

watch(mode, () => renderGraph());
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
  gap: 14px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
}

.mr-1 {
  margin-right: 4px;
  vertical-align: -2px;
}

.graph-panel {
  flex: 1;
  min-height: 480px;
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
}

.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 8px;
}

.apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.mono.target {
  color: var(--apm-accent);
}

.mono.err {
  color: var(--apm-danger);
}

.muted {
  color: var(--apm-muted);
  font-size: 12px;
}
</style>
