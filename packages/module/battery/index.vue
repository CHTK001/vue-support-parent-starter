<script setup>
/**
 * 电池状态部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted, onUnmounted, computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const battery = reactive({
  level: 100,
  charging: false,
  supported: true,
});

let batteryRef = null;

const updateBatteryInfo = (batteryManager) => {
  battery.level = Math.round(batteryManager.level * 100);
  battery.charging = batteryManager.charging;
};

const batteryIcon = computed(() => {
  if (battery.charging) return "ri:battery-charge-fill";
  if (battery.level >= 90) return "ri:battery-fill";
  if (battery.level >= 70) return "ri:battery-2-fill";
  if (battery.level >= 40) return "ri:battery-low-fill";
  return "ri:battery-low-line";
});

const batteryColor = computed(() => {
  if (battery.charging) return "#67c23a";
  if (battery.level >= 60) return "#67c23a";
  if (battery.level >= 30) return "#e6a23c";
  return "#f56c6c";
});

onMounted(async () => {
  if ("getBattery" in navigator) {
    try {
      batteryRef = await navigator.getBattery();
      updateBatteryInfo(batteryRef);
      batteryRef.addEventListener("chargingchange", () => updateBatteryInfo(batteryRef));
      batteryRef.addEventListener("levelchange", () => updateBatteryInfo(batteryRef));
    } catch (error) {
      battery.supported = false;
    }
  } else {
    battery.supported = false;
  }
});

onUnmounted(() => {
  if (batteryRef) {
    batteryRef.removeEventListener("chargingchange", () => updateBatteryInfo(batteryRef));
    batteryRef.removeEventListener("levelchange", () => updateBatteryInfo(batteryRef));
  }
});
</script>

<template>
  <div class="battery-card">
    <template v-if="battery.supported">
      <div class="battery-main">
        <div class="icon-container" :style="{ color: batteryColor }">
          <IconifyIconOnline :icon="batteryIcon" class="battery-icon" />
          <div v-if="battery.charging" class="charging-pulse"></div>
        </div>
        <div class="info-container">
          <div class="level-text">{{ battery.level }}%</div>
          <div class="status-text">{{ battery.charging ? '正在充电' : '使用电池' }}</div>
        </div>
      </div>
      <div class="battery-progress">
        <div class="progress-bar" :style="{ width: battery.level + '%', backgroundColor: batteryColor }"></div>
      </div>
    </template>
    <div v-else class="not-supported">
      <IconifyIconOnline icon="ri:battery-line" class="not-supported-icon" />
      <span>不支持电池状态</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.battery-card {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.battery-main {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.icon-container {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  
  .battery-icon {
    font-size: 28px;
  }
}

.charging-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  border: 2px solid currentColor;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

.info-container {
  .level-text {
    font-size: 20px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }
  
  .status-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.battery-progress {
  width: 100%;
  height: 6px;
  background: var(--el-fill-color-darker);
  border-radius: 3px;
  overflow: hidden;
  
  .progress-bar {
    height: 100%;
    transition: width 0.5s ease, background-color 0.5s ease;
  }
}

.not-supported {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  
  .not-supported-icon {
    font-size: 32px;
    opacity: 0.5;
  }
}
</style>
