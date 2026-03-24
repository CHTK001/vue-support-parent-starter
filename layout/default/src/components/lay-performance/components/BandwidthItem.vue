<template>
  <div v-if="bandwidth" class="monitor-item bandwidth-item">
    <div class="item-content">
      <span class="value">{{ bandwidth.downlink }}</span>
      <span class="label">Mbps</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-bar-gauge">
       <div class="gauge-fill" :style="{ width: `${Math.min(bandwidth.downlink / 20 * 100, 100)}%`, backgroundColor: '#00ccff' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  mode: { type: String, required: true }
});

const bandwidth = ref<{ downlink: number, rtt: number } | null>(null);

const updateBandwidth = () => {
  const conn = (navigator as any).connection;
  if (conn) {
    bandwidth.value = {
      downlink: conn.downlink,
      rtt: conn.rtt
    };
  }
};

onMounted(() => {
  if ((navigator as any).connection) {
    updateBandwidth();
    (navigator as any).connection.addEventListener('change', updateBandwidth);
  }
});

onBeforeUnmount(() => {
  if ((navigator as any).connection) {
    (navigator as any).connection.removeEventListener('change', updateBandwidth);
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
