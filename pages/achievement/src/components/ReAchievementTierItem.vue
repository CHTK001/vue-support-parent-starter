<script setup lang="ts">
/**
 * 成就段位卡片组件
 */
import ReCard from "@repo/ui/re-card";
import ReTag from "@repo/ui/re-tag";
import type { AchievementTier, UnlockedAchievement } from "../api/types";

defineProps<{
  tier: AchievementTier;
  unlocked: boolean;
  badgeIcon: string;
  unlockedItem?: UnlockedAchievement;
}>();
</script>

<template>
  <div
    class="group relative flex gap-6 transition-all duration-300"
    :class="unlocked ? 'opacity-100' : 'opacity-60 hover:opacity-80'"
  >
    <div class="relative z-10 flex-shrink-0">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl text-lg shadow-lg transition-all duration-300 group-hover:scale-110"
        :class="unlocked
          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200/50 dark:shadow-emerald-900/30'
          : 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'"
      >
        <span v-if="unlocked" class="text-xl text-white">✓</span>
        <span v-else class="text-sm font-bold text-white">{{ tier.level }}</span>
      </div>
    </div>
    <ReCard
      :radius="12"
      :padding="20"
      class="flex-1 border border-slate-200/60 bg-white/50 transition-all duration-300 group-hover:shadow-lg group-hover:border-slate-300/60 dark:border-slate-700/60 dark:bg-slate-800/50 dark:group-hover:border-slate-600/60"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ badgeIcon }}</span>
            <div>
              <h3 class="font-semibold text-slate-800 dark:text-white">{{ tier.name }}</h3>
              <span class="text-xs font-medium text-slate-400 dark:text-slate-500">Level {{ tier.level }}</span>
            </div>
          </div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ tier.description }}</p>
          <div
            v-if="tier.rule"
            class="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 dark:bg-slate-700/50"
          >
            <span class="font-mono text-xs text-slate-500 dark:text-slate-400">{{ tier.rule }}</span>
          </div>
        </div>
        <div class="flex-shrink-0">
          <ReTag
            v-if="unlocked"
            type="success"

            effect="dark"
            class="!rounded-full"
          >
            ✓ Unlocked
          </ReTag>
          <ReTag
            v-else
            type="info"

            class="!rounded-full"
          >
            🔒 Locked
          </ReTag>
        </div>
      </div>
      <div
        v-if="unlocked && unlockedItem?.unlockedAt"
        class="mt-3 flex items-center gap-1 text-xs text-emerald-500 dark:text-emerald-400"
      >
        <span>Unlocked at {{ unlockedItem.unlockedAt }}</span>
      </div>
    </ReCard>
  </div>
</template>