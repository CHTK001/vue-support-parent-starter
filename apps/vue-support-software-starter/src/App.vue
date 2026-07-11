<template>
  <div class="app-shell">
    <header class="title-bar">
      <div class="title-bar-left">
        <span class="brand-dot"></span>
        <span class="brand-name">Toolkit</span>
      </div>
      <div class="title-bar-center"></div>
      <div class="title-bar-right">
        <span class="ver-badge">v4.0</span>
      </div>
    </header>
    <div class="app-body">
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <router-link
            v-for="item in sidebarItems"
            :key="item.path"
            :to="item.path"
            class="sidebar-link"
            :class="{ active: isActive(item.path) }"
            :title="item.label"
          >
            <el-icon :size="17">
              <component :is="item.icon" />
            </el-icon>
            <span class="sidebar-label">{{ item.label }}</span>
          </router-link>
        </nav>
      </aside>
      <main class="main-area">
        <router-view v-slot="{ Component }">
          <transition name="fade-up" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Connection, DataBoard, Cpu, Picture, Setting, Grid, TrendCharts, Tools, DataAnalysis } from '@element-plus/icons-vue'

const route = useRoute()

const sidebarItems = [
  { path: '/', label: '首页', icon: HomeFilled },
  { path: '/software-list', label: '软件', icon: Grid },
  { path: '/ai', label: 'AI', icon: Connection },
  { path: '/environment', label: '环境', icon: DataBoard },
  { path: '/monitor', label: '监控', icon: DataAnalysis },
  { path: '/tools', label: '工具', icon: Tools },
  { path: '/stats', label: '统计', icon: TrendCharts },
  { path: '/system', label: '系统', icon: Cpu },
  { path: '/album', label: '相册', icon: Picture },
  { path: '/settings', label: '设置', icon: Setting },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

/* ── Title Bar (native desktop style) ── */
.title-bar {
  height: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: rgb(var(--el-color-primary));
  color: #fff;
  user-select: none;
  -webkit-app-region: drag;
  gap: 8px;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.brand-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
}

.brand-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.title-bar-center {
  flex: 1;
}

.title-bar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.ver-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
}

/* ── Body: sidebar + main ── */
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 176px;
  min-width: 176px;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  text-decoration: none;
  transition: all 0.12s;
}

.sidebar-link:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
}

.sidebar-link.active {
  background: var(--el-color-primary-light-8);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.sidebar-label {
  line-height: 1;
}

/* ── Main Area ── */
.main-area {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  min-width: 0;
}

/* ── Transitions ── */
.fade-up-enter-active {
  transition: all 0.2s ease-out;
}
.fade-up-leave-active {
  transition: all 0.12s ease-in;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
