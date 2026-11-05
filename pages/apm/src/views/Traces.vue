<!--
  调用链路 —— 对齐 SkyWalking UI 的 Trace 列表。

  查询条件与 SkyWalking 一致：服务（可选）、端点（可选）、状态（全部/成功/失败）、
  时间窗口、是否按耗时倒序。因为 OAP 的 queryBasicTraces 是游标分页，
  前端自己维护 pageNum，不显示「总页数」——那会让人误以为数据是齐的。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReSelect
        v-model="query.service"
        :options="serviceOptions"
        placeholder="全部服务"
        clearable
        filterable
        style="width: 220px"
        @change="onServiceChange"
      />
      <ReSelect
        v-model="query.endpoint"
        :options="endpointOptions"
        placeholder="全部端点"
        clearable
        filterable
        style="width: 260px"
      />
      <ReSelect v-model="query.state" :options="stateOptions" style="width: 120px" />
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" />
      <ReInput v-model="query.keyword" placeholder="按 traceId / 端点关键词" clearable style="width: 220px" />
      <el-checkbox v-model="orderByDuration" label="按耗时倒序" />
      <ReButton icon="Search" type="primary" :loading="loading" @click="search">查询</ReButton>
      <span class="apm-bar__spacer" />
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />
    <ReTable
      v-else
      :data="rows"
      :columns="columns"
      engine="element"
      :loading="loading"
      :settings="{ border: false }"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      empty-text="当前条件下没有链路"
      table-id="apm-traces"
      class="apm-row-click"
      @row-click="onRowClick"
    >
      <template #empty="{ description }">
        <span class="apm-table-empty">{{ description }}</span>
      </template>
      <template #col-traceId="{ row }">
        <span class="apm-mono trace-id">{{ row.traceId }}</span>
      </template>
      <template #col-endpointName="{ row }">
        <span class="apm-mono">{{ row.endpointName || "—" }}</span>
      </template>
      <template #col-durationMs="{ row }">
        <span class="apm-mono" :class="latencyClass(row.durationMs)">{{ fmtMs(row.durationMs) }}</span>
      </template>
      <template #col-startTime="{ row }">
        <span class="apm-muted apm-nowrap">{{ fmtTime(row.startTime) }}</span>
      </template>
      <template #col-error="{ row }">
        <ReTag :type="row.error ? 'danger' : 'success'" round size="small">
          {{ row.error ? "失败" : "成功" }}
        </ReTag>
      </template>
    </ReTable>

    <div class="apm-pager">
      <span>第 {{ query.pageNum }} 页 · 本页 {{ items.length }} 条</span>
      <ReButton icon="ArrowLeft" :disabled="query.pageNum <= 1 || loading" @click="prevPage">上一页</ReButton>
      <ReButton icon="ArrowRight" :disabled="items.length < pageSize || loading" @click="nextPage">下一页</ReButton>
    </div>

    <div v-if="!status.capabilities.includes('traces')" class="apm-muted">
      引擎 {{ status.name }} 不支持链路查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/core";
import { ArrowLeft, ArrowRight, Search } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import { listEndpoints, listServices, listTraces } from "../api/apmApi";
import type { ApmTrace, ApmTraceState } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { WINDOW_OPTIONS, fmtMs, fmtTime, latencyClass } from "../utils/format";

const router = useRouter();
const { present, ensure } = useApmStatus();

const pageSize = 20;
const items = ref<ApmTrace[]>([]);
const loading = ref(false);
const minutes = ref(30);
const orderByDuration = ref(false);
const services = ref<string[]>([]);
const endpoints = ref<string[]>([]);
const windowOptions = WINDOW_OPTIONS;

const query = reactive<{
  service: string;
  endpoint: string;
  state: ApmTraceState;
  keyword: string;
  pageNum: number;
}>({
  service: "",
  endpoint: "",
  state: "ALL",
  keyword: "",
  pageNum: 1,
});

const rows = computed(() => items.value as unknown as Record<string, unknown>[]);
const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));
const endpointOptions = computed(() => endpoints.value.map((e) => ({ label: e, value: e })));
const stateOptions = [
  { label: "全部", value: "ALL" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "ERROR" },
];

const columns: ReTableColumn[] = [
  { prop: "traceId", label: "Trace ID", minWidth: 200, slot: "traceId" },
  { prop: "endpointName", label: "入口端点", minWidth: 220, slot: "endpointName" },
  { prop: "durationMs", label: "耗时", width: 100, align: "right", slot: "durationMs", sortable: true },
  { prop: "startTime", label: "开始时间", width: 190, slot: "startTime", sortable: true },
  { prop: "error", label: "状态", width: 90, align: "center", slot: "error" },
];

/** 服务下拉（只取一次，用不上就静默降级成自由文本） */
async function loadServices() {
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
}

/** 换服务后端点下拉跟着换 */
async function onServiceChange() {
  query.endpoint = "";
  endpoints.value = [];
  if (!query.service) {
    return;
  }
  try {
    endpoints.value = ((await listEndpoints(query.service, undefined, {})) || []).map((e) => e.name);
  } catch {
    endpoints.value = [];
  }
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    items.value =
      (await listTraces({
        service: query.service || undefined,
        endpoint: query.endpoint || undefined,
        state: query.state,
        keyword: query.keyword || undefined,
        minutes: minutes.value,
        pageNum: query.pageNum,
        pageSize,
        orderByDuration: orderByDuration.value,
      })) || [];
  } catch (e) {
    items.value = [];
    message.error(`加载链路失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

function search() {
  query.pageNum = 1;
  load();
}

function prevPage() {
  if (query.pageNum > 1) {
    query.pageNum -= 1;
    load();
  }
}

function nextPage() {
  query.pageNum += 1;
  load();
}

/** 行点击 → 瀑布详情 */
function onRowClick(row: Record<string, unknown>) {
  const traceId = String(row.traceId ?? "");
  if (!traceId) {
    return;
  }
  router.push({ path: `${ROUTE_PREFIX}/traces/detail`, query: { traceId } });
}

onMounted(() => {
  loadServices();
  load();
});
</script>

<style scoped>
.trace-id {
  color: var(--text-primary, var(--el-text-color-primary));
}
</style>
