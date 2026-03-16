<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ScSwitch, ScButton, ScInputNumber } from "@repo/components";
import ScSlider from "@repo/components/ScSlider/src/index.vue";

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
  <!-- 高级设置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:tools-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.advancedSettings") }}</h3>
      <div class="section-description">
        {{ t("panel.advancedSettingsDesc") }}
      </div>
    </div>
    <div class="setting-content">
      <!-- 高级功能开关 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline
            icon="ri:settings-4-line"
            class="group-icon"
          />
          {{ t("panel.advancedFeatures") }}
        </h4>
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.keepAlive"
            layout="visual-card"
            size="small"
            :label="t('panel.componentCache')"
            :description="t('panel.componentCacheDesc')"
            active-icon="ri:speed-line"
            ribbon-color="var(--el-color-success)"
            @change="keepAliveChange"
          />

          <ScSwitch
            v-model="settings.stretch"
            layout="visual-card"
            size="small"
            :label="t('panel.pageStretch')"
            :description="t('panel.pageStretchDesc')"
            active-icon="ri:fullscreen-line"
            ribbon-color="var(--el-color-success)"
            @change="stretchSwitchChange"
          />

          <ScSwitch
            v-if="isDevelopment || isTest"
            v-model="settings.debugMode"
            layout="visual-card"
            size="small"
            :label="t('panel.debugMode')"
            :description="t('panel.debugModeDesc')"
            active-icon="ri:terminal-box-line"
            ribbon-color="var(--el-color-warning)"
            @change="debugModeChange"
          />
          <ScSwitch
            v-model="settings.autoLogout"
            layout="visual-card"
            size="small"
            label="超时自动退出"
            description="会话超时后自动登出账号，需要后端 Session.enable 与 timeout 配合"
            active-icon="ri:logout-circle-r-line"
            ribbon-color="var(--el-color-danger)"
            @change="autoLogoutChange"
          />
        </div>

        <div
          v-if="settings.autoLogout"
          class="setting-item"
          style="margin-top: 12px"
        >
          <div class="setting-item-label">
            <span>超时时间</span>
            <span class="setting-item-desc">
              单位：分钟，超过该时间无操作将自动退出
            </span>
          </div>
          <div class="setting-item-control">
            <ScInputNumber
              v-model="settings.sessionTimeoutMinutes"
              :min="minSessionTimeoutMinutes"
              :max="maxSessionTimeoutMinutes"
              controls-position="right"
              style="max-width: 260px"
              @change="sessionTimeoutMinutesChange"
            />
          </div>
        </div>
      </div>

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

      <!-- 云同步选项 -->
      <div v-if="showCloudSync" class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:cloud-line" class="group-icon" />
          {{ t("panel.cloudSync") || "云同步" }}
        </h4>
        <div class="reset-actions">
          <ScButton
            type="primary"
            plain
            :loading="syncLoading"
            @click="syncToCloud"
          >
            <IconifyIconOnline icon="ri:cloud-upload-line" />
            {{ t("panel.syncToCloud") || "上传到云端" }}
          </ScButton>
          <ScButton
            type="primary"
            plain
            :loading="syncLoading"
            @click="syncFromCloud"
          >
            <IconifyIconOnline icon="ri:cloud-download-line" />
            {{ t("panel.syncFromCloud") || "从云端下载" }}
          </ScButton>
        </div>
        <div v-if="cloudSyncUrl" class="cloud-sync-url">
          <span class="sync-url-label">
            {{ t("panel.syncUrl") || "同步地址" }}:
          </span>
          <span class="sync-url-value">{{ cloudSyncUrl }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
