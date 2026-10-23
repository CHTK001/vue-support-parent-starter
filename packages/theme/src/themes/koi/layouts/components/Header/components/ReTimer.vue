<template>
  <el-popover
    placement="bottom-end"
    :width="320"
    trigger="hover"
    :offset="10"
    popper-class="koi-timer-popover"
    :show-arrow="false"
  >
    <template #reference>
      <div class="timer-trigger" :title="t('header.timer.tip')">
        <!-- 动画时钟（hover/focus 播放），故下方 hover 不再叠加 timer-icon-tick 摆动 -->
        <ReIcon name="anim:tabler:clock" :size="16" class="trigger-icon" />
        <span class="trigger-time">{{ localTime }}</span>
      </div>
    </template>

    <div class="timer-panel">
      <!-- 面板头部 -->
      <div class="timer-panel__head">
        <span class="timer-panel__head-icon">
          <el-icon :size="15"><Clock /></el-icon>
        </span>
        <span class="timer-panel__head-title">{{ t("header.timer.title") }}</span>
      </div>

      <!-- 本地时间主区 -->
      <div class="timer-panel__local">
        <span class="timer-panel__local-label">{{ t("header.timer.localLabel") }}</span>
        <span class="timer-panel__local-time">{{ localTime }}</span>
        <span class="timer-panel__local-date">{{ localDate }} · {{ localWeekday }}</span>
      </div>

      <!-- 配置的多时区（最多 3 个） -->
      <template v-if="timerZones.length">
        <div class="timer-panel__divider"></div>
        <div class="timer-panel__zones">
          <div v-for="zone in timerZones" :key="zone.offset" class="timer-zone">
            <span class="timer-zone__label">{{ zone.label }}</span>
            <span class="timer-zone__time">{{ zone.time }}</span>
            <span class="timer-zone__date">{{ zone.date }} {{ zone.weekday }}</span>
          </div>
        </div>
      </template>

      <!-- 未配置时区 -->
      <div v-else class="timer-panel__empty">
        <el-icon :size="13"><InfoFilled /></el-icon>
        <span>{{ t("header.timer.empty") }}</span>
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
import { Clock, InfoFilled } from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { getGlobalTimer, type TimerTick, type TimerZoneTime } from "@repo/work/timer";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

/** 全局定时器 Worker 客户端（createApp 启动时注册，应用内唯一实例） */
const timerClient = getGlobalTimer();

/** 本地时间 HH:mm:ss */
const pad = (n: number) => String(n).padStart(2, "0");
const now = new Date();
const localTime = ref(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
/** 本地日期 YYYY-MM-DD */
const localDate = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
/** 本地星期 */
const getWeekdayNames = (): string[] => {
  const arr = (t as any)("header.timer.weekday", { returnObjects: true });
  return Array.isArray(arr) ? arr : ["日", "一", "二", "三", "四", "五", "六"];
};
const localWeekday = ref(`${getWeekdayNames()[now.getDay()]}`);

/** 配置的多时区时间（最多 3 个） */
const timerZones = ref<TimerZoneTime[]>([]);

/** 时区配置（app.yaml other.timer，响应式联动设置抽屉） */
const timerConfig = computed(() => getConfig().other.timer);

/** 收到 Worker 推送：本地时间从 tick 时区中取 offset=0 对应的墙上时间换算 */
const handleTick = (tick: TimerTick) => {
  const wd = getWeekdayNames();
  const now = new Date(tick.timestamp);
  localTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  localDate.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  localWeekday.value = `${wd[now.getDay()]}`;
  timerZones.value = tick.zones.map((z) => {
    const utcDay = new Date(Date.now() + z.offset * 3600_000).getUTCDay();
    return { ...z, weekday: `${wd[utcDay]}` };
  });
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 36px;
  padding: 0 10px;
  cursor: pointer;
  border-radius: 8px;
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .trigger-icon {
    color: var(--el-text-color-regular);
    transition: color 0.3s ease;
  }

  .trigger-time {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
    letter-spacing: 0.5px;
    transition: color 0.3s ease;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px) scale(1.04);

    .trigger-icon {
      /* 只做配色反馈；图标自身的走针动画由 anim:tabler:clock 在 hover/focus 时播放 */
      color: var(--el-color-primary);
    }

    .trigger-time {
      color: var(--el-color-primary);
    }
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
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    }
  }
}

/* ==================== popover 面板内容 ==================== */
.timer-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px;
}

.timer-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .timer-panel__head-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #fff;
    background: linear-gradient(135deg, #2f8bf0, #7ab6ff);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(47, 139, 240, 0.35);
  }

  .timer-panel__head-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    letter-spacing: 0.5px;
  }
}

.timer-panel__local {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 14px 12px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-fill-color-light)
  );
  border-radius: 12px;

  .timer-panel__local-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .timer-panel__local-time {
    font-size: 32px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1.05;
    letter-spacing: 1px;
    color: var(--el-color-primary);
  }

  .timer-panel__local-date {
    font-size: 12px;
    color: var(--el-text-color-regular);
  }
}

.timer-panel__divider {
  height: 1px;
  margin: 12px 0 8px;
  background: var(--el-border-color-lighter);
}

.timer-panel__zones {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timer-zone {
  display: grid;
  grid-template-columns: 58px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  .timer-zone__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 999px;
  }

  .timer-zone__time {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
  }

  .timer-zone__date {
    font-size: 11px;
    text-align: right;
    color: var(--el-text-color-secondary);
  }
}

.timer-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

<style lang="scss">
/* popover 外框（teleport 到 body，须用非 scoped 样式） */
.koi-timer-popover {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 14px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18) !important;
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
}
</style>
