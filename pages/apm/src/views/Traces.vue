<!--
  调用链路 —— 对齐 SkyWalking UI 的 Trace 列表。

  查询条件与 SkyWalking 一致：服务（可选）、端点（可选）、状态（全部/成功/失败）、
  时间窗口、是否按耗时倒序。因为 OAP 的 queryBasicTraces 是游标分页，
  前端自己维护 pageNum，不显示「总页数」——那会让人误以为数据是齐的。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-toolbar apm-toolbar--split">
      <!-- 筛选区：控件多，宽度不够时自己换行，不牵连右侧分页 -->
      <div class="apm-bar apm-toolbar__filters">
        <ReSelect
          v-model="query.service"
          :options="serviceOptions"
          placeholder="全部服务"
          clearable
          filterable
          style="width: 200px"
          @change="onServiceChange"
        />
        <ReSelect
          v-model="query.endpoint"
          :options="endpointOptions"
          placeholder="全部端点"
          clearable
          filterable
          style="width: 220px"
        />
        <ReSelect v-model="query.state" :options="stateOptions" style="width: 110px" />
        <ReSelect v-model="minutes" :options="windowOptions" style="width: 140px" />
        <ReInput v-model="query.keyword" placeholder="按 traceId / 端点关键词" clearable style="width: 200px" />
        <!-- 勾选即重查：排序是查询条件，不该再多点一次「查询」 -->
        <el-checkbox v-model="orderByDuration" label="按耗时倒序" @change="search" />
        <ReButton icon="Search" type="primary" :loading="loading" @click="search">查询</ReButton>
      </div>
      <!-- 操作区：翻页/刷新是一组，整体推到右边，永不拆开 -->
      <div class="apm-bar apm-toolbar__actions">
        <span class="apm-count">第 {{ query.pageNum }} 页 · {{ items.length }} 条</span>
        <ReButton layout="square" icon="ArrowLeft" tip="上一页" :disabled="query.pageNum <= 1 || loading" @click="prevPage" />
        <ReButton layout="square" icon="ArrowRight" tip="下一页" :disabled="items.length < pageSize || loading" @click="nextPage" />
        <ReButton layout="square" icon="Refresh" tip="刷新" :loading="loading" @click="load" />
      </div>
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
      :layout-table="{ maxHeight: 620 }"
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

    <div v-if="!status.capabilities.includes('traces')" class="apm-muted">
      引擎 {{ status.name }} 不支持链路查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
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
import { consumeApmTabContext } from "../tabs";
import { WINDOW_OPTIONS, fmtMs, fmtTime, latencyClass } from "../utils/format";

const route = useRoute();
const router = useRouter();
const { present, ensure } = useApmStatus();

/** URL 上的单值参数（数组取第一个；外部输入不做信任） */
function firstParam(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw == null ? "" : String(raw).trim();
}

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
  await loadEndpointsOf(query.service);
}

/**
 * 取某个服务的端点列表。
 *
 * <p>从「服务详情 → 慢端点」跳过来时要先有这份列表，
 * 否则端点下拉显示一个列表里不存在的值，看起来像没生效。</p>
 *
 * @param service 服务名，空则清空列表
 */
async function loadEndpointsOf(service: string): Promise<void> {
  if (!service) {
    endpoints.value = [];
    return;
  }
  try {
    endpoints.value = ((await listEndpoints(service, undefined, {})) || []).map((e) => e.name);
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

/** 行点击 → 瀑布详情；把当前筛选一起带上，详情页「返回列表」才能回到同一屏 */
function onRowClick(row: Record<string, unknown>) {
  const traceId = String(row.traceId ?? "");
  if (!traceId) {
    return;
  }
  router.push({
    path: `${ROUTE_PREFIX}/traces/detail`,
    query: {
      traceId,
      ...(query.service ? { service: query.service } : {}),
      ...(query.endpoint ? { endpoint: query.endpoint } : {}),
      minutes: String(minutes.value),
    },
  });
}

onMounted(async () => {
  // 两条来路都要接：
  //   1) URL 带筛选（从服务详情点某个端点过来：?tab=traces&service=X&endpoint=Y&minutes=30）
  //      —— 这种是跨路由跳转，会重建整页，只有 URL 能活下来；
  //   2) 页签内跳转带的一次性上下文（总览点慢服务）。
  // URL 优先：它是用户真正点出来的那一条，上下文只是补充。
  const context = consumeApmTabContext();
  const urlService = firstParam(route.query.service);
  const urlEndpoint = firstParam(route.query.endpoint);
  const urlMinutes = Number(firstParam(route.query.minutes));
  const service = urlService || context?.service || "";
  if (service) {
    query.service = service;
  }
  if (urlMinutes > 0) {
    minutes.value = urlMinutes;
  } else if (context?.minutes) {
    minutes.value = context.minutes;
  }
  // 端点预填要先有该服务的端点列表，否则下拉里是个不存在的值
  if (service) {
    await loadEndpointsOf(service);
  }
  const endpoint = urlEndpoint || context?.endpoint || "";
  if (endpoint) {
    query.endpoint = endpoint;
  }
  loadServices();
  load();
});
</script>

<style scoped>
.trace-id {
  color: var(--text-primary, var(--el-text-color-primary));
}
</style>
