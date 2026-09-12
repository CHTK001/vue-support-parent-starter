<script setup lang="ts">
/**
 * 成就类型切换标签组件
 */
defineProps<{
  types: string[];
  activeType: string;
  badgeMap: Record<string, { icon: string; color: string }>;
}>();

const emit = defineEmits<{
  (e: "change", type: string): void;
  (e: "select-default"): void;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="mr-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Type</span>
    <button
      v-for="t in types"
      :key="t"
      class="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300"
      :class="activeType === t
        ? 'bg-gradient-to-r ' + badgeMap[t].color + ' text-white shadow-lg'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'"
      @click="emit('change', t)"
    >
      <span>{{ badgeMap[t].icon }}</span>
      <span class="capitalize">{{ t }}</span>
    </button>
    <button
      v-if="!activeType && types.length > 0"
      class="ml-2 text-sm text-violet-500 transition-colors hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300"
      @click="emit('select-default')"
    >
      Select a type to view tiers →
    </button>
  </div>
</template>