<template>
  <div class="prom-card" :data-prom-uid="uid" :data-prom-kind="kind" :style="shellStyle">
    <div v-if="!hideTitle" class="prom-card-head">
      <span class="prom-card-title" :title="title">{{ title }}</span>
      <span class="prom-card-head-right">
        <span v-if="updatedAt && !error" class="prom-card-time">{{ updatedAt }}</span>
        <button class="prom-card-refresh" type="button" data-testid="prom-card-refresh" title="刷新" aria-label="刷新" @click="load()">
          <ReIcon name="Refresh" :size="12" />
        </button>
      </span>
    </div>

    <div class="prom-card-body">
      <div v-if="error" class="prom-card-error" :title="error">{{ error }}</div>
      <template v-else>
        <!-- 指标卡 -->
        <div v-if="kind === 'prom-stat'" class="prom-stat">
          <div class="prom-stat-value">{{ statText }}</div>
          <div class="prom-stat-sub">{{ statSub }}</div>
        </div>

        <!-- 趋势图：容器始终存在（useEchart 只在挂载时初始化一次），加载态用浮层 -->
        <div v-else-if="kind === 'prom-chart'" ref="chartEl" class="prom-chart" />

        <!-- 数据表 -->
        <div v-else-if="kind === 'prom-table'" class="prom-table-wrap">
          <table v-if="tableRows.length" class="prom-table">
            <thead>
              <tr>
                <th>序列</th>
                <th v-if="rangeMode">最新</th>
                <th v-if="rangeMode">最小</th>
                <th v-if="rangeMode">最大</th>
                <th v-else>值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tableRows" :key="row.name">
                <td class="prom-table-name" :title="row.name">{{ row.name }}</td>
                <td v-if="rangeMode">{{ row.last }}</td>
                <td v-if="rangeMode">{{ row.min }}</td>
                <td v-if="rangeMode">{{ row.max }}</td>
                <td v-else>{{ row.last }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="prom-card-hint">暂无数据</div>
        </div>

        <!-- 脚本卡 -->
        <div v-else class="prom-script">
          <pre v-if="scriptOutput" class="prom-script-out">{{ scriptOutput }}</pre>
          <div v-else class="prom-card-hint">暂无输出</div>
        </div>
      </template>

      <div v-if="loading && !hasData" class="prom-card-loading">
        <span class="prom-card-loading-dot" />
        加载中…
      </div>
      <div v-if="configWarn" class="prom-card-warn" :title="configWarn">{{ configWarn }}</div>
    </div>
  </div>
</template>

<script setup lang="ts" name="PromCardRenderer">
/**
 * Prometheus 看板卡片渲染器。
 *
 * <p>一张卡片 = 一个 widget：按 {@code widget.type} 渲染指标卡 / 趋势图 / 数据表 / 脚本卡。
 * 卡片配置（PromQL、ECharts 参数、脚本、背景色、自定义 CSS、刷新间隔）来自
 * {@code widget.prom}，由设置弹窗（表单/自定义双模式）产出。数据取数走注入的
 * {@link PromDataContext}，因此同一套卡片在控制台与嵌入页复用。</p>
 *
 * <p>组件刻意做成「四类卡片合体」而不是四个注册组件：四者共享同一条取数/刷新/
 * 错误处理链路，拆开后每一处修补都要抄四遍。</p>
 */
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import ReIcon from "@repo/ui/re-icon";
import { token, URL_TREND_COLORS, useEchart } from "../charts/useEchart";
import { PROM_CTX_KEY, PROM_CARD_META, autoStep, formatMetric, formatNumber } from "./promTypes";
import type { PromCardConfig, PromCardKind, PromWidgetItem } from "./promTypes";

const props = withDefaults(
  defineProps<{
    widget: PromWidgetItem;
    hideTitle?: boolean;
  }>(),
  { hideTitle: false }
);

const ctx = inject(PROM_CTX_KEY, null);

/** 卡片实例唯一标识：既给 style 作用域用（自定义 CSS），也避免多卡样式互串 */
const uid = `pc-${Math.random().toString(36).slice(2, 10)}`;

const kind = computed<PromCardKind>(() => (props.widget.type || "prom-stat") as PromCardKind);
const config = computed<PromCardConfig>(() => props.widget.prom ?? {});
const title = computed(() => props.widget.title || PROM_CARD_META[kind.value]?.label || "卡片");
const rangeMode = computed(() => (config.value.mode ?? (kind.value === "prom-chart" ? "range" : "instant")) === "range");

const loading = ref(false);
const error = ref("");
const configWarn = ref("");
const updatedAt = ref("");
const response = ref<any>(null);
const scriptOutput = ref("");

const hasData = computed(() => response.value !== null || scriptOutput.value !== "");

// ==================== 卡片外观 ====================

/** 卡片外壳样式：背景色 / 文字色 / 圆角（appearance 与 prom 配置都算数） */
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

/** 把「自定义 CSS」注入到 head，用属性选择器圈定本卡片 */
function rebuildCustomCss(): void {
  if (typeof document === "undefined") {
    return;
  }
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.setAttribute("data-prom-card-style", uid);
    document.head.appendChild(styleEl);
  }
  const css = (config.value.css || "").trim();
  // 选择器带 .prom-card 类：scoped 样式是 .prom-card[data-v-*]（0,2,0），纯属性选择器只有
  // (0,1,0) 打不过，border-radius/background 这类撞属性的声明会被静默覆盖。
  // 同为 (0,2,0) 时本注入晚于构建产物，文档序靠后者胜。
  styleEl.textContent = css ? `.prom-card[data-prom-uid="${uid}"] { ${css} }` : "";
}

// ==================== 取数 ====================

/**
 * 取一次数据。
 *
 * @param silent 保留参数位：目前与普通加载同路径（刷新按钮也会带 loading），便于将来做静默轮询
 */
async function load(silent = false): Promise<void> {
  void silent;
  if (!ctx) {
    error.value = "数据上下文缺失";
    return;
  }
  if (kind.value === "prom-script") {
    await runScript();
    return;
  }
  const promql = (config.value.promql || "").trim();
  if (!promql) {
    error.value = "未配置 PromQL";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    if (rangeMode.value) {
      const minutes = config.value.durationMinutes && config.value.durationMinutes > 0 ? config.value.durationMinutes : 60;
      const end = Math.floor(Date.now() / 1000);
      const start = end - minutes * 60;
      const step = (config.value.step || "").trim() || autoStep(start, end);
      response.value = await ctx.queryRange(promql, start, end, step);
    } else {
      response.value = await ctx.query(promql);
    }
    updatedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    await nextTick();
    render();
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
    response.value = null;
  } finally {
    loading.value = false;
  }
}

/** 脚本卡：脚本体在沙箱外直接执行（后台管理员自己配置的采集脚本），ctx 提供取数能力 */
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

/** 脚本可用的上下文（仅暴露取数与数据源标识，不暴露页面内部状态） */
function scriptCtx(): Record<string, unknown> {
  return {
    query: (q: string, time?: string) => ctx!.query(q, time),
    queryRange: (q: string, minutes?: number, step?: string) => {
      const end = Math.floor(Date.now() / 1000);
      const m = minutes && minutes > 0 ? minutes : config.value.durationMinutes || 60;
      const start = end - m * 60;
      return ctx!.queryRange(q, start, end, (step || "").trim() || autoStep(start, end));
    },
    datasourceId: ctx!.datasourceId ?? null,
    now: Date.now(),
  };
}

// ==================== 指标卡 ====================

/** 指标卡主值：取第一条序列的最新点 */
const statText = computed(() => {
  const series = response.value?.data?.result ?? [];
  if (!series.length) {
    return "—";
  }
  const first = series[0];
  const raw = first.values?.length ? first.values[first.values.length - 1][1] : first.value ? first.value[1] : "";
  const num = parseFloat(raw);
  if (!Number.isFinite(num)) {
    return raw || "—";
  }
  return formatNumber(num, config.value.decimals ?? 2, config.value.unit || "");
});

/** 指标卡副标题：序列数 / 首条序列标签 */
const statSub = computed(() => {
  const series = response.value?.data?.result ?? [];
  if (!series.length) {
    return "无数据";
  }
  const text = formatMetric(series[0].metric);
  return series.length > 1 ? `${text}（共 ${series.length} 条序列）` : text;
});

// ==================== 数据表 ====================

interface PromTableRow {
  name: string;
  last: string;
  min: string;
  max: string;
}

const tableRows = computed<PromTableRow[]>(() => {
  const series = response.value?.data?.result ?? [];
  const decimals = config.value.decimals ?? 2;
  // 单位在弹窗里对指标卡/数据表都开放，表格列也必须拼接（否则输入框形同虚设）
  const unit = config.value.unit || "";
  return series.map((s: any) => {
    const name = formatMetric(s.metric);
    if (s.values?.length) {
      const nums = s.values.map((v: [number, string]) => parseFloat(v[1])).filter((n: number) => Number.isFinite(n));
      const last = parseFloat(s.values[s.values.length - 1][1]);
      return {
        name,
        last: formatNumber(last, decimals, unit),
        min: nums.length ? formatNumber(Math.min(...nums), decimals, unit) : "—",
        max: nums.length ? formatNumber(Math.max(...nums), decimals, unit) : "—",
      };
    }
    const value = s.value ? parseFloat(s.value[1]) : NaN;
    return { name, last: formatNumber(value, decimals, unit), min: "", max: "" };
  });
});

// ==================== 趋势图 ====================

const chartEl = ref<HTMLElement | null>(null);

/** ECharts 参数（自定义 JSON）深合并 */
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

/** 解析 ECharts 参数 JSON；失败时给出可见告警而不是静默吞掉 */
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

/** 用当前数据构造图表配置；useEchart 每次重绘都会重新调用 */
function buildOption(): EChartsOption {
  const series: any[] = response.value?.data?.result ?? [];
  const names = series.map((s: any) => formatMetric(s.metric));
  const chartType = config.value.chartType ?? "line";
  const base: Record<string, unknown> = {
    animation: false,
    grid: { left: 6, right: 12, top: names.length > 1 ? 30 : 12, bottom: 4, containLabel: true },
    tooltip: { trigger: "axis" },
    color: names.map((_: string, i: number) => token(URL_TREND_COLORS[i % URL_TREND_COLORS.length])),
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
    series: series.map((s: any, i: number) => {
      const data = (s.values ?? (s.value ? [s.value] : [])).map((v: [number, string]) => [v[0] * 1000, parseFloat(v[1])]);
      return {
        name: names[i],
        type: chartType === "bar" ? "bar" : "line",
        data,
        smooth: chartType === "line",
        showSymbol: false,
        barMaxWidth: 18,
        areaStyle: chartType === "area" ? { opacity: 0.16 } : undefined,
      };
    }),
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
    timer = window.setInterval(() => load(true), Math.max(5, seconds) * 1000);
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
  () => [props.widget.prom, props.widget.type],
  () => {
    rebuildCustomCss();
    setupTimer();
    void load();
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.prom-card {
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

.prom-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.prom-card-title {
  font-size: 12px;
  font-weight: 600;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prom-card-head-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.prom-card-time {
  font-size: 10px;
  color: var(--text-tertiary);
}

.prom-card-refresh {
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

.prom-card-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
}

.prom-card-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 12px;
}

.prom-card-error {
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

.prom-card-loading {
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

.prom-card-loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--brand-500);
  animation: prom-card-pulse 1.1s ease-in-out infinite;
}

@keyframes prom-card-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

.prom-card-warn {
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

/* ---- 指标卡 ---- */
.prom-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 0;
}

.prom-stat-value {
  font-size: clamp(20px, 4vw, 34px);
  font-weight: 700;
  color: inherit;
  line-height: 1.1;
  word-break: break-all;
}

.prom-stat-sub {
  font-size: 11px;
  color: var(--text-tertiary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 趋势图 ---- */
.prom-chart {
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* ---- 数据表 ---- */
.prom-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.prom-table {
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

.prom-table-name {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 脚本卡 ---- */
.prom-script {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.prom-script-out {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: inherit;
  font-family: inherit;
}
</style>
