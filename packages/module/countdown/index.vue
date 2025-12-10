<script setup>
/**
 * 倒计时部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.0
 */
import { reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";

// 预设事件
const presetEvents = [
  { name: "元旦", getDate: (year) => new Date(year + 1, 0, 1) },
  { name: "春节", getDate: (year) => getChineseNewYear(year + 1) },
  { name: "情人节", getDate: (year) => new Date(year, 1, 14) },
  { name: "劳动节", getDate: (year) => new Date(year, 4, 1) },
  { name: "中秋节", getDate: (year) => getMidAutumnFestival(year) },
  { name: "国庆节", getDate: (year) => new Date(year, 9, 1) },
  { name: "圣诞节", getDate: (year) => new Date(year, 11, 25) },
];

/**
 * 获取春节日期（简化计算）
 * @param {number} year - 年份
 * @returns {Date} 春节日期
 */
const getChineseNewYear = (year) => {
  // 这里使用近几年的春节日期映射
  const chineseNewYears = {
    2024: new Date(2024, 1, 10),
    2025: new Date(2025, 0, 29),
    2026: new Date(2026, 1, 17),
    2027: new Date(2027, 1, 6),
    2028: new Date(2028, 0, 26),
  };
  return chineseNewYears[year] || new Date(year, 0, 28);
};

/**
 * 获取中秋节日期（简化计算）
 * @param {number} year - 年份
 * @returns {Date} 中秋节日期
 */
const getMidAutumnFestival = (year) => {
  const midAutumnDates = {
    2024: new Date(2024, 8, 17),
    2025: new Date(2025, 9, 6),
    2026: new Date(2026, 8, 25),
    2027: new Date(2027, 8, 15),
    2028: new Date(2028, 9, 3),
  };
  return midAutumnDates[year] || new Date(year, 8, 15);
};

// 环境变量
const env = reactive({
  mode: "preset", // preset | custom
  selectedPreset: 0,
  customDate: "",
  customName: "",
  countdown: {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  },
  targetDate: null,
  targetName: "",
  isPast: false,
});

let timer = null;

/**
 * 计算倒计时
 */
const calculateCountdown = () => {
  if (!env.targetDate) return;

  const now = new Date().getTime();
  const target = new Date(env.targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    env.isPast = true;
    env.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return;
  }

  env.isPast = false;
  env.countdown.days = Math.floor(diff / (1000 * 60 * 60 * 24));
  env.countdown.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  env.countdown.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  env.countdown.seconds = Math.floor((diff % (1000 * 60)) / 1000);
};

/**
 * 选择预设事件
 * @param {number} index - 预设事件索引
 */
const selectPreset = (index) => {
  env.selectedPreset = index;
  const year = new Date().getFullYear();
  const event = presetEvents[index];
  let targetDate = event.getDate(year);
  
  // 如果日期已过，获取明年的日期
  if (targetDate.getTime() < new Date().getTime()) {
    targetDate = event.getDate(year + 1);
  }
  
  env.targetDate = targetDate;
  env.targetName = event.name;
  calculateCountdown();
};

/**
 * 设置自定义日期
 */
const setCustomDate = () => {
  if (!env.customDate) {
    message("请选择日期", { type: "warning" });
    return;
  }
  env.mode = "custom";
  env.targetDate = new Date(env.customDate);
  env.targetName = env.customName || "自定义倒计时";
  calculateCountdown();
};

/**
 * 切换到预设模式
 */
const switchToPreset = () => {
  env.mode = "preset";
  selectPreset(env.selectedPreset);
};

// 组件挂载时初始化
onMounted(() => {
  selectPreset(0);
  timer = setInterval(calculateCountdown, 1000);
});

// 组件卸载时清理
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <div class="countdown-module">
    <div class="countdown-module__content">
      <div class="countdown-module__card">
        <div class="countdown-module__header">
          <div class="countdown-module__title">
            <IconifyIconOnline icon="ri:timer-line" />
            <span>{{ env.targetName }}</span>
          </div>
          <div class="countdown-module__status" :class="{ 'is-past': env.isPast }">
            {{ env.isPast ? "已过去" : "倒计时" }}
          </div>
        </div>

        <div class="countdown-module__display" v-if="!env.isPast">
          <div class="countdown-module__item">
            <div class="countdown-module__number">{{ env.countdown.days }}</div>
            <div class="countdown-module__label">天</div>
          </div>
          <div class="countdown-module__separator">:</div>
          <div class="countdown-module__item">
            <div class="countdown-module__number">{{ String(env.countdown.hours).padStart(2, "0") }}</div>
            <div class="countdown-module__label">时</div>
          </div>
          <div class="countdown-module__separator">:</div>
          <div class="countdown-module__item">
            <div class="countdown-module__number">{{ String(env.countdown.minutes).padStart(2, "0") }}</div>
            <div class="countdown-module__label">分</div>
          </div>
          <div class="countdown-module__separator">:</div>
          <div class="countdown-module__item">
            <div class="countdown-module__number">{{ String(env.countdown.seconds).padStart(2, "0") }}</div>
            <div class="countdown-module__label">秒</div>
          </div>
        </div>

        <div class="countdown-module__past" v-else>
          <IconifyIconOnline icon="ri:checkbox-circle-line" />
          <span>该事件已结束</span>
        </div>

        <div class="countdown-module__presets">
          <el-button
            v-for="(event, index) in presetEvents"
            :key="index"
            :type="env.mode === 'preset' && env.selectedPreset === index ? 'primary' : 'default'"
            size="small"
            @click="selectPreset(index); env.mode = 'preset'"
          >
            {{ event.name }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.countdown-module {
  &__content {
    border-radius: 12px;
  }

  &__card {
    background: linear-gradient(135deg, #f093fb, #f5576c);
    border-radius: 12px;
    padding: 24px;
    color: #fff;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;

    .iconify {
      font-size: 24px;
    }
  }

  &__status {
    font-size: 12px;
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;

    &.is-past {
      background: rgba(0, 0, 0, 0.2);
    }
  }

  &__display {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  &__item {
    text-align: center;
    min-width: 50px;
  }

  &__number {
    font-size: 32px;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 12px;
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }

  &__label {
    font-size: 12px;
    margin-top: 4px;
    opacity: 0.8;
  }

  &__separator {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  &__past {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    gap: 8px;

    .iconify {
      font-size: 48px;
    }
  }

  &__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;

    .el-button {
      border-radius: 20px;
      font-size: 12px;
      
      &:not(.el-button--primary) {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: #fff;
        
        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }
}
</style>
