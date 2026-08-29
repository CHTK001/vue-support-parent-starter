<script setup lang="ts">
import { ref, shallowRef, type Component } from 'vue';
import ReHostList from './views/ReHostList.vue';
import ReCredentialTab from './views/ReCredentialTab.vue';
import ReExecTab from './views/ReExecTab.vue';
import ReSessionTab from './views/ReSessionTab.vue';
import ReMaintenancePlan from './views/ReMaintenancePlan.vue';
import ReGroupTree from './views/ReGroupTree.vue';
import ReTerminalSnippetManager from './views/ReTerminalSnippetManager.vue';

/** 顶部导航 tab 定义 */
interface TabItem {
  key: string;
  label: string;
  icon: string;
}

/** 业务 tab 与组件的映射 */
const tabs: TabItem[] = [
  { key: 'hosts', label: '主机', icon: 'Monitor' },
  { key: 'credentials', label: '凭据', icon: 'Key' },
  { key: 'exec', label: '批量作业', icon: 'Operation' },
  { key: 'sessions', label: '会话审计', icon: 'Document' },
  { key: 'maintenance', label: '维护计划', icon: 'Clock' },
  { key: 'groups', label: '分组管理', icon: 'FolderOpened' },
  { key: 'snippets', label: '片段管理', icon: 'Grid' },
];

/** 当前激活 tab（v-show 保持状态） */
const activeTab = ref('hosts');

/** tab -> 组件映射 */
const tabComponents: Record<string, Component> = {
  hosts: ReHostList,
  credentials: ReCredentialTab,
  exec: ReExecTab,
  sessions: ReSessionTab,
  maintenance: ReMaintenancePlan,
  groups: ReGroupTree,
  snippets: ReTerminalSnippetManager,
};

/** 当前渲染组件 */
const activeComponent = shallowRef<Component>(tabComponents.hosts);

/**
 * 切换 tab
 *
 * @param key 目标 tab 键
 */
function switchTab(key: string): void {
  activeTab.value = key;
  activeComponent.value = tabComponents[key];
}
</script>

<template>
  <div class="server-shell">
    <!-- 顶栏：品牌 + 导航 -->
    <header class="server-topbar">
      <div class="brand">
        <el-icon :size="20" color="#409eff"><Cpu /></el-icon>
        <span class="brand-name">服务器资产</span>
      </div>
      <nav class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-tab"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          {{ tab.label }}
        </button>
      </nav>
      <div class="topbar-spacer" />
    </header>

    <!-- 内容区：v-show 保持各页签内部状态 -->
    <main class="server-content">
      <component :is="activeComponent" />
    </main>
  </div>
</template>

<style scoped lang="scss">
.server-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.server-topbar {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 52px;
  padding: 0 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;

  .brand-name {
    font-weight: 600;
    font-size: 15px;
  }
}

.nav-tabs {
  display: flex;
  gap: 4px;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

.topbar-spacer {
  flex: 1;
}

.server-content {
  flex: 1;
  padding: 16px 20px 24px;
}
</style>
