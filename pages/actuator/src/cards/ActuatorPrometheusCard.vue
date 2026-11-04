<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-prom">
      <CardKpi :items="kpis" />
      <CardList :rows="families" empty="响应里没有可解析的 Prometheus 样本" />
      <p class="act-prom__foot">读取 /actuator/prometheus · 更新于 {{ clock }}</p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorPrometheusCard">
/**
 * Actuator Prometheus 指标卡片
 *
 * <p>{@code /actuator/prometheus} 的响应不是 JSON，而是 Prometheus 文本 exposition
 * （每行 {@code name{labels} value}）。因此这张卡片与其他 Actuator 卡片不同：
 * 它先解析文本，再按「指标家族」聚合 —— 文本里同一个家族会有几十上百条标签样本，
 * 直接铺出来是几千行噪音，聚合后才读得出「这个应用到底吐了多少指标、哪类最多」。</p>
 *
 * <p>KPI 选的是能立刻判断 JVM 健康度的样本：堆已用 / 上限、进程 CPU、HTTP 请求总量。
 * 指标名按 Micrometer 的 Prometheus 命名约定（下划线、{@code _bytes} 后缀），
 * 换成其他注册表也能用；缺失时显示「—」而不是 0。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import type { CardListRow } from "./parts/types";
import { formatClock, useActuatorResource } from "./useCardResource";
import { humanBytes } from "./useMetricRows";
import { humanValue, parsePrometheus, sumMetric, sumMetricWhere } from "./prometheus";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

/** 轮询间隔：Prometheus 文本通常有几百 KB，默认间隔比 JSON 端点长一些 */
const intervalSec = computed(() => props.card.config?.intervalSec ?? 60);
const res = useActuatorResource(() => "prometheus", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

/** 文本 payload（端点异常时也可能是 JSON 错误体，统一按空文本处理） */
const text = computed(() => (typeof res.data.value === "string" ? res.data.value : ""));

/** 解析后的样本 */
const samples = computed(() => parsePrometheus(text.value));

/** 指标家族 → 样本数（文本里一个名字可能对应多条标签样本） */
const familyCounts = computed(() => {
  const map = new Map<string, number>();
  for (const s of samples.value) map.set(s.name, (map.get(s.name) ?? 0) + 1);
  return [...map.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
});

/** 展示条数：卡片配置的 limit，默认 8 */
const limit = computed(() => props.card.config?.limit ?? 8);

/** Top 指标家族（带占比条，占比按样本数 / 最多者算，便于横向对比） */
const families = computed<CardListRow[]>(() => {
  const top = familyCounts.value.slice(0, limit.value);
  const max = top[0]?.value ?? 0;
  return top.map((f) => ({
    key: f.key,
    value: `${f.value} 条`,
    pct: max > 0 ? (f.value / max) * 100 : undefined,
  }));
});

/** KPI：家族数 / 样本数 / 堆内存 / CPU / HTTP 请求 */
const kpis = computed(() => {
  const all = samples.value;
  const heapUsed = sumMetricWhere(all, "jvm_memory_used_bytes", "area", "heap");
  const heapMax = sumMetricWhere(all, "jvm_memory_max_bytes", "area", "heap");
  const cpu = sumMetric(all, "process_cpu_usage");
  const httpCount = sumMetric(all, "http_server_requests_seconds_count");

  return [
    { label: "指标家族", value: String(familyCounts.value.length) },
    { label: "样本条数", value: humanValue(all.length) },
    {
      label: "堆内存",
      value: heapUsed == null ? "—" : `${humanBytes(heapUsed)}${heapMax ? ` / ${humanBytes(heapMax)}` : ""}`,
    },
    {
      label: "进程 CPU",
      value: cpu == null ? "—" : `${(cpu * 100).toFixed(1)}%`,
      tone: cpu != null && cpu > 0.8 ? ("warn" as const) : undefined,
    },
    { label: "HTTP 请求", value: httpCount == null ? "—" : humanValue(httpCount) },
  ];
});

const clock = computed(() => formatClock(res.updatedAt.value));
</script>

<style lang="scss" scoped>
.act-prom {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.act-prom__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
</style>
