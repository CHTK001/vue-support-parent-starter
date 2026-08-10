<template>
  <ReDrawer
    v-model="visible"
    :title="title"
    size="540px"
    direction="rtl"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="true"
  >
    <div class="settings-drawer">
      <el-tabs v-model="activeTab" class="settings-tabs" tab-position="top">
        <el-tab-pane
          v-for="item in tabs"
          :key="item.name"
          :label="item.label"
          :name="item.name"
        >
          <component :is="item.component" :id="id" />
        </el-tab-pane>
      </el-tabs>
    </div>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </ReDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import ReDrawerLoader from '@repo/ui/re-drawer';
import { SETTINGS_TABS } from './settings/tabs';

/** ReDrawer 默认导出是异步主题加载函数，需包一层异步组件使用 */
const ReDrawer = defineAsyncComponent(ReDrawerLoader);
import { useSettingsTabs } from '../composables/useSettingsTabs';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    id?: string;
    destroyOnClose?: boolean;
  }>(),
  {
    title: '设置',
    id: 'ai-settings',
    destroyOnClose: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const visible = ref(props.modelValue);

/** tab 列表 */
const tabs = SETTINGS_TABS;

/** 通过 composable 管理 tab 状态持久化 */
const { activeTab } = useSettingsTabs(props.id);

/** 同步 v-model */
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);

watch(visible, (val) => {
  emit('update:modelValue', val);
});
</script>

<style scoped>
.settings-drawer {
  padding: 4px 0;
  min-height: 400px;
}
.settings-tabs {
  height: 100%;
}
.settings-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px 0;
  border-bottom: 1px solid var(--el-border-color-light);
}
.settings-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  color: var(--el-text-color-secondary);
}
.settings-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.settings-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--el-color-primary);
  height: 2px;
}
</style>