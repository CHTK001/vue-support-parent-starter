<template>
  <el-popover placement="bottom-end" :width="280" trigger="click">
    <template #reference>
      <el-tooltip content="全局上传设置" placement="top">
        <ScButton size="small" plain>
          <IconifyIconOnline icon="ri:settings-3-line" />
          上传设置
        </ScButton>
      </el-tooltip>
    </template>

    <div class="settings-panel">
      <div class="settings-title">全局上传默认设置</div>
      <div class="settings-list">
        <div class="setting-row">
          <span>自动解压</span>
          <el-switch v-model="settings.autoExtract" @change="save" />
        </div>
        <div class="setting-row">
          <span>清空依赖目录</span>
          <el-switch v-model="settings.clearLib" :disabled="settings.compareLib" @change="save" />
        </div>
        <div class="setting-row">
          <span>对比依赖（仅替换变更）</span>
          <el-switch v-model="settings.compareLib" :disabled="settings.clearLib" @change="save" />
        </div>
        <div class="setting-row">
          <span>清空配置目录</span>
          <el-switch v-model="settings.clearConfig" :disabled="settings.compareConfig" @change="save" />
        </div>
        <div class="setting-row">
          <span>对比配置（仅替换变更）</span>
          <el-switch v-model="settings.compareConfig" :disabled="settings.clearConfig" @change="save" />
        </div>
        <div class="setting-row">
          <span>上传后自动重启</span>
          <el-switch v-model="settings.autoRestart" @change="save" />
        </div>
      </div>
      <div class="settings-hint">拖拽上传也会继承以上设置</div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { IconifyIconOnline } from "@repo/components";

const LS_KEY = "project_upload_settings";

const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); }
  catch { return {}; }
};

const settings = reactive({
  autoExtract: true,
  clearLib: false,
  compareLib: false,
  clearConfig: false,
  compareConfig: false,
  autoRestart: false,
  ...load(),
});

const save = () => localStorage.setItem(LS_KEY, JSON.stringify({ ...settings }));
</script>

<style scoped lang="scss">
.settings-panel { padding: 4px 0; }
.settings-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 12px; }
.settings-list { display: flex; flex-direction: column; gap: 10px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--el-text-color-regular); }
.settings-hint { margin-top: 12px; font-size: 11px; color: var(--el-text-color-secondary); }
</style>
