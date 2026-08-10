<script setup lang="ts">
/**
 * 签到操作卡片组件
 */
import ReCard from "@repo/ui/re-card";
import { Calendar, Check, Right } from "@element-plus/icons-vue";

defineProps<{
  signed: boolean;
  signing: boolean;
  currentStreak: number;
  totalPoints: number;
}>();

const emit = defineEmits<{
  (e: "sign-in"): void;
}>();
</script>

<template>
  <ReCard :radius="16" :padding="0" class="overflow-hidden border border-slate-200/60 bg-white/90 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-800/90">
    <div class="border-b border-slate-200/60 px-6 py-4 dark:border-slate-700/60">
      <span class="font-semibold text-slate-700 dark:text-slate-200">Sign In</span>
    </div>
    <div class="flex flex-col items-center gap-4 px-6 py-8">
      <div
        class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br transition-all duration-300"
        :class="signed
          ? 'from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30'
          : 'from-violet-400 to-indigo-500 shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30'"
      >
        <el-icon :size="40" color="white" v-if="!signed"><Calendar /></el-icon>
        <el-icon :size="40" color="white" v-else><Check /></el-icon>
      </div>
      <button
        class="w-full rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
        :class="signed
          ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-200/50 dark:shadow-emerald-900/30'
          : 'bg-gradient-to-r from-violet-500 to-indigo-600 shadow-violet-200/50 dark:shadow-violet-900/30 hover:from-violet-600 hover:to-indigo-700 hover:shadow-xl'"
        :disabled="signed || signing"
        @click="emit('sign-in')"
      >
        <el-icon v-if="!signed && !signing" class="mr-1"><Right /></el-icon>
        <span v-if="signing">Signing in...</span>
        <span v-else-if="signed">Already Signed</span>
        <span v-else>Sign In Now</span>
      </button>
      <div class="text-center text-sm text-slate-500 dark:text-slate-400">
        <p>Current streak: <span class="font-semibold text-emerald-500 dark:text-emerald-400">{{ currentStreak }}</span> days</p>
        <p class="mt-1">Total points: <span class="font-semibold text-amber-500 dark:text-amber-400">{{ totalPoints }}</span></p>
      </div>
    </div>
  </ReCard>
</template>