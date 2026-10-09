<template>
  <div class="ngx-card" :data-ngx-uid="uid" :data-ngx-kind="kind" :style="shellStyle">
    <div v-if="!hideTitle" class="ngx-card-head">
      <span class="ngx-card-title" :title="title">{{ title }}</span>
      <span class="ngx-card-head-right">
        <span v-if="updatedAt && !error" class="ngx-card-time">{{ updatedAt }}</span>
        <button class="ngx-card-refresh" type="button" data-testid="ngx-card-refresh" title="刷新" aria-label="刷新" @click="load()">
          <ReIcon name="Refresh" :size="12" />
        </button>
      </span>
    </div>

    <div class="ngx-card-body">
      <div v-if="error" class="ngx-card-error" :title="error">{{ error }}</div>
      <template v-else>
        <!-- 状态卡 -->
        <div v-if="kind === 'ngx-stat'" class="ngx-stat">
          <div class="ngx-stat-value">{{ statText }}</div>
          <div class="ngx-stat-sub">{{ statSub }}</div>
        </div>

        <!-- 趋势图 -->
        <div v-else-if="kind === 'ngx-chart'" ref="chartEl" class="ngx-chart" />

        <!-- 访问 Top 表 -->
        <div v-else-if="kind === 'ngx-table'" class="ngx-table-wrap">
          <div v-if="tableSummary" class="ngx-table-summary">{{ tableSummary }}</div>
          <table v-if="tableRows.length" class="ngx-table">
            <thead>
              <tr>
                <th v-if="dimension === 'statuses'">类别</th>
                <th v-else>{{ dimension === 'ips' ? 'IP' : '路径' }}</th>
                <th class="ngx-table-num">命中</th>
                <th v-if="dimension === 'statuses'" class="ngx-table-num">占比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in tableRows" :key="`${row.key}-${i}`">
                <td class="ngx-table-key" :title="row.key">{{ row.key }}</td>
                <td class="ngx-table-num">{{ row.hits }}</td>
                <td v-if="dimension === 'statuses'" class="ngx-table-num">{{ row.pct ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="ngx-card-hint">暂无数据</div>
        </div>

        <!-- 脚本卡 -->
        <div v-else class="ngx-script">
          <pre v-if="scriptOutput" class="ngx-script-out">{{ scriptOutput }}</pre>
          <div v-else class="ngx-card-hint">暂无输出</div>
        </div>
      </template>

      <div v-if="loading && !hasData" class="ngx-card-loading">
        <span class="ngx-card-loading-dot" />
        加载中…
      </div>
      <div v-if="configWarn" class="ngx-card-warn" :title="configWarn">{{ configWarn }}</div>
    </div>
  </div>
</template>

<script setup lang="ts" name="NgxCardRenderer">
/**
 * Nginx 看板卡片渲染器。
 *
 * <p>一张卡片 = 一个 widget：按 {@code widget.type} 渲染状态卡 / 趋势图 / 访问 Top / 脚本卡。
 * 卡片配置（指标名、图表类型、ECharts 参数、脚本、背景色、自定义 CSS、刷新间隔）来自
 * {@code widget.ngx}，由设置弹窗（表单/自定义双模式）产出。数据取数走注入的
 * {@link NgxDataContext}，因此同一套卡片在控制台与嵌入页复用。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import ReIcon from "@repo/ui/re-icon";
import { token, URL_TREND_COLORS, useEchart } from "../charts/useEchart";
import { NGX_CTX_KEY, NGX_CARD_META } from "./ngxTypes";
import type { NgxCardConfig, NgxCardKind, NgxWidgetItem } from "./ngxTypes";
import type { NginxStatus, NginxTrendPoint } from "../../../api/nginx/api";

const props = withDefaults(
  defineProps<{
    widget: NgxWidgetItem;
    hideTitle?: boolean;
  }>(),
  { hideTitle: false }
);

const ctx = inject(NGX_CTX_KEY, null);

/** 卡片实例唯一标识：既给 style 作用域用（自定义 CSS），也避免多卡样式互串 */
const uid = `nc-${Math.random().toString(36).slice(2, 10)}`;

const kind = computed<NgxCardKind>(() => (props.widget.type || "ngx-stat") as NgxCardKind);
const config = computed<NgxCardConfig>(() => props.widget.ngx ?? {});
const title = computed(() => props.widget.title || NGX_CARD_META[kind.value]?.label || "卡片");

const loading = ref(false);
const error = ref("");
const configWarn = ref("");
const updatedAt = ref("");
const statusData = ref<NginxStatus | null>(null);
const trendPoints = ref<NginxTrendPoint[]>([]);
const tableData = ref<any>(null);
const scriptOutput = ref("");

const hasData = computed(
  () => statusData.value !== null || trendPoints.value.length > 0 || tableData.value !== null || scriptOutput.value !== ""
);

// ==================== 卡片外观 ====================

const shellStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {};
  if (config.value.background) {
    style.background = config.value.background;
  }
  if (config.value.textColor) {
    style.color = config.value.textColor;
  }
  const radius = props.widget.appearance?.borderRadius;
  if (typeof radius === "number") {
    style.borderRadius = `${radius}px`;
  }
  return style;
});

let styleEl: HTMLStyleElement | null = null;

function rebuildCustomCss(): void {
  if (typeof document === "undefined") {
    return;
  }
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.setAttribute("data-ngx-card-style", uid);
    document.head.appendChild(styleEl);
  }
  const css = (config.value.css || "").trim();
  // 选择器带 .ngx-card 类：scoped 样式是 .ngx-card[data-v-*]（0,2,0），纯属性选择器只有
  // (0,1,0) 打不过，border-radius/background 这类撞属性的声明会被静默覆盖。
  // 同为 (0,2,0) 时本注入晚于构建产物，文档序靠后者胜。
  styleEl.textContent = css ? `.ngx-card[data-ngx-uid="${uid}"] { ${css} }` : "";
}

// ==================== 取数 ====================

async function load(): Promise<void> {
  if (!ctx) {
    error.value = "数据上下文缺失";
    return;
  }
  if (kind.value === "ngx-script") {
    await runScript();
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    if (kind.value === "ngx-stat") {
      statusData.value = await ctx.status();
    } else if (kind.value === "ngx-chart") {
      const hours = config.value.hours && config.value.hours > 0 ? config.value.hours : 6;
      const interval = config.value.interval;
      const trend = await ctx.trend(hours, interval);
      trendPoints.value = trend.points ?? [];
    } else if (kind.value === "ngx-table") {
      const lines = config.value.lines;
      const minutes = config.value.minutes;
      const topN = config.value.topN && config.value.topN > 0 ? config.value.topN : 10;
      tableData.value = await ctx.accessTop(lines, minutes, topN);
    }
    updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    await nextTick();
    render();
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
    statusData.value = null;
    trendPoints.value = [];
    tableData.value = null;
  } finally {
    loading.value = false;
  }
}

async function runScript(): Promise<void> {
  const code = (config.value.script || "").trim();
  if (!code) {
    error.value = "未配置脚本";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("ctx", `"use strict";\nreturn (async () => {\n${code}\n})();`);
    const out = await fn(scriptCtx());
    scriptOutput.value =
      typeof out === "string" ? out : out === undefined || out === null ? "" : JSON.stringify(out, null, 2);
    updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  } catch (e) {
    error.value = `脚本执行失败: ${(e as Error)?.message ?? e}`;
    scriptOutput.value = "";
  } finally {
    loading.value = false;
  }
}

function scriptCtx(): Record<string, unknown> {
  return {
    status: () => ctx!.status(),
    trend: (hours?: number, interval?: number) => ctx!.trend(hours, interval),
    accessTop: (lines?: number, minutes?: number, topN?: number) => ctx!.accessTop(lines, minutes, topN),
    urlTrend: (lines?: number, topN?: number) => ctx!.urlTrend(lines, topN),
    datasourceId: ctx!.datasourceId ?? null,
    embed: ctx!.embed,
    now: Date.now(),
  };
}

// ==================== 状态卡 ====================

const STAT_LABELS: Record<string, string> = {
  activeConnections: "Active",
  accepts: "Accepts",
  handled: "Handled",
  requests: "Requests",
  reading: "Reading",
  writing: "Writing",
  waiting: "Waiting",
};

const statText = computed(() => {
  const st = statusData.value;
  if (!st || !st.available) {
    return "—";
  }
  const field = config.value.metric || "activeConnections";
  const val = (st as any)[field];
  if (val === null || val === undefined) {
    return "—";
  }
  const num = typeof val === "number" ? val : parseFloat(val);
  if (!Number.isFinite(num)) {
    return String(val);
  }
  const decimals = config.value.decimals ?? 0;
  const unit = config.value.unit || "";
  const fixed = Number(num.toFixed(Math.max(0, Math.min(6, decimals))));
  return `${fixed}${unit}`;
});

const statSub = computed(() => {
  const st = statusData.value;
  if (!st) {
    return "无数据";
  }
  if (!st.available) {
    return st.message || "状态不可用";
  }
  const field = config.value.metric || "activeConnections";
  return STAT_LABELS[field] || field;
});

// ==================== 访问 Top 表 ====================

const dimension = computed<"paths" | "ips" | "statuses">(() => config.value.dimension || "paths");

interface TableRow {
  key: string;
  hits: string;
  pct?: string;
}

const tableSummary = computed(() => {
  const d = tableData.value;
  if (!d) {
    return "";
  }
  const parts: string[] = [`共 ${d.total} 行`];
  if (d.uniqueIps != null) {
    parts.push(`${d.uniqueIps} 个 IP`);
  }
  if (d.clientErrors != null && d.clientErrors > 0) {
    parts.push(`4xx ${d.clientErrors}`);
  }
  if (d.serverErrors != null && d.serverErrors > 0) {
    parts.push(`5xx ${d.serverErrors}`);
  }
  return parts.join(" · ");
});

const tableRows = computed<TableRow[]>(() => {
  const d = tableData.value;
  if (!d) {
    return [];
  }
  const dim = dimension.value;
  if (dim === "statuses") {
    return (d.statuses ?? []).map((s: any) => ({
      key: s.category,
      hits: String(s.hits),
      pct: `${(s.pct ?? 0).toFixed(1)}%`,
    }));
  }
  const arr = (d[dim] ?? []) as Array<{ key: string; hits: number }>;
  return arr.map(item => ({ key: item.key, hits: String(item.hits) }));
});

// ==================== 趋势图 ====================

const chartEl = ref<HTMLElement | null>(null);

function deepMerge<T>(base: T, extra: unknown): T {
  if (extra === null || extra === undefined || typeof extra !== "object" || Array.isArray(extra)) {
    return base;
  }
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    return base;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(extra as Record<string, unknown>)) {
    const current = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object"
        ? deepMerge(current, value)
        : value;
  }
  return out as T;
}

function parseEchartsExtra(): Record<string, unknown> | null {
  const text = (config.value.echarts || "").trim();
  if (!text) {
    configWarn.value = "";
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    configWarn.value = "";
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    configWarn.value = `ECharts 参数不是合法 JSON：${(e as Error)?.message ?? e}`;
    return null;
  }
}

/** 把 "yyyy-MM-dd HH:mm:ss" 解析成 epoch 毫秒（按本地时区） */
function parseTimeMs(timeStr: string): number {
  if (!timeStr) {
    return Date.now();
  }
  const ms = Date.parse(timeStr.replace(" ", "T"));
  return Number.isFinite(ms) ? ms : Date.now();
}

function buildOption(): EChartsOption {
  const selected = config.value.metrics?.length ? config.value.metrics : ["active", "requests"];
  const chartType = config.value.chartType ?? "line";
  // 按指标名分组
  const grouped: Record<string, Array<[number, number | null]>> = {};
  for (const pt of trendPoints.value) {
    if (!selected.includes(pt.name)) {
      continue;
    }
    if (!grouped[pt.name]) {
      grouped[pt.name] = [];
    }
    const y = pt.rate != null ? pt.rate : pt.value;
    grouped[pt.name].push([parseTimeMs(pt.time), y]);
  }
  const names = Object.keys(grouped);
  const base: Record<string, unknown> = {
    animation: false,
    grid: { left: 6, right: 12, top: names.length > 1 ? 30 : 12, bottom: 4, containLabel: true },
    tooltip: { trigger: "axis" },
    color: names.map((_, i) => token(URL_TREND_COLORS[i % URL_TREND_COLORS.length])),
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: token("--border-subtle") } },
      axisLabel: { color: token("--text-tertiary"), fontSize: 10 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: token("--border-subtle") } },
      axisLabel: { color: token("--text-tertiary"), fontSize: 10 },
    },
    series: names.map((name, i) => ({
      name,
      type: chartType === "bar" ? "bar" : "line",
      data: grouped[name],
      smooth: chartType === "line",
      showSymbol: false,
      barMaxWidth: 18,
      areaStyle: chartType === "area" ? { opacity: 0.16 } : undefined,
      connectNulls: false,
    })),
  };
  if (names.length > 1) {
    base.legend = { top: 0, type: "scroll", textStyle: { fontSize: 10, color: token("--text-secondary") } };
  }
  const extra = parseEchartsExtra();
  return (extra ? deepMerge(base, extra) : base) as EChartsOption;
}

const { render } = useEchart(chartEl, buildOption);

// ==================== 刷新循环与生命周期 ====================

let timer: number | null = null;

function clearTimer(): void {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

function setupTimer(): void {
  clearTimer();
  const seconds = Number(config.value.refreshSeconds ?? 30);
  if (seconds > 0) {
    timer = window.setInterval(() => load(), Math.max(5, seconds) * 1000);
  }
}

onMounted(() => {
  rebuildCustomCss();
  setupTimer();
  void load();
});

onBeforeUnmount(() => {
  clearTimer();
  styleEl?.remove();
  styleEl = null;
});

watch(
  () => [props.widget.ngx, props.widget.type],
  () => {
    rebuildCustomCss();
    setupTimer();
    void load();
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.ngx-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.ngx-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.ngx-card-title {
  font-size: 12px;
  font-weight: 600;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ngx-card-head-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ngx-card-time {
  font-size: 10px;
  color: var(--text-tertiary);
}

.ngx-card-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;

  &:hover {
    background: var(--bg-hover);
    color: var(--brand-500);
  }
}

.ngx-card-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
}

.ngx-card-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 12px;
}

.ngx-card-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4px 8px;
  color: var(--status-error);
  font-size: 12px;
  word-break: break-all;
  overflow: auto;
}

.ngx-card-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
  background: color-mix(in srgb, var(--bg-container) 72%, transparent);
}

.ngx-card-loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--brand-500);
  animation: ngx-card-pulse 1.1s ease-in-out infinite;
}

@keyframes ngx-card-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

.ngx-card-warn {
  flex-shrink: 0;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--status-warning);
  background: color-mix(in srgb, var(--status-warning) 10%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 状态卡 ---- */
.ngx-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 0;
}

.ngx-stat-value {
  font-size: clamp(20px, 4vw, 34px);
  font-weight: 700;
  color: inherit;
  line-height: 1.1;
  word-break: break-all;
}

.ngx-stat-sub {
  font-size: 11px;
  color: var(--text-tertiary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 趋势图 ---- */
.ngx-chart {
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* ---- 访问 Top 表 ---- */
.ngx-table-summary {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ngx-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.ngx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;

  th {
    position: sticky;
    top: 0;
    text-align: left;
    font-weight: 600;
    color: var(--text-tertiary);
    background: var(--bg-container);
    padding: 3px 6px;
    border-bottom: 1px solid var(--border-subtle);
  }

  td {
    padding: 3px 6px;
    border-bottom: 1px solid var(--border-subtle);
    color: inherit;
    white-space: nowrap;
  }
}

.ngx-table-key {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ngx-table-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ---- 脚本卡 ---- */
.ngx-script {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.ngx-script-out {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: inherit;
  font-family: inherit;
}
</style>
