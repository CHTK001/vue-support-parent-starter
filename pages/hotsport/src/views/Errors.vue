<template>
  <div class="view">
    <!-- 操作条：无标题大卡，实时推送驱动 -->
    <div class="view-bar">
      <span class="match-hint" v-if="!loading">{{ items.length }} 种错误 · 实时推送</span>
      <div class="view-bar__actions">
        <ReButton icon="Refresh" show-text round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-field keyword-field">
        <label class="filter-label" for="err-kw">关键词</label>
        <el-input
          id="err-kw"
          v-model="keyword"
          placeholder="按错误类型或消息过滤"
          clearable
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
      <div class="filter-actions">
        <span class="match-hint">匹配 {{ filteredItems.length }} / {{ items.length }} 种</span>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && items.length">
      <ReStatCard
        size="compact"
        title="总错误数"
        :value="totalErrors.toLocaleString()"
        :desc="`所有错误类型累计`"
        :icon="Warning"
        icon-color="var(--apm-danger)"
      />
      <ReStatCard
        size="compact"
        title="错误类型数"
        :value="items.length"
        :desc="`不同错误类型`"
        :icon="Document"
        icon-color="var(--apm-accent)"
      />
      <ReStatCard
        size="compact"
        title="最频繁错误"
        :value="topErrorType"
        :desc="topErrorCount ? `${topErrorCount} 次` : '—'"
        :icon="Timer"
        icon-color="var(--apm-accent-alt)"
      />
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />

    <div class="table-panel" v-if="!loading || items.length">
      <ReTable
        :data="filteredItems as unknown as Record<string, unknown>[]"
        :columns="tableColumns"
        :loading="loading"
        engine="element"
        :layout-table="{ minHeight: 300 }"
        :settings="{ border: false }"
        empty-text="没有符合关键词的错误"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <template #col-errorType="{ row }">
          <ReTag type="danger" round>{{ row.errorType }}</ReTag>
        </template>
        <template #col-errorMessage="{ row }">
          <span class="msg-text">{{ truncateMsg(row.errorMessage) }}</span>
        </template>
        <template #col-share="{ row }">
          <div class="share-cell">
            <span class="share-bar"><i :style="{ width: shareOf(row.callCount) }" /></span>
            <span class="share-num">{{ shareOf(row.callCount) }}</span>
          </div>
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
        engine="element"
        :layout-table="{ minHeight: 160 }"
        :settings="{ border: false }"
        empty-text="暂无慢调用"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
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
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import { Warning, Timer, Document, Search } from "@element-plus/icons-vue";

import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import ReEmpty from "@repo/ui/re-empty";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getErrorRanking, getSlowCalls, getSlowSql } from "../api/apmApi";
import type { ErrorRanking, SlowCall, SlowSqlItem } from "../api/apmApi";
import { useRealtimeEvent, useStatsChanged } from "../composables/useRealtime";

const items = ref<ErrorRanking[]>([]);
const slowCalls = ref<SlowCall[]>([]);
const slowSqlItems = ref<SlowSqlItem[]>([]);
const loading = ref(false);
const keyword = ref("");

/** 关键词过滤（错误类型 / 消息），纯前端筛选，不额外打接口 */
const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return items.value;
  return items.value.filter(
    (e) =>
      String(e.errorType ?? "").toLowerCase().includes(kw) ||
      String(e.errorMessage ?? "").toLowerCase().includes(kw),
  );
});

/** 该类错误占总错误数的比例（占比列的宽度与文案共用同一计算） */
function shareOf(count: number): string {
  const total = totalErrors.value;
  if (!total) return "0%";
  const pct = (count / total) * 100;
  return `${pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

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
  { prop: "share", label: "占比", width: 130, align: "right", slot: "share" },
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
    message.error("加载错误排行失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});

// 实时推送驱动（整站共用一条 WS/SSE），不再 setInterval 轮询
useStatsChanged(["errorCount"], () => {
  if (!loading.value) load();
});
</script>

<style scoped>
/* 骨架与 .filter-bar/.filter-field 由 styles/layout.css 提供 */

.table-panel {
  overflow: hidden;
}

.keyword-field {
  width: 300px;
}

.sub-title {
  font-size: 13px;
  font-weight: 600;
  padding: var(--apm-space-2) var(--apm-space-2) 4px;
  color: var(--text-primary, var(--apm-fg));
}

.route-text,
.msg-text {
  color: var(--text-secondary, var(--apm-fg-regular));
}

/* 占比条：一眼看出哪类错误占大头 */
.share-cell {
  display: flex;
  align-items: center;
  gap: var(--apm-space-2);
  justify-content: flex-end;
}

.share-bar {
  position: relative;
  width: 54px;
  height: 4px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--border-subtle, var(--apm-border-soft));
  overflow: hidden;
}

.share-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: var(--status-error, var(--apm-danger));
}

.share-num {
  font-family: var(--apm-font-mono);
  font-size: 12px;
  color: var(--text-tertiary, var(--apm-muted));
  font-variant-numeric: tabular-nums;
  min-width: 44px;
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
