<template>
  <el-container class="app-container">
    <el-aside width="220px" class="app-aside">
      <SideMenu />
    </el-aside>
    <el-container class="app-right">
      <el-header height="60px" class="app-header">
        <div class="header-left">
          <span class="app-title">AI 工作台</span>
        </div>
        <div class="header-right">
          <el-button
            type="text"
            :icon="Setting"
            class="settings-btn"
            @click="settingsVisible = true"
          >
            设置
          </el-button>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  <SettingsDrawer v-model="settingsVisible" id="ai-workbench" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Setting } from '@element-plus/icons-vue';
import SideMenu from './components/SideMenu.vue';
import SettingsDrawer from './components/SettingsDrawer.vue';

const settingsVisible = ref(false);
</script>

<style scoped>
.app-container {
  height: 100vh;
}
.app-aside {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}
.app-right {
  flex-direction: column;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 24px;
}
.header-left {
  display: flex;
  align-items: center;
}
.app-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.3px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.settings-btn {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
}
.settings-btn:hover {
  color: var(--el-text-color-primary);
}
.app-main {
  background: var(--el-bg-color-page);
  padding: 24px;
  overflow: auto;
}
</style>
