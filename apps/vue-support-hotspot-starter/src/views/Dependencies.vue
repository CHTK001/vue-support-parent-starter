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
      <div class="toolbar-right">
        <el-select v-model="injectProto" size="small" style="width: 96px">
          <el-option v-for="p in ['HTTP','REDIS','MYSQL','GRPC','KAFKA']" :key="p" :label="p" :value="p" />
        </el-select>
        <el-input v-model="injectTarget" placeholder="目标 host:port" size="small" style="width: 170px" clearable />
        <el-button size="small" type="primary" round :loading="injecting" @click="doInject">
          <el-icon class="mr-1"><Plus /></el-icon>注入一条调用
        </el-button>
        <el-button size="small" round :loading="batching" @click="doBatch">
          <el-icon class="mr-1"><MagicStick /></el-icon>批量×20
        </el-button>
        <el-button size="small" round :loading="loading" @click="load">
          <el-icon class="mr-1"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 图形视图 -->
    <div v-if="mode === 'graph'" ref="graphRef" class="graph-panel" />

    <!-- 列表视图 -->
    <div v-else class="table-panel">
      <div class="table-filter">
        <el-input
          v-model="listKeyword"
          placeholder="过滤 源/目标/协议…"
          clearable
          size="small"
          style="width: 220px"
        />
        <el-checkbox v-model="listErrorOnly" size="small">仅看错误边</el-checkbox>
        <span class="filter-hint">聚合后 {{ filteredEdges.length }} / {{ edges.length }} 条边</span>
      </div>
      <el-table
        :data="filteredEdges"
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
        <el-table-column prop="callCount" label="调用次数" width="100" align="center" sortable />
        <el-table-column label="P95 耗时" width="100" align="center" sortable sort-by="p95Ms">
          <template #default="{ row }">
            <span class="mono">{{ (row.p95Ms ?? 0).toFixed(1) }} ms</span>
          </template>
        </el-table-column>
        <el-table-column label="错误" width="80" align="center">
          <template #default="{ row }">
            <span :class="['mono', row.errorCount > 0 ? 'err' : 'muted']">{{ row.errorCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="错误率" width="90" align="center" sortable sort-by="errorRate">
          <template #default="{ row }">
            <span :class="['mono', (row.errorRate ?? 0) > 5 ? 'err' : (row.errorRate ?? 0) > 1 ? 'warn' : 'muted']">
              {{ (row.errorRate ?? 0).toFixed(2) }}%
            </span>
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
import { Refresh, Plus, MagicStick } from "@element-plus/icons-vue";
import { getDependenciesAggregated, injectTransmission, injectBatch } from "../api/apmApi";
import type { DependencyEdge } from "../api/apmApi";

const mode = ref<"graph" | "table">("graph");
const edges = ref<DependencyEdge[]>([]);
const loading = ref(false);
const graphRef = ref<HTMLElement | null>(null);
const listKeyword = ref("");
const listErrorOnly = ref(false);

/** 列表视图：前端过滤聚合边 */
const filteredEdges = computed(() => {
  const kw = listKeyword.value.trim().toLowerCase();  return edges.value.filter((e) => {
    if (listErrorOnly.value && e.errorCount === 0) return false;
    if (!kw) return true;
    return (
      e.source.toLowerCase().includes(kw) ||
      e.target.toLowerCase().includes(kw) ||
      (e.protocol || "").toLowerCase().includes(kw)
    );
  });
});

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

// ---- 注入：页面操作产生真实数据 ----
const injectProto = ref("HTTP");
const injectTarget = ref("");
const injecting = ref(false);
const batching = ref(false);

async function doInject() {
  injecting.value = true;
  try {
    const target = injectTarget.value.trim() || "manual-target:8080";
    const source = "manual-client:40000";
    await injectTransmission({
      source,
      target,
      protocol: injectProto.value,
      operation: "manual inject",
      error: false,
    });
    ElMessage.success(`已注入 ${injectProto.value} 调用：${source} → ${target}`);
    await load();
  } catch {
    ElMessage.error("注入失败");
  } finally {
    injecting.value = false;
  }
}

async function doBatch() {
  batching.value = true;
  try {
    const r = await injectBatch(20);
    ElMessage.success(`批量注入 ${r.count ?? 20} 条调用，多条依赖边已生成`);
    await load();
  } catch {
    ElMessage.error("批量注入失败");
  } finally {
    batching.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    edges.value = await getDependenciesAggregated(100);
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

.mono.warn {
  color: var(--apm-warning);
}

/* 列表筛选行 */
.table-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--apm-border);
  margin-bottom: 4px;
}

.filter-hint {
  font-size: 12px;
  color: var(--apm-muted);
  margin-left: auto;
}

.muted {
  color: var(--apm-muted);
  font-size: 12px;
}
</style>
