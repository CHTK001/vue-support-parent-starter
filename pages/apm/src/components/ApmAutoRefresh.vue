<!--
  APM 全局自动刷新开关 —— 关 / 15 秒 / 30 秒 / 60 秒。

  <p>为什么做成公共组件而不是各页一个定时器：自动刷新的口径必须全站一致
  （间隔档位、记忆键、隐藏时暂停），散落到 9 个页面必然出现
  「这页 15 秒一刷、那页 30 秒一刷还带着页面看不见也在刷」的割裂。</p>

  <p>两条纪律：
  ① 浏览器页签切走（document.hidden）时暂停，回来继续 —— 后台定时器刷出来的
     数据没人看，还平白消耗 OAP；
  ② 页签面板被 v-show 隐藏时跳过 —— 工作台的页签是常驻面板，
     不判断的话 12 个页签会同时在后台各自轮询。</p>
-->
<template>
  <span ref="root" class="apm-auto-refresh">
    <ReSelect v-model="seconds" :options="options" style="width: 128px" @change="restart" />
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import ReSelect from "@repo/ui/re-select";

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

/** 全站同一个记忆键：在哪个页签设的间隔，切到别的页签仍然生效 */
const STORAGE_KEY = "apm:auto-refresh-seconds";

const options = [
  { label: "自动刷新：关", value: 0 },
  { label: "15 秒", value: 15 },
  { label: "30 秒", value: 30 },
  { label: "60 秒", value: 60 },
];

/** 从 localStorage 读档位；脏数据一律当「关」，不让存储把组件打坏 */
function readStoredSeconds(): number {
  try {
    const raw = Number(localStorage.getItem(STORAGE_KEY));
    return options.some((option) => option.value === raw) ? raw : 0;
  } catch {
    return 0;
  }
}

const seconds = ref<number>(readStoredSeconds());
const root = ref<HTMLElement | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;
/**
 * 对表定时器：档位记忆是全站一个键，而页签面板常驻（切页签不重新挂载），
 * 在 A 页改的档位，B 页已挂载的实例只能靠这里在 2 秒内跟上。
 */
let syncTimer: ReturnType<typeof setInterval> | null = null;
const SYNC_INTERVAL_MS = 2000;

function startSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
  }
  syncTimer = setInterval(() => {
    const stored = readStoredSeconds();
    if (stored !== seconds.value) {
      seconds.value = stored;
      restart();
    }
  }, SYNC_INTERVAL_MS);
}

function tick(): void {
  if (document.hidden) {
    return;
  }
  // 面板 display:none 时 offsetParent 为 null：只刷新用户正看着的那一页
  if (root.value && !root.value.offsetParent) {
    return;
  }
  emit("refresh");
}

/** 换档 / 初始化：先清旧定时器再按当前档位起，保证同一时刻只有一个 timer */
function restart(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  try {
    localStorage.setItem(STORAGE_KEY, String(seconds.value));
  } catch {
    // 存不进去只影响「下次进来恢复档位」，不影响本次使用
  }
  if (seconds.value > 0) {
    timer = setInterval(tick, seconds.value * 1000);
  }
}

onMounted(() => {
  restart();
  startSync();
});

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
});
</script>

<style scoped>
.apm-auto-refresh {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}
</style>
