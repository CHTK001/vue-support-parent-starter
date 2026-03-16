<script setup lang="ts">
import { ScSwitch } from "@repo/components";
import ScSlider from "@repo/components/ScSlider/src/index.vue";

interface Props {
  /** reactive 设置对象引用 */
  settings: Record<string, any>;
  /** 读屏优化模式变更 */
  screenReaderModeChange: (enabled: boolean) => void;
  /** 高对比度模式变更 */
  highContrastModeChange: (enabled: boolean) => void;
  /** 页面缩放变更 */
  uiScaleChange: (scale: number) => void;
}

defineProps<Props>();
</script>

<template>
  <!-- 无障碍与缩放 -->
  <div class="setting-group">
    <h4 class="group-title">
      <IconifyIconOnline icon="ri:eye-2-line" class="group-icon" />
      无障碍与缩放
    </h4>
    <div class="switch-card-grid">
      <ScSwitch
        v-model="settings.screenReaderMode"
        layout="visual-card"
        size="small"
        label="读屏优化模式"
        description="为视障用户优化焦点高亮和可读性"
        active-icon="mdi:access-point"
        ribbon-color="var(--el-color-success)"
        @change="screenReaderModeChange"
      />
      <ScSwitch
        v-model="settings.highContrastMode"
        layout="visual-card"
        size="small"
        label="高对比度模式"
        description="提高文字与背景对比度，独立于深色模式"
        active-icon="mdi:contrast-circle"
        ribbon-color="var(--el-color-primary)"
        @change="highContrastModeChange"
      />
    </div>
    <div class="setting-item" style="margin-top: 12px">
      <div class="setting-item-label">
        <span>页面缩放</span>
        <span class="setting-item-desc">
          调整整体界面缩放比例，范围 80% - 150%
        </span>
      </div>
      <div class="setting-item-control">
        <ScSlider
          v-model="settings.uiScale"
          :min="0.8"
          :max="1.5"
          :step="0.05"
          :format-tooltip="(val) => `${Math.round(val * 100)}%`"
          style="max-width: 260px"
          @change="uiScaleChange"
        />
      </div>
    </div>
  </div>
</template>
