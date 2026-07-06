<template>
  <span class="header-clock-text">{{ timeStr }}</span>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const timeStr = ref("");
let timer: ReturnType<typeof setInterval> | null = null;

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function update() {
  const d = new Date();
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  const dow = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  timeStr.value = `${h}:${m}:${s} ${d.getMonth() + 1}月${d.getDate()}日 星期${dow}`;
}

onMounted(() => {
  update();
  timer = setInterval(update, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.header-clock-text {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  letter-spacing: 0.3px;
}
</style>
