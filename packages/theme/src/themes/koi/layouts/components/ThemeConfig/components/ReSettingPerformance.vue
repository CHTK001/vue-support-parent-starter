<script setup lang="ts">
import { computed } from "vue";
import { getConfig } from "@repo/config";
import type { PerformanceConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { DataLine } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";

const { t } = useI18n();

const appConfig = getConfig();
const perf = computed(() => appConfig.other.performance as PerformanceConfig);

const positionOptions = computed(() => [
  { label: t("performance.position.topLeft"), value: "top-left" },
  { label: t("performance.position.topCenter"), value: "top-center" },
  { label: t("performance.position.topRight"), value: "top-right" },
  { label: t("performance.position.leftCenter"), value: "left-center" },
  { label: t("performance.position.rightCenter"), value: "right-center" },
  { label: t("performance.position.bottomLeft"), value: "bottom-left" },
  { label: t("performance.position.bottomCenter"), value: "bottom-center" },
  { label: t("performance.position.bottomRight"), value: "bottom-right" },
]);
</script>

<template>
  <div v-if="perf.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><DataLine /></el-icon>
      <span class="section-title">{{ t("performance.title") }}</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card" :title="t('performance.fps.title')" :sub="t('performance.fps.sub')" :tip="t('performance.fps.tip')" v-model="perf.fpsMonitorEnabled" />

      <template v-if="perf.fpsMonitorEnabled">
        <div class="perf-sub-grid">
          <ReSwitch layout="card" :title="t('performance.memory.title')" :sub="t('performance.memory.sub')" :tip="t('performance.memory.tip')" v-model="perf.memoryMonitorEnabled" />
          <ReSwitch layout="card" :title="t('performance.cpu.title')" :sub="t('performance.cpu.sub')" :tip="t('performance.cpu.tip')" v-model="perf.cpuMonitorEnabled" />
          <ReSwitch layout="card" :title="t('performance.battery.title')" :sub="t('performance.battery.sub')" v-model="perf.batteryMonitorEnabled" />
          <ReSwitch layout="card" :title="t('performance.bluetooth.title')" :sub="t('performance.bluetooth.sub')" v-model="perf.bluetoothMonitorEnabled" />
          <ReSwitch layout="card" :title="t('performance.screen.title')" :sub="t('performance.screen.sub')" v-model="perf.screenMonitorEnabled" />
        </div>

        <div class="perf-config">
          <div class="perf-config-row">
            <span class="perf-config-label">{{ t("performance.position.label") }}</span>
            <el-select v-model="perf.performanceMonitorPosition" class="perf-config-select">
              <el-option v-for="opt in positionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div class="perf-config-row">
            <span class="perf-config-label">{{ t("performance.content.label") }}</span>
            <ReRadioGroup v-model="perf.performanceMonitorMode" class="perf-radio">
              <ReRadioButton label="detailed">{{ t("performance.content.detailed") }}</ReRadioButton>
              <ReRadioButton label="simple">{{ t("performance.content.simple") }}</ReRadioButton>
              <ReRadioButton label="minimal">{{ t("performance.content.minimal") }}</ReRadioButton>
            </ReRadioGroup>
          </div>
          <div class="perf-config-row">
            <span class="perf-config-label">{{ t("performance.layout.label") }}</span>
            <ReRadioGroup v-model="perf.performanceMonitorLayout" class="perf-radio">
              <ReRadioButton label="merged">{{ t("performance.layout.merged") }}</ReRadioButton>
              <ReRadioButton label="split">{{ t("performance.layout.split") }}</ReRadioButton>
            </ReRadioGroup>
          </div>
          <div class="perf-config-row">
            <span class="perf-config-label">{{ t("performance.direction.label") }}</span>
            <ReRadioGroup v-model="perf.performanceMonitorDirection" class="perf-radio">
              <ReRadioButton label="auto">{{ t("performance.direction.auto") }}</ReRadioButton>
              <ReRadioButton label="vertical">{{ t("performance.direction.vertical") }}</ReRadioButton>
              <ReRadioButton label="horizontal">{{ t("performance.direction.horizontal") }}</ReRadioButton>
            </ReRadioGroup>
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
    /* 分段控件现在是 el-segmented：只压字号/内距，选中块由控件自己画 */
    :deep(.el-segmented__item-label) {
      font-size: 12px;
      padding: 0 2px;
    }
  }
}
</style>