<template>
  <div v-if="battery" class="monitor-item battery-item">
    <div class="item-content">
      <span class="value">{{ battery.level }}%</span>
      <span class="label">{{ battery.charging ? 'CHG' : 'BAT' }}</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-bar-gauge">
       <div class="gauge-fill" :style="{ width: `${battery.level}%`, backgroundColor: battery.charging ? '#00ff00' : (battery.level < 20 ? '#ff0000' : '#00ccff') }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

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
  justify-content: space-between;
  align-items: center;
  line-height: 1.2;
  padding: 2px 0;
}

.value {
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.label {
  font-size: 10px;
  opacity: 0.8;
  margin-left: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.mini-bar-gauge {
  height: 3px;
  background: rgba(255,255,255,0.2);
  margin-top: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  background: #ccc;
  transition: width 0.3s;
}
</style>
