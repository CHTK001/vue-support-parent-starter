<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ScSwitch, ScInputNumber } from "@repo/components";

const { t } = useI18n();

interface Props {
  /** reactive 设置对象引用 */
  settings: Record<string, any>;
  /** 是否开发环境 */
  isDevelopment: boolean;
  /** 是否测试环境 */
  isTest: boolean;
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
}

defineProps<Props>();
</script>

<template>
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
</template>
