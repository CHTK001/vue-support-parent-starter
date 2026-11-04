<template>
  <ApmCardBody>
    <div class="ac-card">
      <div class="ac-head">
        <span class="ac-chip">{{ engine || "APM" }}</span>
        <span v-if="descriptor?.version" class="ac-chip">v{{ descriptor.version }}</span>
        <span v-if="descriptor?.mode" class="ac-chip">{{ modeLabel }}</span>
      </div>

      <div class="ac-kpi">
        <div v-for="k in kpis" :key="k.label" class="ac-kpi__item">
          <span class="ac-kpi__value" :class="k.tone ? `is-${k.tone}` : ''">{{ k.value }}</span>
          <span class="ac-kpi__label">{{ k.label }}</span>
        </div>
      </div>

      <p v-if="health?.message" class="ac-note">{{ health.message }}</p>
      <div v-if="error" class="ac-note ac-danger">{{ error }}</div>

      <p class="ac-foot">/api/apm/v1/overview · 最近 {{ WINDOW_MINUTES }} 分钟 · 更新于 {{ clock }}</p>
    </div>
  </ApmCardBody>
</template>

<script setup lang="ts" name="ApmOverviewCard">
/**
 * APM 服务概览卡片
 *
 * <p>一张卡回答「现在整体健康吗」：健康度、QPS、错误率、平均 / P99 耗时、服务与端点规模、
 * 告警数。数据来自 {@code /api/apm/v1/overview} —— 后端已经把 SkyWalking / hotspot /
 * OpenTelemetry 三种引擎归一成同一个 {@code ApmHealth}，所以卡片对引擎无感。</p>
 *
 * <p>阈值口径与 APM 页面一致（错误率 &gt;1% 警告 / &gt;5% 危险，P99 &gt;300ms 警告 / &gt;1s 危险），
 * 避免同一份数据在「大屏」和「APM 页面」上显示成两种颜色。</p>
 */
import { computed, watch } from "vue";
import type { MonitorCardItem } from "@pages/system";
import ApmCardBody from "../ApmCardBody.vue";
import { useApmCardGate } from "../useApmCardGate";
import { useApmPoll } from "../useApmPoll";
import { getOverview, type ApmHealth, type ApmOverview, type ApmStatus } from "../../api/apmApi";
import { errorRateClass, fmtClock, fmtMs, fmtNum, fmtPercent, latencyClass } from "../../utils/format";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

/** 概览窗口（分钟）：概览是「当前态势」，不需要长窗口 */
const WINDOW_MINUTES = 30;

const gate = useApmCardGate();
const poll = useApmPoll<ApmOverview>(
  () => gate.ready.value,
  () => getOverview({ minutes: WINDOW_MINUTES }),
  () => props.card.config?.intervalSec ?? 30,
);

watch(
  () => props.refreshKey,
  () => void poll.reload(true),
);

const health = computed<ApmHealth | null>(() => poll.data.value?.health ?? null);
const descriptor = computed<ApmStatus | null>(() => poll.data.value?.descriptor ?? null);
const engine = gate.engine;
const error = computed(() => poll.error.value);
const clock = computed(() => fmtClock(poll.updatedAt.value));

/** 引擎运行模式的中文说明 */
const modeLabel = computed(() => {
  switch (descriptor.value?.mode) {
    case "agent":
      return "进程内 Agent";
    case "remote":
      return "远端后端";
    case "none":
      return "无引擎";
    default:
      return descriptor.value?.mode ?? "—";
  }
});

/** 健康度 → 语义色 */
function healthTone(value?: string): "ok" | "warn" | "danger" | undefined {
  const s = (value ?? "").toLowerCase();
  if (!s) return undefined;
  if (s === "up" || s === "healthy" || s === "ok") return "ok";
  if (s === "down" || s === "unhealthy" || s === "critical") return "danger";
  return "warn";
}

/** 错误率分档（复用页面同一个函数，返回的是 CSS 类名） */
function toneOfClass(cls: string): "ok" | "warn" | "danger" | undefined {
  if (cls === "apm-danger") return "danger";
  if (cls === "apm-warn") return "warn";
  if (cls === "apm-ok") return "ok";
  return undefined;
}

const kpis = computed(() => {
  const h = health.value;
  if (!h) return [];
  const alarmTone = Number(h.alarms) > 0 ? ("warn" as const) : undefined;
  return [
    { label: "健康度", value: String(h.health || "—"), tone: healthTone(h.health) },
    { label: "QPS", value: fmtNum(h.qps, 1) },
    { label: "错误率", value: fmtPercent(h.errorRate), tone: toneOfClass(errorRateClass(h.errorRate)) },
    { label: "平均耗时", value: fmtMs(h.avgMs), tone: toneOfClass(latencyClass(h.avgMs)) },
    { label: "P99", value: fmtMs(h.p99Ms), tone: toneOfClass(latencyClass(h.p99Ms)) },
    { label: "服务数", value: fmtNum(h.services) },
    { label: "端点数", value: fmtNum(h.endpoints) },
    { label: "告警", value: fmtNum(h.alarms), tone: alarmTone },
  ];
});
</script>
