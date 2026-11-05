<!--
  多实体对比 —— 同一指标下横向比较多个服务，外加它们的合并拓扑。

  为什么单独一页而不是在「指标分析」里做多选：
    指标页的心智是「查一个实体的曲线」，多选会把「作用域 / 实例 / 端点」三级选择器
    变成组合爆炸。对比页把选择收敛到「指标 + 服务集合」两件，回答的是另一个问题：
    「这几个服务最近谁更慢 / 谁在报错」。两页共用同一份 /metrics-batch 后端接口。

  后端一次请求按「指标名 × 服务」做笛卡尔组合（最多 24 条曲线），因此这里也按同样
  的顺序去对齐 label —— 顺序错了会串线，这是本页唯一需要小心的地方。
-->
<template>
  <ApmGate v-slot="{ status }">
    <ReSectionHead description="同一指标下横向比较多个服务，并合并展示它们的调用关系">
      <template #title>多实体对比</template>
      <template #actions>
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <div class="apm-bar apm-toolbar">
      <ReSelect
        v-model="metricName"
        :options="metricOptions"
        placeholder="选择指标"
        filterable
        style="width: 240px"
        @change="load"
      />
      <ReSelect
        v-model="selectedServices"
        :options="serviceOptions"
        placeholder="选择要对比的服务（2~6 个）"
        multiple
        filterable
        collapse-tags
        style="min-width: 320px; flex: 1"
        @change="load"
      />
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="load" />
      <ReSelect v-model="step" :options="stepOptions" style="width: 110px" @change="load" />
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ series.length }} 条曲线 · {{ selectedServices.length }} 个服务</span>
    </div>

    <ReSkeleton v-if="loading && !series.length" :rows="6" animated />

    <template v-else>
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">{{ currentDefinition?.label || metricName }}</span>
            <span class="apm-mono apm-muted">{{ unit ? `单位 ${unit}` : "" }}</span>
          </div>
        </template>
        <MetricChart v-if="series.some((s) => s.points?.length)" :series="series" height="400px" />
        <ReEmpty v-else :image-size="70" :description="emptyHint" />
      </ReCard>

      <!-- 横向对照表：图上能看趋势，表里能看具体量级 -->
      <ReCard v-if="series.length" :radius="12" shadow="never">
        <template #header><span class="apm-card-h">量级对照</span></template>
        <ReTable
          :data="summaryRows as unknown as Record<string, unknown>[]"
          :columns="summaryColumns"
          engine="element"
          :settings="{ border: false }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          empty-text="没有数据"
          table-id="apm-compare-summary"
        >
          <template #empty="{ description }">
            <span class="apm-table-empty">{{ description }}</span>
          </template>
          <template #col-service="{ row }">
            <span class="apm-mono">{{ row.service }}</span>
          </template>
          <template #col-latest="{ row }">
            <span class="apm-mono">{{ fmtNum(row.latest, 2) }}</span>
          </template>
          <template #col-avg="{ row }">
            <span class="apm-mono">{{ fmtNum(row.avg, 2) }}</span>
          </template>
          <template #col-max="{ row }">
            <span class="apm-mono">{{ fmtNum(row.max, 2) }}</span>
          </template>
          <template #col-sum="{ row }">
            <span class="apm-mono">{{ fmtNum(row.sum, 2) }}</span>
          </template>
        </ReTable>
      </ReCard>

      <!-- 合并拓扑：多选服务在图上会自然连成一片，能看出它们之间是否互相调用 -->
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">合并拓扑</span>
            <span class="apm-muted">仅显示所选服务及其直接依赖</span>
          </div>
        </template>
        <ReChart v-if="mergedNodes.length" type="custom" engine="echarts" :option="graphOption" height="460px" />
        <ReEmpty v-else :image-size="60" description="所选服务之间没有拓扑关系数据" />
      </ReCard>
    </template>

    <div v-if="!status.capabilities.includes('metrics')" class="apm-muted">
      引擎 {{ status.name }} 不支持指标查询，无法做多实体对比。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { EChartsOption } from "echarts";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReChart from "@repo/ui/re-chart";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import MetricChart from "../components/MetricChart.vue";
import { getMetricsBatch, getMultiTopology, listMetricDefinitions, listServices } from "../api/apmApi";
import type { ApmMetricDefinition, ApmMetricSeries, ApmScope, ApmStep, ApmTopology } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { WINDOW_OPTIONS, fmtNum } from "../utils/format";

const { present, ensure } = useApmStatus();

/** 后端单次批量上限是 24 条曲线，这里限制服务数避免误点 */
const MAX_SERVICES = 6;

const services = ref<string[]>([]);
const selectedServices = ref<string[]>([]);
const definitions = ref<ApmMetricDefinition[]>([]);
const metricName = ref("service_resp_time");
const minutes = ref(60);
const step = ref<ApmStep>("MINUTE");
const series = ref<ApmMetricSeries[]>([]);
const topology = ref<ApmTopology | null>(null);
const loading = ref(false);
const emptyHint = ref("没有数据");

const windowOptions = WINDOW_OPTIONS;
const stepOptions = [
  { label: "秒级", value: "SECOND" },
  { label: "分钟", value: "MINUTE" },
  { label: "小时", value: "HOUR" },
  { label: "天", value: "DAY" },
];

const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));
const metricOptions = computed(() => definitions.value.map((d) => ({ label: d.label || d.name, value: d.name })));
const currentDefinition = computed(() => definitions.value.find((d) => d.name === metricName.value) ?? null);
const unit = computed(() => currentDefinition.value?.unit ?? series.value[0]?.unit ?? "");

/**
 * 对照表行：按曲线 label（服务名）聚合成一行。
 *
 * <p>{@code latest} 取时间戳最大的点而不是数组末尾 —— 后端返回的点并不保证有序，
 * 直接取末位会随机拿到中间某分钟的值。</p>
 */
interface SummaryRow {
  service: string;
  latest: number;
  avg: number;
  max: number;
  sum: number;
}

const summaryRows = computed<SummaryRow[]>(() => {
  const rows: SummaryRow[] = [];
  for (const item of series.value) {
    const points = item.points ?? [];
    if (!points.length) {
      continue;
    }
    const values = points.map((p) => p.value);
    const latestPoint = points.reduce((left, right) => (right.time > left.time ? right : left), points[0]);
    rows.push({
      service: item.label || item.name,
      latest: latestPoint.value,
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      max: Math.max(...values),
      sum: values.reduce((sum, v) => sum + v, 0),
    });
  }
  return rows;
});

const summaryColumns: ReTableColumn[] = [
  { prop: "service", label: "服务", minWidth: 200, slot: "service" },
  { prop: "latest", label: "最新值", width: 130, align: "right", slot: "latest", sortable: true },
  { prop: "avg", label: "均值", width: 130, align: "right", slot: "avg", sortable: true },
  { prop: "max", label: "峰值", width: 130, align: "right", slot: "max", sortable: true },
  { prop: "sum", label: "合计", width: 140, align: "right", slot: "sum", sortable: true },
];

const mergedNodes = computed(() => topology.value?.nodes ?? []);

const nameMap = computed(() => {
  const map = new Map<string, string>();
  for (const node of mergedNodes.value) {
    map.set(node.id, node.name);
  }
  return map;
});

function nodeName(id: string): string {
  return nameMap.value.get(id) || id;
}

const graphOption = computed<EChartsOption>(() => {
  const calls = topology.value?.calls ?? [];
  const selected = new Set(selectedServices.value);
  return {
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === "edge") {
          const data = params.data;
          return `${nodeName(data.source)} → ${nodeName(data.target)}<br/>调用量 ${fmtNum(data.calls)}`;
        }
        return params.data.name;
      },
    },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        force: { repulsion: 280, edgeLength: [100, 200], gravity: 0.09 },
        label: { show: true, fontSize: 11, position: "right" },
        edgeSymbol: ["none", "arrow"],
        edgeSymbolSize: 6,
        lineStyle: { curveness: 0.08 },
        data: mergedNodes.value.map((node) => ({
          id: node.id,
          name: node.name,
          symbolSize: selected.has(node.name) ? 30 : 18,
          itemStyle: {
            // 选中的服务用主色实心，其余（被依赖方）用淡色，避免主客体混淆
            color: selected.has(node.name) ? "var(--el-color-primary)" : undefined,
            opacity: selected.has(node.name) ? 1 : 0.6,
          },
        })),
        links: calls.map((call) => ({
          source: call.source,
          target: call.target,
          calls: call.calls,
          lineStyle: { width: Math.min(6, 1 + Math.log2(1 + Math.max(1, call.calls)) * 0.4) },
        })),
      },
    ],
  };
});

async function loadDefinitions() {
  try {
    // 服务级指标是跨服务可比的前提（实例级 / 端点级指标的名字空间不同，无法混在一张图里）
    const all = (await listMetricDefinitions("SERVICE" as ApmScope)) || [];
    definitions.value = all;
    if (!all.some((d) => d.name === metricName.value)) {
      metricName.value = all[0]?.name ?? metricName.value;
    }
  } catch {
    definitions.value = [];
  }
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  if (selectedServices.value.length > MAX_SERVICES) {
    message.warning(`一次最多对比 ${MAX_SERVICES} 个服务`);
    selectedServices.value = selectedServices.value.slice(0, MAX_SERVICES);
  }
  if (!metricName.value || !selectedServices.value.length) {
    series.value = [];
    topology.value = null;
    emptyHint.value = "请选择指标与至少一个服务";
    return;
  }
  loading.value = true;
  emptyHint.value = "没有数据";
  try {
    series.value =
      (await getMetricsBatch([metricName.value], selectedServices.value, {
        minutes: minutes.value,
        step: step.value,
      })) || [];
    if (!series.value.some((s) => s.points?.length)) {
      emptyHint.value = `指标 ${metricName.value} 在所选服务上都没有数据`;
    }
  } catch (e) {
    series.value = [];
    emptyHint.value = `查询失败：${(e as Error)?.message ?? e}`;
  }

  try {
    // 合并拓扑：一次请求拿齐所选服务的节点与调用边（后端有批量接口时不会逐个查）
    topology.value = await getMultiTopology(selectedServices.value, { minutes: minutes.value });
  } catch {
    topology.value = null;
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
  await loadDefinitions();
  // 默认选前两个服务，让页面一进来就有东西可比（选 0 个只能看到空图）
  selectedServices.value = services.value.slice(0, 2);
  load();
});

/* 页内样式已全部迁到 apm.css 的全局类（apm-card-head / apm-card-h）*/
</script>

