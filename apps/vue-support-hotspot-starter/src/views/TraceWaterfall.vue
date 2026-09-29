<template>
  <div class="view">
    <!-- 顶部工具栏 -->
    <div class="view-toolbar">
      <div class="toolbar-left">
        <ReButton icon="ArrowLeft" show-text @click="goBack">返回</ReButton>
        <ReTag v-if="traceId" type="info" round>
          <code class="mono">{{ traceId }}</code>
        </ReTag>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- 空态 -->
    <ReEmpty v-if="!traceId" description="缺少 traceId 参数，请从链路树页面进入" />

    <!-- 加载中 -->
    <ReSkeleton v-else-if="loading && !waterfall" :rows="6" animated />

    <!-- 主内容 -->
    <template v-else-if="waterfall">
      <!-- 统计卡片 -->
      <div class="panel-row stat-row">
        <ReStatCard size="compact" title="总耗时" :value="waterfall.totalMs + ' ms'" :desc="`trace ${traceId}`" :icon="Timer" icon-color="#3b82f6" />
        <ReStatCard size="compact" title="Span 数" :value="waterfall.spanCount" :desc="`${errorSpanCount} 个异常 span`" :icon="Connection" icon-color="#8b5cf6" />
        <ReStatCard size="compact" title="开始时间" :value="firstSpanStart" :desc="`深度 ${maxDepth} 层`" :icon="DataLine" icon-color="#f59e0b" />
        <ReStatCard size="compact" title="异常率" :value="errorRate" :desc="`${errorSpanCount} / ${waterfall.spanCount} span`" :icon="Warning" icon-color="#ef4444" />
      </div>

      <!-- 瀑布图 -->
      <div class="panel waterfall-panel">
        <div class="panel-head">
          <span>Span 瀑布图</span>
          <span class="panel-sub">颜色 = spanKind · 红边 = 异常 · 悬停查看详情</span>
        </div>
        <ReEcharts :option="waterfallOption" theme="dark" height="100%" class="waterfall-chart" />
      </div>

      <!-- Span 列表 -->
      <div class="panel">
        <div class="panel-head">
          <span>Span 明细</span>
          <span class="panel-sub">点击行查看详情</span>
        </div>
        <ReTable
          :data="spans as unknown as Record<string, unknown>[]"
          :columns="spanColumns"
          :pagination="false"
          :toolbar="false"
          border

          row-key="spanId"
          @row-click="onRowClick"
        />
      </div>

      <!-- Span 详情抽屉 -->
      <ReDrawer
        v-model="drawerVisible"
        :title="drawerSpan ? spanName(drawerSpan) : 'Span 详情'"
        size="480px"
        direction="rtl"
      >
        <template v-if="drawerSpan">
          <ReDescriptions :column="1" border >
            <ReDescriptionsItem label="Span ID">
              <code class="mono">{{ drawerSpan.spanId }}</code>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="操作">
              {{ drawerSpan.operation || drawerSpan.className || "—" }}
            </ReDescriptionsItem>
            <ReDescriptionsItem label="耗时">
              <ReTag :type="drawerSpan.durationMs > 100 ? 'danger' : 'success'" round>
                {{ drawerSpan.durationMs }} ms
              </ReTag>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="状态">
              <ReTag :type="drawerSpan.status === 'OK' ? 'success' : 'danger'" round>
                {{ drawerSpan.status || "OK" }}
              </ReTag>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="Span Kind">
              {{ drawerSpan.spanKind || "—" }}
            </ReDescriptionsItem>
            <ReDescriptionsItem label="源端">
              <code class="mono">{{ drawerSpan.source || "—" }}</code>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="目标端">
              <code class="mono">{{ drawerSpan.target || "—" }}</code>
            </ReDescriptionsItem>
            <ReDescriptionsItem label="协议">
              {{ drawerSpan.protocol || "—" }}
            </ReDescriptionsItem>
            <ReDescriptionsItem label="软件">
              {{ drawerSpan.software || "—" }}
            </ReDescriptionsItem>
            <ReDescriptionsItem label="流量">
              出 {{ drawerSpan.bytesOut ?? 0 }} B · 入 {{ drawerSpan.bytesIn ?? 0 }} B
            </ReDescriptionsItem>
            <ReDescriptionsItem label="Attributes">
              <div v-if="drawerSpan.attributes && Object.keys(drawerSpan.attributes).length">
                <div
                  v-for="(v, k) in drawerSpan.attributes"
                  :key="k"
                  class="attr-line"
                >
                  <span class="attr-key">{{ k }}</span>
                  <span class="attr-val">{{ v }}</span>
                </div>
              </div>
              <span v-else>—</span>
            </ReDescriptionsItem>
          </ReDescriptions>

          <div v-if="drawerSpan.errorType" class="error-block">
            <div class="error-label">
              <ReTag type="danger" round>{{ drawerSpan.errorType }}</ReTag>
            </div>
            <pre class="error-msg">{{ drawerSpan.errorMessage || "（无详细信息）" }}</pre>
          </div>
        </template>
      </ReDrawer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Timer, Connection, DataLine, Warning } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReEmpty from "@repo/ui/re-empty";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTable from "@repo/ui/re-table";
import ReEcharts from "@repo/ui/re-echarts";
import ReDrawer from "@repo/ui/re-drawer";
import { ReDescriptions, ReDescriptionsItem } from "@repo/ui/re-kit";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getTraceWaterfall } from "../api/apmApi";
import type { TraceWaterfall, WaterfallSpan } from "../api/apmApi";
import type { EChartsOption } from "echarts";

const route = useRoute();
const router = useRouter();

const traceId = computed(() => String(route.query.traceId ?? ""));

const waterfall = ref<TraceWaterfall | null>(null);
const loading = ref(false);
const drawerVisible = ref(false);
const drawerSpan = ref<WaterfallSpan | null>(null);

// 派生统计
const spans = computed<WaterfallSpan[]>(() => waterfall.value?.spans ?? []);
const errorSpanCount = computed(() => spans.value.filter((s) => s.status && s.status !== "OK").length);
const errorRate = computed(() => {
  const total = spans.value.length;
  if (!total) return "0%";
  return Math.round((errorSpanCount.value / total) * 100) + "%";
});
const firstSpanStart = computed(() => {
  const s = spans.value[0];
  return s?.startTime ?? "—";
});
const maxDepth = computed(() => Math.max(0, ...spans.value.map((s) => s.depth)));

// 工具函数
function spanName(s: WaterfallSpan): string {
  let name = s.className ? `${s.className}.${s.methodName ?? s.operation}` : s.operation ?? "unknown";
  return name.length > 20 ? name.slice(0, 20) + "…" : name;
}

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/traces");
}

// 加载数据
async function load() {
  if (!traceId.value) return;
  loading.value = true;
  waterfall.value = null;
  try {
    waterfall.value = await getTraceWaterfall(traceId.value);
  } catch {
    waterfall.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});

function onRowClick(row: Record<string, unknown>) {
  drawerSpan.value = row as unknown as WaterfallSpan;
  drawerVisible.value = true;
}

// ---- 瀑布图 ECharts option ----
const SPAN_KIND_COLORS: Record<string, string> = {
  SERVER: "#3b82f6",
  CLIENT: "#f59e0b",
  PRODUCER: "#8b5cf6",
  CONSUMER: "#22c55e",
  INTERNAL: "#64748b",
};

const waterfallOption = computed<EChartsOption>(() => {
  const s = spans.value;
  const totalMs = waterfall.value?.totalMs ?? 1;

  // y 轴：按 depth 展开的行标签（inverse: true → 最深的在最下面）
  const rowLabels = s.map((sp) => spanName(sp));

  // 每个 span 的数据坐标 [yIndex, offsetMs, offsetMs + durationMs]
  const seriesData = s.map((sp, i) => {
    const start = sp.offsetMs;
    const end = sp.offsetMs + sp.durationMs;
    return [i, start, end];
  });

  // tooltip formatter
  const tooltipFormatter = (params: unknown): string => {
    const p = params as { dataIndex: number };
    const sp = s[p.dataIndex];
    if (!sp) return "";
    return [
      `<div style="font-size:13px;font-weight:600;margin-bottom:6px">${spanName(sp)}</div>`,
      `<div style="font-size:12px;color:#9ca3af">耗时：${sp.durationMs} ms</div>`,
      `<div style="font-size:12px;color:#9ca3af">状态：${sp.status ?? "OK"}</div>`,
      sp.source ? `<div style="font-size:12px;color:#9ca3af">${sp.source} → ${sp.target ?? "—"}</div>` : "",
    ]
      .filter(Boolean)
      .join("<br/>");
  };

  return {
    backgroundColor: "transparent",
    grid: {
      left: 180,
      right: 30,
      top: 40,
      bottom: 30,
    },
    tooltip: {
      show: true,
      trigger: "item",
      formatter: tooltipFormatter as EChartsOption["tooltip"] extends { formatter?: infer F } ? F : never,
      backgroundColor: "rgba(19,26,43,0.95)",
      borderColor: "rgba(255,255,255,0.1)",
      textStyle: { color: "#e6edf7", fontSize: 12 },
    },
    xAxis: {
      type: "value",
      min: 0,
      max: totalMs,
      name: "时间 (ms)",
      nameTextStyle: { color: "rgba(230,237,247,0.5)", fontSize: 11 },
      axisLabel: { color: "rgba(230,237,247,0.55)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      axisLine: { show: false },
      axisTick: { show: false },
      position: "top",
    },
    yAxis: {
      type: "category",
      data: rowLabels,
      inverse: true,
      axisLabel: {
        color: "rgba(230,237,247,0.7)",
        fontSize: 11,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    } as EChartsOption["yAxis"] extends infer T ? T & { interval?: number } : never,
    series: [
      {
        type: "custom",
        data: seriesData,
        encode: { x: [1, 2], y: [0] },
        renderItem: function (
          _params: unknown,
          api: {
            value: (dim: number) => number;
            size: (dims: [number, number]) => [number, number];
            coord: (pair: [number, number]) => [number, number];
            style: (args: Record<string, unknown>) => Record<string, unknown>;
          },
        ): unknown {
          const yIndex = api.value(0);
          const start = api.value(1);
          const end = api.value(2);
          const sp = s[yIndex];
          const dur = end - start;

          const [x0, y0] = api.coord([start, yIndex]);
          const [w, h] = api.size([dur, 1]);

          const color = SPAN_KIND_COLORS[sp?.spanKind ?? ""] ?? "#64748b";
          const isError = sp?.status && sp.status !== "OK";

          return {
            type: "rect",
            shape: {
              x: x0,
              y: y0 - h / 2,
              width: Math.max(w, 2),
              height: h,
              r: [2, 2, 2, 2],
            },
            style: api.style({
              fill: color,
              stroke: isError ? "#ef4444" : "transparent",
              lineWidth: isError ? 2 : 0,
            }),
          };
        },
      },
    ] as EChartsOption["series"],
  };
});

// ---- Span 表格列定义 ----
const spanColumns: ReTableColumn[] = [
  { prop: "spanId", label: "Span ID", width: 100, showOverflowTooltip: true, formatter: (row) => String(row.spanId ?? "").slice(0, 12) + "…" },
  { prop: "operation", label: "操作", minWidth: 200, formatter: (row) => {
      const sp = row as unknown as WaterfallSpan;
      return spanName(sp);
    } },
  { prop: "spanKind", label: "Kind", width: 90, align: "center" },
  { prop: "source", label: "源端", minWidth: 140, showOverflowTooltip: true, formatter: (row) => String(row.source ?? "—") },
  { prop: "target", label: "目标端", minWidth: 140, showOverflowTooltip: true, formatter: (row) => String(row.target ?? "—") },
  { prop: "durationMs", label: "耗时(ms)", width: 90, align: "right" },
  { prop: "status", label: "状态", width: 80, align: "center", formatter: (row) => String(row.status ?? "OK") },
];
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
.panel-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-row {
  grid-template-columns: repeat(4, 1fr);
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
  color: var(--apm-fg);
}
.panel-sub {
  font-size: 12px;
  color: var(--apm-muted);
  font-weight: 400;
}
.waterfall-panel {
  min-height: 480px;
  display: flex;
  flex-direction: column;
}
.waterfall-chart {
  flex: 1;
  min-height: 400px;
}
.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
  color: var(--apm-accent);
}
.attr-line {
  display: flex;
  gap: 12px;
  font-size: 12px;
  padding: 2px 0;
}
.attr-key {
  color: var(--apm-muted);
  min-width: 120px;
  flex-shrink: 0;
}
.attr-val {
  color: var(--apm-fg);
  word-break: break-all;
}
.error-block {
  margin-top: 16px;
}
.error-label {
  margin-bottom: 8px;
}
.error-msg {
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 25%, transparent);
  border-radius: var(--el-radius-md, 8px);
  padding: 12px;
  color: var(--apm-danger);
  font-size: 12px;
  font-family: "JetBrains Mono", Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
/* ReStatCard 适配 APM 主题令牌 */
.stat-row :deep(.re-stat-card) {
  position: relative;
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px */
}
.stat-row :deep(.re-stat-card .re-stat-card__title) {
  color: var(--apm-muted);
}
.stat-row :deep(.re-stat-card .re-stat-card__value) {
  color: var(--apm-fg);
  font-variant-numeric: tabular-nums;
}
.stat-row :deep(.re-stat-card .re-stat-card__desc) {
  color: var(--apm-muted);
}
@media (max-width: 1100px) {
  .panel-row,
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .panel-row,
  .stat-row {
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
