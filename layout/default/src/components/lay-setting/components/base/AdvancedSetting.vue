<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { useSettings } from "../../composables/useSettings";

const { t } = useI18n();
const {
  settings,
  setKeepAlive,
  setDebugMode,
  setMessagePopupEnabled,
  setMessagePopupPosition,
  setMessagePopupDuration,
  setFontEncryptionEnabled,
  setFontEncryptionNumbers,
  setFontEncryptionChinese,
  setFontEncryptionGlobal,
  setFontEncryptionOcrNoise,
} = useSettings();

const messagePositionOptions = computed<Array<OptionsType>>(() => [
  { label: "右上角", value: "top-right" },
  { label: "右下角", value: "bottom-right" },
  { label: "左上角", value: "top-left" },
  { label: "左下角", value: "bottom-left" },
]);

const currentMessagePositionIndex = computed(() => {
  const index = messagePositionOptions.value.findIndex(
    (opt) => opt.value === settings.messagePopupPosition,
  );
  return index >= 0 ? index : 0;
});

function handleMessagePositionChange({ option }: { option: OptionsType }) {
  setMessagePopupPosition(option.value as string);
}

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

      <!-- 消息弹窗 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:message-3-line" class="group-icon" />
          消息弹窗
        </h4>
        <div class="switch-card-grid">
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
              <Segmented
                resize
                class="select-none modern-segmented w-[220px]"
                :modelValue="currentMessagePositionIndex"
                :options="messagePositionOptions"
                @change="handleMessagePositionChange"
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

      <!-- 字体加密 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:shield-keyhole-line" class="group-icon" />
          字体加密
        </h4>
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.fontEncryptionEnabled"
            layout="visual-card"
            size="small"
            label="启用字体加密"
            description="对关键内容文字进行简单混淆，降低爬取成本"
            active-icon="ri:shield-check-line"
            ribbon-color="var(--el-color-danger)"
            @change="setFontEncryptionEnabled"
          />

          <ScSwitch
            v-model="settings.fontEncryptionNumbers"
            layout="visual-card"
            size="small"
            label="加密数字"
            description="对页面中的数字做保护"
            active-icon="ri:numbers-line"
            :disabled="!settings.fontEncryptionEnabled"
            @change="setFontEncryptionNumbers"
          />

          <ScSwitch
            v-model="settings.fontEncryptionChinese"
            layout="visual-card"
            size="small"
            label="加密中文"
            description="对中文字符进行保护"
            active-icon="ri:characters-line"
            :disabled="!settings.fontEncryptionEnabled"
            @change="setFontEncryptionChinese"
          />

          <ScSwitch
            v-model="settings.fontEncryptionGlobal"
            layout="visual-card"
            size="small"
            label="全局生效"
            description="应用到整站所有文字"
            active-icon="ri:global-line"
            :disabled="!settings.fontEncryptionEnabled"
            @change="setFontEncryptionGlobal"
          />

          <ScSwitch
            v-model="settings.fontEncryptionOcrNoise"
            layout="visual-card"
            size="small"
            label="增加 OCR 干扰"
            description="对文字形状添加轻微噪点"
            active-icon="ri:contrast-drop-line"
            :disabled="!settings.fontEncryptionEnabled"
            @change="setFontEncryptionOcrNoise"
          />
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


