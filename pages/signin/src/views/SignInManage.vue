<script setup lang="ts">
/**
 * 管理员签到汇总页面
 */
import ReCard from "@repo/ui/re-card";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import { pageUserSummary } from "../api/signinApi";

const columns: ReTableColumn[] = [
  { prop: "userId", label: "User ID", minWidth: 120 },
  { prop: "signInDays", label: "Sign-in Days", width: 160, slot: "signInDays" },
  { prop: "totalPoints", label: "Total Points", minWidth: 160, slot: "totalPoints" },
];

async function loadSummary({ page, pageSize }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageUserSummary({ page, pageSize });
  const data = res?.data;
  return { total: data?.total ?? 0, data: data?.records ?? [] };
}
</script>

<template>
  <div class="signin-manage sc-page">
    <ReSectionHead
      class="page-head"
      title="Sign-in Summary"
      description="User-wise sign-in days and points overview"
    />

    <ReCard class="summary-card">
      <ReTable
        table-id="signin-summary"
        :loader="loadSummary"
        :columns="columns"
        :pagination="true"
        row-key="userId"
      >
        <template #signInDays="{ row }">
          <el-tag type="primary" effect="plain" class="metric-tag metric-tag--days">{{ row.signInDays }}</el-tag>
        </template>
        <template #totalPoints="{ row }">
          <el-tag type="warning" effect="plain" class="metric-tag metric-tag--points">{{ row.totalPoints }}</el-tag>
        </template>
      </ReTable>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.signin-manage {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.page-head {
  margin-bottom: 4px;
}

.summary-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 16px;
}

.metric-tag {
  border-radius: var(--radius-xl) !important;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.metric-tag--days {
  color: var(--brand-600);
  border-color: color-mix(in srgb, var(--brand-500) 30%, transparent);
  background: color-mix(in srgb, var(--brand-500) 8%, transparent);
}

.metric-tag--points {
  color: var(--status-warning);
  border-color: color-mix(in srgb, var(--status-warning) 30%, transparent);
  background: color-mix(in srgb, var(--status-warning) 8%, transparent);
}

@media (max-width: 768px) {
  .signin-manage {
    gap: 12px;
  }
  .summary-card {
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .signin-manage,
  .summary-card {
    transition: none;
    animation: none;
  }
}
</style>
