<template>
  <div class="dsm-flex-col">
    <!-- 查询输入区 -->
    <div class="pqs-input-card">
      <div class="pqs-toolbar">
        <div class="dsm-seg" role="group" aria-label="查询模式">
          <button type="button" :class="{ 'is-active': mode === 'instant' }" data-testid="prq-mode-instant" @click="mode = 'instant'">即时</button>
          <button type="button" :class="{ 'is-active': mode === 'range' }" data-testid="prq-mode-range" @click="mode = 'range'">范围</button>
        </div>
        <template v-if="mode === 'range'">
          <ReSelect v-model="duration" class="pqs-select" data-testid="prq-select-duration" @change="() => {}">
            <ReOption value="15" label="近 15 分钟" />
            <ReOption value="60" label="近 1 小时" />
            <ReOption value="360" label="近 6 小时" />
            <ReOption value="1440" label="近 24 小时" />
            <ReOption value="10080" label="近 7 天" />
          </ReSelect>
        </template>
        <ReSelect v-model="sample" class="pqs-select pqs-select--wide" data-testid="prq-select-sample" placeholder="示例 PromQL" @change="onSample">
          <ReOption value="up" label="up — 目标存活" />
          <ReOption value="process_cpu_seconds_total" label="process_cpu_seconds_total — CPU" />
          <ReOption value="rate(prometheus_http_requests_total[5m])" label="rate(prometheus_http_requests_total[5m]) — QPS" />
          <ReOption value="prometheus_tsdb_head_series" label="prometheus_tsdb_head_series — 时序数" />
          <ReOption value="sum(up) by (job)" label="sum(up) by (job) — 按任务汇总" />
        </ReSelect>
        <div class="pqs-spacer" />
        <ReButton type="primary" data-testid="prq-btn-run" :disabled="!query.trim() || loading" @click="run">
          <ReIcon name="Search" :size="14" />
          执行
        </ReButton>
      </div>
      <textarea
        v-model="query"
        class="pqs-textarea"
        data-testid="prq-input"
        rows="3"
        spellcheck="false"
        placeholder="输入 PromQL，Ctrl+Enter 执行"
        @keydown.ctrl.enter.prevent="run"
        @keydown.meta.enter.prevent="run"
      ></textarea>
      <div v-if="error" class="pqs-error">{{ error }}</div>
    </div>

    <!-- 结果区 -->
    <div v-if="loading" class="pqs-result-card pqs-center">查询中…</div>
    <div v-else-if="rows.length || series.length" class="pqs-result-card" data-testid="prq-result">
      <div class="pqs-result-head">
        <span class="pqs-result-title">结果 · {{ rows.length }} 条序列</span>
        <span class="pqs-result-meta">{{ elapsed }} ms</span>
      </div>

      <!-- 范围查询：图表 -->
      <div v-if="mode === 'range'" ref="chartEl" class="pqs-chart" />

      <!-- 表格 -->
      <div class="pqs-table-wrap">
        <table class="pqs-table">
          <thead>
            <tr>
              <th>序列</th>
              <th v-if="mode === 'range'">最新</th>
              <th v-if="mode === 'range'">最小</th>
              <th v-if="mode === 'range'">最大</th>
              <th v-else>值</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.name">
              <td class="pqs-name" :title="row.name">{{ row.name }}</td>
              <td v-if="mode === 'range'">{{ row.last }}</td>
              <td v-if="mode === 'range'">{{ row.min }}</td>
              <td v-if="mode === 'range'">{{ row.max }}</td>
              <td v-else>{{ row.last }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="pqs-result-card pqs-center">暂无结果</div>
  </div>
</template>

<script setup lang="ts" name="PromQueryPanel">
/**
 * PromQL 查询面板：即时/范围双模式，范围结果用 ECharts 折线呈现。
 */
import { message } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";

import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReSelect from "@repo/ui/re-select";
import { ReOption } from "@repo/ui/re-kit";
import { token, URL_TREND_COLORS, useEchart } from "../charts/useEchart";
import { formatMetric, formatNumber, autoStep } from "./promTypes";
import { prometheusQuery, prometheusQueryRange, type PromSeries } from "../../../api/prometheus/api";

const props = defineProps<{
  datasourceId: number | null | undefined;
}>();

const mode = ref<"instant" | "range">("instant");
const query = ref("up");
const duration = ref("60");
const sample = ref("");
const loading = ref(false);
const error = ref("");
const elapsed = ref(0);
const series = ref<PromSeries[]>([]);

function onSample(value: string | number | boolean | undefined) {
  if (typeof value === "string" && value) {
    query.value = value;
  }
}

const rows = computed(() => {
  return series.value.map(s => {
    if (s.values?.length) {
      const nums = s.values.map(v => parseFloat(v[1])).filter(Number.isFinite);
      const last = parseFloat(s.values[s.values.length - 1][1]);
      return {
        name: formatMetric(s.metric),
        last: formatNumber(last, 4),
        min: nums.length ? formatNumber(Math.min(...nums), 4) : "—",
        max: nums.length ? formatNumber(Math.max(...nums), 4) : "—",
      };
    }
    const value = s.value ? parseFloat(s.value[1]) : NaN;
    return { name: formatMetric(s.metric), last: formatNumber(value, 4), min: "", max: "" };
  });
});

const chartEl = ref<HTMLElement | null>(null);

function buildOption(): any {
  const names = series.value.map(s => formatMetric(s.metric));
  return {
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
    legend: names.length > 1 ? { top: 0, type: "scroll", textStyle: { fontSize: 10, color: token("--text-secondary") } } : undefined,
    series: series.value.map((s, i) => ({
      name: names[i],
      type: "line",
      showSymbol: false,
      smooth: true,
      data: (s.values ?? (s.value ? [s.value] : [])).map(v => [v[0] * 1000, parseFloat(v[1])]),
    })),
  };
}

const { render } = useEchart(chartEl, buildOption);

let timer: number | null = null;

async function run(): Promise<void> {
  const q = query.value.trim();
  if (!q) {
    return;
  }
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  loading.value = true;
  error.value = "";
  const start = performance.now();
  try {
    if (mode.value === "range") {
      const minutes = Number(duration.value) || 60;
      const end = Math.floor(Date.now() / 1000);
      const begin = end - minutes * 60;
      const res = await prometheusQueryRange(props.datasourceId, q, begin, end, autoStep(begin, end));
      series.value = res.data?.result ?? [];
    } else {
      const res = await prometheusQuery(props.datasourceId, q);
      series.value = res.data?.result ?? [];
    }
    elapsed.value = Math.round(performance.now() - start);
    await nextTick();
    if (mode.value === "range") {
      render();
    }
  } catch (e) {
    error.value = (e as Error)?.message || String(e);
    series.value = [];
    message.error(`查询失败：${error.value}`);
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearTimeout(timer);
  }
});
</script>

<style scoped lang="scss">
.dsm-flex-col { display: flex; flex-direction: column; gap: 6px; }

.pqs-input-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px;
}
.pqs-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.pqs-spacer { flex: 1; }
.pqs-select { width: 150px; }
.pqs-select--wide { width: 340px; }

.dsm-seg {
  display: inline-flex;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-elevated);
}
.dsm-seg button {
  padding: 4px 12px;
  border: 0;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  &.is-active {
    background: var(--brand-500);
    color: #fff;
  }
}

.pqs-textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.7;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  color: var(--text-primary);
  background: var(--bg-elevated);
  outline: none;
  &:focus { border-color: var(--brand-500); }
}
.pqs-error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--status-error);
}
.pqs-result-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px;
}
.pqs-center { text-align: center; color: var(--text-tertiary); padding: 40px 0; font-size: 12px; }
.pqs-result-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.pqs-result-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.pqs-result-meta { font-size: 12px; color: var(--text-tertiary); }
.pqs-chart { width: 100%; height: 320px; }
.pqs-table-wrap { max-height: 300px; overflow: auto; }
.pqs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  th { position: sticky; top: 0; text-align: left; font-weight: 600; color: var(--text-tertiary); background: var(--bg-container); padding: 4px 8px; border-bottom: 1px solid var(--border-subtle); }
  td { padding: 4px 8px; border-bottom: 1px solid var(--border-subtle); color: var(--text-primary); white-space: nowrap; }
}
.pqs-name { max-width: 320px; overflow: hidden; text-overflow: ellipsis; }
</style>