<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getConfig } from "@repo/config";
import { http, message, type ReturnResult } from "@repo/utils";

interface WebPerformanceSummary {
  sampleCount?: number;
  successCount?: number;
  successRate?: number;
  minCostMs?: number;
  maxCostMs?: number;
  avgCostMs?: number;
  p95CostMs?: number;
  avgTtfbMs?: number;
  avgPayloadBytes?: number;
}

interface WebPerformanceSample {
  index?: number;
  statusCode?: number;
  totalCostMs?: number;
  ttfbMs?: number;
  headerLatencyMs?: number;
  downloadMs?: number;
  success?: boolean;
}

interface WebPerformanceTraceStage {
  name?: string;
  durationMs?: number;
}

interface WebPerformanceTrace {
  stages?: WebPerformanceTraceStage[];
}

interface WebPerformanceAnalyzeResult {
  summary?: WebPerformanceSummary;
  samples?: WebPerformanceSample[];
  trace?: WebPerformanceTrace;
  recommendations?: string[];
  aiAdvice?: string;
  aiEnhanced?: boolean;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const targetUrl = ref("");
const analyzeEndpoint = computed(() => {
  const configured = String(getConfig().AiPerformanceAnalyzeUrl || "").trim();
  return configured || "/v1/ai/performance/website/analyze";
});
const sampleCount = ref(5);
const loading = ref(false);
const errorText = ref("");
const report = ref<WebPerformanceAnalyzeResult | null>(null);

watch(
  dialogVisible,
  (visible) => {
    if (!visible) {
      return;
    }
    if (!targetUrl.value) {
      const configTarget = getConfig().AiPerformanceDefaultTargetUrl;
      if (configTarget && configTarget.trim()) {
        targetUrl.value = configTarget.trim();
        return;
      }
      if (typeof window !== "undefined") {
        targetUrl.value = window.location.origin;
      }
    }
  },
  { immediate: true },
);

const summary = computed(() => report.value?.summary ?? null);
const samples = computed(() => report.value?.samples ?? []);
const traceStages = computed(() => report.value?.trace?.stages ?? []);
const recommendations = computed(() => report.value?.recommendations ?? []);

const chart = computed(() => {
  const width = 860;
  const height = 220;
  const paddingX = 32;
  const paddingY = 24;
  const data = samples.value;
  if (!data.length) {
    return {
      width,
      height,
      costLine: "",
      ttfbLine: "",
      costDots: [] as Array<{ x: number; y: number; value: number }>,
      ttfbDots: [] as Array<{ x: number; y: number; value: number }>,
      gridYs: [] as number[],
    };
  }

  const costs = data.map((item) => Number(item.totalCostMs || 0));
  const ttfb = data.map((item) => Number(item.ttfbMs || 0));
  const maxValue = Math.max(1, ...costs, ...ttfb);
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const toY = (value: number) =>
    Math.round((height - paddingY - (value / maxValue) * innerHeight) * 100) /
    100;

  const toPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const x = Math.round((paddingX + xStep * index) * 100) / 100;
        return `${x},${toY(value)}`;
      })
      .join(" ");

  const toDots = (values: number[]) =>
    values.map((value, index) => ({
      x: Math.round((paddingX + xStep * index) * 100) / 100,
      y: toY(value),
      value,
    }));

  return {
    width,
    height,
    costLine: toPoints(costs),
    ttfbLine: toPoints(ttfb),
    costDots: toDots(costs),
    ttfbDots: toDots(ttfb),
    gridYs: [0, 0.25, 0.5, 0.75, 1].map(
      (rate) => height - paddingY - innerHeight * rate,
    ),
  };
});

const traceMax = computed(() => {
  if (!traceStages.value.length) {
    return 1;
  }
  return Math.max(
    1,
    ...traceStages.value.map((item) => Number(item.durationMs || 0)),
  );
});

const kpiItems = computed(() => {
  const data = summary.value;
  return [
    { label: "平均耗时", value: `${formatNumber(data?.avgCostMs)} ms` },
    { label: "P95 耗时", value: `${formatNumber(data?.p95CostMs)} ms` },
    { label: "平均 TTFB", value: `${formatNumber(data?.avgTtfbMs)} ms` },
    {
      label: "可用率",
      value: `${formatNumber(data?.successRate, 1)}% (${data?.successCount ?? 0}/${data?.sampleCount ?? 0})`,
    },
    { label: "最小/最大", value: `${formatInteger(data?.minCostMs)} / ${formatInteger(data?.maxCostMs)} ms` },
    { label: "平均载荷", value: formatBytes(data?.avgPayloadBytes ?? 0) },
  ];
});

const runAnalyze = async () => {
  const endpoint = analyzeEndpoint.value;
  if (!endpoint) {
    message.warning("请在运行时配置中设置 AiPerformanceAnalyzeUrl");
    return;
  }

  let normalizedUrl = "";
  try {
    normalizedUrl = normalizeUrl(targetUrl.value);
  } catch (error) {
    message.warning((error as Error).message || "请输入有效的目标 URL");
    return;
  }

  loading.value = true;
  errorText.value = "";
  report.value = null;
  try {
    const response = await http.request<ReturnResult<WebPerformanceAnalyzeResult>>(
      "post",
      endpoint,
      {
        data: {
          url: normalizedUrl,
          sampleCount: sampleCount.value,
          includeSnapshot: true,
          aiAdviceEnabled: true,
        },
      },
    );
    const data = response?.data as WebPerformanceAnalyzeResult | undefined;
    if (!data) {
      throw new Error("服务返回为空");
    }
    report.value = data;
  } catch (error) {
    const msg =
      (error as { msg?: string })?.msg ||
      (error as Error)?.message ||
      "性能分析失败";
    errorText.value = msg;
    message.error(msg);
  } finally {
    loading.value = false;
  }
};

const normalizeUrl = (value: string) => {
  const input = value?.trim();
  if (!input) {
    throw new Error("请输入目标 URL");
  }
  const url = new URL(input);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URL 必须以 http:// 或 https:// 开头");
  }
  return url.toString();
};

const formatNumber = (value: number | undefined, digits = 2) =>
  Number.isFinite(value as number) ? Number(value).toFixed(digits) : "0";

const formatInteger = (value: number | undefined) =>
  Number.isFinite(value as number) ? Math.round(Number(value)).toString() : "0";

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let num = value;
  let idx = 0;
  while (num >= 1024 && idx < units.length - 1) {
    num /= 1024;
    idx += 1;
  }
  return `${num.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="AI 性能分析"
    width="980px"
    class="ai-performance-dialog"
    :close-on-click-modal="false"
  >
    <div class="ai-performance-dialog__toolbar">
      <el-input
        v-model="targetUrl"
        placeholder="输入目标网站 URL，例如 https://example.com"
        class="toolbar-input toolbar-input--url"
      />
      <el-input-number
        v-model="sampleCount"
        :min="1"
        :max="20"
        :step="1"
        size="default"
        class="toolbar-sample-count"
      />
      <el-button
        type="primary"
        :loading="loading"
        @click="runAnalyze"
      >
        <IconifyIconOnline icon="ri:flashlight-line" />
        开始分析
      </el-button>
    </div>
    <div class="ai-performance-dialog__endpoint">
      分析接口：{{ analyzeEndpoint }}
    </div>

    <div v-if="errorText" class="ai-performance-dialog__error">
      <IconifyIconOnline icon="ri:error-warning-line" />
      <span>{{ errorText }}</span>
    </div>

    <div v-if="report" class="ai-performance-dialog__body">
      <section class="kpi-grid">
        <article v-for="item in kpiItems" :key="item.label" class="kpi-item">
          <span class="kpi-label">{{ item.label }}</span>
          <strong class="kpi-value">{{ item.value }}</strong>
        </article>
      </section>

      <section class="chart-panel">
        <header class="panel-header">
          <span class="panel-title">采样延迟趋势</span>
          <div class="chart-legend">
            <span class="legend-dot legend-dot--cost" />总耗时
            <span class="legend-dot legend-dot--ttfb" />TTFB
          </div>
        </header>
        <div class="chart-canvas">
          <svg :viewBox="`0 0 ${chart.width} ${chart.height}`" preserveAspectRatio="none">
            <g>
              <line
                v-for="(y, idx) in chart.gridYs"
                :key="`grid-${idx}`"
                :x1="24"
                :x2="chart.width - 24"
                :y1="y"
                :y2="y"
                class="chart-grid-line"
              />
            </g>
            <polyline :points="chart.costLine" class="chart-line chart-line--cost" />
            <polyline :points="chart.ttfbLine" class="chart-line chart-line--ttfb" />
            <g>
              <circle
                v-for="(dot, idx) in chart.costDots"
                :key="`cost-${idx}`"
                :cx="dot.x"
                :cy="dot.y"
                r="3"
                class="chart-dot chart-dot--cost"
              />
              <circle
                v-for="(dot, idx) in chart.ttfbDots"
                :key="`ttfb-${idx}`"
                :cx="dot.x"
                :cy="dot.y"
                r="3"
                class="chart-dot chart-dot--ttfb"
              />
            </g>
          </svg>
        </div>
      </section>

      <section v-if="traceStages.length" class="trace-panel">
        <header class="panel-header">
          <span class="panel-title">阶段耗时分解</span>
        </header>
        <div class="trace-bars">
          <div v-for="(stage, idx) in traceStages" :key="`${stage.name || 'stage'}-${idx}`" class="trace-row">
            <span class="trace-name">{{ stage.name || `阶段 ${idx + 1}` }}</span>
            <div class="trace-track">
              <div
                class="trace-bar"
                :style="{ width: `${((stage.durationMs || 0) / traceMax) * 100}%` }"
              />
            </div>
            <span class="trace-value">{{ formatInteger(stage.durationMs) }} ms</span>
          </div>
        </div>
      </section>

      <section v-if="recommendations.length || report.aiAdvice" class="advice-panel">
        <header class="panel-header">
          <span class="panel-title">优化建议</span>
        </header>
        <ul v-if="recommendations.length" class="recommendation-list">
          <li v-for="(item, idx) in recommendations" :key="`${idx}-${item}`">
            {{ item }}
          </li>
        </ul>
        <div v-if="report.aiAdvice" class="ai-advice-block">
          <div class="ai-advice-header">
            <IconifyIconOnline icon="ri:robot-line" />
            <span>AI 建议 {{ report.aiEnhanced ? "(增强)" : "" }}</span>
          </div>
          <pre>{{ report.aiAdvice }}</pre>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.ai-performance-dialog {
  :deep(.el-dialog__body) {
    padding-top: 12px;
  }
}

.ai-performance-dialog__toolbar {
  display: grid;
  grid-template-columns: 2fr 120px auto;
  gap: 10px;
  margin-bottom: 8px;
}

.toolbar-sample-count {
  width: 120px;
}

.ai-performance-dialog__endpoint {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ai-performance-dialog__error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  color: var(--el-color-danger);
  font-size: 13px;
}

.ai-performance-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.kpi-item {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.08),
    rgba(var(--el-color-primary-rgb), 0.02)
  );
}

.kpi-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.kpi-value {
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.chart-panel,
.trace-panel,
.advice-panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-legend {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}

.legend-dot--cost {
  background-color: #409eff;
}

.legend-dot--ttfb {
  background-color: #67c23a;
}

.chart-canvas {
  width: 100%;
  height: 220px;
}

.chart-canvas svg {
  width: 100%;
  height: 100%;
}

.chart-grid-line {
  stroke: var(--el-border-color-lighter);
  stroke-width: 1;
}

.chart-line {
  fill: none;
  stroke-width: 2;
}

.chart-line--cost {
  stroke: #409eff;
}

.chart-line--ttfb {
  stroke: #67c23a;
}

.chart-dot {
  stroke: #ffffff;
  stroke-width: 1.5;
}

.chart-dot--cost {
  fill: #409eff;
}

.chart-dot--ttfb {
  fill: #67c23a;
}

.trace-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trace-row {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  gap: 10px;
  align-items: center;
}

.trace-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.trace-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.trace-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #409eff, #67c23a);
}

.trace-value {
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.recommendation-list {
  margin: 0;
  padding-left: 18px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
}

.ai-advice-block {
  margin-top: 10px;
  border-radius: 8px;
  border: 1px dashed var(--el-border-color);
  padding: 10px;
  background: var(--el-fill-color-light);
}

.ai-advice-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.ai-advice-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  font-family: Consolas, "Courier New", monospace;
}

@media (max-width: 1080px) {
  .ai-performance-dialog__toolbar {
    grid-template-columns: 1fr;
  }

  .toolbar-sample-count {
    width: 100%;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trace-row {
    grid-template-columns: 96px 1fr 72px;
  }
}
</style>
