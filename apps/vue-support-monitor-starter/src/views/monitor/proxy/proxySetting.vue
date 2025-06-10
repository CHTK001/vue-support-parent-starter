<template>
  <ScDialog v-model="visible" draggable width="60%" :close-on-click-modal="false"
    :destroy-on-close="true" @closed="doClose">
    <template #header>
      <div class="dialog-header">
        <IconifyIconOnline icon="ep:setting" class="mr-2" />
        <span>插件配置</span>
      </div>
    </template>
    <component :is="componentPath" ref="proxySettingRef" :form="form" :pluginId="pluginId" :plugin="plugin" />
  </ScDialog>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue';
import ScDialog from "@repo/components/ScDialog/src/index.vue";

const emit = defineEmits(['closed']);

// 状态定义
const visible = ref(false);
const form = ref({});
const pluginId = ref(null);
const plugin = ref(null);
const componentPath = ref(null);
const proxySettingRef = ref(null);

// 设置表单数据
const setData = (item) => {
  Object.assign(form.value, item);
  return {
    open,
    setComponent,
    setPluginId,
    setPlugin
  };
};

// 设置插件ID
const setPluginId = (id) => {
  pluginId.value = id;
  return {
    open,
    setData,
    setComponent,
    setPlugin
  };
};

// 设置插件
const setPlugin = (item) => {
  plugin.value = item;
  return {
    open,
    setData,
    setComponent,
    setPluginId
  };
};

// 设置组件路径
const setComponent = (component) => {
  componentPath.value = component;
  return {
    open,
    setData,
    setPluginId,
    setPlugin
  };
};

// 打开对话框
const open = () => {
  visible.value = true;
  return {
    setData,
    setComponent,
    setPluginId,
    setPlugin
  };
};

// 关闭对话框
const doClose = () => {
  visible.value = false;
  emit('closed');
};

// 导出方法
defineExpose({
  setData,
  setPluginId,
  setPlugin,
  setComponent,
  open
});
</script>

<style lang="scss" scoped>
.dialog-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}
</style>
