<!--
  指标分析 —— 对齐 SkyWalking 的 Metrics 面板。

  SkyWalking UI 的指标页是「作用域 + 指标 + 实体 + 时间窗」四件套，换哪一件都重画一张图。
  这里保持同一套语义：

    scope     服务 / 实例 / 端点 / 全局 → 决定指标下拉里可选的名字
    name      指标名（service_resp_time 等，定义来自 /metric-definitions，前端不硬编码）
    service   作用域为实例 / 端点时必须先选服务（OAP 的 Entity 需要 serviceName）
    instance  作用域为实例时选具体实例
    endpoint  作用域为端点时选具体端点

  指标定义由后端给，所以换引擎 / 换 SkyWalking 版本时下拉自动跟着变。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReSelect v-model="scope" :options="scopeOptions" style="width: 130px" @change="onScopeChange" />
      <ReSelect
        v-model="name"
        :options="metricOptions"
        placeholder="选择指标"
        filterable
        style="width: 240px"
        @change="load"
      />
      <ReSelect
        v-if="scope !== 'ALL'"
        v-model="entityService"
        :options="serviceOptions"
        placeholder="选择服务"
        filterable
        clearable
        style="width: 240px"
        @change="onServiceChange"
      />
      <ReSelect
        v-if="scope === 'SERVICE_INSTANCE'"
        v-model="instance"
        :options="instanceOptions"
        placeholder="选择实例（留空 = 全部）"
        filterable
        clearable
        style="width: 240px"
        @change="load"
      />
      <ReSelect
        v-if="scope === 'ENDPOINT'"
        v-model="endpoint"
        :options="endpointOptions"
        placeholder="选择端点"
        filterable
        clearable
        style="width: 260px"
        @change="load"
      />
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 140px" @change="load" />
      <ReSelect v-model="step" :options="stepOptions" style="width: 110px" @change="load" />
      <span class="apm-bar__spacer" />
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <div class="apm-bar">
      <span class="apm-count">{{ currentDefinition?.description || "—" }}</span>
      <span class="apm-bar__spacer" />
      <span class="apm-count">
        {{ series?.points?.length ?? 0 }} 个数据点 · 单位 {{ unit || "—" }}
      </span>
    </div>

    <ReSkeleton v-if="loading && !series" :rows="6" animated />

    <ReCard v-else :radius="12" shadow="never">
      <template #header>
        <div class="apm-card-head">
          <span class="apm-card-h">{{ currentDefinition?.label || name || "指标" }}</span>
          <!-- label 与 name 同值时只显示一次，避免「service_resp_timeservice_resp_time」 -->
          <span v-if="name && name !== (currentDefinition?.label || name)" class="apm-mono apm-muted">{{ name }}</span>
        </div>
      </template>
      <MetricChart v-if="series?.points?.length" :series="[series]" height="380px" />
      <ReEmpty v-else :image-size="70" :description="emptyHint" />
    </ReCard>

    <!-- 数值明细：图上读不出具体峰值 -->
    <ReCard v-if="series?.points?.length" :radius="12" shadow="never">
      <template #header><span class="apm-card-h">数值明细</span></template>
      <ReTable
        :data="pointRows"
        :columns="pointColumns"
        engine="element"
        :settings="{ border: false }"
        :config="{ pagination: { enable: true, pageSize: 10 }, toolbar: { enable: false } }"
        table-id="apm-metric-points"
      >
        <template #col-time="{ row }">
          <span class="apm-muted">{{ fmtTime(row.time) }}</span>
        </template>
        <template #col-value="{ row }">
          <span class="apm-mono">{{ fmtNum(row.value, 2) }} {{ unit }}</span>
        </template>
      </ReTable>
    </ReCard>

    <div v-if="!status.capabilities.includes('metrics')" class="apm-muted">
      引擎 {{ status.name }} 不支持指标查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import MetricChart from "../components/MetricChart.vue";
import { getMetrics, listEndpoints, listInstances, listMetricDefinitions, listServices } from "../api/apmApi";
import type { ApmMetricDefinition, ApmMetricSeries, ApmScope, ApmStep } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { WINDOW_OPTIONS, fmtNum, fmtTime } from "../utils/format";

const { present, ensure } = useApmStatus();

const scope = ref<ApmScope>("SERVICE");
const name = ref("service_resp_time");
const entityService = ref("");
const instance = ref("");
const endpoint = ref("");
const minutes = ref(60);
const step = ref<ApmStep>("MINUTE");
const definitions = ref<ApmMetricDefinition[]>([]);
const series = ref<ApmMetricSeries | null>(null);
const loading = ref(false);
const emptyHint = ref("没有数据");

const services = ref<string[]>([]);
const instances = ref<string[]>([]);
const endpoints = ref<string[]>([]);

const windowOptions = WINDOW_OPTIONS;
const scopeOptions = [
  { label: "服务", value: "SERVICE" },
  { label: "实例", value: "SERVICE_INSTANCE" },
  { label: "端点", value: "ENDPOINT" },
  { label: "全局", value: "ALL" },
];
const stepOptions = [
  { label: "秒级", value: "SECOND" },
  { label: "分钟", value: "MINUTE" },
  { label: "小时", value: "HOUR" },
  { label: "天", value: "DAY" },
];

const metricOptions = computed(() => definitions.value.map((d) => ({ label: d.label || d.name, value: d.name })));
const currentDefinition = computed(() => definitions.value.find((d) => d.name === name.value) ?? null);
const unit = computed(() => currentDefinition.value?.unit ?? series.value?.unit ?? "");
const serviceOptions = computed(() => services.value.map((v) => ({ label: v, value: v })));
const instanceOptions = computed(() => instances.value.map((v) => ({ label: v, value: v })));
const endpointOptions = computed(() => endpoints.value.map((v) => ({ label: v, value: v })));

const pointRows = computed(() => (series.value?.points ?? []) as unknown as Record<string, unknown>[]);

const pointColumns: ReTableColumn[] = [
  { prop: "time", label: "时间", minWidth: 180, slot: "time", sortable: true },
  { prop: "value", label: "数值", width: 160, align: "right", slot: "value", sortable: true },
];

/**
 * 作用域切换：重新取定义；原指标不属于新作用域时取第一个可用的。
 * 实体选择全部清空 —— 实例名与端点名的取值空间不同，留着只会查出空图。
 */
async function onScopeChange() {
  instance.value = "";
  endpoint.value = "";
  instances.value = [];
  endpoints.value = [];
  await loadDefinitions();
  if (!definitions.value.some((d) => d.name === name.value)) {
    name.value = definitions.value[0]?.name ?? "";
  }
  load();
}

/** 服务变化：刷新实例 / 端点下拉（并清掉已选的实体） */
async function onServiceChange() {
  instance.value = "";
  endpoint.value = "";
  instances.value = [];
  endpoints.value = [];
  if (entityService.value) {
    try {
      if (scope.value === "SERVICE_INSTANCE") {
        instances.value = ((await listInstances(entityService.value, {})) || []).map((i) => i.name);
      } else if (scope.value === "ENDPOINT") {
        endpoints.value = ((await listEndpoints(entityService.value, undefined, {})) || []).map((e) => e.name);
      }
    } catch {
      /* 下拉取不到时图表仍可查服务级数据 */
    }
  }
  load();
}

async function loadDefinitions() {
  try {
    definitions.value = (await listMetricDefinitions(scope.value)) || [];
  } catch {
    definitions.value = [];
  }
}

async function load() {
  await ensure();
  if (!present.value || !name.value) {
    return;
  }
  loading.value = true;
  emptyHint.value = "没有数据";
  try {
    series.value = await getMetrics({
      name: name.value,
      scope: scope.value,
      // OAP 的 Entity 里，实例与端点都需要所属服务名
      service: scope.value === "ALL" ? undefined : entityService.value || undefined,
      instance: scope.value === "SERVICE_INSTANCE" ? instance.value || undefined : undefined,
      endpoint: scope.value === "ENDPOINT" ? endpoint.value || undefined : undefined,
      minutes: minutes.value,
      step: step.value,
    });
    if (!series.value?.points?.length) {
      emptyHint.value =
        scope.value !== "ALL" && !entityService.value
          ? "先在上方选择一个服务：SkyWalking 的服务级指标挂在具体实体上，不选实体只有空图"
          : `指标 ${name.value} 在该时间窗口内没有数据（后端可能未开启该指标采集）`;
    }
  } catch (e) {
    series.value = null;
    emptyHint.value = `查询失败：${(e as Error)?.message ?? e}`;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await ensure();
  if (!present.value) {
    return;
  }
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
  // 服务级指标必须带实体：默认落到第一个服务，页面一打开就有图看
  if (!entityService.value && services.value.length) {
    entityService.value = services.value[0];
  }
  await loadDefinitions();
  load();
});
</script>

