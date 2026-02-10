<script setup>
/**
 * 倒计时部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted, onUnmounted, computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const presetEvents = [
  { name: "元旦", getDate: (year) => new Date(year + 1, 0, 1), icon: "ri:calendar-event-line" },
  { name: "春节", getDate: (year) => new Date(2025, 0, 29), icon: "ri:fire-fill" }, // 2025年春节
  { name: "情人节", getDate: (year) => new Date(year, 1, 14), icon: "ri:heart-fill" },
  { name: "劳动节", getDate: (year) => new Date(year, 4, 1), icon: "ri:hammer-fill" },
  { name: "国庆节", getDate: (year) => new Date(year, 9, 1), icon: "ri:flag-fill" },
];

const env = reactive({
  selectedPreset: 0,
  countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
  targetDate: null,
  targetName: "",
});

let timer = null;

const calculateCountdown = () => {
  const now = new Date().getTime();
  const target = env.targetDate.getTime();
  const diff = target - now;

  if (diff <= 0) {
    env.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return;
  }

  env.countdown.days = Math.floor(diff / (1000 * 60 * 60 * 24));
  env.countdown.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
  calculateCountdown();
};

onMounted(() => {
  selectEvent(0);
  timer = setInterval(calculateCountdown, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="countdown-card">
    <div class="card-header">
      <span class="title">距离 {{ env.targetName }} 还有</span>
      <el-dropdown trigger="click" @command="selectEvent">
        <div class="dropdown-trigger">
          <IconifyIconOnline icon="ri:more-2-fill" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="(event, index) in presetEvents" :key="index" :command="index">
              {{ event.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <div class="countdown-display">
      <div class="time-unit">
        <span class="value">{{ env.countdown.days }}</span>
        <span class="label">天</span>
      </div>
      <div class="time-separator">:</div>
      <div class="time-unit">
        <span class="value">{{ String(env.countdown.hours).padStart(2, '0') }}</span>
        <span class="label">时</span>
      </div>
      <div class="time-separator">:</div>
      <div class="time-unit">
        <span class="value">{{ String(env.countdown.minutes).padStart(2, '0') }}</span>
        <span class="label">分</span>
      </div>
      <div class="time-separator">:</div>
      <div class="time-unit">
        <span class="value">{{ String(env.countdown.seconds).padStart(2, '0') }}</span>
        <span class="label">秒</span>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  color: white;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
  
  .title {
    font-size: 14px;
    opacity: 0.9;
  }
  
  .dropdown-trigger {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    &:hover { opacity: 1; }
  }
}

.countdown-display {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  z-index: 1;
  margin: 10px 0;
  
  .time-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .value {
      font-size: 28px;
      font-weight: bold;
      line-height: 1;
      font-family: monospace;
    }
    
    .label {
      font-size: 10px;
      opacity: 0.8;
      margin-top: 4px;
    }
  }
  
  .time-separator {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 14px;
    opacity: 0.5;
  }
}

.event-icon-bg {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 80px;
  opacity: 0.15;
  pointer-events: none;
}
</style>
