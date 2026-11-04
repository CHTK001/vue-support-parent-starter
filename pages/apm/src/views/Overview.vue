<!--
  APM 总览 —— 落首页。

  回答三个问题：
    1. 现在连的是哪个 APM、版本、地址（引擎信息条 + 候选引擎表）；
    2. 整体健康吗（QPS / 错误率 / 平均耗时 / P99 + 规模）；
    3. 趋势在变好还是变坏（响应时间、调用量、成功率三张时序图）。

  数据来源两个接口：/overview（描述 + 健康度）与 /metrics（时序）。
  时序是「尽力而为」——某个指标后端不提供就少一张图，不影响页面其它部分。
-->
<template>
  <ApmGate v-slot="{ status }">
    <ReSectionHead description="当前服务器接入的 APM 引擎、整体健康度与趋势">
      <template #title>APM 总览</template>
      <template #actions>
        <ReButton icon="Refresh" show-text :loading="loading || metricsLoading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <!-- 引擎一句话摘要 -->
    <div class="apm-engine">
      <span class="apm-engine__chip">引擎 {{ status.name }}</span>
      <span class="apm-engine__chip">版本 {{ status.version }}</span>
      <span class="apm-engine__chip">模式 {{ status.mode }}</span>
      <span v-if="status.endpoint" class="apm-engine__chip">{{ status.endpoint }}</span>
      <span class="apm-muted">能力：{{ status.capabilities.join("、") || "—" }}</span>
    </div>

    <!-- 健康度 -->
    <div class="apm-grid">
      <ReStatCard
        size="compact"
        title="QPS"
        :value="fmtNum(health?.qps, 2)"
        desc="每秒调用量"
        :icon="Odometer"
        icon-color="var(--el-color-primary)"
      />
      <ReStatCard
        size="compact"
        title="错误率"
        :value="fmtPercent(health?.errorRate)"
        desc="整体失败比例"
        :icon="Warning"
        :icon-color="(health?.errorRate ?? 0) > 5 ? 'var(--el-color-danger)' : 'var(--el-color-success)'"
      />
      <ReStatCard
        size="compact"
        title="平均耗时"
        :value="fmtMs(health?.avgMs)"
        desc="所有服务平均"
        :icon="Timer"
        icon-color="var(--el-color-info)"
      />
      <ReStatCard
        size="compact"
        title="P99"
        :value="fmtMs(health?.p99Ms)"
        desc="99 分位响应时间"
        :icon="TrendCharts"
        :icon-color="(health?.p99Ms ?? 0) >= 1000 ? 'var(--el-color-danger)' : 'var(--el-color-warning)'"
      />
    </div>

    <!-- 规模 -->
    <div class="apm-grid">
      <ReStatCard
        size="compact"
        title="服务数"
        :value="fmtNum(health?.services)"
        desc="被观测服务"
        :icon="Connection"
        icon-color="var(--el-color-primary)"
      />
      <ReStatCard
        size="compact"
        title="端点数"
        :value="fmtNum(health?.endpoints)"
        desc="被观测端点"
        :icon="Aim"
        icon-color="var(--el-color-info)"
      />
      <ReStatCard
        size="compact"
        title="告警数"
        :value="fmtNum(health?.alarms)"
        desc="当前窗口内告警"
        :icon="Bell"
        :icon-color="(health?.alarms ?? 0) > 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)'"
      />
    </div>

    <!-- 趋势 -->
    <div class="apm-grid apm-grid--chart">
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">响应时间趋势</span>
            <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="loadMetrics" />
          </div>
        </template>
        <MetricChart v-if="latencySeries.length" :series="latencySeries" height="260px" />
        <ReEmpty v-else :image-size="60" description="后端未返回响应时间指标" />
      </ReCard>

      <ReCard :radius="12" shadow="never">
        <template #header><span class="apm-card-h">调用量与成功率</span></template>
        <MetricChart v-if="volumeSeries.length" :series="volumeSeries" height="260px" />
        <ReEmpty v-else :image-size="60" description="后端未返回调用量指标" />
      </ReCard>
    </div>

    <!-- 候选引擎：把「装了但连不上」与「压根没装」摆出来 -->
    <ReCard :radius="12" shadow="never">
      <template #header><span class="apm-card-h">引擎探测结果</span></template>
      <ReTable
        :data="candidateRows"
        :columns="candidateColumns"
        engine="element"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        :settings="{ border: false }"
        empty-text="没有探测到任何 APM 引擎"
        table-id="apm-overview-candidates"
      >
        <template #col-available="{ row }">
          <ReTag :type="row.available ? 'success' : 'info'" round>
            {{ row.available ? "可用" : "不可用" }}
          </ReTag>
        </template>
        <template #col-message="{ row }">
          <span class="apm-muted">{{ row.message || "—" }}</span>
        </template>
      </ReTable>
      <div class="apm-bar" style="margin-top: 8px">
        <span class="apm-count">探测时间：{{ fmtTime(status.checkedAt) }}</span>
        <span class="apm-bar__spacer" />
        <ReButton icon="Refresh" @click="reload">重新探测</ReButton>
      </div>
    </ReCard>

    <!-- 快捷入口：总览页只给方向，细节在下钻页 -->
    <div class="apm-bar">
      <ReButton icon="Document" show-text @click="go('/traces')">调用链路</ReButton>
      <ReButton icon="Share" show-text @click="go('/topology')">服务拓扑</ReButton>
      <ReButton icon="Box" show-text @click="go('/infra-3d')">3D 基础设施</ReButton>
      <ReButton icon="DataLine" show-text @click="go('/metrics')">指标分析</ReButton>
      <ReButton icon="DataAnalysis" show-text @click="go('/compare')">多实体对比</ReButton>
      <ReButton icon="Bell" show-text @click="go('/alarms')">告警</ReButton>
      <ReButton icon="Warning" show-text @click="go('/alerts')">告警分析</ReButton>
      <ReButton icon="Tickets" show-text @click="go('/logs')">日志</ReButton>
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/core";
import { Aim, Bell, Connection, Document, DataLine, Odometer, Share, Tickets, Timer, TrendCharts, Warning } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSelect from "@repo/ui/re-select";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import MetricChart from "../components/MetricChart.vue";
import { getMetrics, getOverview } from "../api/apmApi";
import type { ApmHealth, ApmMetricSeries, ApmOverview } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { WINDOW_OPTIONS, fmtMs, fmtNum, fmtPercent, fmtTime } from "../utils/format";

const router = useRouter();
const { present, ensure, refresh, status } = useApmStatus();

const loading = ref(false);
const metricsLoading = ref(false);
const overview = ref<ApmOverview | null>(null);
const latencySeries = ref<ApmMetricSeries[]>([]);
const volumeSeries = ref<ApmMetricSeries[]>([]);
const minutes = ref(30);
const windowOptions = WINDOW_OPTIONS;

const health = computed<ApmHealth | null>(() => overview.value?.health ?? null);

/** 候选引擎行 */
const candidateRows = computed(
  () => (status.value?.candidates ?? []) as unknown as Record<string, unknown>[],
);

const candidateColumns: ReTableColumn[] = [
  { prop: "name", label: "引擎", width: 140 },
  { prop: "available", label: "状态", width: 90, align: "center", slot: "available" },
  { prop: "mode", label: "模式", width: 100 },
  { prop: "version", label: "版本", width: 120 },
  { prop: "endpoint", label: "后端地址", minWidth: 160 },
  { prop: "message", label: "说明", minWidth: 220, slot: "message" },
];

/** 跳转（路由前缀统一来自 config，页面间不写死绝对路径） */
function go(path: string) {
  router.push(ROUTE_PREFIX + path);
}

/**
 * 取一条指标，失败返回 null —— 时序图是加分项，不能因为某指标不被支持就让整页报错
 *
 * @param name  指标名
 * @param scope 作用域
 */
async function tryMetric(name: string): Promise<ApmMetricSeries | null> {
  try {
    const series = await getMetrics({ name, scope: "SERVICE", minutes: minutes.value, step: "MINUTE" });
    return series?.points?.length ? series : null;
  } catch {
    return null;
  }
}

/** 加载趋势：响应时间 / P99 / P95 / 调用量 / 成功率 */
async function loadMetrics() {
  if (!present.value) {
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
    latencySeries.value = [resp, p99].filter((s): s is ApmMetricSeries => Boolean(s));
    volumeSeries.value = [cpm, sla].filter((s): s is ApmMetricSeries => Boolean(s));
  } finally {
    metricsLoading.value = false;
  }
}

/** 加载概览 */
async function load() {
  // 子组件的 ApmGate 与本站同批挂载，状态可能还没回来 —— 先等它一次
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    overview.value = await getOverview({ minutes: minutes.value });
  } catch (e) {
    message.error(`加载 APM 概览失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
  loadMetrics();
}

/** 重新探测后把概览一起刷新 */
async function reload() {
  await refresh();
  await load();
}

onMounted(() => {
  load();
});
</script>

