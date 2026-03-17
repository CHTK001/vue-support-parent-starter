<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SettingAdvancedCore from "./SettingAdvancedCore.vue";
import SettingAccessibility from "./SettingAccessibility.vue";
import SettingDevTools from "./SettingDevTools.vue";
import SettingCloudSync from "./SettingCloudSync.vue";

const { t } = useI18n();

interface Props {
  /** reactive 设置对象引用 */
  settings: Record<string, any>;
  /** 是否开发环境 */
  isDevelopment: boolean;
  /** 是否测试环境 */
  isTest: boolean;
  /** 是否显示云同步 */
  showCloudSync: boolean;
  /** 云同步地址 */
  cloudSyncUrl: string;
  /** 同步加载状态 */
  syncLoading: boolean;
  /** 会话超时最小值（分钟） */
  minSessionTimeoutMinutes: number;
  /** 会话超时最大值（分钟） */
  maxSessionTimeoutMinutes: number;
  /** 组件缓存变更 */
  keepAliveChange: () => void;
  /** 页宽开关变更 */
  stretchSwitchChange: (enabled: boolean) => void;
  /** 调试模式变更 */
  debugModeChange: (enabled: boolean) => void;
  /** 自动退出变更 */
  autoLogoutChange: (enabled: boolean) => void;
  /** 会话超时时间变更 */
  sessionTimeoutMinutesChange: (value: number) => void;
  /** 读屏优化模式变更 */
  screenReaderModeChange: (enabled: boolean) => void;
  /** 高对比度模式变更 */
  highContrastModeChange: (enabled: boolean) => void;
  /** 页面缩放变更 */
  uiScaleChange: (scale: number) => void;
  /** DevTools 精简版总开关 */
  devLiteToolsChange: (enabled: boolean) => void;
  /** DevTools 标尺开关 */
  devRulerChange: (enabled: boolean) => void;
  /** DevTools 网格开关 */
  devGridChange: (enabled: boolean) => void;
  /** DevTools 悬停检查开关 */
  devHoverInspectorChange: (enabled: boolean) => void;
  /** 上传配置到云端 */
  syncToCloud: () => void;
  /** 从云端下载配置 */
  syncFromCloud: () => void;
}

defineProps<Props>();
</script>

<template>
  <!-- 高级设置区域（聚合组件，各子组件自带 group-title，无需外层 section-header） -->
  <div class="setting-section">
    <div class="setting-content">
      <!-- 高级功能开关子组件 -->
      <SettingAdvancedCore
        :settings="settings"
        :is-development="isDevelopment"
        :is-test="isTest"
        :min-session-timeout-minutes="minSessionTimeoutMinutes"
        :max-session-timeout-minutes="maxSessionTimeoutMinutes"
        :keep-alive-change="keepAliveChange"
        :stretch-switch-change="stretchSwitchChange"
        :debug-mode-change="debugModeChange"
        :auto-logout-change="autoLogoutChange"
        :session-timeout-minutes-change="sessionTimeoutMinutesChange"
      />

      <!-- 无障碍与缩放子组件 -->
      <SettingAccessibility
        :settings="settings"
        :screen-reader-mode-change="screenReaderModeChange"
        :high-contrast-mode-change="highContrastModeChange"
        :ui-scale-change="uiScaleChange"
      />

      <!-- DevTools 精简版子组件 -->
      <SettingDevTools
        :settings="settings"
        :is-development="isDevelopment"
        :is-test="isTest"
        :dev-lite-tools-change="devLiteToolsChange"
        :dev-ruler-change="devRulerChange"
        :dev-grid-change="devGridChange"
        :dev-hover-inspector-change="devHoverInspectorChange"
      />

      <!-- 云同步子组件 -->
      <SettingCloudSync
        :show-cloud-sync="showCloudSync"
        :cloud-sync-url="cloudSyncUrl"
        :sync-loading="syncLoading"
        :sync-to-cloud="syncToCloud"
        :sync-from-cloud="syncFromCloud"
      />
    </div>
  </div>
</template>
