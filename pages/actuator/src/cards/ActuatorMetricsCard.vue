<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-metrics">
      <CardKpi :items="kpis" />
      <p class="act-metrics__foot">
        读取 /actuator/metrics/[name] · {{ rows.length }} 项 · 更新于 {{ clock }}
      </p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorMetricsCard">
/**
 * Actuator 关键指标卡片
 *
 * <p>选中一组「一眼能判断服务状态」的 Micrometer 指标：堆内存、线程数、GC 暂停、
 * HTTP 请求量/耗时、CPU、运行时长、类加载数。要更多指标请用「自定义卡片」直接点
 * {@code metrics/{name}}，那张卡片可以自己填指标名。</p>
 *
 * <p>取数走 {@code useMetricRows}：并行取、单个缺失不算整体失败。缺少的指标
 * （如没有流量时 {@code http.server.requests} 可能未注册）直接不显示，
 * 而不是画一个 0 —— 0 会被读成「服务没请求」，实际只是指标不存在。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import { formatClock } from "./useCardResource";
import { useMetricRows } from "./useMetricRows";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

/**
 * 默认指标清单。
 *
 * <p>顺序即展示顺序：先「多少流量」，再「吃多少资源」，最后「跑多久」。</p>
 */
const DEFAULT_METRICS = [
  "http.server.requests",
  "jvm.memory.used",
  "jvm.memory.max",
  "jvm.threads.live",
  "jvm.gc.pause",
  "system.cpu.usage",
  "jvm.classes.loaded",
  "process.uptime",
];

/**
 * 中文展示名：Micrometer 的 description 是英文长句（"The amount of used memory"），
 * 直接铺在 KPI 上既占地方又难扫。认识的指标给中文名，不认识的仍走 description / 指标名末段。
 */
const LABELS: Record<string, string> = {
  "http.server.requests": "HTTP 请求量",
  "jvm.memory.used": "堆内存已用",
  "jvm.memory.max": "堆内存上限",
  "jvm.threads.live": "活跃线程",
  "jvm.gc.pause": "GC 次数",
  "system.cpu.usage": "CPU 使用率",
  "jvm.classes.loaded": "已加载类",
  "process.uptime": "运行时长",
};

/**
 * 指标清单：允许卡片配置用 {@code path} 覆盖（逗号分隔），
 * 这样不写代码也能把这 8 项换成自己关心的 8 项。
 */
const metricNames = computed(() => {
  const custom = (props.card.config?.path ?? "").trim();
  if (!custom) return DEFAULT_METRICS;
  return custom
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
});

const intervalSec = computed(() => props.card.config?.intervalSec ?? 30);
const res = useMetricRows(() => metricNames.value, () => intervalSec.value * 1000);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

const rows = computed(() => res.rows.value);

/** 指标 → KPI 项（label 与 text 都来自真实取到的指标） */
const kpis = computed(() =>
  rows.value.map((r) => ({
    label: LABELS[r.key] ?? r.label,
    value: r.text,
    tone: r.statistic === "COUNT" ? ("muted" as const) : undefined,
  })),
);

const clock = computed(() => formatClock(res.updatedAt.value));
</script>

<style lang="scss" scoped>
.act-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.act-metrics__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
</style>
