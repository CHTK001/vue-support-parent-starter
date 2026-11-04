<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-kv-card">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="应用信息为空（可在 application.yml 里配 management.info.*）" />
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorInfoCard">
/**
 * Actuator 应用信息卡片（{@code /actuator/info}）
 *
 * <p>{@code info} 端点的内容是「应用自己通过 {@code management.info.*} 或 build-info
 * 填进去的」，不是自动采集的 —— 所以空对象是常态，卡片要把这点说清楚，
 * 否则用户会以为是接口坏了。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import { useActuatorResource } from "./useCardResource";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const intervalSec = computed(() => props.card.config?.intervalSec ?? 60);
const res = useActuatorResource(() => "info", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

/** 应用信息压平成「键 → 值」列表（最多 40 行，再多也读不完） */
const rows = computed(() => {
  const data = (res.data.value ?? {}) as Record<string, unknown>;
  const limit = props.card.config?.limit ?? 40;
  return flatten(data)
    .slice(0, limit)
    .map((r) => ({ key: r.key, value: r.value }));
});

/** 压平两层，够表达 git / build / app 这类嵌套结构 */
function flatten(source: unknown, prefix = "", depth = 0): { key: string; value: string }[] {
  if (source == null) return [];
  if (typeof source !== "object") return [{ key: prefix || "值", value: String(source) }];
  const out: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && depth < 2) out.push(...flatten(v, key, depth + 1));
    else out.push({ key, value: v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v) });
  }
  return out;
}

const kpis = computed(() => {
  const count = Object.keys((res.data.value ?? {}) as Record<string, unknown>).length;
  return [
    { label: "顶层字段", value: String(count) },
    { label: "展示项", value: String(rows.value.length) },
  ];
});
</script>

<style lang="scss" scoped>
.act-kv-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}
</style>
