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
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8">
        <h1 class="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-3xl font-bold text-transparent dark:from-amber-400 dark:to-orange-400">
          Sign-in Summary
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">User-wise sign-in days and points overview</p>
      </div>

      <ReCard :radius="16" :padding="0" class="overflow-hidden border border-slate-200/60 bg-white/90 backdrop-blur-lg shadow-xl dark:border-slate-700/60 dark:bg-slate-800/90">
        <ReTable
          table-id="signin-summary"
          :loader="loadSummary"
          :columns="columns"
          :pagination="true"
          row-key="userId"
          class="p-6"
        >
          <template #signInDays="{ row }">
            <el-tag type="primary" effect="plain" class="!rounded-full">{{ row.signInDays }}</el-tag>
          </template>
          <template #totalPoints="{ row }">
            <el-tag type="warning" effect="plain" class="!rounded-full">{{ row.totalPoints }}</el-tag>
          </template>
        </ReTable>
      </ReCard>
    </div>
  </div>
</template>