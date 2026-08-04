<template>
  <el-container class="app-container">
    <!-- 顶部导航栏 -->
    <el-header height="56px" class="app-header">
      <div class="header-left">
        <div class="app-logo">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M5 14h14l-1.5 3H6.5L5 14z" />
            <circle cx="12" cy="18" r="3" />
          </svg>
        </div>
        <span class="app-title">KOI-AI</span>
      </div>
      <div class="header-center">
        <el-menu
          :default-active="activeRoute"
          mode="horizontal"
          router
          class="header-menu"
          :ellipsis="false"
        >
          <el-sub-menu index="model">
            <template #title>
              <el-icon><Connection /></el-icon>
              <span>模型</span>
            </template>
            <el-menu-item index="/model/providers">模型供应商</el-menu-item>
            <el-menu-item index="/model/app-keys">AppKey</el-menu-item>
            <el-menu-item index="/model/groups">分组管理</el-menu-item>
            <el-menu-item index="/model/alerts">告警规则</el-menu-item>
            <el-menu-item index="/model/usage">用量统计</el-menu-item>
            <el-menu-item index="/model/services">聚合服务</el-menu-item>
            <el-menu-item index="/model/global">全局配置</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
      <div class="header-right">
        <el-button text :icon="Setting" @click="settingsVisible = true">
          设置
        </el-button>
      </div>
    </el-header>
    <el-container class="app-body">
      <!-- 左侧菜单 -->
      <el-aside width="200px" class="app-aside">
        <el-menu
          :default-active="activeRoute"
          router
          class="side-menu"
        >
          <el-menu-item index="/chat">
            <el-icon><ChatDotRound /></el-icon>
            <span>大模型</span>
          </el-menu-item>
          <el-menu-item index="/image-gen">
            <el-icon><Picture /></el-icon>
            <span>图像生成</span>
          </el-menu-item>
          <el-menu-item index="/video-gen">
            <el-icon><VideoCamera /></el-icon>
            <span>视频生成</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <!-- 右侧内容区 -->
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  <SettingsDrawer v-model="settingsVisible" id="ai-workbench" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Setting, Connection, ChatDotRound, Picture, VideoCamera } from '@element-plus/icons-vue';
import SettingsDrawer from './components/SettingsDrawer.vue';

const route = useRoute();
const activeRoute = computed(() => route.path);
const settingsVisible = ref(false);
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
  flex-shrink: 0;
  gap: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.app-logo {
  display: flex;
  align-items: center;
  color: var(--el-color-primary);
}
.app-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}
.header-menu {
  border-bottom: none !important;
  background: transparent;
}
.header-menu .el-sub-menu__title {
  font-size: 14px;
  font-weight: 500;
  border-bottom: none !important;
}
.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.app-body {
  flex: 1;
  overflow: hidden;
}
.app-aside {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  overflow-y: auto;
}
.side-menu {
  height: 100%;
  border-right: none;
  background: transparent;
}
.app-main {
  background: var(--el-bg-color-page);
  padding: 24px;
  overflow: auto;
}
</style>
