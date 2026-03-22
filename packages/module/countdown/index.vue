<script setup>
/**
 * 倒计时部件（节日 + 下班提醒）
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted, onUnmounted, ref, watch } from "vue";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { ElNotification } from "element-plus";

const presetEvents = [
  {
    name: "元旦",
    getDate: (year) => new Date(year + 1, 0, 1),
    icon: "ri:calendar-event-line",
  },
  {
    name: "春节",
    getDate: (year) => new Date(2025, 0, 29),
    icon: "ri:fire-fill",
  }, // 2025年春节
  {
    name: "情人节",
    getDate: (year) => new Date(year, 1, 14),
    icon: "ri:heart-fill",
  },
  {
    name: "劳动节",
    getDate: (year) => new Date(year, 4, 1),
    icon: "ri:hammer-fill",
  },
  {
    name: "国庆节",
    getDate: (year) => new Date(year, 9, 1),
    icon: "ri:flag-fill",
  },
  {
    name: "下班",
    getDate: () => getTodayWorkEnd(),
    icon: "ri:briefcase-4-fill",
  },
];

const env = reactive({
  selectedPreset: 0,
  countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
  targetDate: null,
  targetName: "",
  workEndTime: "17:30",
});

let timer = null;
const hasNotified = ref(false);

/**
 * 获取当天的下班时间
 * @returns {Date} 当天下班时间
 */
const getTodayWorkEnd = () => {
  const now = new Date();
  const [hourStr, minuteStr] = (env.workEndTime || "17:30").split(":");
  const hour = parseInt(hourStr || "17", 10);
  const minute = parseInt(minuteStr || "30", 10);
  const safeHour = Number.isNaN(hour) ? 17 : Math.min(Math.max(hour, 0), 23);
  const safeMinute = Number.isNaN(minute)
    ? 30
    : Math.min(Math.max(minute, 0), 59);
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    safeHour,
    safeMinute,
    0,
  );
};

const calculateCountdown = () => {
  const now = new Date().getTime();
  if (!env.targetDate) {
    env.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return;
  }
  const target = env.targetDate.getTime();
  const diff = target - now;

  if (diff <= 0) {
    env.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    if (!hasNotified.value && env.targetName) {
      hasNotified.value = true;
      ElNotification({
        title: "时间到啦",
        message: `${env.targetName} 已经到了，辛苦啦～`,
        type: "success",
        position: "top-right",
        duration: 5000,
      });
    }
    return;
  }

  env.countdown.days = Math.floor(diff / (1000 * 60 * 60 * 24));
  env.countdown.hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  env.countdown.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  env.countdown.seconds = Math.floor((diff % (1000 * 60)) / 1000);
};

const selectEvent = (index) => {
  env.selectedPreset = index;
  const event = presetEvents[index];
  const year = new Date().getFullYear();
  let target = event.getDate(year);
  if (target < new Date()) {
    target = event.getDate(year);
  }
  env.targetDate = target;
  env.targetName = event.name;
  hasNotified.value = false;
  calculateCountdown();
};

// 下班时间变更时，实时刷新“下班”倒计时
watch(
  () => env.workEndTime,
  () => {
    const currentEvent = presetEvents[env.selectedPreset];
    if (currentEvent && currentEvent.name === "下班") {
      env.targetDate = getTodayWorkEnd();
      hasNotified.value = false;
      calculateCountdown();
    }
  },
);

onMounted(() => {
  const defaultIndex = presetEvents.findIndex((item) => item.name === "下班");
  selectEvent(defaultIndex === -1 ? 0 : defaultIndex);
  timer = setInterval(calculateCountdown, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="countdown-card">
    <div class="card-header">
      <div class="header-left">
        <div class="header-main">
          <div class="event-avatar">
            <IconifyIconOnline :icon="presetEvents[env.selectedPreset].icon" />
          </div>
          <div class="title-block">
            <div class="title-row">
              <span class="target-name">{{
                env.targetName || "目标时间"
              }}</span>
              <span class="badge-mini">倒计时</span>
            </div>
            <div class="subtitle">
              还有一点点，就可以
              <span v-if="presetEvents[env.selectedPreset].name === '下班'"
                >下班啦</span
              >
              <span v-else>迎来它</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <ScDropdown trigger="click" @command="selectEvent">
          <div class="mode-switch">
            <span class="mode-label">模式</span>
            <span class="mode-name">{{
              presetEvents[env.selectedPreset].name
            }}</span>
            <IconifyIconOnline icon="ri:arrow-down-s-line" class="mode-arrow" />
          </div>
          <template #dropdown>
            <ScDropdownMenu>
              <ScDropdownItem
                v-for="(event, index) in presetEvents"
                :key="index"
                :command="index"
              >
                {{ event.name }}
              </ScDropdownItem>
            </ScDropdownMenu>
          </template>
        </ScDropdown>
      </div>
    </div>

    <div class="card-main">
      <div class="countdown-display">
        <div class="time-unit">
          <span class="value">{{ env.countdown.days }}</span>
          <span class="label">天</span>
        </div>
        <div class="time-separator">:</div>
        <div class="time-unit">
          <span class="value">{{
            String(env.countdown.hours).padStart(2, "0")
          }}</span>
          <span class="label">时</span>
        </div>
        <div class="time-separator">:</div>
        <div class="time-unit">
          <span class="value">{{
            String(env.countdown.minutes).padStart(2, "0")
          }}</span>
          <span class="label">分</span>
        </div>
        <div class="time-separator">:</div>
        <div class="time-unit">
          <span class="value">{{
            String(env.countdown.seconds).padStart(2, "0")
          }}</span>
          <span class="label">秒</span>
        </div>
      </div>

      <!-- 下班模式配置区 -->
      <div
        v-if="presetEvents[env.selectedPreset].name === '下班'"
        class="worktime-config"
      >
        <div class="worktime-label">下班时间</div>
        <ScTimePicker
          v-model="env.workEndTime"
          size="small"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="选择下班时间"
          :clearable="false"
          class="worktime-picker"
        />
      </div>

      <div class="card-footer">
        <span class="tip-text">
          提示：点击右上角可切换节日或下班模式，自动计算今日/节日剩余时间。
        </span>
      </div>
    </div>

    <div class="event-icon-bg">
      <IconifyIconOnline :icon="presetEvents[env.selectedPreset].icon" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.countdown-card {
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at top left,
    #6b8cff 0%,
    #7c4dff 35%,
    #282c4a 100%
  );
  border-radius: 16px;
  padding: 16px 18px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(14px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
  margin-bottom: 8px;
  padding: 6px 10px 8px;
  border-radius: 12px;
  background: radial-gradient(
    circle at top left,
    rgba(15, 23, 42, 0.75),
    rgba(15, 23, 42, 0.6)
  );
  border: 1px solid rgba(148, 163, 184, 0.65);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.75);

  .header-left {
    display: flex;
    align-items: center;
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .event-avatar {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: radial-gradient(
      circle at 30% 0,
      #ffffff,
      rgba(251, 191, 36, 0.3)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.6);

    :deep(svg) {
      font-size: 18px;
    }
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .target-name {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #e5edff;
  }

  .badge-mini {
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid rgba(248, 250, 252, 0.55);
    font-size: 10px;
    opacity: 0.9;
    background: rgba(15, 23, 42, 0.35);
    color: #e5edff;
  }

  .subtitle {
    font-size: 11px;
    opacity: 0.86;
    color: #cbd5ff;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .mode-switch {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.38);
    border: 1px solid rgba(248, 250, 252, 0.3);
    cursor: pointer;
    opacity: 0.9;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }

    .mode-label {
      font-size: 11px;
      opacity: 0.8;
      color: #cbd5ff;
    }

    .mode-name {
      font-size: 12px;
      font-weight: 500;
      color: #e5edff;
    }

    .mode-arrow {
      font-size: 14px;
      opacity: 0.8;
    }
  }
}

.card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.countdown-display {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  z-index: 1;
  margin: 6px 0 10px;

  .time-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 8px;
    min-width: 52px;
    border-radius: 12px;
    background: radial-gradient(
      circle at top,
      rgba(255, 255, 255, 0.32),
      rgba(148, 163, 184, 0.1)
    );
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.45);
    border: 1px solid rgba(248, 250, 252, 0.55);
    backdrop-filter: blur(10px);

    .value {
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
      font-family: monospace;
      text-shadow: 0 0 18px rgba(15, 23, 42, 0.7);
    }

    .label {
      font-size: 10px;
      opacity: 0.9;
      margin-top: 4px;
    }
  }

  .time-separator {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    opacity: 0.55;
  }
}

.worktime-config {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  z-index: 1;

  .worktime-label {
    font-size: 12px;
    opacity: 0.9;
    white-space: nowrap;
  }

  :deep(.el-input__wrapper) {
    background-color: rgba(248, 250, 252, 0.2);
    border-radius: 8px;
    box-shadow: none;
    border-color: transparent;
    color: #0f172a;

    .el-input__inner {
      color: #0f172a;
      font-size: 12px;
      font-weight: 500;
    }
  }
}

.card-footer {
  margin-top: 6px;
  z-index: 1;

  .tip-text {
    font-size: 11px;
    opacity: 0.8;
  }
}

.event-icon-bg {
  position: absolute;
  right: -4px;
  bottom: -6px;
  font-size: 88px;
  opacity: 0.18;
  pointer-events: none;
}
</style>
