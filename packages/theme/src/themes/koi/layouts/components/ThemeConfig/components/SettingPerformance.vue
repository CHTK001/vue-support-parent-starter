<script setup lang="ts">
import { computed } from "vue";
import { getConfig } from "@repo/config";
import type { PerformanceConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { DataLine } from "@element-plus/icons-vue";

const appConfig = getConfig();
const perf = computed(() => appConfig.other.performance as PerformanceConfig);

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
</script>

<template>
  <div v-if="perf.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><DataLine /></el-icon>
      <span class="section-title">性能监控</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card" title="FPS" sub="帧率" tip="衡量页面流畅度，60FPS 为最佳" v-model="perf.fpsMonitorEnabled" />

      <template v-if="perf.fpsMonitorEnabled">
        <div class="perf-sub-grid">
          <ReSwitch layout="card" title="内存" sub="JS Heap" tip="当前页面使用的 JS 堆内存（仅 Chrome/Edge 有效）" v-model="perf.memoryMonitorEnabled" />
          <ReSwitch layout="card" title="CPU" sub="主线程负载" tip="基于主线程帧间隔估算的负载值" v-model="perf.cpuMonitorEnabled" />
          <ReSwitch layout="card" title="电池" sub="电量状态" v-model="perf.batteryMonitorEnabled" />
          <ReSwitch layout="card" title="蓝牙" sub="可用性" v-model="perf.bluetoothMonitorEnabled" />
          <ReSwitch layout="card" title="屏幕" sub="分辨率" v-model="perf.screenMonitorEnabled" />
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