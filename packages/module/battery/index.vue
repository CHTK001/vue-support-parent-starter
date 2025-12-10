<script setup>
/**
 * 电池状态部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.0
 */
import { reactive, onMounted, onUnmounted, computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 电池状态
const battery = reactive({
  level: 100,
  charging: false,
  chargingTime: 0,
  dischargingTime: 0,
  supported: true,
});

let batteryRef = null;

/**
 * 更新电池状态
 * @param {BatteryManager} batteryManager - 电池管理器
 */
const updateBatteryInfo = (batteryManager) => {
  battery.level = Math.round(batteryManager.level * 100);
  battery.charging = batteryManager.charging;
  battery.chargingTime = batteryManager.chargingTime;
  battery.dischargingTime = batteryManager.dischargingTime;
};

/**
 * 获取电池图标
 */
const batteryIcon = computed(() => {
  if (battery.charging) {
    return "ri:battery-charge-line";
  }
  if (battery.level >= 90) return "ri:battery-fill";
  if (battery.level >= 70) return "ri:battery-2-fill";
  if (battery.level >= 40) return "ri:battery-low-line";
  if (battery.level >= 20) return "ri:battery-low-line";
  return "ri:battery-line";
});

/**
 * 获取电池颜色
 */
const batteryColor = computed(() => {
  if (battery.charging) return "var(--el-color-success)";
  if (battery.level >= 60) return "var(--el-color-success)";
  if (battery.level >= 30) return "var(--el-color-warning)";
  return "var(--el-color-danger)";
});

/**
 * 格式化剩余时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间
 */
const formatTime = (seconds) => {
  if (!seconds || seconds === Infinity) return "--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
};

// 组件挂载时获取电池信息
onMounted(async () => {
  if ("getBattery" in navigator) {
    try {
      batteryRef = await navigator.getBattery();
      updateBatteryInfo(batteryRef);

      // 监听电池状态变化
      batteryRef.addEventListener("chargingchange", () => updateBatteryInfo(batteryRef));
      batteryRef.addEventListener("levelchange", () => updateBatteryInfo(batteryRef));
      batteryRef.addEventListener("chargingtimechange", () => updateBatteryInfo(batteryRef));
      batteryRef.addEventListener("dischargingtimechange", () => updateBatteryInfo(batteryRef));
    } catch (error) {
      console.error("获取电池信息失败:", error);
      battery.supported = false;
    }
  } else {
    battery.supported = false;
  }
});

// 组件卸载时移除监听
onUnmounted(() => {
  if (batteryRef) {
    batteryRef.removeEventListener("chargingchange", () => updateBatteryInfo(batteryRef));
    batteryRef.removeEventListener("levelchange", () => updateBatteryInfo(batteryRef));
  }
});
</script>

<template>
  <div class="battery-module">
    <div class="battery-module__content" v-if="battery.supported">
      <div class="battery-module__card">
        <div class="battery-module__icon" :style="{ color: batteryColor }">
          <IconifyIconOnline :icon="batteryIcon" />
        </div>
        <div class="battery-module__info">
          <div class="battery-module__level" :style="{ color: batteryColor }">
            {{ battery.level }}%
          </div>
          <div class="battery-module__status">
            {{ battery.charging ? "正在充电" : "使用电池" }}
          </div>
        </div>
        <div class="battery-module__progress">
          <div class="battery-module__progress-bar" :style="{ width: battery.level + '%', backgroundColor: batteryColor }"></div>
        </div>
        <div class="battery-module__time" v-if="battery.charging && battery.chargingTime">
          充满约 {{ formatTime(battery.chargingTime) }}
        </div>
        <div class="battery-module__time" v-else-if="!battery.charging && battery.dischargingTime">
          剩余约 {{ formatTime(battery.dischargingTime) }}
        </div>
      </div>
    </div>
    <div class="battery-module__unsupported" v-else>
      <IconifyIconOnline icon="ri:error-warning-line" />
      <span>您的浏览器不支持电池API</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.battery-module {
  &__content {
    border-radius: 12px;
  }

  &__card {
    background: linear-gradient(135deg, var(--el-fill-color-darker), var(--el-fill-color-dark));
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  &__icon {
    font-size: 48px;
    margin-bottom: 12px;
    transition: color 0.3s ease;
  }

  &__info {
    margin-bottom: 16px;
  }

  &__level {
    font-size: 32px;
    font-weight: 700;
    transition: color 0.3s ease;
  }

  &__status {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  &__progress {
    width: 100%;
    height: 8px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  &__progress-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease, background-color 0.3s ease;
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__unsupported {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: var(--el-text-color-secondary);
    gap: 8px;

    .iconify {
      font-size: 32px;
      color: var(--el-color-warning);
    }
  }
}
</style>
