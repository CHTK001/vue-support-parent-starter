<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-env">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="没有属性源" />
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorEnvCard">
/**
 * Actuator 环境属性卡片（{@code /actuator/env}）
 *
 * <p>{@code env} 的响应可能非常大（几十个属性源、上千条属性），整包渲染既慢又没人看。
 * 这里的口径是「先看结构」：列出每个属性源的属性条数，一眼能看出
 * 配置来自 application.yml、环境变量还是启动参数；具体某个 key 去 Actuator 弹窗里搜。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import { useActuatorResource } from "./useCardResource";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const intervalSec = computed(() => props.card.config?.intervalSec ?? 60);
const res = useActuatorResource(() => "env", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

interface PropertySource {
  name?: string;
  properties?: Record<string, unknown>;
}

/** 属性源列表（按属性条数降序，最多的在最上面） */
const sources = computed<PropertySource[]>(() => {
  const list = (res.data.value as { propertySources?: unknown } | null)?.propertySources;
  return Array.isArray(list) ? (list as PropertySource[]) : [];
});

const totalProps = computed(() =>
  sources.value.reduce((acc, s) => acc + Object.keys(s.properties ?? {}).length, 0),
);

const activeProfiles = computed<string[]>(() => {
  const profiles = (res.data.value as { activeProfiles?: unknown } | null)?.activeProfiles;
  return Array.isArray(profiles) ? profiles.filter((p): p is string => typeof p === "string") : [];
});

const kpis = computed(() => {
  const profiles = activeProfiles.value;
  return [
    { label: "属性源", value: String(sources.value.length) },
    { label: "属性总数", value: String(totalProps.value) },
    { label: "激活配置", value: profiles.length ? profiles.join(" / ") : "default", tone: "muted" as const },
  ];
});

const rows = computed(() => {
  const limit = props.card.config?.limit ?? 30;
  return [...sources.value]
    .sort((a, b) => Object.keys(b.properties ?? {}).length - Object.keys(a.properties ?? {}).length)
    .slice(0, limit)
    .map((s) => ({
      key: s.name ?? "未命名属性源",
      value: `${Object.keys(s.properties ?? {}).length} 项`,
    }));
});
</script>

<style lang="scss" scoped>
.act-env {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}
</style>
