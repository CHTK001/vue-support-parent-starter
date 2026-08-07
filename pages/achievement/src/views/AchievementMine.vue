<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Trophy, Medal, Star, Clock, Check, Lock } from "@element-plus/icons-vue";
import { useSocketService } from "@repo/core";
import { useUserStore } from "@repo/pinia";
import { getMyAchievements, getStats, getTierList, getUncompleted } from "../api/achievementApi";
import type { AchievementStats, AchievementTier, UnlockedAchievement } from "../api/types";

const userStore = useUserStore();
const userId = computed(() => userStore.userInfo?.userId ?? userStore.userId);

const activeType = ref<string>("");
const types = ref<string[]>([]);
const unlocked = ref<UnlockedAchievement[]>([]);
const allTiers = ref<AchievementTier[]>([]);
const uncompleted = ref<AchievementTier[]>([]);
const stats = ref<AchievementStats>({});
const loading = ref(false);

const badgeIcon = (type: string) => {
  const map: Record<string, string> = { login: "🔑", sign: "📅", message: "💬", menu: "📋", frame: "🖼️", rogue: "⚔️" };
  return map[type] ?? "🏆";
};

const unlockedIds = computed(() => new Set(unlocked.value.map((u) => u.id!)));

function isUnlocked(tierId?: number): boolean {
  return tierId ? unlockedIds.value.has(tierId) : false;
}

function findUnlocked(tierId?: number): UnlockedAchievement | undefined {
  return unlocked.value.find((u) => u.id === tierId);
}

async function loadData() {
  if (!userId.value) return;
  loading.value = true;
  try {
    const [unlockedRes, statsRes, tiersRes] = await Promise.all([
      getMyAchievements(userId.value),
      getStats(userId.value),
      getTierList(activeType.value || "login"),
    ]);
    unlocked.value = (unlockedRes?.data ?? []) as UnlockedAchievement[];
    stats.value = (statsRes?.data ?? {}) as AchievementStats;
    allTiers.value = (tiersRes?.data ?? []) as AchievementTier[];
    types.value = [...new Set(unlocked.value.map((u) => u.type!))];
    if (activeType.value && !types.value.includes(activeType.value)) {
      types.value.push(activeType.value);
    }
    if (activeType.value) {
      await loadUncompleted();
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "Failed to load achievements");
  } finally {
    loading.value = false;
  }
}

async function loadUncompleted() {
  if (!userId.value || !activeType.value) return;
  try {
    const res = await getUncompleted(userId.value, activeType.value);
    uncompleted.value = (res?.data ?? []) as AchievementTier[];
  } catch {
    // non-critical
  }
}

async function switchType(type: string) {
  activeType.value = type;
  loading.value = true;
  try {
    const [tiersRes, uncompletedRes] = await Promise.all([
      getTierList(type),
      getUncompleted(userId.value, type),
    ]);
    allTiers.value = (tiersRes?.data ?? []) as AchievementTier[];
    uncompleted.value = (uncompletedRes?.data ?? []) as AchievementTier[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "Failed to load tiers");
  } finally {
    loading.value = false;
  }
}

/* Socket push for real-time unlock */
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
  if (userId.value) {
    loadData();
  }
  bindSocket();
});

onUnmounted(() => {
  unsub?.();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
        My Achievements
      </h2>
      <p class="mt-1 text-sm text-[--el-text-color-secondary]">
        Track your progress and unlock new tiers
      </p>
    </div>

    <!-- Stats overview -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-primary)"><Trophy /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ stats.totalUnlocked ?? 0 }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Unlocked</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-success)"><Medal /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ types.length }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Categories</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-warning)"><Star /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ unlocked.length }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Badges</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-info)"><Clock /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ allTiers.length }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Total Tiers</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Type tabs -->
    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <template #header>
        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-2 text-sm font-medium">Type:</span>
          <el-radio-group v-model="activeType" @change="switchType">
            <el-radio-button v-for="t in types" :key="t" :value="t">
              {{ badgeIcon(t) }} {{ t.charAt(0).toUpperCase() + t.slice(1) }}
            </el-radio-button>
          </el-radio-group>
          <el-button v-if="!activeType" text class="ml-2" @click="activeType = types[0]">
            Select a type to view tiers
          </el-button>
        </div>
      </template>

      <el-timeline v-if="activeType" v-loading="loading">
        <el-timeline-item
          v-for="tier in allTiers"
          :key="tier.id"
          :timestamp="`Level ${tier.level}`"
          :placement="tier.level % 2 === 0 ? 'left' : 'right'"
          :color="isUnlocked(tier.id) ? 'var(--el-color-success)' : 'var(--el-color-info)'"
          :hollow="!isUnlocked(tier.id)"
        >
          <el-card
            :shadow="isUnlocked(tier.id) ? 'always' : 'never'"
            class="rounded-lg"
            :class="isUnlocked(tier.id) ? 'border-l-4 border-l-[--el-color-success]' : 'opacity-60'"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[--el-color-warning-light-9] text-xl">
                {{ badgeIcon(tier.type ?? "") }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{{ tier.name }}</span>
                  <el-tag v-if="isUnlocked(tier.id)" type="success" size="small" effect="dark">
                    <el-icon class="mr-1"><Check /></el-icon>Unlocked
                  </el-tag>
                  <el-tag v-else type="info" size="small" effect="plain">
                    <el-icon class="mr-1"><Lock /></el-icon>Locked
                  </el-tag>
                </div>
                <p class="mt-1 text-sm text-[--el-text-color-secondary]">
                  {{ tier.description }}
                </p>
                <p v-if="tier.rule" class="mt-1 text-xs text-[--el-text-color-placeholder]">
                  Rule: {{ tier.rule }}
                </p>
                <p v-if="isUnlocked(tier.id) && findUnlocked(tier.id)?.unlockedAt" class="mt-1 text-xs text-[--el-color-success]">
                  Unlocked at: {{ findUnlocked(tier.id)?.unlockedAt }}
                </p>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else-if="types.length === 0" description="No achievements yet. Complete actions to earn badges!" />
    </el-card>
  </div>
</template>