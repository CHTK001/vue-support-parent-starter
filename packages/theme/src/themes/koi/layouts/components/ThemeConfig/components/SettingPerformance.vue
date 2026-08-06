<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { getConfig } from "@repo/config";
import type { PerformanceConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { DataLine } from "@element-plus/icons-vue";
import { usePerfMonitor } from "./usePerfMonitor";

const appConfig = getConfig();
const perf = computed(() => appConfig.other.performance as PerformanceConfig);
const { data, startAll, stopAll } = usePerfMonitor();

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

const layoutDir = computed(() => {
  const pos = perf.value.performanceMonitorPosition || "top-right";
  return (pos === "left-center" || pos === "right-center") ? "vertical" : "horizontal";
});

const fpsColor = computed(() => {
  if (data.fps >= 55) return "#22c55e";
  if (data.fps >= 30) return "#eab308";
  return "#ef4444";
});

const batteryColor = computed(() => {
  if (data.batteryLevel >= 0.6) return "#22c55e";
  if (data.batteryLevel >= 0.3) return "#eab308";
  return "#ef4444";
});

const memPct = computed(() => data.memTotal > 0 ? Math.round((data.memUsed / data.memTotal) * 100) : 0);

const sparklinePath = computed(() => {
  const vals = data.fpsHistory;
  if (vals.length < 2) return "";
  const max = Math.max(60, ...vals);
  const w = 48, h = 20;
  return vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - (v / max) * h}`).join(" ");
});

const monitorVisible = computed(() => {
  if (!perf.value.fpsMonitorEnabled) return false;
  return data.fps > 0 || data.memUsed > 0 || data.cpu > 0 || data.batteryLevel > 0 || data.domNodes > 0;
});

watch(() => perf.value.fpsMonitorEnabled, (val) => {
  if (val) startAll(); else stopAll();
}, { immediate: true });

onMounted(() => {
  if (perf.value.fpsMonitorEnabled) startAll();
});
</script>

<template>
  <div v-if="perf.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><DataLine /></el-icon>
      <span class="section-title">性能监控</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card" title="FPS 监控" sub="帧率" tip="衡量页面流畅度，60FPS 为最佳" v-model="perf.fpsMonitorEnabled" />

      <template v-if="perf.fpsMonitorEnabled">
        <div class="perf-sub-grid">
          <ReSwitch layout="card" title="内存监控" sub="JS Heap" tip="当前页面使用的 JS 堆内存（仅 Chrome/Edge 有效）" v-model="perf.memoryMonitorEnabled" />
          <ReSwitch layout="card" title="CPU 监控" sub="主线程负载" tip="基于主线程帧间隔估算的负载值" v-model="perf.cpuMonitorEnabled" />
          <ReSwitch layout="card" title="电池监控" sub="电量状态" v-model="perf.batteryMonitorEnabled" />
          <ReSwitch layout="card" title="蓝牙监控" sub="可用性" v-model="perf.bluetoothMonitorEnabled" />
          <ReSwitch layout="card" title="屏幕监控" sub="分辨率" v-model="perf.screenMonitorEnabled" />
        </div>

        <div class="perf-config">
          <div class="perf-config-row">
            <span class="perf-config-label">显示位置</span>
            <el-select v-model="perf.performanceMonitorPosition" size="small" class="perf-config-select">
              <el-option v-for="opt in positionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div class="perf-config-row">
            <span class="perf-config-label">内容展示</span>
            <el-radio-group v-model="perf.performanceMonitorMode" size="small" class="perf-radio">
              <el-radio-button label="detailed">详细</el-radio-button>
              <el-radio-button label="simple">简洁</el-radio-button>
              <el-radio-button label="minimal">极简</el-radio-button>
            </el-radio-group>
          </div>
          <div class="perf-config-row">
            <span class="perf-config-label">布局模式</span>
            <el-radio-group v-model="perf.performanceMonitorLayout" size="small" class="perf-radio">
              <el-radio-button label="merged">合并</el-radio-button>
              <el-radio-button label="split">分离</el-radio-button>
            </el-radio-group>
          </div>
          <div class="perf-config-row">
            <span class="perf-config-label">布局方向</span>
            <el-radio-group v-model="perf.performanceMonitorDirection" size="small" class="perf-radio">
              <el-radio-button label="auto">自动</el-radio-button>
              <el-radio-button label="vertical">垂直</el-radio-button>
              <el-radio-button label="horizontal">水平</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="monitorVisible"
        class="perf-overlay"
        :class="[
          `perf-overlay--${perf.performanceMonitorMode || 'simple'}`,
          `perf-overlay--${perf.performanceMonitorLayout || 'merged'}`,
          `perf-overlay--${perf.performanceMonitorDirection === 'auto' ? layoutDir : (perf.performanceMonitorDirection || 'horizontal')}`,
          `position-${perf.performanceMonitorPosition || 'top-right'}`,
        ]"
      >
        <template v-if="perf.performanceMonitorMode === 'minimal'">
          <span class="perf-mini-text">
            <span v-if="perf.fpsMonitorEnabled">{{ data.fps }}<small>fps</small></span>
            <span v-if="perf.memoryMonitorEnabled && data.memUsed > 0">{{ data.memUsed }}<small>mb</small></span>
          </span>
        </template>

        <template v-else-if="perf.performanceMonitorMode === 'detailed'">
          <div class="perf-detailed">
            <div class="perf-metric" v-if="perf.fpsMonitorEnabled">
              <span class="perf-metric__label">FPS</span>
              <span class="perf-metric__value" :style="{ color: fpsColor }">{{ data.fps }}</span>
              <svg v-if="sparklinePath" class="perf-sparkline" width="48" height="20" viewBox="0 0 48 20">
                <polyline :points="sparklinePath" fill="none" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </div>
            <div class="perf-metric" v-if="perf.memoryMonitorEnabled && data.memTotal > 0">
              <span class="perf-metric__label">MEM</span>
              <span class="perf-metric__value">{{ data.memUsed }}<small>/{{ data.memTotal }}MB</small></span>
              <div class="perf-bar">
                <div class="perf-bar-fill" :style="{ width: memPct + '%' }"></div>
              </div>
            </div>
            <div class="perf-metric" v-if="perf.cpuMonitorEnabled">
              <span class="perf-metric__label">CPU</span>
              <span class="perf-metric__value" :style="{ color: data.cpu > 70 ? '#ef4444' : '#22c55e' }">{{ data.cpu }}<small>%</small></span>
              <div class="perf-bar">
                <div class="perf-bar-fill--cpu" :style="{ width: Math.min(data.cpu, 100) + '%' }"></div>
              </div>
            </div>
            <div class="perf-metric" v-if="perf.batteryMonitorEnabled && data.batteryLevel > 0">
              <span class="perf-metric__label">BAT</span>
              <span class="perf-metric__value">{{ Math.round(data.batteryLevel * 100) }}<small>%</small></span>
              <svg viewBox="0 0 40 18" width="40" height="18" :style="{ color: batteryColor }" class="perf-battery">
                <rect x="1" y="1" width="34" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.5" />
                <rect x="36" y="6" width="3" height="6" rx="1" fill="currentColor" />
                <rect x="3" y="3" :width="Math.max(0, data.batteryLevel * 32)" height="12" rx="2" fill="currentColor" opacity="0.75" />
                <g v-if="data.batteryCharging">
                  <path d="M20 4 L16 12 L19 12 L17 16 L23 9 L20 9 Z" fill="white" opacity="0.9" />
                </g>
              </svg>
            </div>
            <div class="perf-metric" v-if="data.domNodes > 0">
              <span class="perf-metric__label">DOM</span>
              <span class="perf-metric__value">{{ data.domNodes.toLocaleString() }}</span>
            </div>
            <div class="perf-metric" v-if="data.deviceMemory > 0">
              <span class="perf-metric__label">RAM</span>
              <span class="perf-metric__value">{{ data.deviceMemory }}<small>GB</small></span>
            </div>
            <div class="perf-metric">
              <span class="perf-metric__label">NET</span>
              <span class="perf-metric__value">
                <span class="perf-net-dot" :class="{ 'perf-net-dot--online': data.networkStatus }"></span>
              </span>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-if="perf.fpsMonitorEnabled" class="perf-item">
            <span class="perf-item__label">FPS</span>
            <span class="perf-item__value">{{ data.fps }}</span>
          </div>
          <div v-if="perf.memoryMonitorEnabled && data.memUsed > 0" class="perf-item">
            <span class="perf-item__label">MEM</span>
            <span class="perf-item__value">{{ data.memUsed }}MB</span>
          </div>
          <div v-if="perf.cpuMonitorEnabled && data.cpu > 0" class="perf-item">
            <span class="perf-item__label">CPU</span>
            <span class="perf-item__value">{{ data.cpu }}%</span>
          </div>
          <div v-if="perf.batteryMonitorEnabled && data.batteryLevel > 0" class="perf-item">
            <span class="perf-item__label">BAT</span>
            <span class="perf-item__value">{{ Math.round(data.batteryLevel * 100) }}%</span>
          </div>
          <div v-if="perf.screenMonitorEnabled && data.screenW > 0" class="perf-item">
            <span class="perf-item__label">SCR</span>
            <span class="perf-item__value">{{ data.screenW }}x{{ data.screenH }}</span>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.section-card {
  :deep(.re-switch-card) { margin-top: 10px; }
}

.perf-sub-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
  margin-top: 6px;
}

.perf-config {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.perf-config-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  &:last-child { margin-bottom: 0; }
  
  .perf-config-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    min-width: 50px;
  }
  
  .perf-config-select {
    width: 100px;
  }
  
  .perf-radio {
    :deep(.el-radio-button__inner) {
      font-size: 12px;
      padding: 4px 10px;
      border: 1px solid var(--el-border-color-lighter) !important;
    }
    :deep(.el-radio-button.is-active .el-radio-button__inner) {
      background: var(--el-color-primary);
      color: #fff;
      border-color: var(--el-color-primary) !important;
    }
  }
}
</style>

<style lang="scss">
.perf-overlay {
  position: fixed;
  z-index: 99995;
  display: flex;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  transition: all 0.3s ease;
}

.perf-overlay.position-top-left { top: 12px; left: 12px; }
.perf-overlay.position-top-center { top: 12px; left: 50%; transform: translateX(-50%); }
.perf-overlay.position-top-right { top: 12px; right: 12px; }
.perf-overlay.position-left-center { top: 50%; left: 12px; transform: translateY(-50%); }
.perf-overlay.position-right-center { top: 50%; right: 12px; transform: translateY(-50%); }
.perf-overlay.position-bottom-left { bottom: 12px; left: 12px; }
.perf-overlay.position-bottom-center { bottom: 12px; left: 50%; transform: translateX(-50%); }
.perf-overlay.position-bottom-right { bottom: 12px; right: 12px; }

.perf-overlay--minimal {
  font-size: 11px;
  padding: 4px 10px;
}
.perf-mini-text {
  color: rgba(255, 255, 255, 0.8);
  small { font-size: 9px; opacity: 0.5; margin-left: 2px; }
}

.perf-overlay--merged { padding: 10px 14px; }

.perf-overlay--split {
  gap: 4px;
  .perf-item {
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px 10px;
  }
}

.perf-overlay--horizontal { flex-direction: row; align-items: center; }
.perf-overlay--vertical { flex-direction: column; align-items: stretch; }

.perf-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.perf-item__label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.perf-item__value {
  font-weight: 700;
  font-size: 13px;
  color: #fff;
}

.perf-overlay--detailed {
  padding: 14px 16px;
  min-width: 180px;
  max-width: 340px;
  
  .perf-detailed {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .perf-metric {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      
      &:last-child { border-bottom: none; }
      
      &__label {
        width: 28px;
        flex-shrink: 0;
        font-size: 10px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      &__value {
        flex: 1;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        text-align: center;
        small {
          font-size: 10px;
          font-weight: 500;
          opacity: 0.5;
          margin-left: 2px;
        }
      }
      
      .perf-sparkline {
        width: 50px;
        height: 22px;
        color: rgba(255, 255, 255, 0.5);
        flex-shrink: 0;
      }
      
      .perf-bar {
        width: 50px;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        flex-shrink: 0;
        .perf-bar-fill {
          height: 100%;
          background: #818cf8;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .perf-bar-fill--cpu {
          background: linear-gradient(90deg, #22c55e, #eab308, #ef4444);
        }
      }
      
      .perf-battery { flex-shrink: 0; }
      
      .perf-net-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
        &.perf-net-dot--online { background: #22c55e; }
      }
    }
  }
}
</style>