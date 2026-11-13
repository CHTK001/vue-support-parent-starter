<script setup lang="ts">
/**
 * PerfMonitor —— 性能监控常驻浮窗
 *
 * 独立于主题配置面板挂载，切换 tab / 页面时持续显示。
 * 通过 appConfig.other.performance 控制启停与展示参数。
 */
import { computed, watch } from "vue";
import { getConfig } from "@repo/config";
import type { PerformanceConfig } from "@repo/config";
import { usePerfMonitor } from "./ThemeConfig/components/usePerfMonitor";

const appConfig = getConfig();
const perf = computed(() => appConfig.other.performance as PerformanceConfig);
const { data, startAll, stopAll } = usePerfMonitor();

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
</script>

<template>
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
            <span class="perf-metric__value" :style="{ color: data.cpu > 70 ? '#ef4444' : (data.cpu > 40 ? '#eab308' : '#22c55e') }">{{ data.cpu }}<small>%</small></span>
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
              <span :class="['perf-net-dot', { 'perf-net-dot--online': data.networkStatus }]"></span>
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
</template>

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
  white-space: nowrap;
  transition: all 0.3s ease;
}

.perf-overlay.position-top-left { top: 12px; left: 12px; }
.perf-overlay.position-top-center { top: 12px; left: 50%; transform: translateX(-50%); }
.perf-overlay.position-top-right { top: 60px; right: 12px; }
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

/* 分离：外框让位，每个指标自己成块，否则和底色一致看不出分块 */
.perf-overlay--split {
  gap: 6px;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;

  .perf-item {
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    padding: 6px 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(12px);
  }
}

.perf-overlay--horizontal { flex-direction: row; align-items: center; }
.perf-overlay--vertical { flex-direction: column; align-items: stretch; }

.perf-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
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
  white-space: nowrap;
}

.perf-overlay--detailed {
  padding: 14px 16px;
  width: max-content;
  min-width: 200px;
  max-width: 360px;

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
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
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

/* 详情 + 水平：指标横排，否则「水平」对详情没有任何效果 */
.perf-overlay--detailed.perf-overlay--horizontal {
  max-width: min(92vw, 640px);

  .perf-detailed {
    flex-direction: row;
    align-items: stretch;
    gap: 4px;
  }

  .perf-metric {
    flex-direction: column;
    align-items: flex-start;
    padding: 4px 10px;
    border-bottom: none;

    & + .perf-metric {
      border-left: 1px solid rgba(255, 255, 255, 0.06);
    }

    .perf-metric__value {
      text-align: left;
    }
  }
}

/* 详情 + 分离：每个指标自己成块，和简洁模式的分块观感一致 */
.perf-overlay--detailed.perf-overlay--split {
  padding: 0;

  .perf-detailed {
    gap: 6px;
  }

  .perf-metric {
    padding: 6px 10px;
    border-bottom: none;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(12px);
  }
}
</style>