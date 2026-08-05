<template>
  <div class="monitor-app">
    <header class="top-bar">
      <div class="brand">
        <span class="brand-dot"></span>
        <span class="brand-text">Monitor Center</span>
      </div>
      <nav class="nav-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          :class="['nav-tab', { active: activeTab === t.key }]"
          @click="activeTab = t.key"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon"></svg>
          <span>{{ t.label }}</span>
        </button>
      </nav>
    </header>

    <main class="monitor-content">
      <AssetList v-show="activeTab === 'assets'" />
      <ServerDashboard v-show="activeTab === 'dashboard'" />
      <RedisDashboard v-show="activeTab === 'redis-monitor'" />
      <CacheMonitor v-show="activeTab === 'cache'" />
      <TaskList v-show="activeTab === 'tasks'" />
      <RedisManager v-show="activeTab === 'redis'" />
      <ConfigPanel v-show="activeTab === 'config'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AssetList from './views/AssetList.vue'
import ServerDashboard from './views/dashboard/ServerDashboard.vue'
import RedisDashboard from './views/dashboard/RedisDashboard.vue'
import CacheMonitor from './views/dashboard/CacheMonitor.vue'
import TaskList from './views/TaskList.vue'
import RedisManager from './views/RedisManager.vue'
import ConfigPanel from './views/ConfigPanel.vue'

const activeTab = ref('dashboard')

const tabs = [
  { key: 'assets', label: '资产', icon: '<path d="M3 13h2v-2H3v2zm4 4h14v-2H7v2zM7 7v2h14V7H7z"/>' },
  { key: 'dashboard', label: '仪表盘', icon: '<polyline points="3,17 9,11 13,15 21,7"/><polyline points="14,7 21,7 21,14"/>' },
  { key: 'redis-monitor', label: 'Redis 监控', icon: '<circle cx="5" cy="12" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/>' },
  { key: 'cache', label: '缓存监控', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { key: 'tasks', label: '任务', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  { key: 'redis', label: 'Redis', icon: '<circle cx="5" cy="12" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/>' },
  { key: 'config', label: '配置', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>' },
]
</script>

<style scoped>
.monitor-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color, #f8fafc);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px 24px;
  background: var(--el-card-bg-color, #ffffff);
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
  flex-shrink: 0;
}

.brand { display: flex; align-items: center; gap: 10px; }
.brand-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}
.brand-text { font-size: 16px; font-weight: 700; color: #1f2937; letter-spacing: -0.2px; }

.nav-tabs { display: flex; gap: 4px; }
.nav-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border: none; border-radius: 12px;
  background: transparent; color: #4b5563;
  font-size: 13.5px; font-weight: 500; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-tab:hover { background: #f1f5f9; color: #1f2937; }
.nav-tab.active { background: #e0e7ff; color: #3b82f6; font-weight: 600; }
.nav-icon { width: 16px; height: 16px; fill: currentColor; }

.monitor-content { flex: 1; padding: 20px; overflow: auto; }
</style>
