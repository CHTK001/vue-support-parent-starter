<!--
  服务拓扑 —— 对齐 SkyWalking 的拓扑图 + 调用边表格。

  为什么既画图又列表：图能一眼看出「谁是瓶颈、谁孤立」，但图上读不出
  精确的 QPS / 错误率；表格补精确值，两者是同一份数据（/topology）的两种读法。

  图用 echarts 的 graph 布局（不自造 force 迭代）：节点数在 OAP 默认配置下是几十个量级，
  graph 自带的 repulsion 足够，且不需要引入额外的布局依赖。
-->
<template>
  <ApmGate v-slot="{ status }">
    <ReSectionHead description="服务间调用关系与每条边的调用量、错误率、平均耗时">
      <template #title>服务拓扑</template>
      <template #actions>
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

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
    </div>

    <ReSkeleton v-if="loading && !topology" :rows="6" animated />

    <template v-else>
      <ReCard :radius="12" shadow="never">
        <template #header><span class="apm-card-h">调用关系图</span></template>
        <ApmGraph
          :nodes="nodes"
          :calls="topology?.calls ?? []"
          height="420px"
          empty-text="该时间窗口内没有拓扑数据（可能没有跨服务调用）"
        />
      </ReCard>

      <ReCard :radius="12" shadow="never">
        <template #header><span class="apm-card-h">调用边</span></template>
        <ReTable
          :data="callRows"
          :columns="callColumns"
          engine="element"
          :loading="loading"
          :settings="{ border: false }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
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

      <ReCard :radius="12" shadow="never">
        <template #header><span class="apm-card-h">节点</span></template>
        <ReTable
          :data="nodeRows"
          :columns="nodeColumns"
          engine="element"
          :loading="loading"
          :settings="{ border: false }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          empty-text="没有节点"
          table-id="apm-topology-nodes"
        >
          <template #empty="{ description }">
            <span class="apm-table-empty">{{ description }}</span>
          </template>
          <template #col-name="{ row }">
            <span class="apm-mono">{{ row.name }}</span>
          </template>
          <template #col-isReal="{ row }">
            <ReTag :type="row.isReal ? 'success' : 'info'" size="small" round>
              {{ row.isReal ? "已部署" : "推断" }}
            </ReTag>
          </template>
        </ReTable>
      </ReCard>
    </template>

    <div v-if="!status.capabilities.includes('topology')" class="apm-muted">
      引擎 {{ status.name }} 不支持拓扑查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReSectionHead from "@repo/ui/re-section-head";
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
import { WINDOW_OPTIONS, errorRateClass, errorRateText, fmtMs, fmtNum, latencyClass } from "../utils/format";

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

function nodeName(id: string): string {
  return nameMap.value.get(id) || id;
}

const callColumns: ReTableColumn[] = [
  { prop: "source", label: "调用方", minWidth: 200, slot: "source" },
  { prop: "target", label: "被调方", minWidth: 200, slot: "target" },
  { prop: "calls", label: "调用量", width: 110, align: "right", slot: "calls", sortable: true },
  { prop: "avgMs", label: "平均耗时", width: 110, align: "right", slot: "avgMs", sortable: true },
  { prop: "errorRate", label: "错误率", width: 100, align: "right", slot: "errorRate", sortable: true },
];

const nodeColumns: ReTableColumn[] = [
  { prop: "name", label: "节点", minWidth: 240, slot: "name" },
  { prop: "type", label: "类型", width: 120 },
  { prop: "layer", label: "层", width: 140 },
  { prop: "isReal", label: "来源", width: 100, align: "center", slot: "isReal" },
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

