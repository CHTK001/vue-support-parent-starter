<template>
  <div v-if="latency !== null" class="monitor-item network-latency-item">
    <div class="item-content">
      <span class="value">{{ latency }}ms</span>
      <span class="label">延迟</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-bar-gauge">
      <div class="gauge-fill" :style="{ width: `${Math.min((latency / 200) * 100, 100)}%`, backgroundColor: getLatencyColor(latency) }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  mode: { type: String, required: true }
});

const latency = ref<number | null>(null);
let intervalId: number | null = null;

const measureLatency = async () => {
  try {
    // 优先使用 Connection API（如果可用）
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn && conn.rtt) {
      latency.value = conn.rtt;
      return;
    }

    // 如果 Connection API 不可用，使用 fetch 测量延迟
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
      await fetch(window.location.origin + '/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const endTime = performance.now();
      latency.value = Math.round(endTime - startTime);
    } catch (error) {
      clearTimeout(timeoutId);
      latency.value = null;
    }
  } catch (error) {
    latency.value = null;
  }
};

const getLatencyColor = (val: number) => {
  if (val < 50) return '#00ff00';
  if (val < 100) return '#ffaa00';
  return '#ff0000';
};

onMounted(() => {
  measureLatency();
  intervalId = window.setInterval(measureLatency, 3000);
});

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
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

