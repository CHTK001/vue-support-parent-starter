<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-loggers">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="没有显式配置的 logger（全部继承 root 级别）" />
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorLoggersCard">
/**
 * Actuator 日志级别卡片（{@code /actuator/loggers}）
 *
 * <p>只列<b>显式配置过</b>的 logger（{@code configuredLevel} 非空）。默认情况下
 * 上千个 logger 都继承 root 级别，全列出来既没人看也卡页面；真正需要关注的是
 * 「谁被单独调过」—— 那通常是排障时临时加的，事后该收回去。</p>
 *
 * <p>改级别不在这里做：写操作集中在 Actuator 弹窗的「日志级别」页，
 * 看板上的卡片只读，避免误点。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import { useActuatorResource } from "./useCardResource";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const intervalSec = computed(() => props.card.config?.intervalSec ?? 60);
const res = useActuatorResource(() => "loggers", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

interface LoggerEntry {
  configuredLevel?: string | null;
  effectiveLevel?: string;
}

const loggers = computed<Record<string, LoggerEntry>>(() => {
  const map = (res.data.value as { loggers?: unknown } | null)?.loggers;
  return map && typeof map === "object" ? (map as Record<string, LoggerEntry>) : {};
});

const levels = computed<string[]>(() => {
  const raw = (res.data.value as { levels?: unknown } | null)?.levels;
  return Array.isArray(raw) ? raw.filter((l): l is string => typeof l === "string") : [];
});

/** 显式配置过的 logger（configuredLevel 非空） */
const configured = computed(() =>
  Object.entries(loggers.value)
    .filter(([, v]) => typeof v?.configuredLevel === "string" && v.configuredLevel)
    .map(([name, v]) => ({ name, level: String(v.configuredLevel), effective: v.effectiveLevel ?? "" })),
);

/** 有效级别分布（这才是运行时真正生效的分布） */
const distribution = computed(() => {
  const map = new Map<string, number>();
  for (const v of Object.values(loggers.value)) {
    const lvl = v?.effectiveLevel ?? "—";
    map.set(lvl, (map.get(lvl) ?? 0) + 1);
  }
  return [...map.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
});

const kpis = computed(() => {
  const total = Object.keys(loggers.value).length;
  const dist = distribution.value;
  return [
    { label: "logger 总数", value: String(total) },
    { label: "显式配置", value: String(configured.value.length), tone: configured.value.length ? ("warn" as const) : undefined },
    { label: "root 级别", value: loggers.value["ROOT"]?.effectiveLevel ?? dist[0]?.key ?? "—" },
    { label: "可用级别", value: String(levels.value.length) },
  ];
});

const rows = computed(() => {
  const limit = props.card.config?.limit ?? 20;
  // 显式配置的排前面（排障时最关心），其余展示有效级别分布
  if (configured.value.length) {
    return configured.value.slice(0, limit).map((l) => ({
      key: l.name,
      value: l.level,
      tone: /debug|trace/i.test(l.level) ? ("warn" as const) : undefined,
    }));
  }
  const total = Object.keys(loggers.value).length || 1;
  return distribution.value.slice(0, limit).map((d) => ({
    key: d.key,
    value: `${d.n} 个`,
    pct: Math.round((d.n / total) * 100),
  }));
});
</script>

<style lang="scss" scoped>
.act-loggers {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}
</style>
