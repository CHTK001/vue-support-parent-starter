<template>
  <div class="monitor-item page-time-item">
    <div class="item-content">
      <span class="value">{{ formattedTime }}</span>
      <span class="label">运行</span>
    </div>
    <div v-if="mode === 'detailed'" class="time-details">
      <span class="detail-text">加载: {{ loadTime }}ms</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  mode: { type: String, required: true }
});

const runtime = ref(0);
const loadTime = ref(0);
let intervalId: number | null = null;
const startTime = Date.now();

const updateTime = () => {
  runtime.value = Math.floor((Date.now() - startTime) / 1000);
  
  // 获取页面加载时间
  if (loadTime.value === 0 && performance.timing) {
    const timing = performance.timing;
    loadTime.value = timing.loadEventEnd - timing.navigationStart;
  }
};

const formattedTime = computed(() => {
  const hours = Math.floor(runtime.value / 3600);
  const minutes = Math.floor((runtime.value % 3600) / 60);
  const seconds = runtime.value % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

onMounted(() => {
  updateTime();
  intervalId = window.setInterval(updateTime, 1000);
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

.time-details {
  margin-top: 4px;
}

.detail-text {
  font-size: 9px;
  opacity: 0.7;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
</style>

