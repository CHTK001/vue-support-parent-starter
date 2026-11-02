<template>
  <div class="view">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <template v-if="topology">
          {{ topology.center }} · PID {{ topology.jvmPid }}
          · {{ (topology?.modules ?? []).length }} 个 classpath 组件
          <template v-if="topology.peerCount"> · {{ topology.peerCount }} 个外部调用方</template>
        </template>
        <template v-else>系统拓扑</template>
      </span>
      <div class="view-bar__actions">
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <ReSkeleton :loading="loading" :rows="4" animated v-if="!topology" />

    <template v-else>
      <!-- 中心节点 + 端口/模块/外部调用方 关系图 -->
      <div class="panel graph-panel">
        <div class="panel-head">
          <span>进程网络拓扑</span>
          <span class="panel-sub">中心 = 本机主机 · 连线 = 监听端口 / 外部调用方（真实依赖聚合）</span>
        </div>
        <div ref="graphRef" class="graph-body" />
      </div>

      <div class="panel-row">
        <!-- 监听端口 -->
        <div class="panel">
          <div class="panel-head"><span>监听端口</span><span class="panel-sub">{{ (topology?.ports ?? []).length }} 个声明端口</span></div>
          <ReTable
            :data="(topology?.ports ?? []) as unknown as Record<string, unknown>[]"
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
          <div class="panel-head"><span>活动连接</span><span class="panel-sub">{{ (topology?.connections ?? []).length }} 条</span></div>
          <ReTable
            :data="(topology?.connections ?? []) as unknown as Record<string, unknown>[]"
            :columns="connColumns"
            engine="element"
            :layout-table="{ minHeight: 0 }"
            :settings="{ border: false }"
            :loading="loading"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          />
        </div>
      </div>

      <!-- 真实 classpath 组件 -->
      <div class="panel">
        <div class="panel-head">
          <span>classpath 组件（JVM 实际加载的 jar）</span>
          <span class="panel-sub">{{ (topology?.modules ?? []).length }} 个 · 取文件名去版本号展示</span>
        </div>
        <div class="module-chips">
          <ReTag
            v-for="m in (topology?.modules ?? []).slice(0, 48)"
            :key="m.id"
            type="info"
            effect="plain"
            class="module-chip"
          >
            {{ m.label }}
          </ReTag>
          <ReTag v-if="(topology?.modules ?? []).length > 48" type="info" round>+{{ (topology?.modules ?? []).length - 48 }}</ReTag>
        </div>
      </div>

      <!-- 外部调用方（真实依赖聚合） -->
      <div class="panel">
        <div class="panel-head">
          <span>外部调用方（真实依赖聚合）</span>
          <span class="panel-sub">{{ depRows.length }} 条调用关系 · 来自依赖图 / 真实传输记录</span>
        </div>
        <ReTable
          v-if="depRows.length"
          :data="depRows as unknown as Record<string, unknown>[]"
          :columns="depColumns"
          engine="element"
          :layout-table="{ minHeight: 0 }"
          :settings="{ border: false }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-source="{ row }">
            <span class="mono dep-src">{{ row.source }}</span>
          </template>
          <template #col-target="{ row }">
            <span class="mono muted">{{ row.target }}</span>
          </template>
          <template #col-callCount="{ row }">
            <span class="calls-cell">
              <span class="calls-bar" aria-hidden="true">
                <i :style="{ width: callShareWidth(numOf(row.callCount)) }" />
              </span>
              <span class="mono calls-num">{{ numOf(row.callCount).toLocaleString() }}</span>
            </span>
          </template>
          <template #col-errorRate="{ row }">
            <span class="rate-cell" :class="errorRateClass(numOf(row.errorRate))">
              <i class="rate-dot" aria-hidden="true"></i>
              <span class="mono">{{ numOf(row.errorRate).toFixed(2) }}%</span>
            </span>
          </template>
          <template #col-avgDurationMs="{ row }">
            <span class="mono">{{ numOf(row.avgDurationMs).toFixed(1) }} ms</span>
          </template>
        </ReTable>
        <ReEmpty v-else :image-size="56" description="暂无外部调用记录（存储为空或尚未采集到传输）" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import ReTag from "@repo/ui/re-tag";
import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import ReEmpty from "@repo/ui/re-empty";
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

const depColumns: ReTableColumn[] = [
  { prop: "source", label: "调用方", minWidth: 160, slot: "source" },
  { prop: "target", label: "目标", minWidth: 160, slot: "target" },
  { prop: "protocol", label: "协议", width: 90 },
  { prop: "callCount", label: "调用次数", width: 100, align: "right", slot: "callCount" },
  { prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate" },
  { prop: "avgDurationMs", label: "平均耗时", width: 110, align: "right", slot: "avgDurationMs" },
];

/** 外部调用方汇总行（按调用量降序，全部真实聚合值） */
const depRows = computed(() => {
  const deps = topology.value?.deps ?? [];
  return [...deps].sort((a, b) => (b.callCount ?? 0) - (a.callCount ?? 0));
});

const totalDepCalls = computed(() =>
  depRows.value.reduce((acc, d) => acc + numOf(d.callCount), 0),
);

/** 调用量占比条宽度（%）：占全部外部调用量的比例，0 时退化为 2% 小点 */
function callShareWidth(count: number): string {
  if (!totalDepCalls.value || count <= 0) return "2%";
  return `${Math.max(2, (count / totalDepCalls.value) * 100)}%`;
}

function numOf(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** 错误率着色档：与 Endpoints/Dashboard 阈值一致（>5% 红，1~5% 黄） */
function errorRateClass(v: number): string {
  if (v > 5) return "err-text";
  if (v > 1) return "warn-text";
  return "muted";
}

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

/** 外部调用方是否带错误（卫星节点着色：有错琥珀、全绿翡翠） */
function peerMeta(source: string): { errorCount: number; callCount: number } {
  let errorCount = 0;
  let callCount = 0;
  for (const d of topology.value?.deps ?? []) {
    if (d.source === source) {
      errorCount += numOf(d.errorCount);
      callCount += numOf(d.callCount);
    }
  }
  return { errorCount, callCount };
}

function renderGraph() {
  if (!topology.value || !graphRef.value) return;
  if (!chart) chart = echarts.init(graphRef.value, "light");
  const t = topology.value;
  // 后端未就绪时 ports/modules/connections/deps 可能为 undefined，降级为空数组
  const ports = t.ports ?? [];
  const modules = t.modules ?? [];
  const deps = t.deps ?? [];
  const centerColor = chartColor(0);
  const peerColor = chartColor(3);
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
    ...ports.map((p) => ({
      name: `${p.protocol}:${p.port}`,
      symbolSize: 30,
      itemStyle: { color: portColor(p) },
      label: { color: fgColor(), fontSize: 11 },
      category: "port",
    })),
    ...modules.slice(0, 12).map((m) => ({
      name: m.label,
      symbolSize: 20,
      itemStyle: { color: mutedColor() },
      label: { color: colorWithAlpha(fgColor(), 0.6), fontSize: 10 },
      category: "module",
    })),
    ...deps
      .map((d) => d.source)
      .filter((s, i, all) => all.indexOf(s) === i)
      .map((s) => {
        const meta = peerMeta(s);
        return {
          name: s,
          symbolSize: 26,
          itemStyle: { color: meta.errorCount > 0 ? warningColor() : peerColor },
          label: { color: fgColor(), fontSize: 10 },
          category: "peer",
        };
      }),
  ];
  const links = [
    ...ports.map((p) => ({
      source: t.center,
      target: `${p.protocol}:${p.port}`,
      lineStyle: { color: centerColor, width: 1.5 },
    })),
    ...modules.slice(0, 6).map((m) => ({
      source: t.center,
      target: m.label,
      lineStyle: {
        color: colorWithAlpha(mutedColor(), 0.5),
        width: 1,
        type: "dashed" as const,
      },
    })),
    ...[...new Set(deps.map((d) => d.source))].map((s) => ({
      source: s,
      target: t.center,
      lineStyle: { color: colorWithAlpha(peerColor, 0.7), width: 1.4 },
    })),
  ];
  chart.setOption({
    ...chartCanvas(),
    tooltip: {
      trigger: "item",
      ...tooltipStyle(),
      formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
        const p = params as { dataType?: string; name: string; data?: { category?: string } };
        if (p.dataType === "edge") return p.name;
        const cat = p.data?.category;
        if (cat === "peer") {
          const meta = peerMeta(p.name);
          return `${p.name}<br/>调用次数 <b>${meta.callCount}</b> · 错误 ${meta.errorCount}`;
        }
        return p.name;
      },
    },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: mutedColor(), fontSize: 11 },
      data: ["中心", "端口", "外部调用方"],
      selected: { module: false },
    },
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
          { name: "peer" },
        ],
        emphasis: {
          focus: "adjacency",
          lineStyle: { width: 2.5 },
        },
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
.dep-src {
  color: var(--apm-fg, inherit);
  font-weight: 600;
}

/* 调用量占比条：同页内一眼看出最重的调用方（与 Endpoints 同款规格） */
.calls-cell {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.calls-bar {
  position: relative;
  width: 54px;
  height: 4px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--border-subtle, var(--apm-border-soft));
  overflow: hidden;
}

.calls-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  min-width: 2px;
  border-radius: 999px;
  background: var(--brand-500, var(--apm-accent));
}

.calls-num {
  font-variant-numeric: tabular-nums;
}

/* 错误率状态点：绿/黄/红三档语义一眼可见 */
.rate-cell {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.rate-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--status-success, var(--apm-success));
}

.rate-cell.warn-text .rate-dot {
  background: var(--status-warning, var(--apm-warning));
}

.rate-cell.err-text .rate-dot {
  background: var(--status-error, var(--apm-danger));
}

.warn-text {
  color: var(--apm-warning, #d99000);
}
.err-text {
  color: var(--apm-danger, #d03050);
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