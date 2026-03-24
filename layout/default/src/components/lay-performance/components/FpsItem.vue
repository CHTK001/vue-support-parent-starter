<template>
  <div class="monitor-item fps-item" :class="getFpsClass(fps)">
    <div class="item-content">
      <span class="value">{{ fps }}</span>
      <span class="label">FPS</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-chart">
      <div 
        v-for="(bar, index) in history" 
        :key="index" 
        class="chart-bar"
        :style="{ height: `${Math.min(bar, 60) / 60 * 100}%`, backgroundColor: getBarColor(bar) }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  fps: { type: Number, required: true },
  history: { type: Array as PropType<number[]>, required: true },
  mode: { type: String, required: true }
});

const getBarColor = (val: number) => {
  if (val >= 50) return '#00ffff'; 
  if (val >= 30) return '#ffaa00'; 
  return '#ff00ff'; 
};

const getFpsClass = (val: number) => {
  if (val >= 50) return 'high-fps';
  if (val >= 30) return 'med-fps';
  return 'low-fps';
};
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

.high-fps .value { color: #00ffff; }
.med-fps .value { color: #ffaa00; }
.low-fps .value { color: #ff00ff; }

.mini-chart {
  display: flex;
  align-items: flex-end;
  height: 20px;
  margin-top: 4px;
  gap: 1px;
}

.chart-bar {
  flex: 1;
  min-width: 2px;
  background-color: #00ffff;
  opacity: 0.7;
  transition: height 0.2s ease;
}
</style>
