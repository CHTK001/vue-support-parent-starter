<template>
  <ApmCardBody capability="metrics">
    <div class="ac-card">
      <div class="ac-head">
        <span class="ac-chip">{{ label || name || "指标" }}</span>
        <span v-if="name" class="ac-muted">{{ name }}</span>
        <span v-if="unit" class="ac-chip">单位 {{ unit }}</span>
        <span v-if="points" class="ac-muted">{{ points }} 点</span>
      </div>

      <div class="ac-chart">
        <MetricChart v-if="series?.points?.length" :series="[series]" height="100%" />
        <div v-else-if="error" class="ac-empty ac-danger">{{ error }}</div>
        <div v-else-if="loading" class="ac-empty">读取指标…</div>
        <div v-else class="ac-empty">{{ emptyHint }}</div>
      </div>

      <p class="ac-foot">/api/apm/v1/metrics · 最近 {{ WINDOW_MINUTES }} 分钟 · 更新于 {{ clock }}</p>
    </div>
  </ApmCardBody>
</template>

<script setup lang="ts" name="ApmMetricsCard">
/**
 * APM 指标趋势卡片
 *
 * <p>指标名<b>不写死</b>：先问后端 {@code /metric-definitions} 有哪些服务级指标，再按偏好
 * 顺序挑一个存在的。原因是 SkyWalking 与 OpenTelemetry 的指标命名完全不同
 * （{@code service_resp_time} vs {@code http.server.duration}），写死一个就只对一种引擎有效。</p>
 *
 * <p>偏好顺序以「值班先看什么」排列：响应时间 → 吞吐 → 成功率 → Apdex。
 * 想换指标时在卡片配置里填 {@code path}（指标名，可逗号分隔多个按顺序命中）。</p>
 */
import { computed, watch } from "vue";
import type { MonitorCardItem } from "@pages/system";
import ApmCardBody from "../ApmCardBody.vue";
import { useApmCardGate } from "../useApmCardGate";
import { useApmPoll } from "../useApmPoll";
import MetricChart from "../../components/MetricChart.vue";
import {
  getMetrics,
  listMetricDefinitions,
  type ApmMetricDefinition,
  type ApmMetricSeries,
} from "../../api/apmApi";
import { fmtClock } from "../../utils/format";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const WINDOW_MINUTES = 30;

/** 默认指标偏好（按顺序取第一个后端存在的） */
const DEFAULT_METRICS = [
  "service_resp_time",
  "service_cpm",
  "service_sla",
  "service_apdex",
  "http.server.duration",
];

/**
 * 指标定义缓存（模块级，60 秒）。
 *
 * <p>定义清单对同一引擎是稳定的，每张指标卡片每 30 秒重拉一次纯属浪费；
 * 换引擎需要下掉这个缓存 —— 走 APM 页面的「重新探测」会重置状态，下次自然重取。</p>
 */
let defCache: { at: number; list: ApmMetricDefinition[] } | null = null;
const DEF_TTL_MS = 60_000;

async function definitions(): Promise<ApmMetricDefinition[]> {
  if (defCache && Date.now() - defCache.at < DEF_TTL_MS) return defCache.list;
  const list = (await listMetricDefinitions("SERVICE")) ?? [];
  defCache = { at: Date.now(), list };
  return list;
}

/** 卡片配置里指定的指标名（逗号分隔，按顺序命中） */
const preferred = computed(() =>
  (props.card.config?.path ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

/** 选中的指标定义：偏好清单按顺序命中，最后退回后端给的第一个 */
async function resolveMetric(): Promise<ApmMetricDefinition | null> {
  const list = await definitions();
  if (!list.length) return null;
  const wanted = preferred.value.length ? preferred.value : DEFAULT_METRICS;
  for (const name of wanted) {
    const hit = list.find((d) => d.name === name);
    if (hit) return hit;
  }
  return list[0] ?? null;
}

const gate = useApmCardGate(() => "metrics");
const poll = useApmPoll<{ def: ApmMetricDefinition; series: ApmMetricSeries } | null>(
  () => gate.ready.value,
  async () => {
    const def = await resolveMetric();
    if (!def) return null;
    const series = await getMetrics({
      name: def.name,
      scope: "SERVICE",
      minutes: WINDOW_MINUTES,
      step: "MINUTE",
    });
    return { def, series };
  },
  () => props.card.config?.intervalSec ?? 30,
);

watch(
  () => props.refreshKey,
  () => void poll.reload(true),
);

const series = computed(() => poll.data.value?.series ?? null);
const name = computed(() => poll.data.value?.def.name ?? "");
const label = computed(() => poll.data.value?.def.label ?? "");
const unit = computed(() => poll.data.value?.def.unit ?? "");
const points = computed(() => series.value?.points?.length ?? 0);
const loading = computed(() => poll.loading.value);
const error = computed(() => poll.error.value);
const clock = computed(() => fmtClock(poll.updatedAt.value));

const emptyHint = computed(() =>
  name.value
    ? `指标 ${name.value} 在最近 ${WINDOW_MINUTES} 分钟没有数据（后端可能未开启该指标采集）`
    : "引擎没有返回任何服务级指标定义",
);
</script>
