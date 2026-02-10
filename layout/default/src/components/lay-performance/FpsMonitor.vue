<template>
  <div v-if="visible && isPerformanceMonitorVisible" class="fps-monitor-container" :class="[
    `position-${performanceMonitorPosition}`,
    `layout-${performanceMonitorLayout || 'merged'}`,
    `direction-${performanceMonitorDirection || 'vertical'}`
  ]">
    <!-- FPS Item -->
    <FpsItem :fps="fps" :history="history" :mode="performanceMonitorMode" />
    
    <!-- CPU Item -->
    <CpuItem v-if="cpuMonitorEnabled" :cpu-load="cpuLoad" :mode="performanceMonitorMode" />

    <!-- Memory Item -->
    <MemoryItem v-if="memoryMonitorEnabled" :memory="memory" :mode="performanceMonitorMode" />

    <!-- Bandwidth Item -->
    <BandwidthItem v-if="bandwidthMonitorEnabled" :mode="performanceMonitorMode" />

    <!-- Battery Item -->
    <BatteryItem v-if="batteryMonitorEnabled" :mode="performanceMonitorMode" />
    
    <!-- Bluetooth Item -->
    <BluetoothItem v-if="bluetoothMonitorEnabled" :mode="performanceMonitorMode" />

    <!-- Screen Item -->
    <ScreenItem v-if="screenMonitorEnabled" :mode="performanceMonitorMode" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useThemeStore } from "../../stores/themeStore";
import { storeToRefs } from "pinia";
import FpsItem from './components/FpsItem.vue';
import CpuItem from './components/CpuItem.vue';
import MemoryItem from './components/MemoryItem.vue';
import BandwidthItem from './components/BandwidthItem.vue';
import BatteryItem from './components/BatteryItem.vue';
import BluetoothItem from './components/BluetoothItem.vue';
import ScreenItem from './components/ScreenItem.vue';

const themeStore = useThemeStore();
const { 
  memoryMonitorEnabled, 
  cpuMonitorEnabled, 
  bandwidthMonitorEnabled,
  batteryMonitorEnabled,
  bluetoothMonitorEnabled,
  screenMonitorEnabled,
  performanceMonitorPosition, 
  isPerformanceMonitorVisible,
  performanceMonitorMode,
  performanceMonitorLayout,
  performanceMonitorDirection
} = storeToRefs(themeStore);

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const fps = ref(60);
const cpuLoad = ref(0);
const memory = ref<{ used: string, limit: string } | null>(null);
const history = ref<number[]>(new Array(20).fill(60));
let frameCount = 0;
let lastTime = performance.now();
let lastFrameTime = performance.now();
let animationFrameId: number;

const updateMemory = () => {
  if ((performance as any).memory) {
    const mem = (performance as any).memory;
    memory.value = {
      used: (mem.usedJSHeapSize / 1048576).toFixed(1),
      limit: (mem.jsHeapSizeLimit / 1048576).toFixed(1)
    };
  }
};

const updateFps = () => {
  const now = performance.now();
  
  // Calculate Frame Time for CPU Load estimation
  const frameDuration = now - lastFrameTime;
  lastFrameTime = now;
  
  // Estimate CPU load based on FPS
  // Formula: (1 - (fps / 60)) * 100
  
  frameCount++;
  
  if (now - lastTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (now - lastTime));
    
    // Update CPU Load estimation based on FPS
    const load = Math.max(0, Math.min(100, (1 - (fps.value / 60)) * 100));
    cpuLoad.value = Math.round(load);

    frameCount = 0;
    lastTime = now;
    
    history.value.shift();
    history.value.push(fps.value);
    
    if (memoryMonitorEnabled.value) {
      updateMemory();
    }
  }
  
  animationFrameId = requestAnimationFrame(updateFps);
};

onMounted(() => {
  updateFps();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.fps-monitor-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  pointer-events: none;
  transition: all 0.3s;
  /* Default text color to ensure visibility against dark background */
  color: #fff;
}

/* Position Styles */
.fps-monitor-container.position-top-left { top: 10px; left: 10px; }
.fps-monitor-container.position-top-center { top: 10px; left: 50%; transform: translateX(-50%); }
.fps-monitor-container.position-top-right { top: 10px; right: 10px; }

.fps-monitor-container.position-left-center { top: 50%; left: 10px; transform: translateY(-50%); }
.fps-monitor-container.position-right-center { top: 50%; right: 10px; transform: translateY(-50%); }

.fps-monitor-container.position-bottom-left { bottom: 10px; left: 10px; }
.fps-monitor-container.position-bottom-center { bottom: 10px; left: 50%; transform: translateX(-50%); }
.fps-monitor-container.position-bottom-right { bottom: 10px; right: 10px; }

/* Layout Styles */

/* 1. Merged Layout (Default) */
.fps-monitor-container.layout-merged {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 8px;
  min-width: 100px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

/* Merged + Vertical (Default) */
.fps-monitor-container.layout-merged.direction-vertical {
  flex-direction: column;
}

.fps-monitor-container.layout-merged.direction-vertical :deep(.monitor-item) {
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fps-monitor-container.layout-merged.direction-vertical :deep(.monitor-item:last-child) {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* Merged + Horizontal */
.fps-monitor-container.layout-merged.direction-horizontal {
  flex-direction: row;
  gap: 12px;
  align-items: stretch;
}

.fps-monitor-container.layout-merged.direction-horizontal :deep(.monitor-item) {
  padding-right: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fps-monitor-container.layout-merged.direction-horizontal :deep(.monitor-item:last-child) {
  padding-right: 0;
  border-right: none;
}

/* 2. Split Layout */
.fps-monitor-container.layout-split {
  gap: 6px;
}

/* Split + Vertical */
.fps-monitor-container.layout-split.direction-vertical {
  flex-direction: column;
}

/* Split + Horizontal */
.fps-monitor-container.layout-split.direction-horizontal {
  flex-direction: row;
}

.fps-monitor-container.layout-split :deep(.monitor-item) {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  min-width: 100px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
</style>
