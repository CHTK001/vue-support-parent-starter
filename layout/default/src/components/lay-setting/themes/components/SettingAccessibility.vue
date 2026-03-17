<script setup lang="ts">
import { ScSwitch } from "@repo/components";

interface Props {
  /** reactive 设置对象引用 */
  settings: Record<string, any>;
  /** 读屏优化模式变更 */
  screenReaderModeChange: (enabled: boolean) => void;
  /** 高对比度模式变更 */
  highContrastModeChange: (enabled: boolean) => void;
}

defineProps<Props>();
</script>

<template>
  <!-- 无障碍 -->
  <div class="setting-group">
    <h4 class="group-title">
      <IconifyIconOnline icon="ri:eye-2-line" class="group-icon" />
      无障碍
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
  </div>
</template>
