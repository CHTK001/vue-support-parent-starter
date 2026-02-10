<template>
  <div v-if="isAvailable" class="monitor-item bluetooth-item">
    <div class="item-content">
      <span class="value">ON</span>
      <span class="label">BLE</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-bar-gauge">
       <div class="gauge-fill" style="width: 100%; background-color: #007bff"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

defineProps({
  mode: { type: String, required: true }
});

const isAvailable = ref(false);

onMounted(async () => {
  if ((navigator as any).bluetooth) {
    try {
      isAvailable.value = await (navigator as any).bluetooth.getAvailability();
    } catch (e) {
      console.error('Bluetooth availability check failed:', e);
      isAvailable.value = false;
    }
  }
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
