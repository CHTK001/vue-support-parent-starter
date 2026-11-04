<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-health">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="健康检查没有返回组件明细" />
      <p class="act-health__foot">读取 /actuator/health · 更新于 {{ clock }}</p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorHealthCard">
/**
 * Actuator 健康状态卡片
 *
 * <p>{@code /actuator/health} 的结构是 {@code { status, components: { db: { status, details } } }}。
 * 这里既给出总体状态（UP / DOWN），也把每个组件的状态列出来 —— 只看总体 UP
 * 时，某个组件其实已经 OUT_OF_SERVICE 的情况会被藏起来。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import type { CardListRow, CardTone } from "./parts/types";
import { formatClock, useActuatorResource } from "./useCardResource";
import { humanBytes } from "./useMetricRows";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

/** 轮询间隔：卡片设置里可改，默认 20 秒 */
const intervalSec = computed(() => props.card.config?.intervalSec ?? 20);
const res = useActuatorResource(() => "health", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

interface HealthComponent {
  status?: string;
  details?: Record<string, unknown>;
}

/** 组件明细表 */
const components = computed<Record<string, HealthComponent>>(() => {
  const cs = (res.data.value as { components?: Record<string, HealthComponent> } | null)?.components;
  return cs && typeof cs === "object" ? cs : {};
});

/** 总体状态 */
const overall = computed(() => {
  const s = (res.data.value as { status?: string } | null)?.status;
  return typeof s === "string" && s ? s : "—";
});

/** 状态 → 语义色 */
function toneOf(status: string): CardTone {
  const s = status.toUpperCase();
  if (s === "UP") return "ok";
  if (s === "DOWN" || s === "OUT_OF_SERVICE") return "danger";
  if (s === "UNKNOWN") return "warn";
  return "muted";
}

const kpis = computed(() => {
  const names = Object.keys(components.value);
  const bad = names.filter((n) => toneOf(components.value[n]?.status ?? "") === "danger").length;
  return [
    { label: "总体状态", value: overall.value, tone: toneOf(overall.value) },
    { label: "检查组件", value: String(names.length) },
    { label: "异常组件", value: String(bad), tone: bad > 0 ? ("danger" as const) : ("ok" as const) },
  ];
});

const rows = computed<CardListRow[]>(() =>
  Object.entries(components.value)
    .map(([name, c]) => {
      const status = (c?.status ?? "UNKNOWN").toUpperCase();
      // 把 details 里最有信息量的一两条拼在数值位置（如 db: "MySQL 8.0.33"、diskSpace: "free=200.0 GB"）
      const detailKeys = Object.keys(c?.details ?? {});
      const hint = detailKeys.slice(0, 2).map((k) => `${k}=${detailText(k, (c.details as Record<string, unknown>)[k])}`);
      return {
        key: name,
        value: hint.length ? `${status} · ${hint.join(" ")}` : status,
        tone: toneOf(status),
      };
    })
    .sort((a, b) => (a.tone === b.tone ? a.key.localeCompare(b.key) : a.tone === "danger" ? -1 : 1)),
);

/**
 * 详情值转文本
 *
 * <p>health 里的磁盘指标是裸字节数（512110190592），直接铺出来没人读得懂；
 * 键名像容量（total/free/used/max/threshold）且数值够大的时候换成人类可读单位。</p>
 */
function detailText(key: string, value: unknown): string {
  if (typeof value === "number" && value >= 1024 && /(total|free|used|max|threshold|bytes)/i.test(key)) {
    return humanBytes(value);
  }
  return String(value);
}

const clock = computed(() => formatClock(res.updatedAt.value));
</script>

<style lang="scss" scoped>
.act-health {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.act-health__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
</style>
