<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-beans">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="没有 Bean 明细" />
      <p class="act-beans__foot">读取 /actuator/beans · 按包名前缀统计</p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorBeansCard">
/**
 * Actuator Bean 统计卡片（{@code /actuator/beans}）
 *
 * <p>Bean 列表通常有上千条。卡片不逐个列，而是按<b>包名前缀</b>聚合计数 ——
 * 一看就知道「这个应用装了哪些组件」（mybatis、redis、security、项目自己的 biz 包…），
 * 也让 Bean 数量的异常增长（比如某次改动把工厂方法写成了 prototype 作用域）更容易被发现。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import { useActuatorResource } from "./useCardResource";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const intervalSec = computed(() => props.card.config?.intervalSec ?? 120);
const res = useActuatorResource(() => "beans", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

interface BeanEntry {
  type?: string;
  scope?: string;
  resource?: string;
  dependencies?: string[];
}

/** 取当前（唯一）application context 的 beans */
const beans = computed<Record<string, BeanEntry>>(() => {
  const contexts = (res.data.value as { contexts?: Record<string, { beans?: unknown }> } | null)?.contexts;
  const first = contexts ? Object.values(contexts)[0] : undefined;
  const map = first?.beans;
  return map && typeof map === "object" ? (map as Record<string, BeanEntry>) : {};
});

/** 按类型的前两个包段聚合：com.example.biz.service.XxxService → com.example */
function packagePrefix(type?: string): string {
  if (!type) return "未知类型";
  const clean = type.replace(/^class\s+/, "").split("$")[0];
  const segs = clean.split(".");
  if (segs.length < 3) return clean;
  return segs.slice(0, 2).join(".");
}

const byScope = computed(() => {
  const map = new Map<string, number>();
  for (const b of Object.values(beans.value)) {
    const scope = (b?.scope ?? "singleton").toLowerCase();
    map.set(scope, (map.get(scope) ?? 0) + 1);
  }
  return map;
});

const byPackage = computed(() => {
  const map = new Map<string, number>();
  for (const b of Object.values(beans.value)) {
    const key = packagePrefix(b?.type);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
});

const kpis = computed(() => {
  const total = Object.keys(beans.value).length;
  const prototypes = byScope.value.get("prototype") ?? 0;
  const contexts = Object.keys((res.data.value as { contexts?: object } | null)?.contexts ?? {}).length;
  return [
    { label: "Bean 总数", value: String(total) },
    { label: "应用上下文", value: String(contexts) },
    { label: "prototype", value: String(prototypes), tone: prototypes > 0 ? ("warn" as const) : ("muted" as const) },
  ];
});

const rows = computed(() => {
  const limit = props.card.config?.limit ?? 12;
  const total = Object.keys(beans.value).length || 1;
  return byPackage.value.slice(0, limit).map((p) => ({
    key: p.key,
    value: `${p.n} 个`,
    pct: Math.round((p.n / total) * 100),
  }));
});
</script>

<style lang="scss" scoped>
.act-beans {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.act-beans__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
</style>
