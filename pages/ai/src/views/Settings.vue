<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div>
        <div class="settings-page__title">设置</div>
        <div class="settings-page__sub">管理提供商、全局配置、聚合服务、AppKey、分组、告警与用量</div>
      </div>
    </div>
    <div class="settings-page__body">
      <el-tabs v-model="activeTab" class="settings-page__tabs" tab-position="left">
        <el-tab-pane
          v-for="item in tabs"
          :key="item.name"
          :label="item.label"
          :name="item.name"
        >
          <component :is="item.component" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SETTINGS_TABS } from '../components/settings/tabs';
import { useSettingsTabs } from '../composables/useSettingsTabs';

/** tab 列表 */
const tabs = SETTINGS_TABS;

/** 通过 composable 管理 tab 状态持久化 */
const { activeTab } = useSettingsTabs('ai-settings-page');
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  box-sizing: border-box;
  overflow: hidden;
}
.settings-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.settings-page__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.settings-page__sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}
.settings-page__body {
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  overflow: hidden;
}
.settings-page__tabs {
  height: 100%;
}
.settings-page__tabs :deep(.el-tabs__header) {
  width: 160px;
  border-right: 1px solid var(--el-border-color-light);
  margin: 0;
}
.settings-page__tabs :deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
  height: 46px;
  line-height: 46px;
  padding: 0 20px;
  color: var(--el-text-color-secondary);
}
.settings-page__tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}
.settings-page__tabs :deep(.el-tabs__content) {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}
</style>
