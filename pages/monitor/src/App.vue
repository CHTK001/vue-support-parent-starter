<template>
  <div class="monitor-app">
    <header class="top-bar">
      <div class="brand">
        <span class="brand-dot"></span>
        <div class="brand-text-wrap">
          <span class="brand-text">Monitor</span>
          <span class="brand-sub">实时监控中心</span>
        </div>
        <span class="brand-sep"></span>
        <span class="sys-status">
          <span class="sys-dot"></span>
          <span>系统正常</span>
        </span>
      </div>

      <nav class="nav-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          :class="['nav-tab', { active: activeTab === t.key }]"
          @click="activeTab = t.key"
        >
          <ReIcon class="nav-icon" :name="t.icon" :size="14" />
          <span>{{ t.label }}</span>
        </button>
      </nav>

      <div class="top-right">
        <ScAlarmCenter />
        <span class="clock">{{ currentTime }}</span>
        <ReDropdown trigger="click" placement="bottom-end">
          <div class="user-zone">
            <ReAvatar :size="26" class="user-avatar"><ReIcon name="User" :size="14" /></ReAvatar>
            <span class="user-name">Admin</span>
            <ReIcon name="ArrowDown" :size="10" class="user-arrow" />
          </div>
          <template #dropdown>
            <ReDropdownMenu>
              <ReDropdownItem><ReIcon name="User" :size="12" /> 个人资料</ReDropdownItem>
              <ReDropdownItem><ReIcon name="Setting" :size="12" /> 系统设置</ReDropdownItem>
              <ReDropdownItem divided><ReIcon name="SwitchButton" :size="12" /> 退出登录</ReDropdownItem>
            </ReDropdownMenu>
          </template>
        </ReDropdown>
      </div>
    </header>

    <main class="monitor-content">
      <ScOverview v-show="activeTab === 'overview'" />
      <ScAssetCenter v-show="activeTab === 'assets'" />
      <ScAssetList v-show="activeTab === 'monitor-items'" />
      <ScServerDashboard v-if="activeTab === 'dashboard'" />
      <ScAlarmTab v-if="activeTab === 'alarm'" />
      <ScRedisDashboard v-if="activeTab === 'redis-monitor'" />
      <ScCacheMonitor v-if="activeTab === 'cache'" />
      <ScTaskList v-show="activeTab === 'tasks'" />
      <ScRedisManager v-show="activeTab === 'redis'" />
      <ScAgentList v-show="activeTab === 'agents'" />
      <ScTsharkCapture v-if="activeTab === 'tshark'" />
      <ScTerminalSnippetManager v-show="activeTab === 'snippets'" />
      <ScConfigPanel v-show="activeTab === 'config'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import ScAssetList from './views/ScAssetList.vue'
import ScAssetCenter from './views/assets/ScAssetCenter.vue'
import ScServerDashboard from './views/dashboard/ScServerDashboard.vue'
import ScRedisDashboard from './views/redis-monitor/ScRedisDashboard.vue'
import ScCacheMonitor from './views/cache/ScCacheMonitor.vue'
import ScTaskList from './views/tasks/ScTaskList.vue'
import ScAlarmTab from './views/alarm/ScAlarmTab.vue'
import ScAgentList from './views/agents/ScAgentList.vue'
import ScOverview from './views/overview/ScOverview.vue'
import ScRedisManager from './views/redis/ScRedisManager.vue'
import ScConfigPanel from './views/config/ScConfigPanel.vue'
import ScTsharkCapture from './views/tshark/ScTsharkCapture.vue'
import ScTerminalSnippetManager from './views/ScTerminalSnippetManager.vue'
import ScAlarmCenter from './components/ScAlarmCenter.vue'

const activeTab = ref('dashboard')
const currentTime = ref('')
const route = useRoute()

const tabs = [
  { key: 'overview', label: '概览', icon: 'DataBoard' },
  { key: 'assets', label: '资产', icon: 'Monitor' },
  { key: 'monitor-items', label: '监控项', icon: 'Coin' },
  { key: 'dashboard', label: '仪表盘', icon: 'Dashboard' },
  { key: 'alarm', label: '告警', icon: 'Bell' },
  { key: 'redis-monitor', label: 'Redis 监控', icon: 'Coin' },
  { key: 'cache', label: '缓存监控', icon: 'List' },
  { key: 'tasks', label: '任务', icon: 'Timer' },
  { key: 'redis', label: 'Redis', icon: 'Coin' },
  { key: 'agents', label: 'Agent', icon: 'Monitor' },
  { key: 'tshark', label: '抓包', icon: 'Monitor' },
  { key: 'snippets', label: '片段管理', icon: 'Document' },
  { key: 'config', label: '配置', icon: 'Setting' },
]

// 支持从 URL query 切换 tab（如告警中心跳转 /?tab=alarm）
watch(
  () => route.query.tab,
  (tab) => {
    if (typeof tab === 'string' && tabs.some(t => t.key === tab)) {
      activeTab.value = tab
    }
  },
  { immediate: true },
)

let clockTimer: any = null
const updateClock = () => {
  const d = new Date()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  currentTime.value = `${h}:${m}:${s}`
}

onMounted(() => { updateClock(); clockTimer = setInterval(updateClock, 1000) })
onBeforeUnmount(() => { if (clockTimer) clearInterval(clockTimer) })
</script>

<style scoped>
.monitor-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  min-height: 54px;
}

.brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.brand-dot {
  width: 7px; height: 7px; border-radius: 2px;
  background: var(--el-color-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}
.brand-text-wrap { display: flex; flex-direction: column; line-height: 1.2; }
.brand-text { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); letter-spacing: -0.2px; }
.brand-sub { font-size: 10px; color: var(--el-text-color-secondary); letter-spacing: 0.3px; font-weight: 500; }
.brand-sep { width: 1px; height: 22px; background: var(--el-border-color-light); }
.sys-status { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--el-text-color-secondary); }
.sys-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 20%, transparent);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 20%, transparent); }
  50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--el-color-success) 8%, transparent); }
}

.nav-tabs { display: flex; gap: 2px; flex: 1; justify-content: center; padding: 3px; background: var(--el-fill-color-light); border-radius: 10px; }
.nav-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; border: none; border-radius: 7px;
  background: transparent; color: var(--el-text-color-secondary);
  font-size: 12.5px; font-weight: 500; cursor: pointer;
  transition: all 0.18s ease; white-space: nowrap;
}
.nav-tab:hover { color: var(--el-text-color-primary); background: var(--el-bg-color); }
.nav-tab.active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.nav-icon { width: 13px; height: 13px; color: currentColor; }

.top-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.clock {
  font-family: 'SF Mono', 'Cascadia Code', monospace;
  font-size: 11px; color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  padding: 3px 8px; background: var(--el-fill-color-light);
  border-radius: 5px;
}
.user-zone {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px 4px 6px; border-radius: 6px;
  cursor: pointer; transition: background 0.15s;
}
.user-zone:hover { background: var(--el-fill-color-light); }
.user-avatar {
  background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
}
.user-name { font-size: 11.5px; font-weight: 500; color: var(--el-text-color-primary); }
.user-arrow { width: 10px; height: 10px; color: var(--el-text-color-secondary); }
.user-dropdown { display: none; }

.monitor-content { flex: 1; padding: 16px; overflow: auto; }
</style>