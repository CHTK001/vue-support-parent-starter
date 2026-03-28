<template>
  <div
    v-if="visible && isPerformanceMonitorVisible"
    class="fps-monitor-container"
    :class="[
      `position-${performanceMonitorPosition}`,
      `layout-${performanceMonitorLayout || 'merged'}`,
      `direction-${effectiveDirection}`,
      `mode-${performanceMonitorMode || 'simple'}`,
    ]"
  >
    <!-- FPS Item -->
    <FpsItem :fps="fps" :history="history" :mode="performanceMonitorMode" />

    <!-- CPU Item -->
    <CpuItem
      v-if="cpuMonitorEnabled"
      :cpu-load="cpuLoad"
      :mode="performanceMonitorMode"
    />

    <!-- Memory Item -->
    <MemoryItem
      v-if="memoryMonitorEnabled"
      :memory="memory"
      :mode="performanceMonitorMode"
    />

    <!-- Bandwidth Item -->
    <BandwidthItem
      v-if="bandwidthMonitorEnabled"
      :mode="performanceMonitorMode"
    />

    <!-- Battery Item -->
    <BatteryItem v-if="batteryMonitorEnabled" :mode="performanceMonitorMode" />

    <!-- Bluetooth Item -->
    <BluetoothItem
      v-if="bluetoothMonitorEnabled"
      :mode="performanceMonitorMode"
    />

    <!-- Screen Item -->
    <ScreenItem v-if="screenMonitorEnabled" :mode="performanceMonitorMode" />

    <!-- Network Latency Item -->
    <NetworkLatencyItem
      v-if="networkLatencyMonitorEnabled"
      :mode="performanceMonitorMode"
    />

    <!-- Storage Item -->
    <StorageItem v-if="storageMonitorEnabled" :mode="performanceMonitorMode" />

    <!-- Device Info Item -->
    <DeviceInfoItem
      v-if="deviceInfoMonitorEnabled"
      :mode="performanceMonitorMode"
    />

    <!-- Page Time Item -->
    <PageTimeItem
      v-if="pageTimeMonitorEnabled"
      :mode="performanceMonitorMode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useThemeStore } from "../../stores/themeStore";
import { storeToRefs } from "pinia";
import FpsItem from "./components/FpsItem.vue";
import CpuItem from "./components/CpuItem.vue";
import MemoryItem from "./components/MemoryItem.vue";
import BandwidthItem from "./components/BandwidthItem.vue";
import BatteryItem from "./components/BatteryItem.vue";
import BluetoothItem from "./components/BluetoothItem.vue";
import ScreenItem from "./components/ScreenItem.vue";
import NetworkLatencyItem from "./components/NetworkLatencyItem.vue";
import StorageItem from "./components/StorageItem.vue";
import DeviceInfoItem from "./components/DeviceInfoItem.vue";
import PageTimeItem from "./components/PageTimeItem.vue";
import {
  subscribePerformanceMonitor,
  type MonitorSnapshot,
} from "./monitor-runtime";

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
  performanceMonitorDirection,
} = storeToRefs(themeStore);

// 这些扩展监控项当前未接入主题 store，先保持关闭，避免组件本身出现运行时/类型错误。
const networkLatencyMonitorEnabled = computed(() => false);
const storageMonitorEnabled = computed(() => false);
const deviceInfoMonitorEnabled = computed(() => false);
const pageTimeMonitorEnabled = computed(() => false);

/**
 * 根据位置自动计算布局方向：
 * - 上下位置：横向布局
 * - 左右位置：纵向布局
 * - 其他情况默认纵向
 */
const effectiveDirection = computed(() => {
  const rawDirection = performanceMonitorDirection.value || "vertical";
  if (rawDirection !== "auto") {
    return rawDirection;
  }

  const position = performanceMonitorPosition.value || "bottom-right";

  if (position.startsWith("top") || position.startsWith("bottom")) {
    return "horizontal";
  }

  return "vertical";
});

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const fps = ref(60);
const cpuLoad = ref(0);
const memory = ref<{ used: string; limit: string } | null>(null);
const history = ref<number[]>(new Array(20).fill(60));
let stopMonitorSubscription: (() => void) | null = null;

const updateMonitorState = (snapshot: MonitorSnapshot) => {
  fps.value = snapshot.fps;
  cpuLoad.value = snapshot.cpuLoad;
  history.value = snapshot.history;
  memory.value = memoryMonitorEnabled.value ? snapshot.memory : null;
};

onMounted(() => {
  stopMonitorSubscription = subscribePerformanceMonitor(updateMonitorState);
});

onBeforeUnmount(() => {
  stopMonitorSubscription?.();
  stopMonitorSubscription = null;
});
</script>

<style scoped>
.fps-monitor-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  /* 允许性能监控面板响应鼠标交互 */
  pointer-events: auto;
  transition: all 0.3s;
  /* 默认文字颜色，保证在暗色背景下可见 */
  color: #fff;
}

/* 极简模式：在简洁模式基础上进一步压缩尺寸，减少占用 */
.fps-monitor-container.mode-minimal {
  font-size: 8px;
  line-height: 1;
}

.fps-monitor-container.mode-minimal.layout-merged {
  padding: 0 2px;
  /* 进一步压缩整体高度与宽度占用 */
  min-height: 14px;
  min-width: 40px;
}

.fps-monitor-container.mode-minimal.layout-split {
  gap: 1px;
}

.fps-monitor-container.mode-minimal :deep(.monitor-item .item-content) {
  padding: 0;
}

/* Position Styles */
.fps-monitor-container.position-top-left {
  top: 10px;
  left: 10px;
}
.fps-monitor-container.position-top-center {
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}
.fps-monitor-container.position-top-right {
  top: 10px;
  right: 10px;
}

.fps-monitor-container.position-left-center {
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
}
.fps-monitor-container.position-right-center {
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
}

.fps-monitor-container.position-bottom-left {
  bottom: 10px;
  left: 10px;
}
.fps-monitor-container.position-bottom-center {
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}
.fps-monitor-container.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

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

.fps-monitor-container.layout-merged.direction-vertical
  :deep(.monitor-item:last-child) {
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

.fps-monitor-container.layout-merged.direction-horizontal
  :deep(.monitor-item:last-child) {
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
