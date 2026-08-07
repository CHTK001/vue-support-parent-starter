<script setup lang="ts">
/**
 * 用户签到页面
 *
 * 展示签到统计卡片、月度日历、签到按钮，并通过 Socket 实时接收签到成功推送。
 */
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Calendar, Medal, Star, Clock, Check, Right } from "@element-plus/icons-vue";
import { useSocketService } from "@repo/core";
import { useUserStore } from "@repo/pinia";
import { checkToday, doSignIn, getCalendar, getStats } from "../api/signinApi";
import type { SignInDay, SignInResult, SignInStats } from "../api/types";

const userStore = useUserStore();
const userId = computed(() => userStore.userInfo?.userId ?? userStore.userId);

const stats = ref<SignInStats>({});
const today = ref(false);
const signing = ref(false);
const signed = ref(false);
const calendarDays = ref<(SignInDay | null)[]>([]);
const currentMonth = ref("");

const daysLabels = ["一", "二", "三", "四", "五", "六", "日"];

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
    today.value = !!todayRes?.data?.signed;
    signed.value = today.value;
    buildCalendar((calRes?.data ?? []) as SignInDay[]);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载签到数据失败");
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
      ElMessage.success(`签到成功！获得 ${result.todayPoints} 积分，连续 ${result.streak} 天`);
      await loadData();
    } else {
      ElMessage.warning(result?.msg ?? "签到失败");
      if (result?.alreadySigned) signed.value = true;
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "签到失败");
  } finally {
    signing.value = false;
  }
}

/* Socket: real-time sign-in push */
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
        ElMessage.success(`签到成功！获得 ${result.todayPoints} 积分`);
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
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
        Daily Sign-in
      </h2>
      <p class="mt-1 text-sm text-[--el-text-color-secondary]">
        Sign in every day to earn points and keep your streak
      </p>
    </div>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-primary)"><Calendar /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ stats.totalDays ?? 0 }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Total Days</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-success)"><Medal /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ stats.currentStreak ?? 0 }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Current Streak</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-warning)"><Clock /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ stats.maxStreak ?? 0 }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Max Streak</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <div class="flex items-center gap-3">
          <el-icon :size="28" color="var(--el-color-danger)"><Star /></el-icon>
          <div>
            <div class="text-2xl font-bold">{{ stats.totalPoints ?? 0 }}</div>
            <div class="text-xs text-[--el-text-color-secondary]">Total Points</div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Calendar -->
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter] lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ currentMonth }}</span>
            <el-tag v-if="signed" type="success" effect="dark">Signed Today</el-tag>
            <el-tag v-else type="warning" effect="plain">Not Signed</el-tag>
          </div>
        </template>
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-[--el-text-color-secondary]">
          <div v-for="d in daysLabels" :key="d" class="py-1">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <template v-for="(cell, idx) in calendarDays" :key="idx">
            <div v-if="cell" class="flex h-14 items-center justify-center rounded-lg border border-solid"
              :class="cell.signed ? 'border-[--el-color-success] bg-[--el-color-success-light-9]' : 'border-[--el-border-color-lighter]'">
              <div class="text-center">
                <div class="flex items-center gap-1">
                  <span :class="cell.signed ? 'text-[--el-color-success] font-semibold' : 'text-[--el-text-color-regular]'">
                    {{ cell.date.slice(8) }}
                  </span>
                  <el-icon v-if="cell.signed" :size="12" color="var(--el-color-success)"><Check /></el-icon>
                </div>
              </div>
            </div>
            <div v-else class="h-14" />
          </template>
        </div>
      </el-card>

      <!-- Sign-in action -->
      <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
        <template #header>
          <span class="font-medium">Sign In</span>
        </template>
        <div class="flex flex-col items-center gap-4 py-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-[--el-color-primary-light-9]">
            <el-icon :size="40" color="var(--el-color-primary)" v-if="!signed"><Calendar /></el-icon>
            <el-icon :size="40" color="var(--el-color-success)" v-else><Check /></el-icon>
          </div>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            :loading="signing"
            :disabled="signed"
            @click="handleSignIn"
          >
            <template v-if="!signed">
              <el-icon class="mr-1"><Right /></el-icon>Sign In Now
            </template>
            <template v-else>Already Signed</template>
          </el-button>
          <div class="text-center text-sm text-[--el-text-color-secondary]">
            <p>Current streak: <span class="font-semibold text-[--el-color-success]">{{ stats.currentStreak ?? 0 }}</span> days</p>
            <p class="mt-1">Total points: <span class="font-semibold text-[--el-color-warning]">{{ stats.totalPoints ?? 0 }}</span></p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>