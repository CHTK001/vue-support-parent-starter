<script setup>
/**
 * 问候语部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.0
 */
import { reactive, onMounted, computed, onUnmounted } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useUserStoreHook } from "@repo/core";
import { dateFormat } from "@repo/utils";

// 环境变量
const env = reactive({
  currentTime: new Date(),
  username: "",
});

let timer = null;

/**
 * 获取问候语
 */
const greeting = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "早上好";
  if (hour >= 9 && hour < 12) return "上午好";
  if (hour >= 12 && hour < 14) return "中午好";
  if (hour >= 14 && hour < 18) return "下午好";
  if (hour >= 18 && hour < 22) return "晚上好";
  return "夜深了";
});

/**
 * 获取时段图标
 */
const timeIcon = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "meteocons:sunrise-fill";
  if (hour >= 9 && hour < 18) return "meteocons:clear-day-fill";
  if (hour >= 18 && hour < 22) return "meteocons:sunset-fill";
  return "meteocons:clear-night-fill";
});

/**
 * 获取时段提示语
 */
const tipMessage = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "新的一天开始了，元气满满！";
  if (hour >= 9 && hour < 12) return "上午是最佳工作时间，加油！";
  if (hour >= 12 && hour < 14) return "记得吃午饭，休息一下！";
  if (hour >= 14 && hour < 18) return "下午茶时间，补充能量~";
  if (hour >= 18 && hour < 22) return "辛苦一天了，放松一下！";
  return "夜深了，注意休息哦~";
});

/**
 * 获取背景渐变色
 */
const bgGradient = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "linear-gradient(135deg, #ff9966, #ff5e62)";
  if (hour >= 9 && hour < 12) return "linear-gradient(135deg, #56CCF2, #2F80ED)";
  if (hour >= 12 && hour < 14) return "linear-gradient(135deg, #F2994A, #F2C94C)";
  if (hour >= 14 && hour < 18) return "linear-gradient(135deg, #11998e, #38ef7d)";
  if (hour >= 18 && hour < 22) return "linear-gradient(135deg, #ee9ca7, #ffdde1)";
  return "linear-gradient(135deg, #2c3e50, #4ca1af)";
});

/**
 * 格式化日期
 */
const formattedDate = computed(() => {
  return dateFormat(env.currentTime, "yyyy年MM月dd日");
});

/**
 * 格式化时间
 */
const formattedTime = computed(() => {
  return dateFormat(env.currentTime, "hh:mm:ss");
});

/**
 * 星期
 */
const weekDay = computed(() => {
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return days[env.currentTime.getDay()];
});

// 组件挂载时初始化
onMounted(() => {
  // 获取用户名
  try {
    const userStore = useUserStoreHook();
    env.username = userStore?.username || userStore?.nickname || "用户";
  } catch (e) {
    env.username = "用户";
  }

  // 更新时间
  timer = setInterval(() => {
    env.currentTime = new Date();
  }, 1000);
});

// 组件卸载时清理
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <div class="greeting-module">
    <div class="greeting-module__content" :style="{ background: bgGradient }">
      <div class="greeting-module__decoration">
        <div class="greeting-module__circle"></div>
        <div class="greeting-module__circle"></div>
        <div class="greeting-module__circle"></div>
      </div>

      <div class="greeting-module__main">
        <div class="greeting-module__icon">
          <IconifyIconOnline :icon="timeIcon" />
        </div>

        <div class="greeting-module__text">
          <div class="greeting-module__hello">
            {{ greeting }}，{{ env.username }}
          </div>
          <div class="greeting-module__tip">
            {{ tipMessage }}
          </div>
        </div>
      </div>

      <div class="greeting-module__time">
        <div class="greeting-module__clock">{{ formattedTime }}</div>
        <div class="greeting-module__date">
          {{ formattedDate }} {{ weekDay }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.greeting-module {
  &__content {
    border-radius: 12px;
    padding: 24px;
    color: #fff;
    position: relative;
    overflow: hidden;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  &__decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);

    &:nth-child(1) {
      width: 150px;
      height: 150px;
      top: -50px;
      right: -30px;
      animation: float 12s infinite ease-in-out;
    }

    &:nth-child(2) {
      width: 100px;
      height: 100px;
      bottom: -30px;
      left: -20px;
      animation: float 10s infinite ease-in-out reverse;
    }

    &:nth-child(3) {
      width: 60px;
      height: 60px;
      top: 50%;
      left: 30%;
      animation: pulse 6s infinite ease-in-out;
    }
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    z-index: 1;
  }

  &__icon {
    font-size: 48px;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }

  &__text {
    flex: 1;
  }

  &__hello {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &__tip {
    font-size: 14px;
    opacity: 0.9;
  }

  &__time {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    position: relative;
    z-index: 1;
    margin-top: 16px;
  }

  &__clock {
    font-size: 28px;
    font-weight: 700;
    font-family: "Avenir Next", "Helvetica Neue", monospace;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &__date {
    font-size: 14px;
    opacity: 0.9;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(5deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
}
</style>
