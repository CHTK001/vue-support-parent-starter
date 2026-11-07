<!--
  服务拓扑 —— 对齐 SkyWalking 的拓扑图 + 调用边表格。

  为什么既画图又列表：图能一眼看出「谁是瓶颈、谁孤立」，但图上读不出
  精确的 QPS / 错误率；表格补精确值，两者是同一份数据（/topology）的两种读法。

  图用 echarts 的 graph 布局（不自造 force 迭代）：节点数在 OAP 默认配置下是几十个量级，
  graph 自带的 repulsion 足够，且不需要引入额外的布局依赖。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReSelect
        v-model="service"
        :options="serviceOptions"
        placeholder="全局拓扑"
        clearable
        filterable
        style="width: 240px"
        @change="load"
      />
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="load" />
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ topology?.nodes?.length ?? 0 }} 个节点 · {{ topology?.calls?.length ?? 0 }} 条调用边</span>
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <ReSkeleton v-if="loading && !topology" :rows="6" animated />

    <template v-else>
      <ReCard :radius="16">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">调用关系图</span>
            <span class="apm-card-note">节点大小 = 出入调用量 · 边宽 = 调用量 · 点节点看服务详情</span>
            <span class="apm-bar__spacer" />
            <span class="apm-legend">
              <span><i class="is-node" />已部署</span>
              <span><i class="is-virtual" />推断</span>
              <span><i class="is-self" />自身</span>
            </span>
          </div>
        </template>
        <div class="apm-graph-stage">
          <ApmGraph
            :nodes="nodes"
            :calls="topology?.calls ?? []"
            height="460px"
            empty-text="该时间窗口内没有拓扑数据（可能没有跨服务调用）"
            @pick="openService"
          />
        </div>
      </ReCard>

      <div class="apm-duo">
        <ReCard :radius="16">
          <template #header><span class="apm-card-h">调用边</span></template>
          <ReTable
            :data="callRows"
            :columns="callColumns"
            engine="element"
            :loading="loading"
            :settings="{ border: false }"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
            :layout-table="{ maxHeight: 380 }"
            empty-text="没有调用边"
            table-id="apm-topology-calls"
          >
            <template #empty="{ description }">
              <span class="apm-table-empty">{{ description }}</span>
            </template>
            <template #col-source="{ row }">
              <span class="apm-mono">{{ nodeName(row.source) }}</span>
            </template>
            <template #col-target="{ row }">
              <span class="apm-mono">{{ nodeName(row.target) }}</span>
            </template>
            <template #col-calls="{ row }">
              <span class="apm-mono">{{ fmtNum(row.calls) }}</span>
            </template>
            <template #col-avgMs="{ row }">
              <span class="apm-mono" :class="latencyClass(row.avgMs)">{{ fmtMs(row.avgMs) }}</span>
            </template>
            <template #col-errorRate="{ row }">
              <span class="apm-mono" :class="Number(row.calls) > 0 ? errorRateClass(row.errorRate) : 'apm-muted'">{{ errorRateText(row.errorRate, row.calls) }}</span>
            </template>
          </ReTable>
        </ReCard>

        <ReCard :radius="16">
          <template #header><span class="apm-card-h">节点</span></template>
          <ReTable
            :data="nodeRows"
            :columns="nodeColumns"
            engine="element"
            :loading="loading"
            :settings="{ border: false }"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
            :layout-table="{ maxHeight: 380 }"
            empty-text="没有节点"
            table-id="apm-topology-nodes"
            class="apm-row-click"
            @row-click="onNodeRowClick"
          >
            <template #empty="{ description }">
              <span class="apm-table-empty">{{ description }}</span>
            </template>
            <template #col-name="{ row }">
              <span class="apm-mono">{{ row.name }}</span>
            </template>
            <template #col-isReal="{ row }">
              <ReTag :type="row.real ? 'success' : 'info'" size="small" round>
                {{ row.real ? "已部署" : "推断" }}
              </ReTag>
            </template>
          </ReTable>
        </ReCard>
      </div>
    </template>

    <div v-if="!status.capabilities.includes('topology')" class="apm-muted">
      引擎 {{ status.name }} 不支持拓扑查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import ApmGraph from "../components/ApmGraph.vue";
import { getTopology, listServices } from "../api/apmApi";
import type { ApmTopology, ApmTopologyNode } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { WINDOW_OPTIONS, errorRateClass, errorRateText, fmtMs, fmtNum, latencyClass } from "../utils/format";

const router = useRouter();
const { present, ensure } = useApmStatus();

const topology = ref<ApmTopology | null>(null);
const loading = ref(false);
const service = ref("");
const minutes = ref(30);
const services = ref<string[]>([]);
const windowOptions = WINDOW_OPTIONS;

const nodes = computed<ApmTopologyNode[]>(() => topology.value?.nodes ?? []);
const nodeRows = computed(() => nodes.value as unknown as Record<string, unknown>[]);
const callRows = computed(() => (topology.value?.calls ?? []) as unknown as Record<string, unknown>[]);
const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));

/** 节点 id → 名字（边上只有 id） */
const nameMap = computed(() => {
  const map = new Map<string, string>();
  for (const node of nodes.value) {
    map.set(node.id, node.name);
  }
  return map;
});

/**
 * 打开某个服务的详情。
 *
 * <p>拓扑图上点节点、或节点表点行都走这里：图上能看出「谁最忙」，
 * 接着要看的就是这个服务的实例与端点 —— 中间那一跳（先回列表再选一次）没有必要。</p>
 *
 * <p>推断出来的节点（如 User / 外部系统）不是部署实例，没有详情可看，直接忽略。</p>
 *
 * @param name 服务名
 */
function openService(name: string): void {
  if (!name) {
    return;
  }
  const node = nodes.value.find((n) => n.name === name);
  if (node && (node.real === false || node.isReal === false)) {
    return;
  }
  router.push({ path: `${ROUTE_PREFIX}/services/detail`, query: { service: name } });
}

/** 节点表行点击：转发给 {@link openService} */
function onNodeRowClick(row: Record<string, unknown>): void {
  openService(String(row.name ?? ""));
}

function nodeName(id: string): string {
  return nameMap.value.get(id) || id;
}

/**
 * 边上的调用指标。
 *
 * <p>虚拟节点（User）没有关系指标实体，OAP 会返回 -1 —— 这时三列全是破折号，
 * 不如收起，改显示 OAP 真正给出的检测点（CLIENT / SERVER）。</p>
 */
const hasCallMetrics = computed(() => (topology.value?.calls ?? []).some((c) => Number(c.calls) >= 0));

const callColumns = computed<ReTableColumn[]>(() => {
  const list: ReTableColumn[] = [
    { prop: "source", label: "调用方", minWidth: 200, slot: "source" },
    { prop: "target", label: "被调方", minWidth: 200, slot: "target" },
  ];
  if (hasCallMetrics.value) {
    list.push(
      { prop: "calls", label: "调用量", width: 110, align: "right", slot: "calls", sortable: true },
      { prop: "avgMs", label: "平均耗时", width: 110, align: "right", slot: "avgMs", sortable: true },
      { prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate", sortable: true },
    );
  } else {
    list.push({ prop: "detectPoint", label: "检测点", width: 120, align: "right" });
  }
  return list;
});

const nodeColumns: ReTableColumn[] = [
  { prop: "name", label: "节点", minWidth: 140, slot: "name" },
  { prop: "type", label: "类型", width: 110 },
  { prop: "layer", label: "层", width: 80 },
  { prop: "isReal", label: "来源", width: 96, align: "center", slot: "isReal" },
];

async function loadServices() {
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    topology.value = await getTopology({ service: service.value || undefined, minutes: minutes.value });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadServices();
  load();
});
</script>

