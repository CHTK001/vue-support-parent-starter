<template>
  <div class="view">
    <!-- 操作条：无标题大卡，实时推送驱动 -->
    <div class="view-bar">
      <span class="match-hint" v-if="!loading">
        共 {{ items.length }} 个服务 · 点行下钻详情 · 实时推送
      </span>
      <div class="view-bar__actions">
        <ReButton icon="Refresh" show-text round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && items.length">
      <ReStatCard
        size="compact"
        title="总服务数"
        :value="items.length"
        desc="活跃服务"
        :icon="Connection"
        icon-color="var(--apm-accent)"
      />
      <ReStatCard
        size="compact"
        title="总调用量"
        :value="totalCalls.toLocaleString()"
        desc="所有服务调用总和"
        :icon="Histogram"
        icon-color="var(--apm-accent-alt)"
      />
      <ReStatCard
        size="compact"
        title="错误服务数"
        :value="errorServices.length"
        :desc="errorServices.length ? errorServices.join(' · ') : '全部健康'"
        :icon="Warning"
        :icon-color="errorServices.length ? 'var(--apm-danger)' : 'var(--apm-success)'"
      />
      <ReStatCard
        size="compact"
        title="整体错误率"
        :value="`${overallErrorRate} %`"
        :desc="overallErrorRate > 5 ? '高于 5% 警戒线' : '处于健康区间'"
        :icon="Odometer"
        :icon-color="overallErrorRate > 5 ? 'var(--apm-danger)' : 'var(--apm-success)'"
      />
    </div>

    <div class="filter-bar">
      <div class="filter-field keyword-field">
        <label class="filter-label" for="svc-kw">服务名</label>
        <el-input id="svc-kw" v-model="keyword" placeholder="按服务名过滤" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
      <div class="filter-field">
        <label class="filter-label">仅看异常</label>
        <el-checkbox v-model="errorOnly">有错误的服务</el-checkbox>
      </div>
      <div class="filter-actions">
        <span class="match-hint">匹配 {{ filteredItems.length }} / {{ items.length }}</span>
      </div>
    </div>

    <ReSkeleton v-if="loading && !items.length" :rows="8" animated />

    <div class="table-panel" v-if="!loading || items.length" v-loading="loading">
      <ReTable
        :data="filteredItems as unknown as Record<string, unknown>[]"
        :columns="tableColumns"
        :loading="loading"
        engine="element"
        :layout-table="{ minHeight: 300 }"
        :settings="{ border: false }"
        empty-text="没有符合条件的服务"
        class="drill-table"
        @row-click="onRowClick"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <template #col-service="{ row }">
          <span class="mono service-text">{{ row.service }}</span>
        </template>
        <template #col-endpointCount="{ row }">
          <span class="mono muted">{{ row.endpointCount }}</span>
        </template>
        <template #col-callCount="{ row }">
          <span class="mono">{{ row.callCount.toLocaleString() }}</span>
        </template>
        <template #col-avgMs="{ row }">
          <span class="mono">{{ fmtMs(row.avgMs) }}</span>
        </template>
        <template #col-p95Ms="{ row }">
          <span class="mono" :class="latencyClass(row.p95Ms)">{{ fmtMs(row.p95Ms) }}</span>
        </template>
        <template #col-p99Ms="{ row }">
          <span class="mono" :class="latencyClass(row.p99Ms)">{{ fmtMs(row.p99Ms) }}</span>
        </template>
        <template #col-errorCount="{ row }">
          <ReTag v-if="row.errorCount > 0" type="danger" round>
            {{ row.errorCount }}
          </ReTag>
          <span v-else class="muted mono">0</span>
        </template>
        <template #col-errorRate="{ row }">
          <div class="rate-cell">
            <span class="rate-bar">
              <i
                :class="rateClass(calcErrorRate(row))"
                :style="{ width: Math.min(100, Math.max(2, calcErrorRate(row) * 4)) + '%' }"
              />
            </span>
            <span class="mono" :class="rateClass(calcErrorRate(row))">
              {{ calcErrorRate(row) }} %
            </span>
          </div>
        </template>
      </ReTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ROUTE_PREFIX } from "../config";
import { useRealtimeEvent, useStatsChanged } from "../composables/useRealtime";
import {
  Connection,
  Histogram,
  Odometer,
  Search,
  Warning,
} from "@element-plus/icons-vue";

import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import { getServices } from "../api/apmApi";
import type { ApmService } from "../api/apmApi";

const items = ref<ApmService[]>([]);
const loading = ref(false);
const keyword = ref("");
const errorOnly = ref(false);
const router = useRouter();

/** 行下钻 → 服务详情页 */
function onRowClick(row: Record<string, unknown>) {
  router.push({ path: ROUTE_PREFIX + "/services/detail", query: { service: String(row.service ?? "") } });
}

const totalCalls = computed(() => items.value.reduce((acc, s) => acc + s.callCount, 0));
const errorServices = computed(() =>
  items.value.filter((s) => s.errorCount > 0).map((s) => s.service),
);

/** 整体错误率：总错误 / 总调用，作为全局健康度指标 */
const overallErrorRate = computed(() => {
  const total = totalCalls.value;
  if (!total) return 0;
  const errs = items.value.reduce((acc, s) => acc + s.errorCount, 0);
  return Math.round((errs / total) * 10000) / 100;
});

/** 前端过滤：服务名关键词 + 仅看异常 */
const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return items.value.filter((s) => {
    if (kw && !s.service.toLowerCase().includes(kw)) return false;
    if (errorOnly.value && s.errorCount <= 0) return false;
    return true;
  });
});

/** 计算错误率（%） */
function calcErrorRate(row: Record<string, unknown>): number {
  const r = row as unknown as ApmService;
  if (!r.callCount) return 0;
  return Math.round((r.errorCount / r.callCount) * 10000) / 100;
}

/** 错误率三档：阈值与 Errors 页口径一致 */
function rateClass(rate: number): string {
  if (rate > 5) return "danger";
  if (rate > 1) return "warning";
  return "ok";
}

async function load() {
  loading.value = true;
  try {
    const svc = (await getServices()) || [];
    items.value = svc.map((s) => ({
      ...s,
      errorRate: s.callCount > 0 ? Math.round((s.errorCount / s.callCount) * 10000) / 100 : 0,
    }));
  } catch {
    message.error("加载服务列表失败");
  } finally {
    loading.value = false;
  }
}

const tableColumns: ReTableColumn[] = [
  { prop: "service", label: "服务名", minWidth: 220, slot: "service" },
  { prop: "endpointCount", label: "端点数", width: 100, align: "center", slot: "endpointCount", sortable: true },
  { prop: "callCount", label: "调用次数", width: 110, align: "right", slot: "callCount", sortable: true },
  { prop: "avgMs", label: "平均 ms", width: 100, align: "right", slot: "avgMs", sortable: true },
  { prop: "p95Ms", label: "P95 ms", width: 100, align: "right", slot: "p95Ms", sortable: true },
  { prop: "p99Ms", label: "P99 ms", width: 100, align: "right", slot: "p99Ms", sortable: true },
  { prop: "errorCount", label: "错误数", width: 90, align: "center", slot: "errorCount", sortable: true },
  { prop: "errorRate", label: "错误率", width: 150, align: "right", slot: "errorRate", sortable: true },
];

/** 毫秒格式化：>=1000 显示秒，否则整数毫秒 */
function fmtMs(v: unknown): string {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${Math.round(n)}ms`;
}

/** 延迟分档：与 Dependencies 页 P95 阈值同口径 */
function latencyClass(v: unknown): string {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "muted";
  if (n >= 1000) return "err-text";
  if (n >= 300) return "warn-text";
  return "";
}

onMounted(() => {
  load();
});

// 实时推送：整站共用一条 WS/SSE，收到 stats 事件即静默刷新，不再各自 setInterval 轮询
useStatsChanged(["transmissionCount"], () => {
  if (!loading.value) load();
});
</script>

<style scoped>
/* 骨架与 .filter-bar/.filter-field 由 styles/layout.css 提供 */

.keyword-field {
  width: 280px;
}

.table-panel {
  overflow: hidden;
}

.drill-table :deep(.el-table__row) {
  cursor: pointer;
}

.service-text {
  color: var(--text-primary, var(--apm-fg));
  font-weight: 500;
}

/* 错误率：数值 + 迷你占比条 */
.rate-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--apm-space-2);
}

.rate-bar {
  position: relative;
  width: 56px;
  height: 4px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--border-subtle, var(--apm-border-soft));
  overflow: hidden;
}

.rate-bar > i {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  transition: width var(--transition-base, var(--apm-t-base));
}

.rate-bar > i.ok {
  background: var(--status-success, var(--apm-success));
}
.rate-bar > i.warning {
  background: var(--status-warning, var(--apm-warning));
}
.rate-bar > i.danger {
  background: var(--status-error, var(--apm-danger));
}

.ok {
  color: var(--text-secondary, var(--apm-fg-regular));
}
.warning {
  color: var(--status-warning, var(--apm-warning));
}
.danger {
  color: var(--status-error, var(--apm-danger));
}

@media (prefers-reduced-motion: reduce) {
  .rate-bar > i {
    transition: none;
  }
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
