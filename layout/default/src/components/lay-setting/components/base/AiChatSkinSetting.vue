<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { storageConfigureChange } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const enableAiChatTheme = computed({
  get: () => $storage?.configure?.enableAiChatTheme ?? true,
  set: (value: boolean) => {
    storageConfigureChange("enableAiChatTheme", value);
  },
});

const enableAiChatBackground = computed({
  get: () => $storage?.configure?.enableAiChatBackground ?? true,
  set: (value: boolean) => {
    storageConfigureChange("enableAiChatBackground", value);
  },
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:robot-2-line" class="section-icon" />
      <h3 class="section-title">AI 聊天外观</h3>
    </div>
    <div class="setting-content">
      <div class="mb-3">
        <ScSwitch
          v-model="enableAiChatTheme"
          layout="visual-card"
          size="small"
          label="启用主题化对话窗"
          description="根据当前系统主题优化 AI 聊天气泡和框体样式"
          active-icon="ri:sparkling-2-line"
        />
      </div>
      <div>
        <ScSwitch
          v-model="enableAiChatBackground"
          layout="visual-card"
          size="small"
          label="启用场景背景"
          description="为 AI 对话区域添加轻量背景与装饰元素"
          active-icon="ri:landscape-line"
        />
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


