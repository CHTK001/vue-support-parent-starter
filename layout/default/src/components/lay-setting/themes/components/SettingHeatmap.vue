<script setup lang="ts">
import ScSwitch from "@repo/components/ScSwitch/index.vue";

interface Props {
  /** reactive 设置对象引用 */
  settings: Record<string, any>;
  /** 是否开发环境 */
  isDevelopment: boolean;
  /** 是否测试环境 */
  isTest: boolean;
  /** 热点工具（热力图）开关 */
  devHeatmapChange: (enabled: boolean) => void;
}

defineProps<Props>();
</script>

<template>
  <!-- 热点工具（仅开发/测试环境） -->
  <div v-if="isDevelopment || isTest" class="setting-group">
    <h4 class="group-title">
      <IconifyIconOnline icon="ri:fire-line" class="group-icon" />
      热点工具
    </h4>
    <div class="switch-card-grid">
      <ScSwitch
        v-model="settings.devHeatmap"
        layout="visual-card"
        size="small"
        label="热力图覆盖层"
        description="记录用户点击热点，以热力图形式覆盖展示"
        active-icon="ri:fire-line"
        ribbon-color="var(--el-color-danger)"
        @change="devHeatmapChange"
      />
    </div>
  </div>
</template>
