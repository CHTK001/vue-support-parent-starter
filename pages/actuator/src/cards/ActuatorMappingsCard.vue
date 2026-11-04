<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-map">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="没有请求映射" />
      <p class="act-map__foot">读取 /actuator/mappings · 展示方法 + 路径</p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorMappingsCard">
/**
 * Actuator 请求映射卡片（{@code /actuator/mappings}）
 *
 * <p>{@code mappings} 的结构随 Spring 版本变化过多次（{@code dispatcherServlets} 是对象还是数组、
 * {@code patterns} 在哪个分支里），所以这里做了宽松解析：先把整棵树里的
 * {@code patterns} 与 {@code methods} 递归抓出来，抓不到就退化成计数，
 * 不让结构差异把整张卡片打成「加载失败」。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import { useActuatorResource } from "./useCardResource";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const intervalSec = computed(() => props.card.config?.intervalSec ?? 120);
const res = useActuatorResource(() => "mappings", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

/** 递归收集 (path, methods) 对 */
interface RouteRow {
  path: string;
  methods: string;
}

function collect(node: unknown, out: RouteRow[], depth = 0): void {
  if (node == null || depth > 8) return;
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const patterns = obj.patterns;
  const methods = obj.methods;
  if (Array.isArray(patterns)) {
    for (const p of patterns) {
      if (typeof p !== "string") continue;
      out.push({
        path: p,
        methods: Array.isArray(methods) ? methods.filter((m): m is string => typeof m === "string").join(",") : "ANY",
      });
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === "patterns" || k === "methods") continue;
    collect(v, out, depth + 1);
  }
}

const routes = computed<RouteRow[]>(() => {
  const out: RouteRow[] = [];
  collect(res.data.value, out);
  return out;
});

/** 按方法聚合 */
const byMethod = computed(() => {
  const map = new Map<string, number>();
  for (const r of routes.value) {
    for (const m of r.methods.split(",")) {
      const key = (m || "ANY").toUpperCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return [...map.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
});

const kpis = computed(() => {
  const contexts = Object.keys((res.data.value as { contexts?: object } | null)?.contexts ?? {}).length;
  return [
    { label: "映射条目", value: String(routes.value.length) },
    { label: "应用上下文", value: String(contexts) },
    { label: "GET 路由", value: String(byMethod.value.find((m) => m.key === "GET")?.n ?? 0) },
  ];
});

const rows = computed(() => {
  const limit = props.card.config?.limit ?? 14;
  const keyword = (props.card.config?.path ?? "").trim().toLowerCase();
  // 配了关键字就按路径过滤（相当于卡片级的「搜索框」），否则展示方法分布
  if (keyword) {
    return routes.value
      .filter((r) => r.path.toLowerCase().includes(keyword))
      .slice(0, limit)
      .map((r) => ({ key: r.path, value: r.methods }));
  }
  const total = routes.value.length || 1;
  return byMethod.value
    .slice(0, limit)
    .map((m) => ({ key: `${m.key} 方法`, value: `${m.n} 条`, pct: Math.round((m.n / total) * 100) }));
});
</script>

<style lang="scss" scoped>
.act-map {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.act-map__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
</style>
