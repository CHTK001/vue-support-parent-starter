<template>
  <el-popover
    placement="bottom"
    :width="220"
    trigger="hover"
    :offset="8"
    popper-class="koi-timer-popover"
  >
    <template #reference>
      <div class="timer-trigger" :title="t('header.timer.tip')">
        <el-icon :size="16" class="trigger-icon">
          <Clock />
        </el-icon>
        <span class="trigger-time">{{ localTime }}</span>
      </div>
    </template>

    <div class="timer-zones">
      <!-- 本地时间始终显示 -->
      <div class="timer-zone">
        <span class="timer-zone__label">本地</span>
        <span class="timer-zone__time">{{ localTime }}</span>
        <span class="timer-zone__date">{{ localDate }} {{ localWeekday }}</span>
      </div>

      <div v-if="timerZones.length" class="timer-divider"></div>

      <!-- 配置的多时区（最多 3 个） -->
      <div v-for="zone in timerZones" :key="zone.offset" class="timer-zone">
        <span class="timer-zone__label">{{ zone.label }}</span>
        <span class="timer-zone__time">{{ zone.time }}</span>
        <span class="timer-zone__date">{{ zone.date }} {{ zone.weekday }}</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
/**
 * Timer —— 顶部右侧多时区计时器
 *
 * 由 @repo/work 定时器 Worker 驱动（独立线程每秒推送，规避主线程节流），
 * app.yaml other.timer 控制：enable 显隐、zones 时区列表（UTC ±12，最多 3 个）。
 * 悬停 popover 展示各时区当前时间（本地时间始终显示）。
 */
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { Clock } from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { getGlobalTimer, type TimerTick, type TimerZoneTime } from "@repo/work/timer";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

/** 全局定时器 Worker 客户端（createApp 启动时注册，应用内唯一实例） */
const timerClient = getGlobalTimer();

/** 本地时间 HH:mm:ss */
const localTime = ref("--:--:--");
/** 本地日期 YYYY-MM-DD */
const localDate = ref("");
/** 本地星期 */
const localWeekday = ref("");

/** 配置的多时区时间（最多 3 个） */
const timerZones = ref<TimerZoneTime[]>([]);

/** 时区配置（app.yaml other.timer，响应式联动设置抽屉） */
const timerConfig = computed(() => getConfig().other.timer);

/** 收到 Worker 推送：本地时间从 tick 时区中取 offset=0 对应的墙上时间换算 */
const handleTick = (tick: TimerTick) => {
  // 本地时间：浏览器时区的墙上时间（不依赖任何配置时区）
  const now = new Date(tick.timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  localTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  localDate.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  localWeekday.value = `星期${"日一二三四五六"[now.getDay()]}`;
  timerZones.value = tick.zones;
};

/** 卸载订阅（返回取消函数） */
let unsubscribe: (() => void) | null = null;

/** 同步 Worker 时区配置 */
const syncWorker = () => {
  const { enable, zones } = timerConfig.value;
  if (enable) {
    timerClient.start(zones);
  } else {
    timerClient.stop();
    localTime.value = "--:--:--";
    timerZones.value = [];
  }
};

watch(() => timerConfig.value, syncWorker, { deep: true });

onMounted(() => {
  unsubscribe = timerClient.subscribe(handleTick);
  syncWorker();
});

onUnmounted(() => {
  // 仅退订，不销毁全局 Worker（全局实例由应用卸载时统一销毁）
  unsubscribe?.();
});
</script>

<style lang="scss" scoped>
.timer-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 36px;
  padding: 0 10px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.5s ease;

  .trigger-icon {
    color: var(--el-text-color-regular);
  }

  .trigger-time {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
    letter-spacing: 0.5px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(0.96);
  }
}

html.dark {
  .timer-trigger {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>

<style lang="scss">
.koi-timer-popover {
  padding: 8px !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}
</style>
