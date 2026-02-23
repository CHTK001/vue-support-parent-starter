<template>
  <div v-if="memory" class="monitor-item memory-item">
    <div class="item-content">
      <span class="value">{{ memory.used }}</span>
      <span class="label">MB</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-bar-gauge">
       <div class="gauge-fill" :style="{ width: `${Math.min((parseFloat(memory.used) / parseFloat(memory.limit)) * 100, 100)}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  memory: { type: Object as PropType<{ used: string, limit: string } | null>, default: null },
  mode: { type: String, required: true }
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
