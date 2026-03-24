<template>
  <div class="monitor-item screen-item">
    <div class="item-content">
      <span class="value">{{ resolution }}</span>
      <span class="label">SCR</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-bar-gauge">
       <div class="gauge-fill" style="width: 100%; background-color: #9c27b0"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  mode: { type: String, required: true }
});

const resolution = ref('');

const updateResolution = () => {
  resolution.value = `${window.screen.width}x${window.screen.height}`;
};

onMounted(() => {
  updateResolution();
  window.addEventListener('resize', updateResolution);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResolution);
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
