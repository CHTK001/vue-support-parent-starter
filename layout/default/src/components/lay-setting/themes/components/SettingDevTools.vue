<script setup lang="ts">
import ScSwitch from "@repo/components/ScSwitch/index.vue";

interface Props {
  /** reactive 设置对象引用 */
  settings: Record<string, any>;
  /** 是否开发环境 */
  isDevelopment: boolean;
  /** 是否测试环境 */
  isTest: boolean;
  /** DevTools 精简版总开关 */
  devLiteToolsChange: (enabled: boolean) => void;
  /** DevTools 标尺开关 */
  devRulerChange: (enabled: boolean) => void;
  /** DevTools 网格开关 */
  devGridChange: (enabled: boolean) => void;
  /** DevTools 悬停检查开关 */
  devHoverInspectorChange: (enabled: boolean) => void;
}

defineProps<Props>();
</script>

<template>
  <!-- DevTools 精简版（仅开发/测试环境） -->
  <div v-if="isDevelopment || isTest" class="setting-group">
    <h4 class="group-title">
      <IconifyIconOnline icon="ri:bug-line" class="group-icon" />
      DevTools 精简版
    </h4>
    <div class="switch-card-grid">
      <ScSwitch
        v-model="settings.devLiteTools"
        layout="visual-card"
        size="small"
        label="启用轻量调试"
        description="显示标尺、网格和悬停信息等调试辅助"
        active-icon="ri:bug-2-line"
        ribbon-color="var(--el-color-warning)"
        @change="devLiteToolsChange"
      />
      <ScSwitch
        v-model="settings.devRuler"
        layout="visual-card"
        size="small"
        label="标尺"
        description="在顶部和左侧显示像素标尺"
        active-icon="ri:arrow-left-right-line"
        @change="devRulerChange"
      />
      <ScSwitch
        v-model="settings.devGrid"
        layout="visual-card"
        size="small"
        label="网格"
        description="显示布局网格辅助对齐"
        active-icon="ri:grid-line"
        @change="devGridChange"
      />
      <ScSwitch
        v-model="settings.devHoverInspector"
        layout="visual-card"
        size="small"
        label="悬停检查"
        description="悬停显示元素标签、类名和尺寸"
        active-icon="ri:focus-3-line"
        @change="devHoverInspectorChange"
      />
    </div>
  </div>
</template>
