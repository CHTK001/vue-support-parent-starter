<!-- 依赖拓扑：操作条 + koi 令牌筛选卡 / 图例卡 / 表格壳 / 空态。
     力导向图容器（ref="graphRef"）、ReTable（列定义 edgeColumns、7 个具名插槽、
     row-class-name）、v-model 绑定（mode / keyword / listErrorOnly）与全部 click
     处理函数均原样保留，仅重排结构与样式。 -->
<template>
  <div class="view deps-page">
    <!-- 操作条：无标题大卡，只留动作与规模摘要，内容吃满 -->
    <div class="view-bar">
      <span class="match-hint">
        {{ nodeCount }} 节点 · {{ edges.length }} 边
        <template v-if="errorEdgeCount"> · <span class="err-text">{{ errorEdgeCount }} 异常</span></template>
        <template v-if="self"> · 当前主机 {{ self.display }}</template>
      </span>
      <div class="view-bar__actions">
        <el-radio-group v-model="mode" size="small" class="mode-switch">
          <el-radio-button value="graph">图形</el-radio-button>
          <el-radio-button value="table">列表</el-radio-button>
        </el-radio-group>
        <el-button size="small" round :loading="loading" @click="load">
          <el-icon class="btn-icon"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选：只保留查询条件，注入类操作已全部移除 -->
    <div class="filter-bar deps-filter">
      <div class="filter-field search-field">
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
        <el-checkbox v-model="listErrorOnly">仅看错误边</el-checkbox>
      </div>

      <div class="filter-actions">
        <span v-if="mode === 'table'" class="match-hint">
          聚合后 {{ filteredEdges.length }} / {{ edges.length }} 条边
        </span>
      </div>
    </div>

    <!-- 图形视图：力导向图容器必须保持 ref="graphRef" 挂载点 -->
    <div v-if="mode === 'graph'" class="panel graph-panel">
      <div class="panel-head graph-head">
        <div class="panel-head__main">
          <span class="panel-title">依赖图</span>
          <span class="panel-sub">节点大小反映关联调用量，红色描边表示节点错误率 &gt; 1%</span>
        </div>
        <div class="graph-actions">
          <span v-if="keyword.trim()" class="match-hint">
            匹配 {{ matchedNodeNames.length }} 个节点
          </span>
          <el-button size="small" round @click="resetView">重置视图</el-button>
        </div>
      </div>

      <div class="graph-legend">
        <span class="legend-item"><i class="legend-dot caller" />调用方</span>
        <span class="legend-item"><i class="legend-dot callee" />被调方</span>
        <span class="legend-item"><i class="legend-dot both" />双向节点</span>
        <span v-if="self" class="legend-item">
          <i class="legend-dot self" />当前主机（{{ self.display }}）
        </span>
        <span class="legend-item"><i class="legend-dot error" />异常节点（错误率 &gt; 1%）</span>
        <span class="legend-item"><i class="legend-line" />正常调用</span>
        <span class="legend-item"><i class="legend-line error" />错误调用</span>
      </div>

      <div v-if="edges.length" ref="graphRef" class="graph-body" />

      <!-- 无数据时不留空白画布：ECharts 空图在深色底上只是一块哑光矩形 -->
      <div v-else class="panel-empty-body">
        <ReEmpty
          :image-size="72"
          :description="loading ? '正在加载依赖数据…' : '暂无依赖数据：尚未采集到服务间调用'"
        />
      </div>
    </div>

    <!-- 列表视图 -->
    <template v-else>
      <div v-if="!edges.length" class="table-card">
        <div class="panel-empty-body">
          <ReEmpty
            :image-size="72"
            :description="loading ? '正在加载依赖数据…' : '暂无依赖数据：尚未采集到服务间调用'"
          />
        </div>
      </div>

      <div v-else class="table-card">
        <div class="table-panel deps-table-wrap">
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
            @row-click="(row) => openEdgeDetail(row as never)"
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
            <template #col-actions="{ row }">
              <el-button
                text
                size="small"
                :loading="detailLoading && detailEdge?.source === row.source && detailEdge?.target === row.target"
                @click.stop="openEdgeDetail(row as never)"
              >
                <el-icon class="btn-icon"><View /></el-icon>调用序列
              </el-button>
            </template>
          </ReTable>
        </div>
      </div>
    </template>

    <!-- 依赖边下钻：该边 source→target 的真实调用记录（服务端过滤） -->
    <div v-if="detailEdge" class="panel drill-panel">
      <div class="panel-head drill-head">
        <div class="panel-head__main">
          <span class="panel-title">调用序列</span>
          <span class="panel-sub">
            <span class="mono dep-node">{{ detailEdge.source }}</span>
            <span class="drill-arrow">→</span>
            <span class="mono dep-node target">{{ detailEdge.target }}</span>
            <span class="match-hint"> · 最近 {{ detailItems.length }} 条调用（真实采集）</span>
          </span>
        </div>
        <div class="graph-actions">
          <el-button size="small" round @click="closeEdgeDetail">关闭</el-button>
        </div>
      </div>

      <div v-if="!detailItems.length" class="panel-empty-body">
        <ReEmpty :image-size="56" description="该边暂无传输记录" />
      </div>
      <div v-else class="drill-table-wrap">
        <ReTable
          :data="detailItems"
          :columns="drillColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-traceId="{ row }">
            <span class="mono muted">{{ String(row.traceId ?? "—").slice(0, 24) }}</span>
          </template>
          <template #col-operation="{ row }">
            <span class="mono muted drill-op">{{ row.operation }}</span>
          </template>
          <template #col-status="{ row }">
            <el-tag
              :type="row.status === 'ERROR' ? 'danger' : 'success'"
              effect="plain"
              round
              size="small"
            >{{ row.status }}</el-tag>
          </template>
          <template #col-durationMs="{ row }">
            <span class="mono" :class="{ 'warn-text': numOf(row.durationMs) > 1000 }">
              {{ numOf(row.durationMs).toFixed(1) }} ms
            </span>
          </template>
          <template #col-startedAt="{ row }">
            <span class="mono muted">{{ row.startTime }}</span>
          </template>
        </ReTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";

import { Refresh, Search, View } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReEmpty from "@repo/ui/re-empty";
import { getDependenciesAggregated, getAgentSelf, pageTransmissions } from "../api/apmApi";
import type { AgentSelf, DependencyEdge, TransmissionRecord } from "../api/apmApi";
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

const mode = ref<"graph" | "table">("graph");
const edges = ref<DependencyEdge[]>([]);
const loading = ref(false);
const graphRef = ref<HTMLElement | null>(null);
const keyword = ref("");
const listErrorOnly = ref(false);

/**
 * 本进程自身标识（真实主机名 / 地址 / 监听端口）。
 *
 * <p>依赖边的 target 就是服务端自己记录的 {@code host:port}，把与之匹配的节点
 * 标成「当前主机」，读者才能分清哪个节点是本应用。端口未知时为 null，
 * 此时不标记任何节点 —— 不靠猜。</p>
 */
const self = ref<AgentSelf | null>(null);

/**
 * 该节点是否就是本进程。
 *
 * <p>判定只用真实值：地址/主机名 + 实际监听端口完全一致；或端口一致且主机段是
 * 回环地址 / localhost / 本机主机名 —— 这三种情况下请求确实是打到本进程。</p>
 */
function isSelfNode(name: string): boolean {
  const s = self.value;
  if (!s || !(s.port > 0)) return false;
  const n = String(name ?? "").trim();
  if (!n) return false;
  const suffix = `:${s.port}`;
  if (!n.endsWith(suffix)) return false;
  const host = n.slice(0, n.length - suffix.length).toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === String(s.hostName ?? "").toLowerCase() ||
    host === String(s.address ?? "").toLowerCase()
  );
}

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
  { prop: "actions", label: "", width: 110, align: "center", slot: "actions" },
];

/** 下钻：当前选中的依赖边（source→target）与其真实调用序列 */
const detailEdge = ref<DependencyEdge | null>(null);
const detailItems = ref<TransmissionRecord[]>([]);
const detailLoading = ref(false);

const drillColumns: ReTableColumn[] = [
  { prop: "traceId", label: "Trace ID", minWidth: 180, slot: "traceId" },
  { prop: "operation", label: "Operation", minWidth: 200, slot: "operation" },
  { prop: "status", label: "状态", width: 90, align: "center", slot: "status" },
  { prop: "durationMs", label: "耗时", width: 100, align: "right", slot: "durationMs" },
  { prop: "startTime", label: "开始时间", width: 170, slot: "startedAt" },
];

/** 解析依赖边节点名 → host（下钻查询按主机过滤：依赖边 target 形如 host:port） */
function hostOf(node: string): string {
  const s = String(node ?? "").trim();
  const idx = s.lastIndexOf(":");
  if (idx > 0 && /^\d+$/.test(s.slice(idx + 1))) {
    return s.slice(0, idx);
  }
  return s;
}

/** 点开一条边的调用序列：按 source/target 主机过滤真实传输记录 */
async function openEdgeDetail(edge: DependencyEdge): Promise<void> {
  if (!edge) return;
  detailEdge.value = edge;
  detailLoading.value = true;
  detailItems.value = [];
  try {
    const page = await pageTransmissions({
      page: 1,
      size: 20,
      source: hostOf(edge.source),
      target: hostOf(edge.target),
    });
    detailItems.value = page.items ?? [];
  } catch {
    message.error("加载调用序列失败");
    detailItems.value = [];
  } finally {
    detailLoading.value = false;
  }
}

function closeEdgeDetail(): void {
  detailEdge.value = null;
  detailItems.value = [];
}

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

async function load() {
  loading.value = true;
  try {
    // 自身标识与依赖边并行拉取：自身标识失败不影响依赖图主体
    const [edgeList, selfInfo] = await Promise.all([
      getDependenciesAggregated(100),
      getAgentSelf().catch(() => null),
    ]);
    edges.value = edgeList;
    self.value = selfInfo;
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
  const selfLine = isSelfNode(name)
    ? `<div style="font-size:12px;color:var(--apm-accent);font-weight:600">当前主机（本进程，端口 ${self.value?.port ?? "—"}）</div>`
    : "";
  return [
    `<div style="font-size:13px;font-weight:600;margin-bottom:6px">${escapeHtml(name)}</div>`,
    selfLine,
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
    const isSelf = isSelfNode(name);
    return {
      name,
      category: st.outDegree > 0 && st.inDegree > 0 ? 2 : st.outDegree > 0 ? 0 : 1,
      symbolSize: 28 + Math.round(22 * Math.sqrt(st.calls / maxCalls)) + (isSelf ? 8 : 0),
      itemStyle: {
        color: nodeColor(st),
        borderColor: hasError
          ? dangerColor()
          : isSelf
            ? chartColor(0)
            : colorWithAlpha(fgColor(), 0.18),
        borderWidth: isSelf ? 3 : hasError ? 2.5 : 1,
        shadowBlur: hasError ? 16 : isSelf ? 14 : 8,
        shadowColor: colorWithAlpha(
          hasError ? dangerColor() : chartColor(0),
          hasError ? 0.45 : isSelf ? 0.35 : 0.22,
        ),
      },
      label: {
        show: true,
        position: "bottom" as const,
        color: hasError ? dangerColor() : fgColor(),
        fontSize: 11,
        width: isSelf ? 180 : 120,
        overflow: "truncate" as const,
        // 本进程节点直接标出来，否则图上只有一堆 IP，看不出哪个是自己
        formatter: isSelf ? `${name} · 当前主机` : undefined,
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
    chart = echarts.init(graphRef.value, "light");
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
/* ========================================================
   依赖拓扑 · koi 令牌
   颜色 / 圆角 / 阴影 / 过渡一律优先取 koi 令牌，并以本包 --apm-*
   语义令牌兜底 —— hotsport 独立运行时不加载 koi，var(--koi, fallback)
   会落到 tokens.css 里语义相同的一档，视觉不崩。
   骨架类（.view / .filter-bar / .filter-field / .filter-actions / .panel /
   .panel-head / .panel-sub / .table-panel / .apm-table / .mono / .muted /
   .err-text / .warn-text / .match-hint）由 styles/layout.css 提供。
   ======================================================== */
.deps-page {
  gap: 16px;
}

/* ---- 操作条（无标题大卡，内容吃满）---- */
.view-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 2px;
}

.view-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-switch {
  flex-shrink: 0;
}

.btn-icon {
  margin-right: 4px;
  vertical-align: -2px;
}

/* ---- 筛选卡 ---- */
.deps-filter {
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
  gap: 12px;
  padding: 12px 16px;
}

.deps-filter .filter-label {
  color: var(--text-tertiary, var(--apm-muted));
  letter-spacing: 0.04em;
}

.deps-filter .filter-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* 筛选栏字段宽度 */
.search-field {
  width: 240px;
}
.check-field {
  width: auto;
}

/* ---- 图形视图 ---- */
.graph-panel {
  min-height: 520px;
  gap: 12px;
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
}

.graph-head {
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-head__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, var(--apm-fg));
}

.graph-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 图例：分隔线以上的独立一档，避免与图表内容抢视线 */
.graph-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
  background: var(--bg-fill, var(--apm-panel-raised));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-md, var(--apm-radius-md));
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
  background: var(--brand-500, var(--apm-chart-1));
}
.legend-dot.callee {
  background: var(--status-success, var(--apm-success));
}
.legend-dot.both {
  background: var(--metric-mem, var(--apm-chart-3));
}
.legend-dot.error {
  background: transparent;
  border: 2px solid var(--status-error, var(--apm-danger));
}

/* 当前主机：本进程节点用实心 + 外环，与「角色色」并存不冲突 */
.legend-dot.self {
  background: transparent;
  border: 2px solid var(--brand-500, var(--apm-accent));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-500, #2563eb) 22%, transparent);
}

.legend-line {
  width: 16px;
  height: 2px;
  border-radius: 2px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--text-tertiary, var(--apm-muted)) 50%, transparent);
}
.legend-line.error {
  background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 80%, transparent);
}

/* ECharts 画布：flex 撑满面板剩余高度 */
.graph-body {
  flex: 1;
  min-height: 420px;
  border-radius: var(--radius-md, var(--apm-radius-md));
  overflow: hidden;
}

/* 空态：ReEmpty 自带大留白，这里收到图表同高，避免面板塌陷 */
.panel-empty-body {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 240px;
}

/* ---- 列表视图 ---- */
.table-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8px 12px 12px;
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
  transition: box-shadow var(--transition-base, var(--apm-t-base));
}

.table-card:hover {
  box-shadow: var(--shadow-md, var(--apm-shadow-card-hover));
}

/* 表格变量：koi 优先，apm 兜底 */
.table-card .table-panel {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  flex: 1;
  min-height: 0;
}

.table-card .table-panel,
.table-card .apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--bg-hover, var(--apm-panel-active));
  --el-table-border-color: var(--border-subtle, var(--apm-border-soft));
  --el-table-header-bg-color: transparent;
  --el-table-header-text-color: var(--text-tertiary, var(--apm-muted));
  --el-table-text-color: var(--text-primary, var(--apm-fg));
  --el-table-fixed-bg-color: var(--bg-container, var(--apm-panel));
}

.table-card .table-panel .el-table__header th.el-table__cell,
.table-card .apm-table .el-table__header th.el-table__cell {
  background: transparent;
  border-bottom: 1px solid var(--border-default, var(--apm-border));
}

.dep-node {
  color: var(--text-primary, var(--apm-fg));
}

.dep-node.target {
  color: var(--brand-500, var(--apm-accent));
}

/* 错误节点优先于普通/目标色：同一个类名内显式覆盖，避免依赖样式顺序 */
.dep-node.error,
.dep-node.target.error {
  color: var(--status-error, var(--apm-danger));
  font-weight: 600;
}

/* 错误边行：淡红底承载语义 */
.dep-table :deep(.row-error) {
  background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 8%, var(--apm-danger-bg));
}

.dep-table :deep(.row-error:hover > td.el-table__cell) {
  background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 14%, transparent) !important;
}

/* ---- 依赖边下钻面板 ---- */
.drill-panel {
  padding: 12px 14px;
  gap: 10px;
  background: var(--bg-container, var(--apm-panel));
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--radius-lg, var(--apm-radius-lg));
  box-shadow: var(--shadow-sm, var(--apm-shadow-card));
}

.drill-head {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.drill-arrow {
  margin: 0 6px;
  color: var(--text-tertiary, var(--apm-muted));
}

.drill-op {
  word-break: break-all;
}

.drill-table-wrap .apm-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--bg-hover, var(--apm-panel-active));
  --el-table-border-color: var(--border-subtle, var(--apm-border-soft));
  --el-table-header-bg-color: transparent;
  --el-table-header-text-color: var(--text-tertiary, var(--apm-muted));
  --el-table-text-color: var(--text-primary, var(--apm-fg));
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .deps-filter {
    padding: 10px 12px;
  }

  .search-field,
  .check-field {
    width: 100%;
  }

  .deps-filter .filter-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }

  .graph-panel {
    min-height: 420px;
    padding: 12px;
  }

  .graph-head {
    flex-direction: column;
    align-items: stretch;
  }

  /* 图例在窄屏收起为两行内滚动，不挤占画布高度 */
  .graph-legend {
    max-height: 84px;
    overflow-y: auto;
  }

  .graph-body {
    min-height: 320px;
  }

  .table-card {
    padding: 6px 8px 10px;
  }
}

/* 尊重系统「减少动态效果」偏好：
   本页自身只保留 loading 旋转，图表力导向布局动画一并关闭 */
@media (prefers-reduced-motion: reduce) {
  .table-card,
  .table-card:hover {
    transition: none;
  }

  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
