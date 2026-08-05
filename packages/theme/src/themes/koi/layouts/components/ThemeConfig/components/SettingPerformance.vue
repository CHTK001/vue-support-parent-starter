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
const performanceCfg = computed(() => appConfig.other.performance as PerformanceConfig);

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
  if (performanceCfg.value.fpsMonitorEnabled) parts.push(`FPS: ${fps.value}`);
  if (performanceCfg.value.memoryMonitorEnabled && memUsed.value > 0)
    parts.push(`MEM: ${memUsed.value}/${memTotal.value}MB`);
  return parts.join(" | ");
});

/** 浮窗是否可见 */
const monitorVisible = computed(() => monitorText.value.length > 0);

/** 浮窗位置样式 */
const monitorStyle = computed(() => {
  const pos = performanceCfg.value.performanceMonitorPosition;
  const map: Record<string, string> = {
    "top-left": "top: 8px; left: 8px;",
    "top-center": "top: 8px; left: 50%; transform: translateX(-50%);",
    "top-right": "top: 8px; right: 8px;",
    "left-center": "top: 50%; left: 8px; transform: translateY(-50%);",
    "right-center": "top: 50%; right: 8px; transform: translateY(-50%);",
    "bottom-left": "bottom: 8px; left: 8px;",
    "bottom-center": "bottom: 8px; left: 50%; transform: translateX(-50%);",
    "bottom-right": "bottom: 8px; right: 8px;",
  };
  return map[pos] || map["top-right"];
});

// ==================== 监听开关 ====================
watch(
  () => performanceCfg.value.fpsMonitorEnabled,
  (val) => (val ? startFpsMonitor() : stopFpsMonitor()),
  { immediate: true },
);

watch(
  () => performanceCfg.value.memoryMonitorEnabled,
  (val) => {
    if (val && performanceCfg.value.fpsMonitorEnabled) startMemMonitor();
    else stopMemMonitor();
  },
);

// FPS 关闭时连带关闭内存监控
watch(
  () => performanceCfg.value.fpsMonitorEnabled,
  (val) => {
    if (!val) stopMemMonitor();
    else if (performanceCfg.value.memoryMonitorEnabled) startMemMonitor();
  },
);

onMounted(() => {
  // 确保初始状态正确
  if (performanceCfg.value.fpsMonitorEnabled) startFpsMonitor();
});

onBeforeUnmount(() => {
  stopFpsMonitor();
  stopMemMonitor();
});
</script>

<template>
  <div v-if="performanceCfg.enable" class="config-section">
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
        v-model="performanceCfg.fpsMonitorEnabled"
      />

      <template v-if="performanceCfg.fpsMonitorEnabled">
        <!-- 子监控项 -->
        <ReSwitch layout="card"
          title="内存监控"
          sub="JS Heap"
          tip="当前页面使用的 JS 堆内存（仅 Chrome/Edge 有效）"
          v-model="performanceCfg.memoryMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="CPU 监控"
          sub="主线程负载"
          tip="基于主线程帧间隔估算的负载值（非系统真实 CPU）"
          v-model="performanceCfg.cpuMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="带宽监控"
          sub="网络速率"
          tip="显示当前页面网络请求的传输速率"
          v-model="performanceCfg.bandwidthMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="电池监控"
          sub="电量状态"
          tip="显示电池电量和充电状态"
          v-model="performanceCfg.batteryMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="蓝牙监控"
          sub="可用性"
          tip="显示蓝牙功能可用性"
          v-model="performanceCfg.bluetoothMonitorEnabled"
        />

        <ReSwitch layout="card"
          title="屏幕监控"
          sub="分辨率"
          tip="显示屏幕分辨率"
          v-model="performanceCfg.screenMonitorEnabled"
        />

        <!-- 显示配置 -->
        <div class="perf-display-config">
          <div class="config-item">
            <div class="config-label">显示位置</div>
            <el-select
              v-model="performanceCfg.performanceMonitorPosition"
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
              v-model="performanceCfg.performanceMonitorMode"
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
              v-model="performanceCfg.performanceMonitorLayout"
              class="config-input"
            >
              <el-option label="合并" value="merged" />
              <el-option label="分离" value="split" />
            </el-select>
          </div>

          <div class="config-item">
            <div class="config-label">布局方向</div>
            <el-select
              v-model="performanceCfg.performanceMonitorDirection"
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
        :style="monitorStyle"
      >
        {{ monitorText }}
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
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
  padding: 4px 10px;
  font-size: 12px;
  font-family: monospace;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  white-space: nowrap;
}
</style>
