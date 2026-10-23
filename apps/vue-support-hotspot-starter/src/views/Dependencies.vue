<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">依赖拓扑</span>
        <el-radio-group v-model="mode" size="small">
          <el-radio-button value="graph">图形</el-radio-button>
          <el-radio-button value="table">列表</el-radio-button>
        </el-radio-group>
        <span class="match-hint">
          {{ nodeCount }} 个节点 · {{ edges.length }} 条边
          <template v-if="errorEdgeCount"> · {{ errorEdgeCount }} 条异常</template>
        </span>
      </div>
      <div class="toolbar-right">
        <el-button round :loading="loading" @click="load">
          <el-icon class="btn-icon"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选 + 注入操作：查询条件与动作分离，窄屏自然换行 -->
    <div class="filter-bar">
      <div class="filter-field search-field">
        <label class="filter-label" for="dep-keyword">节点 / 边</label>
        <el-input
          id="dep-keyword"
          v-model="keyword"
          placeholder="搜索节点名…"
          clearable
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <div v-if="mode === 'table'" class="filter-field check-field">
        <label class="filter-label">异常</label>
        <el-checkbox v-model="listErrorOnly">仅看错误边</el-checkbox>
      </div>

      <div class="filter-field protocol-field">
        <label class="filter-label" for="dep-proto">注入协议</label>
        <el-select id="dep-proto" v-model="injectProto">
          <el-option v-for="p in PROTOCOLS" :key="p" :label="p" :value="p" />
        </el-select>
      </div>

      <div class="filter-field target-field">
        <label class="filter-label" for="dep-target">注入目标</label>
        <el-input id="dep-target" v-model="injectTarget" placeholder="目标 host:port" clearable />
      </div>

      <div class="filter-actions">
        <span v-if="mode === 'table'" class="match-hint">
          聚合后 {{ filteredEdges.length }} / {{ edges.length }} 条边
        </span>
        <el-button round :loading="batching" @click="doBatch">
          <el-icon class="btn-icon"><MagicStick /></el-icon>批量×20
        </el-button>
        <el-button type="primary" round :loading="injecting" @click="doInject">
          <el-icon class="btn-icon"><Plus /></el-icon>注入一条调用
        </el-button>
      </div>
    </div>

    <!-- 图形视图 -->
    <div v-if="mode === 'graph'" class="panel graph-panel">
      <div class="graph-toolbar">
        <div class="graph-legend">
          <span class="legend-item"><i class="legend-dot caller" />调用方</span>
          <span class="legend-item"><i class="legend-dot callee" />被调方</span>
          <span class="legend-item"><i class="legend-dot both" />双向节点</span>
          <span class="legend-item"><i class="legend-dot error" />异常节点（错误率 &gt; 1%）</span>
          <span class="legend-item"><i class="legend-line" />正常调用</span>
          <span class="legend-item"><i class="legend-line error" />错误调用</span>
        </div>
        <div class="graph-actions">
          <span v-if="keyword.trim()" class="match-hint">
            匹配 {{ matchedNodeNames.length }} 个节点
          </span>
          <el-button size="small" round @click="resetView">重置视图</el-button>
        </div>
      </div>

      <div v-if="edges.length" ref="graphRef" class="graph-body" />

      <!-- 无数据时不留空白画布：ECharts 空图在深色底上只是一块哑光矩形 -->
      <div v-else class="panel-empty">
        {{ loading ? "正在加载依赖数据…" : "暂无依赖数据，可注入一条调用或点击刷新" }}
      </div>
    </div>

    <!-- 列表视图 -->
    <template v-else>
      <div v-if="!edges.length" class="panel">
        <div class="panel-empty">
          {{ loading ? "正在加载依赖数据…" : "暂无依赖数据，可注入一条调用或点击刷新" }}
        </div>
      </div>

      <div v-else class="table-panel">
        <ReTable
          :data="listRows as unknown as Record<string, unknown>[]"
          :columns="edgeColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          :row-class-name="rowClass"
          class="apm-table dep-table"
          empty-text="没有匹配的依赖边"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-source="{ row }">
            <span
              class="mono dep-node"
              :class="{ error: nodeHasError(row.source) }"
            >{{ row.source }}</span>
          </template>
          <template #col-target="{ row }">
            <span
              class="mono dep-node target"
              :class="{ error: nodeHasError(row.target) }"
            >{{ row.target }}</span>
          </template>
          <template #col-protocol="{ row }">
            <el-tag v-if="row.protocol" effect="plain" round size="small">{{ row.protocol }}</el-tag>
            <span v-else class="muted">—</span>
          </template>
          <template #col-callCount="{ row }">
            <span class="mono">{{ numOf(row.callCount).toLocaleString() }}</span>
          </template>
          <template #col-p95Ms="{ row }">
            <span class="mono" :class="p95Class(numOf(row.p95Ms))">
              {{ numOf(row.p95Ms).toFixed(1) }} ms
            </span>
          </template>
          <template #col-errorCount="{ row }">
            <span :class="['mono', numOf(row.errorCount) > 0 ? 'err-text' : 'muted']">
              {{ numOf(row.errorCount) }}
            </span>
          </template>
          <template #col-errorRate="{ row }">
            <span class="mono" :class="rateClass(numOf(row.errorRate))">
              {{ numOf(row.errorRate).toFixed(2) }}%
            </span>
          </template>
        </ReTable>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";

import { MagicStick, Plus, Refresh, Search } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getDependenciesAggregated, injectTransmission, injectBatch } from "../api/apmApi";
import type { DependencyEdge } from "../api/apmApi";
import {
  chartCanvas,
  chartColor,
  colorWithAlpha,
  dangerColor,
  fgColor,
  mutedColor,
  okColor,
  tooltipStyle,
} from "../styles/chartTheme";

const PROTOCOLS = ["HTTP", "REDIS", "MYSQL", "GRPC", "KAFKA"];

const mode = ref<"graph" | "table">("graph");
const edges = ref<DependencyEdge[]>([]);
const loading = ref(false);
const graphRef = ref<HTMLElement | null>(null);
const keyword = ref("");
const listErrorOnly = ref(false);

/** 边的错误率：后端未给时用 errorCount / callCount 兜底（与后端同口径） */
function edgeErrorRate(e: DependencyEdge): number {
  if (typeof e.errorRate === "number" && Number.isFinite(e.errorRate)) {
    return e.errorRate;
  }
  return e.callCount > 0 ? (e.errorCount / e.callCount) * 100 : 0;
}

/** 列表视图：前端过滤聚合边 */
const filteredEdges = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return edges.value.filter((e) => {
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
 * 表格数据：把 p95Ms / errorRate 提升为必有数值字段。
 *
 * <p>ReTable 的客户端排序按 prop 直接取值，字段缺失会排到一堆 undefined 里；
 * 这里显式补齐，排序口径与原列定义一致（p95Ms、errorRate）。</p>
 */
const listRows = computed(() =>
  filteredEdges.value.map((e) => ({
    ...e,
    p95Ms: Number(e.p95Ms ?? 0),
    errorRate: edgeErrorRate(e),
  })),
);

const edgeColumns: ReTableColumn[] = [
  { prop: "source", label: "源端", minWidth: 180, slot: "source" },
  { prop: "target", label: "目标", minWidth: 180, slot: "target" },
  { prop: "protocol", label: "协议", width: 100, slot: "protocol" },
  { prop: "callCount", label: "调用次数", width: 110, align: "right", sortable: true, slot: "callCount" },
  { prop: "p95Ms", label: "P95 耗时", width: 110, align: "right", sortable: true, slot: "p95Ms" },
  { prop: "errorCount", label: "错误", width: 80, align: "center", sortable: true, slot: "errorCount" },
  { prop: "errorRate", label: "错误率", width: 100, align: "right", sortable: true, slot: "errorRate" },
];

/** 插槽里的 row 是宽类型（unknown）：数值列统一收窄 */
function numOf(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** 耗时三档：与 Traces 页阈值同口径 */
function p95Class(ms: number): string {
  if (ms >= 1000) return "err-text";
  if (ms >= 300) return "warn-text";
  return "";
}

/** 错误率三档：>5% 危险 / >1% 警告 */
function rateClass(rate: number): string {
  if (rate > 5) return "err-text";
  if (rate > 1) return "warn-text";
  return "muted";
}

function rowClass({ row }: { row: Record<string, unknown> }) {
  return numOf(row.errorRate) > 1 ? "row-error" : "";
}

/**
 * 节点聚合：出/入度、关联调用量、关联错误数。
 *
 * <p>“关联”刻意是双边合计 —— 节点规模反映它在图里的分量，
 * 而不是唯一请求数；tooltip 里有明确文案，不会被误读成调用量。</p>
 */
interface NodeStat {
  calls: number;
  errors: number;
  outDegree: number;
  inDegree: number;
}

const nodeStats = computed(() => {
  const map = new Map<string, NodeStat>();
  const touch = (name: string): NodeStat => {
    let s = map.get(name);
    if (!s) {
      s = { calls: 0, errors: 0, outDegree: 0, inDegree: 0 };
      map.set(name, s);
    }
    return s;
  };
  for (const e of edges.value) {
    const s = touch(e.source);
    s.outDegree += 1;
    s.calls += numOf(e.callCount);
    s.errors += numOf(e.errorCount);

    const t = touch(e.target);
    t.inDegree += 1;
    t.calls += numOf(e.callCount);
    t.errors += numOf(e.errorCount);
  }
  return map;
});

const nodeCount = computed(() => nodeStats.value.size);
const errorEdgeCount = computed(() => edges.value.filter((e) => numOf(e.errorCount) > 0).length);

/** 搜索命中节点：图中高亮这些节点及其邻接边，其余淡出 */
const matchedNodeNames = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return [];
  return [...nodeStats.value.keys()].filter((n) => n.toLowerCase().includes(kw));
});

function nodeHasError(name: unknown): boolean {
  const st = nodeStats.value.get(String(name ?? ""));
  return st ? nodeErrorRate(st) > 1 : false;
}

/** 节点错误率（%）：关联错误数 / 关联调用量，阈值与列表错误率同口径 */
function nodeErrorRate(st: NodeStat): number {
  return st.calls > 0 ? (st.errors / st.calls) * 100 : 0;
}

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
  } catch {
    message.error("加载依赖拓扑失败");
  } finally {
    loading.value = false;
  }
}

// ---- 依赖图 ----

let chart: echarts.ECharts | null = null;

/** 力导向布局会持续动画：系统要求减少动态效果时直接跳到稳定位置 */
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface GraphTooltipParam {
  dataType?: string;
  name?: string;
  data?: Record<string, unknown>;
}

/** tooltip 是 DOM 渲染，颜色直接引用 CSS 令牌，跟随主题 */
function graphTooltip(p: GraphTooltipParam): string {
  const muted = "var(--apm-muted)";
  if (p.dataType === "edge") {
    const d = p.data ?? {};
    const callCount = numOf(d.callCount);
    const errors = numOf(d.errorCount);
    const rate = callCount > 0 ? (errors / callCount) * 100 : 0;
    return [
      `<div style="font-size:13px;font-weight:600;margin-bottom:6px">`,
      `${escapeHtml(d.source)} → ${escapeHtml(d.target)}`,
      `</div>`,
      `<div style="font-size:12px;color:${muted}">协议：${escapeHtml(d.protocol) || "—"} · 调用 ${callCount.toLocaleString()} 次</div>`,
      `<div style="font-size:12px;color:${muted}">错误 ${errors} 次 · 错误率 ${rate.toFixed(2)}%</div>`,
      `<div style="font-size:12px;color:${muted}">P95 ${numOf(d.p95Ms).toFixed(1)} ms</div>`,
    ].join("");
  }

  const name = String(p.name ?? "");
  const st = nodeStats.value.get(name);
  if (!st) return escapeHtml(name);
  const role = st.outDegree > 0 && st.inDegree > 0 ? "双向" : st.outDegree > 0 ? "调用方" : "被调方";
  const rate = nodeErrorRate(st);
  return [
    `<div style="font-size:13px;font-weight:600;margin-bottom:6px">${escapeHtml(name)}</div>`,
    `<div style="font-size:12px;color:${muted}">角色：${role} · 关联调用 ${st.calls.toLocaleString()} 次</div>`,
    `<div style="font-size:12px;color:${muted}">出边 ${st.outDegree} / 入边 ${st.inDegree}</div>`,
    `<div style="font-size:12px;color:${rate > 1 ? "var(--apm-danger)" : muted}">关联错误 ${st.errors} 次 · 错误率 ${rate.toFixed(2)}%</div>`,
  ].join("");
}

/** 节点角色 → 令牌色：调用方主色 / 被调方成功色 / 双向靛蓝 */
function nodeColor(st: NodeStat): string {
  if (st.outDegree > 0 && st.inDegree > 0) return chartColor(2);
  if (st.outDegree > 0) return chartColor(0);
  return okColor();
}

function buildGraphOption(): echarts.EChartsOption {
  const stats = nodeStats.value;
  const maxCalls = Math.max(1, ...[...stats.values()].map((s) => s.calls));
  const nodes = [...stats.entries()].map(([name, st]) => {
    const hasError = nodeErrorRate(st) > 1;
    return {
      name,
      category: st.outDegree > 0 && st.inDegree > 0 ? 2 : st.outDegree > 0 ? 0 : 1,
      symbolSize: 28 + Math.round(22 * Math.sqrt(st.calls / maxCalls)),
      itemStyle: {
        color: nodeColor(st),
        borderColor: hasError ? dangerColor() : colorWithAlpha(fgColor(), 0.18),
        borderWidth: hasError ? 2.5 : 1,
        shadowBlur: hasError ? 16 : 8,
        shadowColor: colorWithAlpha(hasError ? dangerColor() : chartColor(0), hasError ? 0.45 : 0.22),
      },
      label: {
        show: true,
        position: "bottom" as const,
        color: hasError ? dangerColor() : fgColor(),
        fontSize: 11,
        width: 120,
        overflow: "truncate" as const,
      },
    };
  });

  const links = edges.value.map((e) => {
    const hasError = numOf(e.errorCount) > 0;
    const width = Math.max(1, Math.min(4, 1 + Math.sqrt(numOf(e.callCount)) / 6));
    return {
      source: e.source,
      target: e.target,
      callCount: numOf(e.callCount),
      errorCount: numOf(e.errorCount),
      p95Ms: numOf(e.p95Ms),
      protocol: e.protocol,
      lineStyle: {
        width: hasError ? Math.max(2, width) : width,
        color: colorWithAlpha(hasError ? dangerColor() : mutedColor(), hasError ? 0.8 : 0.5),
        curveness: 0.15,
      },
    };
  });

  return {
    ...chartCanvas(),
    animation: !reduceMotion,
    tooltip: {
      trigger: "item",
      ...tooltipStyle(),
      formatter: (p: GraphTooltipParam) => graphTooltip(p),
    },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        scaleLimit: { min: 0.4, max: 3 },
        force: { repulsion: 420, edgeLength: [120, 200], gravity: 0.08 },
        categories: [{ name: "调用方" }, { name: "被调方" }, { name: "双向" }],
        lineStyle: { color: colorWithAlpha(mutedColor(), 0.5), curveness: 0.15, width: 1.2 },
        // 悬停 / 搜索高亮时聚焦邻接子图，其余节点淡出
        emphasis: { focus: "adjacency", scale: 1.08 },
        blur: {
          itemStyle: { opacity: 0.15 },
          label: { opacity: 0.2 },
          lineStyle: { opacity: 0.08 },
        },
        data: nodes,
        links,
      },
    ],
  } as unknown as echarts.EChartsOption;
}

async function renderGraph() {
  if (mode.value !== "graph") return;
  if (!edges.value.length) {
    chart?.dispose();
    chart = null;
    return;
  }
  await nextTick();
  if (!graphRef.value) return;
  if (!chart) {
    chart = echarts.init(graphRef.value, "dark");
  }
  chart.setOption(buildGraphOption(), true);
  applyHighlight();
}

/** 搜索：先全部 downplay，再高亮命中节点（emphasis.focus=adjacency 自动淡出其余） */
function applyHighlight() {
  if (!chart) return;
  chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
  for (const name of matchedNodeNames.value) {
    chart.dispatchAction({ type: "highlight", seriesIndex: 0, name });
  }
}

/** 重建 option：force 布局与 roam 位移/缩放一起复位 */
async function resetView() {
  if (!chart) return;
  chart.clear();
  await renderGraph();
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

watch(edges, () => {
  if (mode.value === "graph") renderGraph();
});

watch(mode, async (m) => {
  if (m === "graph") {
    await renderGraph();
  } else {
    chart?.dispose();
    chart = null;
  }
});

watch(keyword, () => applyHighlight());
</script>

<style scoped>
/* 骨架（.view / .view-toolbar / .toolbar-* / .section-label / .match-hint /
   .filter-bar / .filter-field / .filter-actions / .panel / .panel-empty /
   .table-panel / .apm-table / .mono / .muted / .err-text / .warn-text）
   统一由 styles/layout.css 提供，此处只留本页独有部分。 */

.btn-icon {
  margin-right: 4px;
  vertical-align: -2px;
}

/* 筛选栏字段宽度：搜索与注入目标更宽，协议一档够用 */
.search-field {
  width: 240px;
}
.protocol-field {
  width: 120px;
}
.target-field {
  width: 200px;
}
.check-field {
  width: auto;
}

/* ---- 图形视图 ---- */
.graph-panel {
  min-height: 520px;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--apm-space-2);
}

.graph-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--apm-space-3);
  font-size: 12px;
  color: var(--apm-muted);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

.legend-dot.caller {
  background: var(--apm-chart-1);
}
.legend-dot.callee {
  background: var(--apm-success);
}
.legend-dot.both {
  background: var(--apm-chart-3);
}
.legend-dot.error {
  background: transparent;
  border: 2px solid var(--apm-danger);
}

.legend-line {
  width: 16px;
  height: 2px;
  border-radius: 2px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--apm-muted) 50%, transparent);
}
.legend-line.error {
  background: color-mix(in srgb, var(--apm-danger) 80%, transparent);
}

.graph-actions {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
}

.graph-body {
  flex: 1;
  min-height: 420px;
}

/* ---- 列表视图 ---- */
.dep-node {
  color: var(--apm-fg);
}

.dep-node.target {
  color: var(--apm-accent);
}

/* 错误节点优先于普通/目标色：同一个类名内显式覆盖，避免依赖样式顺序 */
.dep-node.error,
.dep-node.target.error {
  color: var(--apm-danger);
}

.dep-table :deep(.row-error) {
  background: var(--apm-danger-bg);
}

/* 尊重系统「减少动态效果」偏好：
   本页自身只保留 loading 旋转，图表力导向布局动画一并关闭 */
@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
