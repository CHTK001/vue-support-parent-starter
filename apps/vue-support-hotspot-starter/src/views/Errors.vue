<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">错误排行</span>
        <span class="match-hint" v-if="!loading">{{ items.length }} 种错误 · 5s 自动刷新</span>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text size="small" round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && items.length">
      <ReStatCard
        title="总错误数"
        :value="totalErrors.toLocaleString()"
        :desc="`所有错误类型累计`"
        :icon="Warning"
        icon-color="#ef4444"
      />
      <ReStatCard
        title="错误类型数"
        :value="items.length"
        :desc="`不同错误类型`"
        :icon="Document"
        icon-color="#3b82f6"
      />
      <ReStatCard
        title="最频繁错误"
        :value="topErrorType"
        :desc="topErrorCount ? `${topErrorCount} 次` : '—'"
        :icon="Timer"
        icon-color="#8b5cf6"
      />
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />

    <div class="table-panel" v-if="!loading || items.length">
      <ReTable
        :data="items as unknown as Record<string, unknown>[]"
        :columns="tableColumns"
        :loading="loading"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 300 }"
        empty-text="暂无错误数据"
      >
        <template #col-errorType="{ row }">
          <ReTag type="danger" size="small" round>{{ row.errorType }}</ReTag>
        </template>
        <template #col-errorMessage="{ row }">
          <span class="msg-text">{{ truncateMsg(row.errorMessage) }}</span>
        </template>
        <template #col-callCount="{ row }">
          <span class="mono">{{ row.callCount.toLocaleString() }}</span>
        </template>
        <template #col-avgDurationMs="{ row }">
          <span class="mono muted">{{ ((row.avgDurationMs ?? 0)).toFixed(1) }} ms</span>
        </template>
        <template #col-lastOccurrence="{ row }">
          <span class="mono muted">{{ row.lastOccurrence }}</span>
        </template>
      </ReTable>
    </div>

    <div class="table-panel" v-if="slowCalls.length">
      <div class="sub-title">慢调用 Top N</div>
      <ReTable
        :data="slowCalls as unknown as Record<string, unknown>[]"
        :columns="slowColumns"
        :loading="loading"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 160 }"
        empty-text="暂无慢调用"
      >
        <template #col-traceId="{ row }">
          <span class="mono muted">{{ truncateTraceId(row.traceId) }}</span>
        </template>
        <template #col-route="{ row }">
          <span class="mono route-text">{{ row.source }} → {{ row.target }}</span>
        </template>
        <template #col-operation="{ row }">
          <span class="mono muted">{{ row.operation }}</span>
        </template>
        <template #col-durationMs="{ row }">
          <span class="mono" :class="{ 'warn-text': row.durationMs > 2000 }">{{ row.durationMs }} ms</span>
        </template>
      </ReTable>
    </div>

    <div class="table-panel" v-if="!loading && !items.length && !slowCalls.length">
      <ReEmpty description="暂无错误数据，系统健康" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Warning, Timer, Document } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import ReEmpty from "@repo/ui/re-empty";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getErrorRanking, getSlowCalls } from "../api/apmApi";
import type { ErrorRanking, SlowCall } from "../api/apmApi";

const items = ref<ErrorRanking[]>([]);
const slowCalls = ref<SlowCall[]>([]);
const loading = ref(false);
let timer: number | undefined;

const totalErrors = computed(() => items.value.reduce((acc, e) => acc + e.callCount, 0));
const topErrorType = computed(() => {
  if (!items.value.length) return "—";
  const sorted = [...items.value].sort((a, b) => b.callCount - a.callCount);
  return sorted[0].errorType;
});
const topErrorCount = computed(() => {
  if (!items.value.length) return 0;
  const sorted = [...items.value].sort((a, b) => b.callCount - a.callCount);
  return sorted[0].callCount;
});

function truncateMsg(msg: string): string {
  if (!msg) return "—";
  return msg.length > 80 ? msg.slice(0, 80) + "…" : msg;
}

function truncateTraceId(id: string): string {
  if (!id) return "";
  return id.length > 16 ? id.slice(0, 16) + "…" : id;
}

const tableColumns: ReTableColumn[] = [
  { prop: "errorType", label: "错误类型", width: 140, slot: "errorType" },
  { prop: "errorMessage", label: "错误消息", minWidth: 280, slot: "errorMessage" },
  { prop: "callCount", label: "次数", width: 90, align: "right", slot: "callCount", sortable: true },
  { prop: "avgDurationMs", label: "平均耗时", width: 110, align: "right", slot: "avgDurationMs" },
  { prop: "lastOccurrence", label: "最后出现", width: 180, slot: "lastOccurrence" },
];

const slowColumns: ReTableColumn[] = [
  { prop: "traceId", label: "Trace ID", width: 160, slot: "traceId" },
  { prop: "route", label: "Source → Target", minWidth: 200, slot: "route" },
  { prop: "operation", label: "Operation", minWidth: 160, slot: "operation" },
  { prop: "durationMs", label: "耗时", width: 100, align: "right", slot: "durationMs" },
];

async function load() {
  loading.value = true;
  try {
    const [errors, slow] = await Promise.all([getErrorRanking(20), getSlowCalls(10)]);
    items.value = errors;
    slowCalls.value = slow;
  } catch {
    ElMessage.error("加载错误排行失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  timer = window.setInterval(load, 5000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
}

.match-hint {
  font-size: 12px;
  color: var(--apm-muted);
  white-space: nowrap;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.stat-row :deep(.re-stat-card) {
  background: var(--apm-panel, #131a2b);
  border: 1px solid var(--apm-border, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
}

.stat-row :deep(.re-stat-card .re-stat-card__title) {
  color: var(--apm-muted, rgba(230, 237, 247, 0.55));
}

.stat-row :deep(.re-stat-card .re-stat-card__value) {
  color: var(--apm-fg, #e6edf7);
  font-variant-numeric: tabular-nums;
}

.stat-row :deep(.re-stat-card .re-stat-card__desc) {
  color: var(--apm-muted, rgba(230, 237, 247, 0.55));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 8px;
}

.table-panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
}

.sub-title {
  font-size: 13px;
  font-weight: 600;
  padding: 8px 8px 4px;
  color: var(--apm-fg, #e6edf7);
}

.route-text {
  color: var(--apm-fg);
}

.msg-text {
  color: var(--apm-fg);
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

.muted {
  color: var(--apm-muted);
}

.err-text {
  color: var(--apm-danger);
}

.warn-text {
  color: var(--apm-warning);
}

@media (max-width: 1100px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stat-row {
    grid-template-columns: 1fr;
  }
}
</style>
