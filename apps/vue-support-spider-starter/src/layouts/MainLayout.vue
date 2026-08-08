<template>
  <div class="app-shell">
    <aside class="app-aside">
      <div class="brand">Spider Center</div>
      <nav class="app-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'is-active': isActive(item.path) }"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="app-foot">
        <div>v1.0.0 · CH</div>
        <div>后端: 127.0.0.1:19091</div>
      </div>
    </aside>
    <main class="app-main">
      <header class="app-header">
        <span class="app-title">{{ pageTitle }}</span>
        <span class="app-backend">后端: 19091</span>
      </header>
      <section class="app-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Connection, List, Setting, AlarmClock } from "@element-plus/icons-vue";

const route = useRoute();

/**
 * 侧边栏菜单。
 */
const menuItems = [
  { path: "/definitions", label: "爬虫定义", icon: Setting },
  { path: "/proxy-pools", label: "代理池", icon: Connection },
  { path: "/executions", label: "执行记录", icon: List },
  { path: "/schedules", label: "定时调度", icon: AlarmClock },
];

/**
 * 当前路由标题。
 */
const pageTitle = computed(
  () => menuItems.find((m) => m.path === route.path)?.label ?? "Spider Center"
);

/**
 * 判断菜单项是否处于激活态。
 */
function isActive(path: string): boolean {
  return route.path.startsWith(path);
}
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  width: 100%;
  background: var(--el-bg-color-page);
}
.app-aside {
  width: 220px;
  background: #0f172a;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.brand {
  padding: 18px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
  border-bottom: 1px solid #1e293b;
}
.app-nav {
  flex: 1;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 14px;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover {
  background: #1e293b;
  color: #f8fafc;
}
.nav-item.is-active {
  background: #1e293b;
  color: #60a5fa;
  border-left-color: #3b82f6;
}
.app-foot {
  padding: 12px 20px;
  font-size: 11px;
  color: #64748b;
  border-top: 1px solid #1e293b;
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}
.app-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.app-backend {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.app-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
