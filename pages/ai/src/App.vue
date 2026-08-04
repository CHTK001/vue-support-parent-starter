<template>
  <div class="app-shell">
    <!-- 顶部导航栏 -->
    <header v-if="!hideHeader" class="app-header">
      <div class="header-left">
        <div class="app-logo">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M5 14h14l-1.5 3H6.5L5 14z" />
            <circle cx="12" cy="18" r="3" />
          </svg>
        </div>
        <div class="brand">
          <div class="brand-name">KOI-AI</div>
          <div class="brand-sub">多模态工作台</div>
        </div>
      </div>

      <div class="header-center">
        <el-menu
          mode="horizontal"
          class="header-menu"
          :default-active="activeRoute"
          :ellipsis="false"
        >
          <el-menu-item v-role="['admin', 'superadmin']" index="/model/providers" @click="navigate('/model/providers')">
            <el-icon><Cpu /></el-icon>
            <span>模型管理</span>
          </el-menu-item>
          <el-menu-item v-role="['admin', 'superadmin']" index="/model/groups" @click="navigate('/model/groups')">
            <el-icon><Collection /></el-icon>
            <span>分组管理</span>
          </el-menu-item>
          <el-menu-item v-role="['admin', 'superadmin']" index="/model/usage" @click="navigate('/model/usage')">
            <el-icon><DataAnalysis /></el-icon>
            <span>用量统计</span>
          </el-menu-item>
          <el-menu-item v-role="['admin', 'superadmin']" index="/model/alerts" @click="navigate('/model/alerts')">
            <el-icon><Bell /></el-icon>
            <span>告警管理</span>
          </el-menu-item>
          <el-menu-item v-role="['admin', 'superadmin']" index="/model/services" @click="navigate('/model/services')">
            <el-icon><Service /></el-icon>
            <span>服务管理</span>
          </el-menu-item>
          <el-menu-item v-role="['admin', 'superadmin']" index="settings" @click="settingsVisible = true">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="header-right">
        <el-tooltip :content="asideCollapsed ? '显示左侧菜单' : '隐藏左侧菜单'" placement="bottom">
          <el-button text circle @click="asideCollapsed = !asideCollapsed">
            <el-icon><Fold v-if="!asideCollapsed" /><Expand v-else /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </header>

    <div class="app-body">
      <!-- 左侧菜单 -->
      <aside :class="['app-aside', { collapsed: asideCollapsed }]">
        <el-menu
          class="side-menu"
          :default-active="activeRoute"
          :collapse="asideCollapsed"
          :collapse-transition="false"
        >
          <el-menu-item index="/chat" @click="navigate('/chat')">
            <el-icon><ChatDotRound /></el-icon>
            <template #title>大模型</template>
          </el-menu-item>
          <el-menu-item index="/image-gen" @click="navigate('/image-gen')">
            <el-icon><Picture /></el-icon>
            <template #title>图像生成</template>
          </el-menu-item>
          <el-menu-item index="/video-gen" @click="navigate('/video-gen')">
            <el-icon><VideoCamera /></el-icon>
            <template #title>视频生成</template>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 主内容区 -->
      <main class="app-main">
        <router-view v-slot="{ Component, route: r }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="r.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>

  <SettingsDrawer v-model="settingsVisible" id="ai-workbench" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Setting,
  Cpu,
  Collection,
  DataAnalysis,
  Bell,
  Service,
  ChatDotRound,
  Picture,
  VideoCamera,
  Fold,
  Expand,
} from '@element-plus/icons-vue';
import SettingsDrawer from './components/SettingsDrawer.vue';

const route = useRoute();
const router = useRouter();
const settingsVisible = ref(false);
const asideCollapsed = ref(false);

const activeRoute = computed(() => route.path);

/**
 * 通过 URL query 控制框架外壳（顶部导航 / 左侧菜单）显隐，便于嵌入第三方页面：
 *   ?chrome=0      → 顶部 + 左侧全部隐藏（纯内容）
 *   ?header=0      → 仅隐藏顶部导航
 *   ?aside=0       → 仅隐藏左侧菜单
 */
const hideHeader = computed(() => {
  const q = route.query;
  return q.chrome === '0' || q.header === '0';
});
const hideAside = computed(() => {
  const q = route.query;
  return q.chrome === '0' || q.aside === '0';
});

const navigate = (path: string) => {
  if (route.path !== path) {
    router.push(path);
  }
};
</script>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

/* ===== 顶栏 ===== */
.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #ffffff 0%, #f7f9ff 100%);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
  flex-shrink: 0;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
}
.app-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #409eff 0%, #6f42c1 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}
.brand {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}
.brand-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  letter-spacing: 0.3px;
}
.header-center {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  padding-left: 24px;
}
.header-menu {
  border-bottom: none !important;
  background: transparent;
  display: flex;
}
.header-menu .el-menu-item {
  font-size: 14px;
  font-weight: 500;
  border-bottom: none !important;
  padding: 0 16px;
  flex-shrink: 0;
}
.header-menu .el-menu-item.is-active {
  color: #409eff;
  background: transparent;
  border-bottom: 2px solid #409eff;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ===== 主体 ===== */
.app-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/* ===== 侧边栏 ===== */
.app-aside {
  width: 200px;
  background: #fff;
  border-right: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s ease, border 0.2s ease;
}
.app-aside.collapsed {
  width: 0;
  border-right: none;
}
.side-menu {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-right: none;
  background: transparent;
  padding: 8px 0;
  --el-menu-hover-bg-color: rgba(64, 158, 255, 0.08);
  --el-menu-active-color: #409eff;
}
.side-menu .el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.12) 0%, rgba(64, 158, 255, 0.04) 100%);
  border-right: 3px solid #409eff;
  font-weight: 600;
}

/* ===== 主区域 ===== */
.app-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>