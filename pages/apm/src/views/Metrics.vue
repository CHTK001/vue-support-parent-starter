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
      <!-- 叠加指标：比如响应时间叠上调用量，一条看「多慢」，一条看「多少」；
           单位不同时图表自动切双轴，不必再开第二个页面来回对时间轴。 -->
      <ReSelect
        v-model="compareNames"
        :options="metricOptions"
        placeholder="叠加指标（可选）"
        multiple
        filterable
        collapse-tags
        :multiple-limit="3"
        style="min-width: 250px"
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
      <!-- 时间窗是每次都要动的；粒度（秒/分/时/天）是偶尔才动的，
           把它挪到图表卡头，紧挨着它影响的那张图，工具条少一层。 -->
      <ApmTimeWindow v-model="timeWindow" @change="load" />
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ scopeText }}{{ entityService ? ` · ${entityService}` : "" }}</span>
      <ApmAutoRefresh @refresh="load" />
    </div>

    <ReSkeleton v-if="loading && !hasPoints" :rows="6" animated />

    <ReCard v-else :radius="12" shadow="never">
      <template #header>
        <div class="apm-card-head">
          <span class="apm-card-h">{{ currentDefinition?.label || name || "指标" }}</span>
          <!-- label 与 name 同值时只显示一次，避免「service_resp_timeservice_resp_time」 -->
          <span v-if="name && name !== (currentDefinition?.label || name)" class="apm-mono apm-muted">{{ name }}</span>
          <span class="apm-bar__spacer" />
          <span v-if="currentDefinition?.description" class="apm-card-note">{{ currentDefinition.description }}</span>
          <span class="apm-card-note">{{ primarySeries?.points?.length ?? 0 }} 个数据点 · 单位 {{ unit || "—" }}</span>
          <!-- 粒度贴着它影响的曲线放：改这里就是改这张图的采样密度 -->
          <ReSelect v-model="step" :options="stepOptions" style="width: 102px" @change="load" />
          <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
        </div>
      </template>
      <MetricChart v-if="hasPoints" :series="seriesList" height="380px" />
      <ReEmpty v-else :image-size="70" :description="emptyHint" />
    </ReCard>

    <!-- 数值明细：图上读不出具体峰值（多指标时只列主指标，叠加指标以图例曲线为准） -->
    <ReCard v-if="primarySeries?.points?.length" :radius="12" shadow="never">
      <template #header><span class="apm-card-h">数值明细</span></template>
      <ReTable
        :data="pointRows"
        :columns="pointColumns"
        engine="element"
        :settings="{ border: false }"
        :config="{ pagination: { enable: true, pageSize: 10 }, toolbar: { enable: false } }"
        :layout-table="{ maxHeight: 420 }"
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
import ApmAutoRefresh from "../components/ApmAutoRefresh.vue";
import ApmTimeWindow from "../components/ApmTimeWindow.vue";
import MetricChart from "../components/MetricChart.vue";
import { getMetrics, listEndpoints, listInstances, listMetricDefinitions, listServices } from "../api/apmApi";
import type { ApmMetricDefinition, ApmMetricSeries, ApmScope, ApmStep } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { consumeApmTabContext } from "../tabs";
import type { ApmTabContext } from "../tabs";
import { useApmTabActivated } from "../composables/useApmTabActivated";
import { message } from "@repo/core";
import { fmtNum, fmtTime } from "../utils/format";
import { timeQuery } from "../utils/timeRange";
import type { ApmTimeWindow as ApmTimeWindowState } from "../utils/timeRange";

const { present, ensure } = useApmStatus();

/** 本页在 URL 上的页签名，必须与 tabs.ts 里的 name 一致 */
const TAB_NAME = "metrics";

const scope = ref<ApmScope>("SERVICE");
const name = ref("service_resp_time");
const entityService = ref("");
const instance = ref("");
const endpoint = ref("");
/** 时间窗：预设分钟数或自定义区间 */
const timeWindow = ref<ApmTimeWindowState>({ minutes: 60 });
/** 叠加指标：与主指标画进同一张图，单位不同时自动切双轴 */
const compareNames = ref<string[]>([]);
const step = ref<ApmStep>("MINUTE");
const definitions = ref<ApmMetricDefinition[]>([]);
const seriesList = ref<ApmMetricSeries[]>([]);
const loading = ref(false);
const emptyHint = ref("没有数据");

const services = ref<string[]>([]);
const instances = ref<string[]>([]);
const endpoints = ref<string[]>([]);

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
const scopeText = computed(() => scopeOptions.find((item) => item.value === scope.value)?.label ?? "");
const currentDefinition = computed(() => definitions.value.find((d) => d.name === name.value) ?? null);
const primarySeries = computed(() => seriesList.value[0] ?? null);
const hasPoints = computed(() => seriesList.value.some((s) => s.points?.length));
const unit = computed(() => currentDefinition.value?.unit ?? primarySeries.value?.unit ?? "");
const serviceOptions = computed(() => services.value.map((v) => ({ label: v, value: v })));
const instanceOptions = computed(() => instances.value.map((v) => ({ label: v, value: v })));
const endpointOptions = computed(() => endpoints.value.map((v) => ({ label: v, value: v })));

const pointRows = computed(() => (primarySeries.value?.points ?? []) as unknown as Record<string, unknown>[]);

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
  // 叠加指标同样按作用域取定义：切了作用域后不在清单里的一并丢弃
  compareNames.value = compareNames.value.filter((n) => definitions.value.some((d) => d.name === n));
  load();
}

/** 服务变化：刷新实例 / 端点下拉（并清掉已选的实体） */
async function onServiceChange() {
  instance.value = "";
  endpoint.value = "";
  await loadEntityOptions();
  load();
}

/** 只刷新实体下拉，不查询 —— 供 onServiceChange 与首屏预填复用 */
async function loadEntityOptions() {
  instances.value = [];
  endpoints.value = [];
  if (!entityService.value) {
    return;
  }
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
    // 主指标 + 叠加指标一起查：allSettled 保证个别指标失败不拖垮整张图
    const requested = [name.value, ...compareNames.value.filter((n) => n && n !== name.value)];
    const results = await Promise.allSettled(
      requested.map((metric) =>
        getMetrics({
          name: metric,
          scope: scope.value,
          // OAP 的 Entity 里，实例与端点都需要所属服务名
          service: scope.value === "ALL" ? undefined : entityService.value || undefined,
          instance: scope.value === "SERVICE_INSTANCE" ? instance.value || undefined : undefined,
          endpoint: scope.value === "ENDPOINT" ? endpoint.value || undefined : undefined,
          ...timeQuery(timeWindow.value),
          step: step.value,
        }),
      ),
    );
    seriesList.value = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.length - seriesList.value.length;
    if (failed > 0) {
      message.warning(`${failed} 个指标查询失败，图中只画返回成功的部分`);
    }
    if (!hasPoints.value) {
      emptyHint.value =
        scope.value !== "ALL" && !entityService.value
          ? "先在上方选择一个服务：SkyWalking 的服务级指标挂在具体实体上，不选实体只有空图"
          : `指标 ${name.value} 在该时间窗口内没有数据（后端可能未开启该指标采集）`;
    }
  } catch (e) {
    seriesList.value = [];
    emptyHint.value = `查询失败：${(e as Error)?.message ?? e}`;
  } finally {
    loading.value = false;
  }
}

/**
 * 按跳转上下文落位并取数：首屏与「页签切回」共用同一套落位逻辑，
 * 避免两处各写一份后出现「下钻过来和刷新进来行为不一样」。
 *
 * @param context 一次性跳转上下文；首屏直接进入时为 null
 */
async function bootstrap(context: ApmTabContext | null): Promise<void> {
  // 从其它页跳过来时带着服务/端点：优先用它，别覆盖成「第一个服务」。
  // 带端点说明来源是端点维度的排障，作用域直接落到「端点」，省一次手选。
  if (context?.instance) {
    scope.value = "SERVICE_INSTANCE";
  } else if (context?.endpoint) {
    scope.value = "ENDPOINT";
  }
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
  // 服务级指标必须带实体：跳转指定了服务就用它（与已选不同时换过来），
  // 否则落到第一个服务，页面一打开就有图看
  if (context?.service) {
    if (context.service !== entityService.value) {
      entityService.value = context.service;
      instance.value = "";
      endpoint.value = "";
    }
  } else if (!entityService.value) {
    entityService.value = services.value[0] || "";
  }
  if (context?.startTime && context?.endTime) {
    timeWindow.value = { minutes: 0, startTime: context.startTime, endTime: context.endTime };
  } else if (context?.minutes) {
    timeWindow.value = { minutes: context.minutes };
  }
  // 端点 / 实例的取值空间挂在服务下，先把下拉补齐再回填上下文里的选择
  if (entityService.value && (scope.value === "ENDPOINT" || scope.value === "SERVICE_INSTANCE")) {
    await loadEntityOptions();
  }
  if (context?.endpoint && scope.value === "ENDPOINT") {
    endpoint.value = context.endpoint;
  }
  if (context?.instance && scope.value === "SERVICE_INSTANCE") {
    instance.value = context.instance;
  }
  await loadDefinitions();
  // 作用域换过之后原指标可能不在新清单里（端点作用域没有 service_resp_time），
  // 与 onScopeChange 同口径退到第一个可用指标，否则查询必然报错
  if (!definitions.value.some((d) => d.name === name.value)) {
    name.value = definitions.value[0]?.name ?? "";
  }
  // 总览 KPI 下钻会指定指标（如 service_resp_time）：定义里真的有才采用
  if (context?.metric && definitions.value.some((d) => d.name === context.metric)) {
    name.value = context.metric;
  }
  load();
}

onMounted(async () => {
  await ensure();
  if (!present.value) {
    return;
  }
  await bootstrap(consumeApmTabContext());
});

/**
 * 页签常驻保活（v-show 切换）：总览 KPI 下钻再次切到本页签时
 * {@link onMounted} 不会重跑，一次性上下文（指标名 / 服务 / 实体 / 时间窗）在这里接住。
 * 普通切回不重查 —— 批量指标查询较重，新鲜度由自动刷新兜底。
 */
useApmTabActivated(TAB_NAME, async () => {
  const context = consumeApmTabContext();
  if (!context) {
    return;
  }
  await ensure();
  if (!present.value) {
    return;
  }
  await bootstrap(context);
});
</script>

