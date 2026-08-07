<script setup lang="ts">
/**
 * 签到日历网格组件
 */
import ReCard from "@repo/ui/re-card";
import type { SignInDay } from "../api/types";

const props = defineProps<{
  days: (SignInDay | null)[];
  currentMonth: string;
  signed: boolean;
}>();

const daysLabels = ["一", "二", "三", "四", "五", "六", "日"];
</script>

<template>
  <ReCard :radius="16" :padding="0" class="overflow-hidden border border-slate-200/60 bg-white/90 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-800/90 lg:col-span-2">
    <div class="flex items-center justify-between border-b border-slate-200/60 px-6 py-4 dark:border-slate-700/60">
      <span class="font-semibold text-slate-700 dark:text-slate-200">{{ currentMonth }}</span>
      <el-tag v-if="signed" type="success" effect="dark" class="!rounded-full">Signed Today</el-tag>
      <el-tag v-else type="warning" effect="plain" class="!rounded-full">Not Signed</el-tag>
    </div>
    <div class="p-6">
      <div class="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-slate-400 dark:text-slate-500">
        <div v-for="d in daysLabels" :key="d" class="py-1 font-medium">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <template v-for="(cell, idx) in days" :key="idx">
          <div
            v-if="cell"
            class="flex h-14 items-center justify-center rounded-lg border border-solid transition-all duration-200"
            :class="cell.signed
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/30'
              : 'border-slate-200 dark:border-slate-600'"
          >
            <div class="text-center">
              <div class="flex items-center gap-1">
                <span
                  class="text-sm"
                  :class="cell.signed
                    ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300'"
                >
                  {{ cell.date.slice(8) }}
                </span>
                <span v-if="cell.signed" class="text-emerald-500 dark:text-emerald-400">✓</span>
              </div>
            </div>
          </div>
          <div v-else class="h-14" />
        </template>
      </div>
    </div>
  </ReCard>
</template>