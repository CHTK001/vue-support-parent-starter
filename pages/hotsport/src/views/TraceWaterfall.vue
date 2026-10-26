<template>
  <div class="view">
    <!-- 顶部操作条（无标题大卡） -->
    <div class="view-bar">
      <span class="match-hint">
        <ReButton icon="ArrowLeft" show-text @click="goBack">返回</ReButton>
        <ReTag v-if="traceId" type="info" round>
          <code class="mono">{{ traceId }}</code>
        </ReTag>
      </span>
      <div class="view-bar__actions">
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- 空态 -->
    <ReEmpty v-if="!traceId" description="缺少 traceId 参数，请从链路树页面进入" />

    <!-- 加载中 -->
    <ReSkeleton v-else-if="loading && !waterfall" :rows="6" animated />

    <!-- 主内容 -->
    <template v-else-if="waterfall && spans.length">
      <!-- 统计卡片 -->
      <div class="stat-row">
        <ReStatCard
          size="compact"
          title="总耗时"
          :value="`${fmtMs(waterfall.totalMs)} ms`"
          :desc="`根 span 自身 ${fmtMs(rootSelfMs)} ms`"
          :icon="Timer"
          icon-color="var(--apm-accent)"
        />
        <ReStatCard
          size="compact"
          title="Span 数"
          :value="waterfall.spanCount"
          :desc="`平均每 span ${fmtMs(avgSpanMs)} ms`"
          :icon="Connection"
          icon-color="var(--apm-accent-alt)"
        />
        <ReStatCard
          size="compact"
          title="错误 Span"
          :value="errorSpanCount"
          :desc="`错误率 ${errorRate} · 共 ${spans.length} 个 span`"
          :icon="Warning"
          :icon-color="errorSpanCount ? 'var(--apm-danger)' : 'var(--apm-success)'"
        />
        <ReStatCard
          size="compact"
          title="最深层级"
          :value="maxDepth"
          :desc="`${deepSpanCount} 个 span 位于第 ${maxDepth} 层`"
          :icon="DataLine"
          icon-color="var(--apm-info)"
        />
      </div>

      <!-- 甘特图 -->
      <div class="panel waterfall-panel">
        <div class="panel-head">
          <span>Span 甘特图</span>
          <span class="panel-sub">横向长度 = 耗时，横向位置 = 起始时刻 · 颜色 = spanKind · 红边 = 异常 · 点击条形定位明细</span>
        </div>
        <ReEcharts
          :option="waterfallOption"
          theme="light"
          height="100%"
          class="waterfall-chart"
          @click="onChartClick"
        />
      </div>

      <!-- Span 明细：点击 / Enter / Space 展开自身详情 -->
      <div class="panel">
        <div class="panel-head">
          <span>Span 明细</span>
          <span class="panel-sub">
            自身耗时 = 总耗时 − 子 span 耗时之和 · 点击任意行展开，键盘可用
          </span>
        </div>

        <div class="span-list">
          <div
            v-for="(sp, i) in spans"
            :key="`${sp.spanId || 'span'}-${i}`"
            class="span-item"
            :class="{ 'is-open': expandedIndex === i, 'is-error': isError(sp) }"
          >
            <button
              type="button"
              class="span-row"
              :aria-expanded="expandedIndex === i"
              :aria-controls="detailId(i)"
              @click="toggle(i)"
            >
              <el-icon class="chev" :class="{ open: expandedIndex === i }" aria-hidden="true">
                <ArrowRight />
              </el-icon>
              <span
                class="span-indent"
                :style="{ width: indentWidth(sp) + 'px' }"
                aria-hidden="true"
              />
              <el-tag size="small" effect="plain" round class="kind-tag">
                {{ sp.spanKind || "—" }}
              </el-tag>
              <span class="span-name mono">{{ spanName(sp) }}</span>
              <span class="span-bar" aria-hidden="true">
                <i
                  class="bar-total"
                  :style="{ marginLeft: offsetPercent(sp) + '%', width: durationPercent(sp) + '%' }"
                >
                  <i class="bar-self" :style="{ width: selfPercent(sp) + '%' }" />
                </i>
              </span>
              <span class="span-self mono">自身 {{ fmtMs(selfTimeMs(sp)) }} ms</span>
              <span class="span-dur mono">{{ fmtMs(sp.durationMs) }} ms</span>
              <span class="span-status" :class="isError(sp) ? 'err-text' : 'ok-text'">
                {{ sp.status || "OK" }}
              </span>
            </button>

            <div v-if="expandedIndex === i" :id="detailId(i)" class="span-detail">
              <dl class="detail-grid">
                <div class="detail-row">
                  <dt>Span ID</dt>
                  <dd><code class="mono">{{ sp.spanId }}</code></dd>
                </div>
                <div class="detail-row">
                  <dt>父 Span</dt>
                  <dd><code class="mono">{{ sp.parentSpanId || "—（根 span）" }}</code></dd>
                </div>
                <div class="detail-row">
                  <dt>操作</dt>
                  <dd>{{ sp.operation || sp.className || "—" }}</dd>
                </div>
                <div class="detail-row">
                  <dt>源 → 目标</dt>
                  <dd class="mono">{{ sp.source || "—" }} → {{ sp.target || "—" }}</dd>
                </div>
                <div class="detail-row">
                  <dt>协议 / 软件</dt>
                  <dd>{{ sp.protocol || "—" }}<template v-if="sp.software"> · {{ sp.software }}</template></dd>
                </div>
                <div class="detail-row">
                  <dt>时间</dt>
                  <dd class="mono">{{ sp.startTime }} → {{ sp.endTime || "—" }}</dd>
                </div>
                <div class="detail-row">
                  <dt>耗时构成</dt>
                  <dd class="mono">
                    总 {{ fmtMs(sp.durationMs) }} ms · 自身 {{ fmtMs(selfTimeMs(sp)) }} ms ·
                    子 span {{ fmtMs(Math.max(0, sp.durationMs - selfTimeMs(sp))) }} ms
                  </dd>
                </div>
                <div class="detail-row">
                  <dt>层级</dt>
                  <dd>第 {{ sp.depth }} 层</dd>
                </div>
                <div class="detail-row">
                  <dt>流量</dt>
                  <dd class="mono">出 {{ sp.bytesOut ?? 0 }} B · 入 {{ sp.bytesIn ?? 0 }} B</dd>
                </div>
              </dl>

              <div v-if="sp.attributes && Object.keys(sp.attributes).length" class="attr-block">
                <div class="attr-title">Attributes</div>
                <div v-for="(v, k) in sp.attributes" :key="k" class="attr-line">
                  <span class="attr-key">{{ k }}</span>
                  <span class="attr-val">{{ v }}</span>
                </div>
              </div>

              <div v-if="sp.errorType || sp.errorMessage" class="error-block">
                <div class="error-label">
                  <ReTag type="danger" round>{{ sp.errorType || "ERROR" }}</ReTag>
                </div>
                <pre class="error-msg">{{ sp.errorMessage || "（无详细信息）" }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 有 traceId、也拿到了数据，但没有 span：不画空图表 -->
    <div v-else-if="waterfall" class="panel">
      <div class="panel-empty">该链路没有 span 数据，可刷新重试或从链路列表重新进入</div>
    </div>

    <!-- 加载失败 / 无结果：不留空白页 -->
    <div v-else-if="!loading" class="panel">
      <div class="panel-empty">未获取到链路数据，请刷新或从链路列表重新进入</div>
    </div>

    <!-- 关联日志：按 traceId 拉取该链路的日志（无 traceId 时不显示） -->
    <div v-if="traceId" class="panel">
      <div class="panel-head">
        <span>关联日志</span>
        <span class="panel-sub">
          该链路 {{ relatedLogs.length }} 条日志 ·
          <ReButton text size="small" type="primary" @click="goToLogs">在日志页查看 →</ReButton>
        </span>
      </div>

      <div v-if="logsLoading" class="panel-empty">
        <span class="muted">正在加载关联日志…</span>
      </div>
      <div v-else-if="!relatedLogs.length" class="panel-empty muted">
        该链路暂无日志记录
      </div>
      <div v-else class="related-logs">
        <div
          v-for="(log, i) in relatedLogs"
          :key="`${log.id}-${i}`"
          class="log-line"
          :class="`log-line--${levelClass(log.level)}`"
        >
          <span class="log-time mono muted">{{ shortTime(log.timestamp) }}</span>
          <span class="lvl" :class="`lvl-${levelClass(log.level)}`">{{ log.level }}</span>
          <span class="log-msg">{{ log.message }}</span>
          <span v-if="log.traceId" class="span-badge mono">
            {{ spanCountOf(log.traceId) }} span
          </span>
          <span class="log-trace-hint mono muted">
            {{ log.traceId ? shortId(log.traceId) : "—" }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ROUTE_PREFIX } from "../config";
import { ArrowRight, Connection, DataLine, Timer, Warning } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReEmpty from "@repo/ui/re-empty";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReEcharts from "@repo/ui/re-echarts";
import { getTraceWaterfall, pageLogs, getTraceDetail } from "../api/apmApi";
import type { TraceWaterfall, WaterfallSpan, LogRecord } from "../api/apmApi";
import type { EChartsOption } from "echarts";
import {
  axisTextColor,
  chartCanvas,
  chartColor,
  dangerColor,
  mutedColor,
  neutralColor,
  okColor,
  splitLineColor,
  tooltipStyle,
  warningColor,
} from "../styles/chartTheme";

const route = useRoute();
const router = useRouter();

const traceId = computed(() => String(route.query.traceId ?? ""));

const waterfall = ref<TraceWaterfall | null>(null);
// 初值为 true：首帧不闪「未获取到数据」空态，等 load() 明确结束再判定
const loading = ref(true);
/** 展开的 span 下标（用下标而非 spanId：重复 spanId 也能各自独立展开） */
const expandedIndex = ref<number | null>(null);

/** 关联日志（按 traceId 拉取） */
const relatedLogs = ref<LogRecord[]>([]);
const logsLoading = ref(false);

/** 关联日志 Span 计数缓存（ref 包装 Map 以获得响应式更新） */
const spanCountCache = ref(new Map<string, number>());

// 派生统计
const spans = computed<WaterfallSpan[]>(() => waterfall.value?.spans ?? []);
const errorSpanCount = computed(() => spans.value.filter((s) => isError(s)).length);
const errorRate = computed(() => {
  const total = spans.value.length;
  if (!total) return "0%";
  return Math.round((errorSpanCount.value / total) * 100) + "%";
});
const maxDepth = computed(() => Math.max(0, ...spans.value.map((s) => Number(s.depth) || 0)));
const deepSpanCount = computed(() => spans.value.filter((s) => Number(s.depth) === maxDepth.value).length);
const avgSpanMs = computed(() => {
  if (!spans.value.length) return 0;
  return (waterfall.value?.totalMs ?? 0) / spans.value.length;
});
const rootSelfMs = computed(() => {
  const roots = spans.value.filter((s) => !s.parentSpanId);
  if (!roots.length) return 0;
  return roots.reduce((acc, s) => acc + selfTimeMs(s), 0);
});

/**
 * 子 span 耗时合计（按 parentSpanId 归并）。
 *
 * <p>自身耗时 = 本 span 总耗时 − 直接子 span 耗时之和。这是判断「时间花在自己
 * 还是花在下游」的关键指标：一个 800ms 的 span 若自身只有 2ms，优化点在下游；
 * 若自身 780ms，则瓶颈就在这段代码里。</p>
 */
const childDurationMap = computed(() => {
  const map = new Map<string, number>();
  for (const s of spans.value) {
    const parent = s.parentSpanId;
    if (!parent) continue;
    map.set(parent, (map.get(parent) ?? 0) + (Number(s.durationMs) || 0));
  }
  return map;
});

function selfTimeMs(s: WaterfallSpan): number {
  const children = childDurationMap.value.get(s.spanId) ?? 0;
  return Math.max(0, (Number(s.durationMs) || 0) - children);
}

function isError(s: WaterfallSpan): boolean {
  return Boolean(s.status && s.status !== "OK");
}

// 工具函数
function fullSpanName(s: WaterfallSpan): string {
  return s.className ? `${s.className}.${s.methodName ?? s.operation}` : s.operation ?? "unknown";
}

function spanName(s: WaterfallSpan): string {
  const name = fullSpanName(s);
  return name.length > 20 ? name.slice(0, 20) + "…" : name;
}

/** 毫秒：整数不带小数点，非整数保留 1 位，避免 12.0 ms 这种噪音 */
function fmtMs(v: number | undefined): string {
  const n = Number(v) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push(ROUTE_PREFIX + "/traces");
}

// 加载数据
async function load() {
  if (!traceId.value) return;
  loading.value = true;
  waterfall.value = null;
  expandedIndex.value = null;
  try {
    waterfall.value = await getTraceWaterfall(traceId.value);
  } catch {
    waterfall.value = null;
  } finally {
    loading.value = false;
  }
  // 同时拉关联日志
  await loadRelatedLogs();
  // 预取日志的 span 计数（驱动 spanCountCache.value Map 响应式更新）
  prefetchSpanCounts();
}

/** 预取日志的 span 计数（ref<Map> 会被 Vue 响应式追踪） */
async function prefetchSpanCounts() {
  if (!relatedLogs.value.length) return;
  for (const log of relatedLogs.value) {
    if (!log.traceId) continue;
    if (spanCountCache.value.has(log.traceId)) continue;
    try {
      const spans = await getTraceDetail(log.traceId);
      const count = Array.isArray(spans) ? spans.length : 0;
      // 创建新 Map 触发响应式更新（Map.set 不触发）
      spanCountCache.value = new Map(spanCountCache.value).set(log.traceId, count);
    } catch {
      spanCountCache.value = new Map(spanCountCache.value).set(log.traceId, 0);
    }
  }
}

/** 同步取 span 计数（加载中显示 "…"） */
function spanCountOf(traceId: string): number | string {
  if (!traceId) return 0;
  return spanCountCache.value.get(traceId) ?? "…";
}

/** 按 traceId 拉取该链路的关联日志 */
async function loadRelatedLogs() {
  if (!traceId.value) return;
  logsLoading.value = true;
  try {
    const res = await pageLogs({ traceId: traceId.value, size: 50 });
    relatedLogs.value = res.items || [];
  } catch {
    relatedLogs.value = [];
  } finally {
    logsLoading.value = false;
  }
}

/** 级别 → CSS 类名 */
function levelClass(level: string): string {
  switch ((level || "").toUpperCase()) {
    case "ERROR": case "FATAL": return "error";
    case "WARN": case "WARNING": return "warn";
    case "INFO": return "info";
    default: return "debug";
  }
}

/** 时间戳截取 HH:mm:ss */
function shortTime(ts: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** traceId 截取前 12 位 */
function shortId(id: string): string {
  return id ? id.slice(0, 12) : "—";
}

/** 跳转到日志页，带 traceId 参数 */
function goToLogs() {
  router.push({ path: ROUTE_PREFIX + "/logs", query: { traceId: traceId.value } });
}

onMounted(() => {
  load();
});

function toggle(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

function detailId(index: number): string {
  return `span-detail-${index}`;
}

/**
 * 点击瀑布图里的 span 条 → 展开对应明细并滚动到可视区。
 *
 * <p>图表与列表是同一份 spans，dataIndex 即列表下标；再点一次同一根条收起。</p>
 */
async function onChartClick(params: unknown): Promise<void> {
  const dataIndex = Number((params as { dataIndex?: number } | null)?.dataIndex);
  if (!Number.isInteger(dataIndex) || !spans.value[dataIndex]) return;
  expandedIndex.value = expandedIndex.value === dataIndex ? null : dataIndex;
  if (expandedIndex.value === null) return;
  await nextTick();
  document.getElementById(detailId(dataIndex))?.scrollIntoView({ block: "nearest" });
}

// ---- 瀑布图 ----
// 缩进按层级阶梯，最宽 8 档后封顶（再深也读不出层级差异，只会把行名挤没）
function indentWidth(s: WaterfallSpan): number {
  return Math.min(8, Math.max(0, Number(s.depth) || 0)) * 10;
}

/** 甘特图 y 轴缩进档数（同样封顶 8 档） */
function indentLevel(s: WaterfallSpan): number {
  return Math.min(8, Math.max(0, Number(s.depth) || 0));
}

function offsetPercent(s: WaterfallSpan): number {
  const total = waterfall.value?.totalMs ?? 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, ((Number(s.offsetMs) || 0) / total) * 100));
}

function durationPercent(s: WaterfallSpan): number {
  const total = waterfall.value?.totalMs ?? 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0.4, ((Number(s.durationMs) || 0) / total) * 100));
}

/** 自身耗时占本 span 的比例：条内深色段 = 自身，浅色段 = 子 span */
function selfPercent(s: WaterfallSpan): number {
  const dur = Number(s.durationMs) || 0;
  if (dur <= 0) return 0;
  return Math.min(100, Math.max(0, (selfTimeMs(s) / dur) * 100));
}

/** spanKind → 令牌色：服务端蓝 / 客户端琥珀 / 生产靛蓝 / 消费翡翠 / 内部灰 */
function spanKindColor(kind: string | undefined): string {
  switch ((kind || "").toUpperCase()) {
    case "SERVER":
      return chartColor(0);
    case "CLIENT":
      return warningColor();
    case "PRODUCER":
      return chartColor(2);
    case "CONSUMER":
      return okColor();
    case "INTERNAL":
      return mutedColor();
    default:
      return neutralColor();
  }
}

const waterfallOption = computed<EChartsOption>(() => {
  const s = spans.value;
  const totalMs = waterfall.value?.totalMs ?? 1;

  // y 轴：每个 span 一行，按层级缩进（甘特图靠缩进表达调用深度）
  const rowLabels = s.map((sp) => "　".repeat(indentLevel(sp)) + spanName(sp));

  // 每个 span 的数据坐标 [yIndex, offsetMs, offsetMs + durationMs]
  const seriesData = s.map((sp, i) => [i, sp.offsetMs, sp.offsetMs + sp.durationMs]);

  // tooltip formatter：总耗时之外补自身耗时，直接回答「慢在自己还是慢在下游」
  const escapeHtml = (v: unknown): string =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const tooltipFormatter = (params: unknown): string => {
    const p = params as { dataIndex: number };
    const sp = s[p.dataIndex];
    if (!sp) return "";
    const muted = "var(--apm-muted)";
    const err = "var(--apm-danger)";
    const lines = [
      `<div style="font-size:13px;font-weight:600;margin-bottom:6px">${escapeHtml(spanName(sp))}</div>`,
      `<div style="font-size:12px;color:${muted}">总耗时：${fmtMs(sp.durationMs)} ms</div>`,
      `<div style="font-size:12px;color:${(sp.errorType || isError(sp)) ? err : muted}">自身耗时：${fmtMs(selfTimeMs(sp))} ms</div>`,
      `<div style="font-size:12px;color:${muted}">层级：${sp.depth} · 状态：${escapeHtml(sp.status ?? "OK")}</div>`,
      sp.source
        ? `<div style="font-size:12px;color:${muted}">${escapeHtml(sp.source)} → ${escapeHtml(sp.target ?? "—")}</div>`
        : "",
    ];
    return lines.filter(Boolean).join("<br/>");
  };

  return {
    ...chartCanvas(),
    grid: {
      left: 180,
      right: 30,
      top: 40,
      bottom: 30,
    },
    tooltip: {
      show: true,
      trigger: "item",
      ...tooltipStyle(),
      formatter: tooltipFormatter,
    },
    xAxis: {
      type: "value",
      min: 0,
      max: totalMs,
      name: "时间 (ms)",
      nameTextStyle: { color: axisTextColor(), fontSize: 11 },
      axisLabel: { color: axisTextColor(), fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor() } },
      axisLine: { show: false },
      axisTick: { show: false },
      position: "top",
    },
    yAxis: {
      type: "category",
      data: rowLabels,
      inverse: true,
      axisLabel: {
        color: axisTextColor(),
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
          const error = sp ? isError(sp) : false;

          const [x0, y0] = api.coord([start, yIndex]);
          const [w, h] = api.size([dur, 1]);

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
              fill: spanKindColor(sp?.spanKind),
              stroke: error ? dangerColor() : "transparent",
              lineWidth: error ? 2 : 0,
            }),
          };
        },
      },
    ] as EChartsOption["series"],
  };
});
</script>

<style scoped>
/* 骨架（.view / .view-toolbar / .toolbar-* / .stat-row / .panel / .panel-head /
   .panel-sub / .panel-empty / .mono / .muted / .err-text / .ok-text）
   统一由 styles/layout.css 提供，此处只留本页独有部分。
   颜色令牌：koi 优先，未接入 koi 时回落 hotsport 的 --apm-* 令牌。 */

.waterfall-panel {
  min-height: 480px;
}

.waterfall-chart {
  flex: 1;
  min-height: 400px;
}

/* ---- Span 明细列表 ---- */
.span-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle, var(--apm-border-soft));
  border-radius: var(--apm-radius-md);
  overflow: hidden;
}

.span-item + .span-item {
  border-top: 1px solid var(--border-subtle, var(--apm-border-soft));
}

.span-item.is-error {
  background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 5%, transparent);
}

.span-item.is-open {
  background: var(--bg-elevated, var(--apm-panel-raised));
}

/* 整行是按钮：键盘 Tab 聚焦、Enter/Space 展开，无需额外事件绑定 */
.span-row {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  width: 100%;
  min-height: 38px;
  padding: 6px var(--apm-space-3);
  margin: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary, var(--apm-fg));
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--apm-t-fast);
}

.span-row:hover {
  background: var(--bg-hover, var(--apm-panel-active));
}

.span-row:focus-visible {
  outline: 2px solid var(--brand-500, var(--apm-accent));
  outline-offset: -2px;
}

.chev {
  flex-shrink: 0;
  color: var(--text-tertiary, var(--apm-muted));
  transition: transform var(--apm-t-fast);
}

.chev.open {
  transform: rotate(90deg);
  color: var(--brand-500, var(--apm-accent));
}

/* 缩进用固定宽度占位而不是 margin：行高与右侧列宽不随层级抖动 */
.span-indent {
  flex-shrink: 0;
  height: 1px;
}

.kind-tag {
  flex-shrink: 0;
  width: 84px;
  justify-content: center;
}

.span-name {
  min-width: 150px;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, var(--apm-fg));
}

/* 时间条：浅色段 = 子 span 耗时，深色段 = 自身耗时 */
.span-bar {
  position: relative;
  flex: 1;
  min-width: 120px;
  height: 8px;
  border-radius: 999px;
  background: var(--border-subtle, var(--apm-border-soft));
  overflow: hidden;
}

.bar-total {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-500, var(--apm-accent)) 26%, transparent);
}

.bar-self {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 999px;
  background: var(--brand-500, var(--apm-accent));
}

.span-item.is-error .bar-self {
  background: var(--status-error, var(--apm-danger));
}

.span-self {
  flex-shrink: 0;
  width: 108px;
  text-align: right;
  white-space: nowrap;
  color: var(--text-secondary, var(--apm-fg-regular));
}

.span-dur {
  flex-shrink: 0;
  width: 84px;
  text-align: right;
  white-space: nowrap;
  color: var(--text-tertiary, var(--apm-muted));
}

.span-status {
  flex-shrink: 0;
  width: 56px;
  text-align: right;
  font-size: 12px;
}

/* ---- 展开后的详情 ---- */
.span-detail {
  padding: 0 var(--apm-space-4) var(--apm-space-3) calc(var(--apm-space-4) + 28px);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 6px var(--apm-space-4);
  margin: 0;
}

.detail-row {
  display: flex;
  gap: var(--apm-space-2);
  min-width: 0;
  font-size: 12px;
  line-height: 1.6;
}

.detail-row dt {
  flex-shrink: 0;
  width: 74px;
  color: var(--text-tertiary, var(--apm-muted));
}

.detail-row dd {
  margin: 0;
  min-width: 0;
  color: var(--text-secondary, var(--apm-fg-regular));
  word-break: break-word;
}

.attr-block {
  margin-top: var(--apm-space-3);
  border-top: 1px dashed var(--border-subtle, var(--apm-border-soft));
  padding-top: var(--apm-space-2);
}

.attr-title {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary, var(--apm-muted));
  margin-bottom: var(--apm-space-1);
}

.attr-line {
  display: flex;
  gap: var(--apm-space-3);
  font-size: 12px;
  padding: 2px 0;
}

.attr-key {
  color: var(--text-tertiary, var(--apm-muted));
  min-width: 120px;
  flex-shrink: 0;
}

.attr-val {
  color: var(--text-primary, var(--apm-fg));
  word-break: break-all;
}

.error-block {
  margin-top: var(--apm-space-3);
}

.error-label {
  margin-bottom: var(--apm-space-2);
}

.error-msg {
  margin: 0;
  background: var(--apm-danger-bg);
  border: 1px solid color-mix(in srgb, var(--status-error, var(--apm-danger)) 25%, transparent);
  border-radius: var(--apm-radius-md);
  padding: var(--apm-space-3);
  color: var(--status-error, var(--apm-danger));
  font-size: 12px;
  font-family: var(--apm-font-mono);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* 窄屏：时间条让位给文字，自身耗时不折行 */
@media (max-width: 900px) {
  .span-bar {
    display: none;
  }

  .span-name {
    flex: 1;
    max-width: none;
  }
}

/* ---- 关联日志 ---- */
.related-logs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 320px;
  overflow-y: auto;
}

.log-line {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  padding: 5px var(--apm-space-3);
  border-radius: var(--apm-radius-sm);
  font-size: 12.5px;
  min-height: 36px;
  transition: background var(--apm-t-fast);
}

.log-line:hover {
  background: var(--bg-hover, var(--apm-panel-active));
}

.log-line--error {
  background: color-mix(in srgb, var(--status-error, var(--apm-danger)) 7%, transparent);
}

.log-line--warn {
  background: color-mix(in srgb, var(--status-warning, var(--apm-warning)) 6%, transparent);
}

.log-time {
  width: 72px;
  flex-shrink: 0;
  font-size: 11px;
}

.log-msg {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary, var(--apm-fg-regular));
}

.log-trace-hint {
  flex-shrink: 0;
  font-size: 11px;
}

/* 关联 Span 徽标 */
.span-badge {
  flex-shrink: 0;
  min-width: 48px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-500, var(--apm-accent)) 14%, transparent);
  color: var(--brand-500, var(--apm-accent));
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* 级别徽标（与 Logs.vue 共享同款样式） */
.lvl {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border-radius: 999px;
  font-family: var(--apm-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}

.lvl::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
}

.lvl-error { color: var(--status-error, var(--apm-danger)); }
.lvl-warn  { color: var(--status-warning, var(--apm-warning)); }
.lvl-info  { color: var(--brand-500, var(--apm-accent)); }
.lvl-debug { color: var(--text-tertiary, var(--apm-muted)); }

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .span-row,
  .chev {
    transition: none;
  }

  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
