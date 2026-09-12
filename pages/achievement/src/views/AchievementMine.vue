<script setup lang="ts">
/**
 * 用户成就页面
 *
 * 展示成就统计概览、类型切换标签、段位时间线，并通过 Socket 实时接收成就解锁推送。
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import { useSocketService } from "@repo/core";
import { useUserStore } from "@repo/pinia";
import { getMyAchievements, getStats, getTierList } from "../api/achievementApi";
import ReAchievementStatCard from "../components/ReAchievementStatCard.vue";
import ReAchievementTypeTabs from "../components/ReAchievementTypeTabs.vue";
import ReAchievementTierItem from "../components/ReAchievementTierItem.vue";
import type { AchievementTier, UnlockedAchievement } from "../api/types";

const userStore = useUserStore();
const userId = computed(() => userStore.userInfo?.userId ?? userStore.userId);

const activeType = ref("");
const types = ref<string[]>([]);
const unlocked = ref<UnlockedAchievement[]>([]);
const allTiers = ref<AchievementTier[]>([]);
const stats = ref({ totalUnlocked: 0 });
const loading = ref(false);
const pageLoaded = ref(false);

const badgeMap: Record<string, { icon: string; color: string }> = {
  login: { icon: "🔑", color: "from-emerald-400 to-teal-500" },
  sign: { icon: "📅", color: "from-sky-400 to-blue-500" },
  message: { icon: "💬", color: "from-violet-400 to-purple-500" },
  menu: { icon: "📋", color: "from-orange-400 to-amber-500" },
  frame: { icon: "🖼️", color: "from-pink-400 to-rose-500" },
  rogue: { icon: "⚔️", color: "from-red-400 to-rose-600" },
};

const unlockedIds = computed(() => new Set(unlocked.value.map((u) => u.id!)));

function isUnlocked(tierId?: number) {
  return tierId ? unlockedIds.value.has(tierId) : false;
}

function findUnlocked(tierId?: number) {
  return unlocked.value.find((u) => u.id === tierId);
}

async function loadData() {
  if (!userId.value) return;
  loading.value = true;
  try {
    const [unlockedRes, statsRes] = await Promise.all([
      getMyAchievements(userId.value),
      getStats(userId.value),
    ]);
    unlocked.value = (unlockedRes?.data ?? []) as UnlockedAchievement[];
    stats.value = (statsRes?.data ?? {}) as { totalUnlocked: number };
    types.value = [...new Set(unlocked.value.map((u) => u.type!))];
    if (types.value.length > 0 && !activeType.value) activeType.value = types.value[0];
    if (activeType.value) await loadTiersForType(activeType.value);
    pageLoaded.value = true;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "Failed to load achievements");
  } finally {
    loading.value = false;
  }
}

async function loadTiersForType(type: string) {
  allTiers.value = [];
  loading.value = true;
  try {
    const res = await getTierList(type);
    allTiers.value = (res?.data ?? []) as AchievementTier[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "Failed to load tiers");
  } finally {
    loading.value = false;
  }
}

function switchType(type: string) {
  activeType.value = type;
  loadTiersForType(type);
}

let unsub: (() => void) | null = null;

function bindSocket() {
  const service = useSocketService();
  if (!service) return;
  unsub = service.subscribe("achievement", "unlock", (msg) => {
    const payload = msg.data as Record<string, unknown> | undefined;
    if (payload) {
      const list = payload.list as UnlockedAchievement[] | undefined;
      if (list && list.length > 0) {
        ElMessage.success(`Achievement unlocked: ${list[0]?.name ?? "Unknown"}`);
        loadData();
      }
    }
  });
}

onMounted(() => {
  if (userId.value) loadData();
  bindSocket();
});

onUnmounted(() => {
  unsub?.();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-6xl">
      <div class="mb-8">
        <h1 class="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent dark:from-violet-400 dark:to-indigo-400">
          My Achievements
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Track your progress and unlock new tiers</p>
      </div>

      <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReAchievementStatCard title="Unlocked" :value="stats.totalUnlocked ?? 0" gradient="from-violet-400 to-indigo-500" emoji="🏆" shadow-class="from-violet-500/10" />
        <ReAchievementStatCard title="Categories" :value="types.length" gradient="from-emerald-400 to-teal-500" emoji="📂" shadow-class="from-emerald-500/10" />
        <ReAchievementStatCard title="Badges" :value="unlocked.length" gradient="from-amber-400 to-orange-500" emoji="⭐" shadow-class="from-amber-500/10" />
        <ReAchievementStatCard title="Total Tiers" :value="allTiers.length" gradient="from-rose-400 to-pink-500" emoji="📊" shadow-class="from-rose-500/10" />
      </div>

      <ReCard :radius="16" :padding="0" class="overflow-hidden border border-slate-200/60 bg-white/90 backdrop-blur-lg shadow-xl dark:border-slate-700/60 dark:bg-slate-800/90">
        <div class="border-b border-slate-200/60 px-6 py-4 dark:border-slate-700/60">
          <ReAchievementTypeTabs :types="types" :active-type="activeType" :badge-map="badgeMap" @change="switchType" @select-default="activeType = types[0]" />
        </div>
        <div class="p-6">
          <div v-if="loading" class="space-y-6">
            <div v-for="i in 3" :key="i" class="flex items-center gap-4 animate-pulse">
              <div class="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div class="flex-1 space-y-2">
                <div class="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div class="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-600" />
              </div>
            </div>
          </div>
          <div v-else-if="activeType" class="relative space-y-6">
            <div class="absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-violet-300 via-indigo-300 to-transparent dark:from-violet-600 dark:via-indigo-600" />
            <ReAchievementTierItem
              v-for="tier in allTiers"
              :key="tier.id"
              :tier="tier"
              :unlocked="isUnlocked(tier.id)"
              :badge-icon="badgeMap[tier.type ?? '']?.icon ?? '🏆'"
              :unlocked-item="findUnlocked(tier.id)"
            />
          </div>
          <ReEmpty v-else description="No achievements yet. Complete actions to earn badges!" />
        </div>
      </ReCard>
    </div>
  </div>
</template>