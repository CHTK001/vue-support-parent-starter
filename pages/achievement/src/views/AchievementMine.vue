<script setup lang="ts">
/**
 * 用户成就页面
 *
 * 展示成就统计概览、类型切换标签、段位时间线，并通过 Socket 实时接收成就解锁推送。
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, ref } from "vue";

import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import {useSocketService, message} from "@repo/core";
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
    message.error((e as Error)?.message ?? "Failed to load achievements");
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
    message.error((e as Error)?.message ?? "Failed to load tiers");
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
        message.success(`Achievement unlocked: ${list[0]?.name ?? "Unknown"}`);
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
  <div class="achievement-page">
    <ReSectionHead
      class="achievement-head"
      title="My Achievements"
      description="Track your progress and unlock new tiers"
    />

    <!-- 成就统计概览：大数字 + 顶部色条，窄屏 2 列 -->
    <div class="stat-grid" role="group" aria-label="成就概览">
      <div class="stat-card" style="--accent: var(--brand-500)">
        <span class="stat-label">Unlocked</span>
        <span class="stat-value">{{ stats.totalUnlocked ?? 0 }}</span>
        <span class="stat-trend">成就已解锁</span>
      </div>
      <div class="stat-card" style="--accent: var(--metric-cpu)">
        <span class="stat-label">Categories</span>
        <span class="stat-value">{{ types.length }}</span>
        <span class="stat-trend">类型数</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-warning)">
        <span class="stat-label">Badges</span>
        <span class="stat-value">{{ unlocked.length }}</span>
        <span class="stat-trend">已获取徽章</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-info)">
        <span class="stat-label">Total Tiers</span>
        <span class="stat-value">{{ allTiers.length }}</span>
        <span class="stat-trend">当前段位</span>
      </div>
    </div>

    <!-- 类型切换 + 段位时间线卡片壳；子组件交互协议不变 -->
    <div class="achievement-card">
      <div class="achievement-tabs">
        <ReAchievementTypeTabs
          :types="types"
          :active-type="activeType"
          :badge-map="badgeMap"
          @change="switchType"
          @select-default="activeType = types[0]"
        />
      </div>
      <div class="achievement-body">
        <div v-if="loading" class="skeleton-list">
          <div v-for="i in 3" :key="i" class="skeleton-item">
            <div class="skeleton-avatar" />
            <div class="skeleton-lines">
              <div class="skeleton-line skeleton-line--lg" />
              <div class="skeleton-line" />
            </div>
          </div>
        </div>
        <div v-else-if="activeType" class="tier-timeline">
          <div class="tier-timeline__rail" />
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
    </div>
  </div>
</template>

<style scoped lang="scss">
.achievement-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
  background: var(--bg-page);
  min-height: 100%;
  box-sizing: border-box;
}

/* ===== 统计卡片 ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
  padding: 14px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.stat-trend {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 主卡片壳 ===== */
.achievement-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.achievement-tabs {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
}
.achievement-body {
  flex: 1 1 auto;
  padding: 16px;
  min-height: 0;
}

/* ===== 加载骨架：koi 背景填充 + 呼吸动效（尊重 reduced-motion） ===== */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.skeleton-item {
  display: flex;
  align-items: center;
  gap: 16px;
  animation: skeleton-pulse 1.5s var(--ease-out) infinite;
}
.skeleton-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--bg-fill);
}
.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skeleton-line {
  height: 12px;
  width: 66%;
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
}
.skeleton-line--lg {
  height: 16px;
  width: 33%;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== 段位时间线 ===== */
.tier-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tier-timeline__rail {
  position: absolute;
  left: 23px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--brand-500) 40%, transparent),
    color-mix(in srgb, var(--brand-500) 12%, transparent),
    transparent
  );
  border-radius: 9999px;
  pointer-events: none;
}

/* ===== 响应式：移动端 2 列概览 + 单列下方内容 ===== */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  .stat-card:hover {
    transform: none;
  }
  .skeleton-item {
    animation: none;
  }
}
</style>