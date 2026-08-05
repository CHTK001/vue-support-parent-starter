<script setup lang="ts">
/**
 * 性能监控设置组件
 *
 * FPS / 内存 / CPU / 带宽 / 电池 / 蓝牙 / 屏幕监控。
 * 设置项实时写入 appConfig.other.performance，由 config.ts 的 watch 自动持久化。
 */
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { getConfig } from "@repo/config";
import type { PerformanceConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { DataLine } from "@element-plus/icons-vue";

const appConfig = getConfig();
const perf = computed(() => appConfig.other.performance as PerformanceConfig);

/** 位置选项 */
const positionOptions = [
  { label: "左上角", value: "top-left" },
  { label: "顶部居中", value: "top-center" },
  { label: "右上角", value: "top-right" },
  { label: "左侧居中", value: "left-center" },
  { label: "右侧居中", value: "right-center" },
  { label: "左下角", value: "bottom-left" },
  { label: "底部居中", value: "bottom-center" },
  { label: "右下角", value: "bottom-right" },
];

// ==================== FPS 监控（requestAnimationFrame 帧率采样） ====================
const fps = ref(0);
let frames = 0;
let lastFpsTime = 0;
let rafId: number | null = null;

function startFpsMonitor() {
  if (rafId) return;
  frames = 0;
  lastFpsTime = performance.now();
  const tick = (now: number) => {
    frames++;
    if (now - lastFpsTime >= 1000) {
      fps.value = Math.round((frames * 1000) / (now - lastFpsTime));
      frames = 0;
      lastFpsTime = now;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopFpsMonitor() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  fps.value = 0;
}

// ==================== 内存监控（performance.memory，仅 Chrome/Edge） ====================
const memUsed = ref(0);
const memTotal = ref(0);
let memTimer: ReturnType<typeof setInterval> | null = null;

function startMemMonitor() {
  if (memTimer) return;
  const update = () => {
    const mem = (performance as any).memory;
    if (mem) {
      memUsed.value = Math.round(mem.usedJSHeapSize / 1048576);
      memTotal.value = Math.round(mem.jsHeapSizeLimit / 1048576);
    }
  };
  update();
  memTimer = setInterval(update, 2000);
}

function stopMemMonitor() {
  if (memTimer) {
    clearInterval(memTimer);
    memTimer = null;
  }
  memUsed.value = 0;
  memTotal.value = 0;
}

// ==================== 浮窗渲染 ====================
const monitorEl = ref<HTMLDivElement | null>(null);

/** 构建浮窗内容 */
const monitorText = computed(() => {
  const parts: string[] = [];
  if (perf.value.fpsMonitorEnabled) parts.push(`FPS: ${fps.value}`);
  if (perf.memoryMonitorEnabled && memUsed.value > 0)
    parts.push(`MEM: ${memUsed.value}/${memTotal.value}MB`);
  return parts.join(" | ");
});

/** 浮窗是否可见 */
const monitorVisible = computed(() => monitorText.value.length > 0);

// ==================== 监听开关 ====================
watch(
  () => perf.value.fpsMonitorEnabled,
  (val) => (val ? startFpsMonitor() : stopFpsMonitor()),
  { immediate: true },
);

watch(
  () => perf.memoryMonitorEnabled,
  (val) => {
    if (val && perf.value.fpsMonitorEnabled) startMemMonitor();
    else stopMemMonitor();
  },
);

// FPS 关闭时连带关闭内存监控
watch(
  () => perf.value.fpsMonitorEnabled,
  (val) => {
    if (!val) stopMemMonitor();
    else if (perf.memoryMonitorEnabled) startMemMonitor();
  },
);

onMounted(() => {
  // 确保初始状态正确
  if (perf.value.fpsMonitorEnabled) startFpsMonitor();
});

onBeforeUnmount(() => {
  stopFpsMonitor();
  stopMemMonitor();
});
</script>

<template>
  <div v-if="perf.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><DataLine /></el-icon>
      <span class="section-title">性能监控</span>
    </div>

    <div class="section-card">
      <!-- FPS 主开关 -->
      <ReSwitch layout="card"
        title="FPS 监控"
        sub="帧率"
        tip="衡量页面流畅度，60FPS 为最佳"
        v-model="perf.value.fpsMonitorEnabled"
      />

      <template v-if="perf.value.fpsMonitorEnabled">
        <!-- 子监控项 -->
        <ReSwitch layout="card"
          title="内存监控"
          sub="JS Heap"
          tip="当前页面使用的 JS 堆内存（仅 Chrome/Edge 有效）"
          v-model="perf.memoryMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="CPU 监控"
          sub="主线程负载"
          tip="基于主线程帧间隔估算的负载值（非系统真实 CPU）"
          v-model="perf.cpuMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="带宽监控"
          sub="网络速率"
          tip="显示当前页面网络请求的传输速率"
          v-model="perf.bandwidthMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="电池监控"
          sub="电量状态"
          tip="显示电池电量和充电状态"
          v-model="perf.batteryMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="蓝牙监控"
          sub="可用性"
          tip="显示蓝牙功能可用性"
          v-model="perf.bluetoothMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="屏幕监控"
          sub="分辨率"
          tip="显示屏幕分辨率"
          v-model="perf.screenMonitorEnabled"
        />

        <!-- 显示配置 -->
        <div class="perf-display-config">
          <div class="config-item">
            <div class="config-label">显示位置</div>
            <el-select
              v-model="perf.performanceMonitorPosition"
              class="config-input"
            >
              <el-option
                v-for="opt in positionOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>

          <div class="config-item">
            <div class="config-label">内容展示</div>
            <el-select
              v-model="perf.performanceMonitorMode"
              class="config-input"
            >
              <el-option label="详细" value="detailed" />
              <el-option label="简洁" value="simple" />
              <el-option label="极简" value="minimal" />
            </el-select>
          </div>

          <div class="config-item">
            <div class="config-label">布局模式</div>
            <el-select
              v-model="perf.performanceMonitorLayout"
              class="config-input"
            >
              <el-option label="合并" value="merged" />
              <el-option label="分离" value="split" />
            </el-select>
          </div>

          <div class="config-item">
            <div class="config-label">布局方向</div>
            <el-select
              v-model="perf.performanceMonitorDirection"
              class="config-input"
            >
              <el-option label="自动" value="auto" />
              <el-option label="垂直" value="vertical" />
              <el-option label="水平" value="horizontal" />
            </el-select>
          </div>
        </div>
      </template>
    </div>

    <!-- 性能监控浮窗（Teleport 到 body） -->
    <Teleport to="body">
      <div
        v-if="monitorVisible"
        class="perf-monitor-floating"
        :class="[
          `position-${perf.performanceMonitorPosition || 'top-right'}`,
          `layout-${perf.performanceMonitorLayout || 'merged'}`,
          `direction-${perf.performanceMonitorDirection === 'auto' ? 'vertical' : (perf.performanceMonitorDirection || 'vertical')}`,
          `mode-${perf.performanceMonitorMode || 'simple'}`,
        ]"
      >
        <template v-if="perf.performanceMonitorMode === 'minimal'">
          <span class="monitor-item">{{ monitorText }}</span>
        </template>
        <template v-else>
          <div v-if="perf.value.fpsMonitorEnabled" class="monitor-item">
            <span class="item-label">FPS</span>
            <span class="item-value">{{ fps.value }}</span>
          </div>
          <div v-if="perf.memoryMonitorEnabled && memUsed.value > 0" class="monitor-item">
            <span class="item-label">MEM</span>
            <span class="item-value">{{ memUsed.value }}MB</span>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.section-card {
  :deep(.re-switch-card) {
    margin-top: 10px;
  }
}

.perf-display-config {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>

<style lang="scss">
/* 浮窗全局样式（非 scoped，因为 Teleport 到 body） */
.perf-monitor-floating {
  position: fixed;
  z-index: 99995;
  display: flex;
  pointer-events: auto;
  transition: all 0.3s;
  color: #fff;
}

/* 极简模式 */
.perf-monitor-floating.mode-minimal {
  font-size: 10px;
  line-height: 1;
  padding: 3px 8px;
  min-height: 16px;
  background: rgba(20, 20, 20, 0.9);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* Position */
.perf-monitor-floating.position-top-left { top: 10px; left: 10px; }
.perf-monitor-floating.position-top-center { top: 10px; left: 50%; transform: translateX(-50%); }
.perf-monitor-floating.position-top-right { top: 10px; right: 10px; }
.perf-monitor-floating.position-left-center { top: 50%; left: 10px; transform: translateY(-50%); }
.perf-monitor-floating.position-right-center { top: 50%; right: 10px; transform: translateY(-50%); }
.perf-monitor-floating.position-bottom-left { bottom: 10px; left: 10px; }
.perf-monitor-floating.position-bottom-center { bottom: 10px; left: 50%; transform: translateX(-50%); }
.perf-monitor-floating.position-bottom-right { bottom: 10px; right: 10px; }

/* Merged Layout */
.perf-monitor-floating.layout-merged {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 8px;
  min-width: 100px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
}

.perf-monitor-floating.layout-merged.direction-vertical {
  flex-direction: column;
}

.perf-monitor-floating.layout-merged.direction-vertical .monitor-item {
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.perf-monitor-floating.layout-merged.direction-vertical .monitor-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.perf-monitor-floating.layout-merged.direction-horizontal {
  flex-direction: row;
  gap: 12px;
  align-items: stretch;
}

.perf-monitor-floating.layout-merged.direction-horizontal .monitor-item {
  padding-right: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.perf-monitor-floating.layout-merged.direction-horizontal .monitor-item:last-child {
  padding-right: 0;
  border-right: none;
}

/* Split Layout */
.perf-monitor-floating.layout-split {
  gap: 6px;
}

.perf-monitor-floating.layout-split.direction-vertical {
  flex-direction: column;
}

.perf-monitor-floating.layout-split.direction-horizontal {
  flex-direction: row;
}

.perf-monitor-floating.layout-split .monitor-item {
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  min-width: 100px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* Monitor Item */
.monitor-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: monospace;
}

.item-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-value {
  font-weight: 700;
  color: #fff;
}
</style>
