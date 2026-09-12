<script setup lang="ts">
/**
 * 成就统计卡片组件
 */
import ReCard from "@repo/ui/re-card";

defineProps<{
  title: string;
  value: number;
  gradient: string;
  emoji: string;
  shadowClass: string;
}>();
</script>

<template>
  <ReCard
    hoverable
    :radius="16"
    :padding="20"
    class="group relative overflow-hidden border border-slate-200/60 bg-white/80 backdrop-blur-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-slate-700/60 dark:bg-slate-800/80"
  >
    <div
      class="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      :class="shadowClass"
    />
    <div class="relative flex items-center gap-4">
      <div
        class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
        :class="gradient"
      >
        <span>{{ emoji }}</span>
      </div>
      <div>
        <div class="text-2xl font-bold text-slate-800 dark:text-white">{{ value }}</div>
        <div class="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ title }}</div>
      </div>
    </div>
  </ReCard>
</template>