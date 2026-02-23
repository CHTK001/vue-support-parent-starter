<template>
  <div v-if="battery" class="monitor-item battery-item">
    <div class="item-content">
      <div class="battery-container">
        <div v-if="mode === 'detailed'" class="battery-gauge">
          <div class="battery-tip"></div>
          <div class="battery-body">
            <div class="battery-fill" :style="{ height: `${battery.level}%`, backgroundColor: batteryColor }"></div>
          </div>
        </div>
        <div v-else class="battery-icon-wrapper" :style="{ color: batteryColor }">
          <IconifyIconOnline :icon="batteryIcon" class="battery-icon" />
          <div v-if="battery.charging" class="charging-indicator"></div>
        </div>
      </div>
      <div class="text-info">
      <span class="value">{{ battery.level }}%</span>
      <span class="label">{{ battery.charging ? 'CHG' : 'BAT' }}</span>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IconifyIconOnline } from "@repo/components/ReIcon";

defineProps({
  mode: { type: String, required: true }
});

const battery = ref<{ level: number, charging: boolean } | null>(null);

const updateBattery = async () => {
  if ((navigator as any).getBattery) {
    try {
      const bat = await (navigator as any).getBattery();
      battery.value = {
        level: Math.round(bat.level * 100),
        charging: bat.charging
      };
      
      bat.onlevelchange = () => {
        if (battery.value) battery.value.level = Math.round(bat.level * 100);
      };
      bat.onchargingchange = () => {
        if (battery.value) battery.value.charging = bat.charging;
      };
    } catch (e) {
      battery.value = null;
    }
  }
};

const batteryIcon = computed(() => {
  if (battery.value?.charging) return "ri:battery-charge-fill";
  if (battery.value && battery.value.level >= 90) return "ri:battery-fill";
  if (battery.value && battery.value.level >= 70) return "ri:battery-2-fill";
  if (battery.value && battery.value.level >= 40) return "ri:battery-low-fill";
  return "ri:battery-low-line";
});

const batteryColor = computed(() => {
  if (!battery.value) return "#00ccff";
  if (battery.value.charging) return "#00ff00";
  if (battery.value.level >= 60) return "#00ff00";
  if (battery.value.level >= 30) return "#ffaa00";
  return "#ff0000";
});

onMounted(() => {
  updateBattery();
});
</script>

<style scoped>
.monitor-item {
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: monospace;
  transition: all 0.3s ease;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.2;
  padding: 2px 0;
}

.battery-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.battery-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.battery-icon {
  font-size: 16px;
  line-height: 1;
}

.charging-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 4px;
  height: 4px;
  background: #00ff00;
  border-radius: 50%;
  animation: pulse-charge 1.5s infinite ease-in-out;
}

@keyframes pulse-charge {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.text-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
}

.value {
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  line-height: 1;
}

.label {
  font-size: 10px;
  opacity: 0.8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  line-height: 1;
}

.battery-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.battery-tip {
  width: 8px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px 2px 0 0;
  flex-shrink: 0;
}

.battery-body {
  width: 20px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.battery-fill {
  width: 100%;
  border-radius: 2px;
  transition: height 0.3s ease, background-color 0.3s ease;
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>
