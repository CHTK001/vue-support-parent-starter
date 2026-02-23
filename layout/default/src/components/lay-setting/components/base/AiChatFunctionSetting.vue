<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import ScSwitch from "@repo/components/ScSwitch/index.vue";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const enableAiQuickAction = computed({
  get: () => $storage?.configure?.enableAiQuickAction ?? true,
  set: (value: boolean) => {
    if ($storage?.configure) {
      $storage.configure.enableAiQuickAction = value as any;
    }
  },
});

const enableAiShortcutPanel = computed({
  get: () => $storage?.configure?.enableAiShortcutPanel ?? true,
  set: (value: boolean) => {
    if ($storage?.configure) {
      $storage.configure.enableAiShortcutPanel = value as any;
    }
  },
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:magic-line" class="section-icon" />
      <h3 class="section-title">AI 聊天功能</h3>
    </div>
    <div class="setting-content">
      <div class="mb-3">
        <ScSwitch
          v-model="enableAiQuickAction"
          layout="visual-card"
          size="small"
          label="启用快捷提问"
          description="在输入框附近展示推荐问题与一键提问入口"
          active-icon="ri:flashlight-line"
        />
      </div>
      <div>
        <ScSwitch
          v-model="enableAiShortcutPanel"
          layout="visual-card"
          size="small"
          label="启用快捷功能面板"
          description="在侧边区域展示常用 AI 工具与会话模板"
          active-icon="ri:layout-4-line"
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


