<!--
  日志 —— 对齐 SkyWalking 的 Log 页面。

  SkyWalking 的日志（queryLogs）是 OAP 从各 agent 采集上来的过程日志，
  字段是「服务 / 实例 / 端点 / traceId / 级别 / 内容」，没有「文件 / 路径」概念 ——
  因此这里不做主机日志那套（那是 @pages/system 的领域），只按 APM 口径展示。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReSelect
        v-model="service"
        :options="serviceOptions"
        placeholder="全部服务"
        clearable
        filterable
        style="width: 220px"
        @change="load"
      />
      <ReInput v-model="keyword" placeholder="按日志内容 / traceId 过滤" clearable style="width: 260px" @keyup.enter="load" />
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="load" />
      <!-- 服务与时间窗都是选了就查，只有关键字需要显式提交；
           因此这里不再单独放「刷新」——它和查询做的是同一件事，只会多一个按钮。 -->
      <ReButton icon="Search" type="primary" :loading="loading" @click="load">查询</ReButton>
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ logs.length }} 条日志</span>
    </div>

    <ReSkeleton v-if="loading && !logs.length" :rows="8" animated />

    <!-- 空态放在页面级：表格自己的空态会缩在表头下面，
         一张 600px 高的白卡里只有一行灰字，看起来像加载失败 -->
    <div v-else-if="!rows.length" class="apm-empty-card">
      <span class="apm-empty-card__icon"><ReIcon name="Document" :size="22" /></span>
      <div class="apm-empty-card__title">该时间窗口内没有日志</div>
      <p class="apm-empty-card__desc">
        OAP 只返回 agent 上报的过程日志。如果确认应该有，请检查 agent 的日志采集开关与 OAP 的日志存储。
      </p>
    </div>

    <ReTable
      v-else
      :data="rows"
      :columns="columns"
      engine="element"
      :loading="loading"
      :settings="{ border: false }"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      empty-text="该时间窗口内没有日志（OAP 可能未开启日志采集）"
      :layout-table="{ maxHeight: 620 }"
      table-id="apm-logs"
    >
      <template #col-timestamp="{ row }">
        <span class="apm-muted">{{ fmtTime(row.timestamp) }}</span>
      </template>
      <template #col-level="{ row }">
        <ReTag :type="levelType(row.level)" size="small" round>{{ row.level || "—" }}</ReTag>
      </template>
      <template #col-serviceName="{ row }">
        <el-link
          v-if="row.serviceName"
          type="primary"
          :underline="false"
          class="apm-mono"
          @click="openService(row.serviceName)"
        >
          {{ row.serviceName }}
        </el-link>
        <span v-else class="apm-muted">—</span>
      </template>
      <template #col-content="{ row }">
        <span class="apm-mono log-content" :title="row.content">{{ row.content || "—" }}</span>
      </template>
      <template #col-traceId="{ row }">
        <el-link v-if="row.traceId" type="primary" :underline="false" @click="openTrace(row)">
          {{ shortId(row.traceId) }}
        </el-link>
        <span v-else class="apm-muted">—</span>
      </template>
    </ReTable>

    <div v-if="!status.capabilities.includes('logs')" class="apm-muted">
      引擎 {{ status.name }} 不支持日志查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/core";
import { Search } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReIcon from "@repo/ui/re-icon";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import ApmGate from "../components/ApmGate.vue";
import { listLogs, listServices } from "../api/apmApi";
import type { ApmLogRecord } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { WINDOW_OPTIONS, fmtTime } from "../utils/format";

const router = useRouter();
const { present, ensure } = useApmStatus();

const logs = ref<ApmLogRecord[]>([]);
const services = ref<string[]>([]);
const service = ref("");
const keyword = ref("");
const minutes = ref(60);
const loading = ref(false);
const windowOptions = WINDOW_OPTIONS;

const rows = computed(() => logs.value as unknown as Record<string, unknown>[]);
const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));

const columns: ReTableColumn[] = [
  { prop: "timestamp", label: "时间", width: 175, slot: "timestamp", sortable: true },
  { prop: "level", label: "级别", width: 90, align: "center", slot: "level" },
  { prop: "serviceName", label: "服务", width: 180, slot: "serviceName" },
  { prop: "content", label: "内容", minWidth: 380, slot: "content" },
  { prop: "traceId", label: "Trace", width: 130, slot: "traceId" },
];

/** 日志级别 → 标签样式 */
function levelType(level?: string | null): "danger" | "warning" | "info" | "success" | "primary" {
  const value = (level || "").toUpperCase();
  if (value === "ERROR" || value === "FATAL") {
    return "danger";
  }
  if (value === "WARN" || value === "WARNING") {
    return "warning";
  }
  if (value === "DEBUG" || value === "TRACE") {
    return "info";
  }
  if (value === "INFO") {
    return "success";
  }
  return "primary";
}

/** traceId 太长，列里只显示尾段；title 里仍有全量 */
function shortId(traceId: string): string {
  return traceId.length > 16 ? `…${traceId.slice(-14)}` : traceId;
}

/** 点 traceId 回到链路详情：把服务与时间窗一起带过去。
 *
 *  只带 traceId 的话，详情页「返回列表」会退成默认筛选（全部服务、
 *  默认时间窗），一条日志点进去再退回来就丢了上下文 —— 这正是
 *  「要点好几次」的来源。TraceDetail 的 goBack 会原样还原这三个参数。
 */
function openTrace(row: ApmLogRecord) {
  router.push({
    path: `${ROUTE_PREFIX}/traces/detail`,
    query: {
      traceId: String(row.traceId ?? ""),
      ...(row.serviceName ? { service: row.serviceName } : {}),
      minutes: String(minutes.value),
    },
  });
}

/** 点服务名直接看这个服务的健康与端点，不用回服务列表再找一遍 */
function openService(name: string) {
  router.push({ path: `${ROUTE_PREFIX}/services/detail`, query: { service: name } });
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    logs.value =
      (await listLogs({
        service: service.value || undefined,
        keyword: keyword.value || undefined,
        minutes: minutes.value,
        pageSize: 200,
      })) || [];
  } catch (e) {
    logs.value = [];
    message.error(`加载日志失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

async function loadServices() {
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
}

onMounted(async () => {
  await loadServices();
  load();
});
</script>

<style scoped>
.log-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, var(--el-text-color-primary));
}
</style>
