<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">依赖拓扑</span>
        <el-radio-group v-model="mode" >
          <el-radio-button value="graph">图形</el-radio-button>
          <el-radio-button value="table">列表</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-select v-model="injectProto" style="width: 96px">
          <el-option v-for="p in ['HTTP','REDIS','MYSQL','GRPC','KAFKA']" :key="p" :label="p" :value="p" />
        </el-select>
        <el-input v-model="injectTarget" placeholder="目标 host:port" style="width: 170px" clearable />
        <el-button type="primary" round :loading="injecting" @click="doInject">
          <el-icon class="mr-1"><Plus /></el-icon>注入一条调用
        </el-button>
        <el-button round :loading="batching" @click="doBatch">
          <el-icon class="mr-1"><MagicStick /></el-icon>批量×20
        </el-button>
        <el-button round :loading="loading" @click="load">
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

          style="width: 220px"
        />
        <el-checkbox v-model="listErrorOnly" >仅看错误边</el-checkbox>
        <span class="filter-hint">聚合后 {{ filteredEdges.length }} / {{ edges.length }} 条边</span>
      </div>
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM，
           .apm-table 变量覆盖与 e2e 的 .el-table__body 选择器不失效；
           pagination=false / toolbar=false —— 原表既无分页也无工具栏按钮；
           原 el-table 没写 border → settings.border=false 抑制默认边框；
           layout-table.minHeight=0 关掉组件默认的 440px 撑高与 fill 自适应。
           原两列的 sort-by="p95Ms"/"errorRate" 改为把 p95Ms/errorRate 直接写成 prop
           （ReTableColumn 无 sort-by），排序口径与原来完全一致。 -->
      <ReTable
        :data="filteredEdges as unknown as Record<string, unknown>[]"
        :columns="edgeColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ minHeight: 0 }"
        class="apm-table"
        empty-text="暂无依赖关系"
      >
        <template #col-source="{ row }">
          <span class="mono">{{ row.source }}</span>
        </template>
        <template #col-target="{ row }">
          <span class="mono target">{{ row.target }}</span>
        </template>
        <template #col-protocol="{ row }">
          <el-tag v-if="row.protocol" effect="plain" round>{{ row.protocol }}</el-tag>
          <span v-else class="muted">—</span>
        </template>
        <template #col-p95Ms="{ row }">
          <span class="mono">{{ p95MsOf(row).toFixed(1) }} ms</span>
        </template>
        <template #col-errorCount="{ row }">
          <span :class="['mono', errorCountOf(row) > 0 ? 'err' : 'muted']">{{ errorCountOf(row) }}</span>
        </template>
        <template #col-errorRate="{ row }">
          <span :class="['mono', errorRateOf(row) > 5 ? 'err' : errorRateOf(row) > 1 ? 'warn' : 'muted']">
            {{ errorRateOf(row).toFixed(2) }}%
          </span>
        </template>
      </ReTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";

import { Refresh, Plus, MagicStick } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
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

/**
 * 列表视图的列配置：原来散在模板里的 7 个 el-table-column 收敛到这里。
 *
 * <p>标题都是写死文案（没有 t()），用普通常量即可。原「源端 / 目标 / P95 耗时 /
 * 错误 / 错误率」没有 prop，这里补稳定合成 prop；其中 P95 耗时、错误率原是
 * sort-by="p95Ms" / sort-by="errorRate"（ReTableColumn 没有 sort-by），
 * 直接把排序字段写成 prop，排序口径与原来一致。</p>
 */
const edgeColumns: ReTableColumn[] = [
  { prop: "source", label: "源端", minWidth: 180, slot: "source" },
  { prop: "target", label: "目标", minWidth: 180, slot: "target" },
  { prop: "protocol", label: "协议", width: 100, slot: "protocol" },
  { prop: "callCount", label: "调用次数", width: 100, align: "center", sortable: true },
  { prop: "p95Ms", label: "P95 耗时", width: 100, align: "center", sortable: true, slot: "p95Ms" },
  { prop: "errorCount", label: "错误", width: 80, align: "center", slot: "errorCount" },
  { prop: "errorRate", label: "错误率", width: 90, align: "center", sortable: true, slot: "errorRate" },
];

/** 插槽里的 row 是宽类型（unknown）：下列取值都是算术/比较入参，先收窄成 number */
function p95MsOf(row: Record<string, unknown>): number {
  return Number(row.p95Ms ?? 0);
}

function errorCountOf(row: Record<string, unknown>): number {
  return Number(row.errorCount ?? 0);
}

function errorRateOf(row: Record<string, unknown>): number {
  return Number(row.errorRate ?? 0);
}

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
    message.success(`已注入 ${injectProto.value} 调用：${source} → ${target}`);
    await load();
  } catch {
    message.error("注入失败");
  } finally {
    injecting.value = false;
  }
}

async function doBatch() {
  batching.value = true;
  try {
    const r = await injectBatch(20);
    message.success(`批量注入 ${r.count ?? 20} 条调用，多条依赖边已生成`);
    await load();
  } catch {
    message.error("批量注入失败");
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
    message.error("加载依赖拓扑失败");
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
  border-radius: var(--el-radius-lg, 12px); /* 原 14px，取最近档 lg */
}

.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px */
  padding: 8px;
}

.apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
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
