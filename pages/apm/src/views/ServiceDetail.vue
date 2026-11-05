<!--
  服务详情 —— 一个服务的实例清单、端点清单与关键指标趋势。

  SkyWalking 的 Service Detail 是「选一个服务 → 看它的实例 / 端点 / 指标」，
  这里保持同样的下钻顺序：先看「跑在几个实例上」，再看「慢在哪个端点」，
  最后看「指标趋势是否退化」。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <template v-if="serviceName">
        <ReInput v-model="serviceName" placeholder="服务名" style="width: 300px" @keyup.enter="load" />
        <ReButton icon="Search" type="primary" :loading="loading" @click="load">加载</ReButton>
        <span class="apm-bar__spacer" />
        <span class="apm-count">{{ instances.length }} 个实例 · {{ endpoints.length }} 个端点</span>
      </template>
      <span v-else class="apm-bar__spacer" />
      <ReButton icon="Back" show-text @click="goBack">返回列表</ReButton>
      <ReButton v-if="serviceName" icon="Timer" show-text @click="goProfiles">性能剖析</ReButton>
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <!-- 未带 service 参数 -->
    <ReEmpty v-if="!serviceName" :image-size="70" description="缺少服务名，请从服务列表点行进入" />

    <template v-else>

      <div class="apm-kpis">
        <ReStatCard
          size="compact"
          title="实例数"
          :value="instances.length"
          desc="已心跳上报的实例"
          :icon="Monitor"
          icon-color="var(--el-color-primary)"
          style="--accent: var(--el-color-primary)"
        />
        <ReStatCard
          size="compact"
          title="端点数"
          :value="endpoints.length"
          desc="被观测端点"
          :icon="Aim"
          icon-color="var(--el-color-info)"
          style="--accent: var(--el-color-info)"
        />
        <ReStatCard
          size="compact"
          title="总调用量"
          :value="fmtNum(totalCalls)"
          desc="端调用量合计"
          :icon="Histogram"
          icon-color="var(--el-color-primary)"
          style="--accent: var(--el-color-success)"
        />
        <ReStatCard
          size="compact"
          title="最慢端点"
          :value="slowest ? fmtMs(slowest.p99Ms) : '—'"
          :desc="slowest?.name || '暂无数据'"
          :icon="Timer"
          icon-color="var(--el-color-warning)"
          style="--accent: var(--el-color-warning)"
        />
      </div>

      <!-- 指标趋势 -->
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">指标趋势</span>
            <div class="apm-bar" style="gap: 8px">
              <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="loadMetrics" />
              <ReButton icon="Refresh" :loading="metricsLoading" @click="loadMetrics" />
            </div>
          </div>
        </template>
        <MetricChart v-if="series.length" :series="series" height="300px" />
        <ReEmpty v-else :image-size="60" :description="metricsHint" />
      </ReCard>

      <!-- 实例 -->
      <ReCard :radius="12" shadow="never">
        <template #header><span class="apm-card-h">实例</span></template>
        <ReTable
          :data="instanceRows"
          :columns="instanceColumns"
          engine="element"
          :loading="loading"
          :settings="{ border: false }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          empty-text="该服务没有实例数据"
          :layout-table="{ maxHeight: 360 }"
          table-id="apm-service-instances"
        >
          <template #empty="{ description }">
            <span class="apm-table-empty">{{ description }}</span>
          </template>
          <template #col-name="{ row }">
            <span class="apm-mono">{{ row.name }}</span>
          </template>
          <template #col-heartbeatTime="{ row }">
            <span class="apm-muted">{{ fmtAgo(row.heartbeatTime) }}</span>
          </template>
          <template #col-attributes="{ row }">
            <span class="apm-muted apm-mono">{{ tagsPreview(row.attributes) }}</span>
          </template>
        </ReTable>
      </ReCard>

      <!-- 端点 -->
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">端点</span>
            <ReInput
              v-model="endpointKeyword"
              placeholder="按端点名过滤"
              clearable
              style="width: 240px"
              @keyup.enter="loadEndpoints"
            />
          </div>
        </template>
        <ReTable
          :data="endpointRows"
          :columns="endpointColumns"
          engine="element"
          :loading="endpointsLoading"
          :settings="{ border: false }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          empty-text="没有符合条件的端点"
          :layout-table="{ maxHeight: 420 }"
          table-id="apm-service-endpoints"
        >
          <template #empty="{ description }">
            <span class="apm-table-empty">{{ description }}</span>
          </template>
          <template #col-name="{ row }">
            <span class="apm-mono">{{ row.name }}</span>
          </template>
          <template #col-calls="{ row }">
            <span class="apm-mono">{{ fmtNum(row.calls) }}</span>
          </template>
          <template #col-avgMs="{ row }">
            <span class="apm-mono" :class="latencyClass(row.avgMs)">{{ fmtMs(row.avgMs) }}</span>
          </template>
          <template #col-p99Ms="{ row }">
            <span class="apm-mono" :class="latencyClass(row.p99Ms)">{{ fmtMs(row.p99Ms) }}</span>
          </template>
          <template #col-errorRate="{ row }">
            <span class="apm-mono" :class="Number(row.calls) > 0 ? errorRateClass(row.errorRate) : 'apm-muted'">{{ errorRateText(row.errorRate, row.calls) }}</span>
          </template>
        </ReTable>
      </ReCard>

      <div v-if="!status.capabilities.includes('instances')" class="apm-muted">
        引擎 {{ status.name }} 不支持实例查询，实例表为空是预期行为。
      </div>
    </template>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/core";
import { Aim, Back, Histogram, Monitor, Search, Timer } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import MetricChart from "../components/MetricChart.vue";
import { getMetrics, listEndpoints, listInstances } from "../api/apmApi";
import type { ApmEndpoint, ApmInstance, ApmMetricSeries, ApmTag } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import {
  WINDOW_OPTIONS,
  errorRateClass,
  errorRateText,
  fmtAgo,
  fmtMs,
  fmtNum,
  fmtPercent,
  latencyClass,
} from "../utils/format";

const route = useRoute();
const router = useRouter();
const { present, ensure } = useApmStatus();

/** 服务名：以路由 query 为初值，页内可改（方便粘贴服务名直接看） */
const serviceName = ref(String(route.query.service ?? ""));
const instances = ref<ApmInstance[]>([]);
const endpoints = ref<ApmEndpoint[]>([]);
const series = ref<ApmMetricSeries[]>([]);
const loading = ref(false);
const endpointsLoading = ref(false);
const metricsLoading = ref(false);
const endpointKeyword = ref("");
const minutes = ref(30);
const metricsHint = ref("后端未返回该服务的指标");
const windowOptions = WINDOW_OPTIONS;

const instanceRows = computed(() => instances.value as unknown as Record<string, unknown>[]);
const endpointRows = computed(() => endpoints.value as unknown as Record<string, unknown>[]);
const totalCalls = computed(() => endpoints.value.reduce((sum, e) => sum + (e.calls || 0), 0));
const slowest = computed<ApmEndpoint | null>(() => {
  if (!endpoints.value.length) {
    return null;
  }
  return [...endpoints.value].sort((a, b) => (b.p99Ms || 0) - (a.p99Ms || 0))[0];
});

const instanceColumns: ReTableColumn[] = [
  { prop: "name", label: "实例名", minWidth: 240, slot: "name" },
  { prop: "language", label: "语言", width: 100 },
  { prop: "heartbeatTime", label: "最后心跳", width: 160, slot: "heartbeatTime" },
  { prop: "attributes", label: "属性", minWidth: 220, slot: "attributes" },
];

const endpointColumns: ReTableColumn[] = [
  { prop: "name", label: "端点", minWidth: 300, slot: "name" },
  { prop: "calls", label: "调用量", width: 110, align: "right", slot: "calls", sortable: true },
  { prop: "avgMs", label: "平均耗时", width: 110, align: "right", slot: "avgMs", sortable: true },
  { prop: "p99Ms", label: "P99", width: 100, align: "right", slot: "p99Ms", sortable: true },
  { prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate", sortable: true },
];

/** 属性预览：只显示前 3 对，完整内容在 instance 详情里（当前直接给 JSON） */
function tagsPreview(tags?: ApmTag[]): string {
  if (!tags?.length) {
    return "—";
  }
  return tags
    .slice(0, 3)
    .map((t) => `${t.key}=${t.value}`)
    .join(" · ");
}

/** 取一条服务级指标 */
async function tryMetric(name: string): Promise<ApmMetricSeries | null> {
  try {
    const result = await getMetrics({
      name,
      scope: "SERVICE",
      service: serviceName.value,
      minutes: minutes.value,
      step: "MINUTE",
    });
    return result?.points?.length ? result : null;
  } catch {
    return null;
  }
}

async function loadMetrics() {
  if (!serviceName.value) {
    return;
  }
  metricsLoading.value = true;
  try {
    const [resp, p99, cpm, sla] = await Promise.all([
      tryMetric("service_resp_time"),
      tryMetric("service_p99"),
      tryMetric("service_cpm"),
      tryMetric("service_sla"),
    ]);
    series.value = [resp, p99, cpm, sla].filter((s): s is ApmMetricSeries => Boolean(s));
    metricsHint.value = series.value.length ? "" : `后端未返回 ${serviceName.value} 的指标数据`;
  } finally {
    metricsLoading.value = false;
  }
}

async function loadEndpoints() {
  if (!serviceName.value) {
    return;
  }
  endpointsLoading.value = true;
  try {
    endpoints.value = (await listEndpoints(serviceName.value, endpointKeyword.value || undefined, {})) || [];
  } catch (e) {
    // 端点查询失败不影响实例与指标
    endpoints.value = [];
    message.warning(`加载端点失败：${(e as Error)?.message ?? e}`);
  } finally {
    endpointsLoading.value = false;
  }
}

async function load() {
  await ensure();
  if (!present.value || !serviceName.value) {
    return;
  }
  loading.value = true;
  try {
    const list = await listInstances(serviceName.value, {});
    instances.value = list || [];
  } catch (e) {
    instances.value = [];
    message.warning(`加载实例失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
  await Promise.all([loadEndpoints(), loadMetrics()]);
}

function goBack() {
  router.push(`${ROUTE_PREFIX}/services`);
}

/** 跳到剖析页并带上当前服务：剖析必须先选服务，用户不该再手点一遍 */
function goProfiles() {
  router.push({ path: `${ROUTE_PREFIX}/profiles`, query: { service: serviceName.value } });
}

// 支持从别处带着新 service 跳进来（同一路由复用组件时 query 变化）
watch(
  () => route.query.service,
  (value) => {
    const next = String(value ?? "");
    if (next && next !== serviceName.value) {
      serviceName.value = next;
      load();
    }
  },
);

onMounted(load);
</script>

