<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">服务列表</span>
        <span class="match-hint" v-if="!loading">共 {{ items.length }} 个服务 · 5s 自动刷新</span>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text round :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <div class="stat-row" v-if="!loading && items.length">
      <ReStatCard
        size="compact"
        title="总服务数"
        :value="items.length"
        :desc="`活跃服务`"
        :icon="Connection"
        icon-color="#3b82f6"
      />
      <ReStatCard
        size="compact"
        title="总调用量"
        :value="totalCalls.toLocaleString()"
        :desc="`所有服务调用总和`"
        :icon="Histogram"
        icon-color="#8b5cf6"
      />
      <ReStatCard
        size="compact"
        title="错误服务数"
        :value="errorServices.length"
        :desc="errorServices.length ? errorServices.join(' · ') : '全部健康'"
        :icon="Warning"
        :icon-color="errorServices.length ? '#ef4444' : '#22c55e'"
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
        empty-text="暂无服务数据"
        class="drill-table"
        @row-click="onRowClick"
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
        <template #col-errorCount="{ row }">
          <ReTag v-if="row.errorCount > 0" type="danger" round>
            {{ row.errorCount }}
          </ReTag>
          <span v-else class="muted mono">0</span>
        </template>
        <template #col-errorRate="{ row }">
          <span :class="{ 'err-text': calcErrorRate(row) > 5, 'warn-text': calcErrorRate(row) > 1 && calcErrorRate(row) <= 5 }">
            {{ calcErrorRate(row) }} %
          </span>
        </template>
      </ReTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Connection, Histogram, Warning } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
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
let timer: number | undefined;
const router = useRouter();

/** 行下钻 → 服务详情页 */
function onRowClick(row: Record<string, unknown>) {
  router.push({ path: "/services/detail", query: { service: String(row.service ?? "") } });
}

const totalCalls = computed(() => items.value.reduce((acc, s) => acc + s.callCount, 0));
const errorServices = computed(() => items.value.filter((s) => s.errorCount > 0).map((s) => s.service));

/** 计算错误率（%） */
function calcErrorRate(row: Record<string, unknown>): number {
  const r = row as unknown as ApmService;
  if (!r.callCount) return 0;
  return Math.round((r.errorCount / r.callCount) * 10000) / 100;
}

/** 加载时富化 errorRate 字段，支持排序 */
async function load() {
  loading.value = true;
  try {
    const svc = (await getServices()) || [];
    items.value = svc.map((s) => ({
      ...s,
      errorRate: s.callCount > 0 ? Math.round((s.errorCount / s.callCount) * 10000) / 100 : 0,
    }));
  } catch {
    ElMessage.error("加载服务列表失败");
  } finally {
    loading.value = false;
  }
}

const tableColumns: ReTableColumn[] = [
  { prop: "service", label: "服务名", minWidth: 220, slot: "service" },
  { prop: "endpointCount", label: "端点数", width: 100, align: "center", slot: "endpointCount", sortable: true },
  { prop: "callCount", label: "调用次数", width: 110, align: "right", slot: "callCount", sortable: true },
  { prop: "errorCount", label: "错误数", width: 90, align: "center", slot: "errorCount", sortable: true },
  { prop: "errorRate", label: "错误率 %", width: 100, align: "center", slot: "errorRate", sortable: true },
];

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
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px，取最近档 lg */
}

.stat-row :deep(.re-stat-card .re-stat-card__title) {
  color: var(--apm-muted);
}

.stat-row :deep(.re-stat-card .re-stat-card__value) {
  color: var(--apm-fg);
  font-variant-numeric: tabular-nums;
}

.stat-row :deep(.re-stat-card .re-stat-card__desc) {
  color: var(--apm-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: var(--el-radius-lg, 12px); /* 原 14px */
  padding: 8px;
}

.table-panel :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  --el-table-border-color: var(--apm-border);
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  --el-table-text-color: var(--apm-fg);
  --el-table-header-text-color: var(--apm-muted);
  /* 整表可点下钻到服务详情，故整表用手型光标 */
  cursor: pointer;
}

.service-text {
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

/* 尊重系统「减少动态效果」偏好：
   本页自身无 transition/animation，需关掉的是骨架屏与 loading 的旋转动画 */
@media (prefers-reduced-motion: reduce) {
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
