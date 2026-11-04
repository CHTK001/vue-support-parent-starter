<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-threads">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="线程快照为空" />
      <p class="act-threads__foot">读取 /actuator/threaddump · 更新于 {{ clock }}</p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorThreadsCard">
/**
 * Actuator 线程快照卡片（{@code /actuator/threaddump}）
 *
 * <p>整份 threaddump 动辄上千个线程、每线程一个 {@code stackTrace} 数组，
 * 直接铺在卡片里会让浏览器卡住（DOM 节点数以万计）。所以只统计
 * <b>线程状态分布</b>并把死锁/阻塞的线程拎出来 —— 排障时真正要看的也正是这两个。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import { formatClock, useActuatorResource } from "./useCardResource";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const intervalSec = computed(() => props.card.config?.intervalSec ?? 30);
const res = useActuatorResource(() => "threaddump", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

interface ThreadEntry {
  threadName?: string;
  threadState?: string;
  blockedTime?: number;
  blockedCount?: number;
  lockName?: string;
}

const threads = computed<ThreadEntry[]>(() => {
  const list = (res.data.value as { threads?: unknown } | null)?.threads;
  return Array.isArray(list) ? (list as ThreadEntry[]) : [];
});

/** 状态分布（BLOCKED / WAITING / RUNNABLE…） */
const distribution = computed(() => {
  const map = new Map<string, number>();
  for (const t of threads.value) {
    const state = t?.threadState ?? "UNKNOWN";
    map.set(state, (map.get(state) ?? 0) + 1);
  }
  return [...map.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
});

/** 阻塞最久的线程（blockedTime 单位 ms） */
const blocked = computed(() =>
  threads.value
    .filter((t) => typeof t?.blockedTime === "number" && (t.blockedTime ?? 0) > 0)
    .sort((a, b) => (b.blockedTime ?? 0) - (a.blockedTime ?? 0))
    .slice(0, 5),
);

const kpis = computed(() => {
  const total = threads.value.length;
  const blockedCount = threads.value.filter((t) => (t.threadState ?? "").toUpperCase() === "BLOCKED").length;
  const waiting = threads.value.filter((t) => (t.threadState ?? "").toUpperCase() === "WAITING").length;
  return [
    { label: "线程数", value: String(total) },
    { label: "BLOCKED", value: String(blockedCount), tone: blockedCount ? ("danger" as const) : ("ok" as const) },
    { label: "WAITING", value: String(waiting), tone: waiting > total / 2 ? ("warn" as const) : undefined },
  ];
});

const rows = computed(() => {
  const total = threads.value.length || 1;
  // 有长阻塞时优先展示它们，否则展示状态分布
  if (blocked.value.length) {
    return blocked.value.map((t) => ({
      key: t.threadName ?? "未命名线程",
      value: `${Math.round(t.blockedTime ?? 0)} ms`,
      tone: "danger" as const,
    }));
  }
  return distribution.value.map((d) => ({
    key: d.key,
    value: `${d.n} 个`,
    pct: Math.round((d.n / total) * 100),
    tone: /BLOCKED/i.test(d.key) ? ("danger" as const) : undefined,
  }));
});

const clock = computed(() => formatClock(res.updatedAt.value));
</script>

<style lang="scss" scoped>
.act-threads {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.act-threads__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
</style>
