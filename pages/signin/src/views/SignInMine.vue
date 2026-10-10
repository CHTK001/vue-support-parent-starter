<script setup lang="ts">
/**
 * 用户签到页面
 */
import { computed, onMounted, onUnmounted, ref } from "vue";

import {useSocketService, message} from "@repo/core";
import { useUserStore } from "@repo/pinia";
import { checkToday, doSignIn, getCalendar, getStats } from "../api/signinApi";
import ReSignInStatCard from "../components/ReSignInStatCard.vue";
import ReSignInCalendar from "../components/ReSignInCalendar.vue";
import ReSignInActionCard from "../components/ReSignInActionCard.vue";
import type { SignInDay, SignInResult, SignInStats } from "../api/types";

const userStore = useUserStore();
const userId = computed(() => userStore.userInfo?.userId ?? userStore.userId);

const stats = ref<SignInStats>({});
const signing = ref(false);
const signed = ref(false);
const calendarDays = ref<(SignInDay | null)[]>([]);
const currentMonth = ref("");

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function buildCalendar(days: SignInDay[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  currentMonth.value = `${year}-${pad(month + 1)}`;
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;
  const signedMap = new Map<string, boolean>();
  days.forEach((d) => signedMap.set(d.date, d.signed));

  const cells: (SignInDay | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    cells.push({ date: dateStr, signed: !!signedMap.get(dateStr), points: 0 });
  }
  calendarDays.value = cells;
}

async function loadData() {
  if (!userId.value) return;
  try {
    const [statsRes, todayRes, calRes] = await Promise.all([
      getStats(userId.value),
      checkToday(userId.value),
      getCalendar(userId.value),
    ]);
    stats.value = (statsRes?.data ?? {}) as SignInStats;
    signed.value = !!todayRes?.data?.signed;
    buildCalendar((calRes?.data ?? []) as SignInDay[]);
  } catch (e) {
    message.error((e as Error)?.message ?? "加载签到数据失败");
  }
}

async function handleSignIn() {
  if (!userId.value || signing.value || signed.value) return;
  signing.value = true;
  try {
    const res = await doSignIn(userId.value);
    const result = res?.data as SignInResult;
    if (result?.success) {
      signed.value = true;
      message.success(`签到成功！获得 ${result.todayPoints} 积分，连续 ${result.streak} 天`);
      await loadData();
    } else {
      message.warning(result?.msg ?? "签到失败");
      if (result?.alreadySigned) signed.value = true;
    }
  } catch (e) {
    message.error((e as Error)?.message ?? "签到失败");
  } finally {
    signing.value = false;
  }
}

let unsub: (() => void) | null = null;

function bindSocket() {
  const service = useSocketService();
  if (!service) return;
  unsub = service.subscribe("signin", "done", (msg) => {
    const payload = msg.data as Record<string, unknown> | undefined;
    if (payload) {
      const result = payload.result as SignInResult | undefined;
      if (result && !result.alreadySigned) {
        signed.value = true;
        message.success(`签到成功！获得 ${result.todayPoints} 积分`);
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
        <h1 class="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-3xl font-bold text-transparent dark:from-emerald-400 dark:to-teal-400">
          Daily Sign-in
        </h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in every day to earn points and keep your streak</p>
      </div>

      <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReSignInStatCard title="Total Days" :value="stats.totalDays ?? 0" gradient="from-sky-400 to-blue-500" emoji="📅" shadow-class="from-sky-500/10" />
        <ReSignInStatCard title="Current Streak" :value="stats.currentStreak ?? 0" gradient="from-emerald-400 to-teal-500" emoji="🔥" shadow-class="from-emerald-500/10" />
        <ReSignInStatCard title="Max Streak" :value="stats.maxStreak ?? 0" gradient="from-amber-400 to-orange-500" emoji="🏆" shadow-class="from-amber-500/10" />
        <ReSignInStatCard title="Total Points" :value="stats.totalPoints ?? 0" gradient="from-violet-400 to-purple-500" emoji="⭐" shadow-class="from-violet-500/10" />
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <ReSignInCalendar :days="calendarDays" :current-month="currentMonth" :signed="signed" />
        <ReSignInActionCard
          :signed="signed"
          :signing="signing"
          :current-streak="stats.currentStreak ?? 0"
          :total-points="stats.totalPoints ?? 0"
          @sign-in="handleSignIn"
        />
      </div>
    </div>
  </div>
</template>