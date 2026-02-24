<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { useSettings } from "../../composables/useSettings";

const { t } = useI18n();
const {
  settings,
  setKeepAlive,
  setDebugMode,
  setShowMessage,
  setMessagePopupEnabled,
  setMessagePopupPosition,
  setMessagePopupDuration,
} = useSettings();

const messagePositionOptions = computed(() => [
  { label: "左上角", value: "top-left", position: "top-left" },
  { label: "顶部", value: "top-center", position: "top-center" },
  { label: "右上角", value: "top-right", position: "top-right" },
  { label: "左侧", value: "left-center", position: "left-center" },
  { label: "右侧", value: "right-center", position: "right-center" },
  { label: "左下角", value: "bottom-left", position: "bottom-left" },
  { label: "底部", value: "bottom-center", position: "bottom-center" },
  { label: "右下角", value: "bottom-right", position: "bottom-right" },
]);

const messagePopupPositionValue = computed({
  get() {
    const valid = messagePositionOptions.value.some(
      (opt) => opt.value === settings.messagePopupPosition,
    );
    return valid ? settings.messagePopupPosition : "top-right";
  },
  set(val: string) {
    setMessagePopupPosition(val);
  },
});

function handleMessageDurationChange(value: number) {
  setMessagePopupDuration(value);
}
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:settings-3-line" class="section-icon" />
      <h3 class="section-title">高级设置</h3>
      <div class="section-description">控制缓存、调试与安全相关功能</div>
    </div>
    <div class="setting-content">
      <!-- 功能相关 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:tools-line" class="group-icon" />
          功能
        </h4>
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.keepAlive"
            layout="visual-card"
            size="small"
            :label="t('panel.pureKeepAlive') || '组件缓存'"
            description="开启后常用页面会被缓存，提升切换速度"
            active-icon="ri:database-2-line"
            ribbon-color="var(--el-color-success)"
            @change="setKeepAlive"
          />

          <ScSwitch
            v-model="settings.debugMode"
            layout="visual-card"
            size="small"
            label="调试模式"
            description="显示开发调试信息和性能面板"
            active-icon="ri:bug-line"
            ribbon-color="var(--el-color-warning)"
            @change="setDebugMode"
          />
        </div>
      </div>

      <!-- 消息设置 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:message-3-line" class="group-icon" />
          消息设置
        </h4>
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.showMessage"
            layout="visual-card"
            size="small"
            label="启用顶部消息按钮"
            description="控制头部消息中心按钮是否显示"
            active-icon="ri:notification-3-line"
            ribbon-color="var(--el-color-primary)"
            @change="setShowMessage"
          />

          <ScSwitch
            v-model="settings.messagePopupEnabled"
            layout="visual-card"
            size="small"
            label="启用消息弹窗"
            description="控制全局提示消息是否显示"
            active-icon="ri:notification-3-line"
            ribbon-color="var(--el-color-primary)"
            @change="setMessagePopupEnabled"
          />
        </div>

        <div
          v-if="settings.messagePopupEnabled"
          class="sub-settings-container mt-4 pl-3 border-l-2 border-[var(--el-border-color-lighter)]"
        >
          <div class="setting-item mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-[var(--el-text-color-regular)]">
                显示位置
              </span>
              <ScSwitch
                v-model="messagePopupPositionValue"
                layout="rect-8"
                size="small"
                :rect8-options="messagePositionOptions"
              />
            </div>
          </div>

          <div class="setting-item mb-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-[var(--el-text-color-regular)]">
                自动关闭时间(秒)
              </span>
              <el-input-number
                v-model="settings.messagePopupDuration"
                :min="1"
                :max="60"
                :step="1"
                size="small"
                style="width: 120px"
                @change="handleMessageDurationChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setting-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-icon {
  margin-right: 8px;
  font-size: 20px;
  color: var(--el-color-primary);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>


