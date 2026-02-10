<template>
  <div v-if="visible && isPerformanceMonitorVisible" class="fps-monitor-container" :class="[
    `position-${performanceMonitorPosition}`,
    `layout-${performanceMonitorLayout || 'merged'}`,
    `direction-${performanceMonitorDirection || 'vertical'}`
  ]">
    <!-- FPS Item -->
    <div class="monitor-item fps-item" :class="getFpsClass(fps)">
      <div class="item-content">
        <span class="value">{{ fps }}</span>
        <span class="label">FPS</span>
      </div>
      <div v-if="performanceMonitorMode === 'detailed'" class="mini-chart">
        <div 
          v-for="(bar, index) in history" 
          :key="index" 
          class="chart-bar"
          :style="{ height: `${Math.min(bar, 60) / 60 * 100}%`, backgroundColor: getBarColor(bar) }"
        ></div>
      </div>
    </div>
    
    <!-- CPU Item -->
    <div v-if="cpuMonitorEnabled" class="monitor-item cpu-item">
      <div class="item-content">
        <span class="value">{{ cpuLoad }}%</span>
        <span class="label">CPU</span>
      </div>
      <div v-if="performanceMonitorMode === 'detailed'" class="mini-bar-gauge">
        <div class="gauge-fill" :style="{ width: `${cpuLoad}%`, backgroundColor: getCpuColor(cpuLoad) }"></div>
      </div>
    </div>

    <!-- Memory Item -->
    <div v-if="memory && memoryMonitorEnabled" class="monitor-item memory-item">
      <div class="item-content">
        <span class="value">{{ memory.used }}</span>
        <span class="label">MB</span>
      </div>
      <div v-if="performanceMonitorMode === 'detailed'" class="mini-bar-gauge">
         <div class="gauge-fill" :style="{ width: `${Math.min(parseFloat(memory.used) / 1000 * 100, 100)}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useThemeStore } from "../../stores/themeStore";
import { storeToRefs } from "pinia";

const themeStore = useThemeStore();
const { 
  memoryMonitorEnabled, 
  cpuMonitorEnabled, 
  performanceMonitorPosition, 
  isPerformanceMonitorVisible,
  performanceMonitorMode,
  performanceMonitorLayout,
  performanceMonitorDirection
} = storeToRefs(themeStore);

const props = defineProps({
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

const getBarColor = (val: number) => {
  if (val >= 50) return '#00ffff'; // Cyan
  if (val >= 30) return '#ffaa00'; // Orange
  return '#ff00ff'; // Magenta (Warning)
};

const getCpuColor = (val: number) => {
  if (val < 50) return '#00ff00';
  if (val < 80) return '#ffaa00';
  return '#ff0000';
};

const getFpsClass = (val: number) => {
  if (val >= 50) return 'high-fps';
  if (val >= 30) return 'med-fps';
  return 'low-fps';
};

const getMemoryClass = (mem: { used: string, limit: string }) => {
  // Simple heuristic: if used > 80% of typical limit (e.g. 1GB for tab?), but limits vary wildly.
  // Just return neutral for now, or maybe based on absolute size.
  return 'memory-normal';
};

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
  // If frame time > 16.6ms (60fps interval), it implies main thread is busy
  const frameDuration = now - lastFrameTime;
  lastFrameTime = now;
  
  // Estimate CPU load: (frameDuration / 16.6) * 100, clamped to 0-100
  // But wait, if frameDuration is 16.6ms, it doesn't mean CPU is 100% busy, 
  // it just means we hit the target.
  // A better heuristic: if fps < 60, CPU load increases.
  // Let's use a simple inverted FPS mapping for "Main Thread Load"
  // 60fps -> 0% load (ideal), 30fps -> 50% load, 0fps -> 100% load
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

.fps-monitor-container.layout-merged.direction-vertical .monitor-item {
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fps-monitor-container.layout-merged.direction-vertical .monitor-item:last-child {
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

.fps-monitor-container.layout-merged.direction-horizontal .monitor-item {
  padding-right: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fps-monitor-container.layout-merged.direction-horizontal .monitor-item:last-child {
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

.fps-monitor-container.layout-split .monitor-item {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  min-width: 100px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* Cleanup old selectors to prevent conflict */
/* Removed: .layout-split-vertical, .layout-split-horizontal */

/* Common Item Styles */
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
  padding: 2px 0; /* Add slight padding for breathing room */
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

/* Color Classes for FPS Text */
.high-fps .value { color: #00ffff; }
.med-fps .value { color: #ffaa00; }
.low-fps .value { color: #ff00ff; }

/* Visual Elements (Detailed Mode) */
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
