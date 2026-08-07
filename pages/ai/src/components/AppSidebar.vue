<template>
  <aside :class="['app-sidebar', { 'app-sidebar--collapsed': collapsed }]">
    <!-- Logo -->
    <div class="app-sidebar__brand">
      <div class="app-sidebar__logo">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
          <path d="M5 14h14l-1.5 3H6.5L5 14z" />
          <circle cx="12" cy="18" r="3" />
        </svg>
      </div>
      <span v-if="!collapsed" class="app-sidebar__brand-text">KOI-AI</span>
    </div>

    <!-- 功能入口 -->
    <nav class="app-sidebar__nav">
      <div v-if="!collapsed" class="app-sidebar__group-label">功能</div>
      <router-link
        v-for="item in featureItems"
        :key="item.path"
        :to="item.path"
        :class="['app-sidebar__item', { 'app-sidebar__item--active': isActive(item.path) }]"
      >
        <component :is="item.icon" class="app-sidebar__icon" />
        <span v-if="!collapsed" class="app-sidebar__item-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- 管理入口（admin 可见） -->
    <nav v-role="['admin', 'superadmin']" class="app-sidebar__nav">
      <div v-if="!collapsed" class="app-sidebar__group-label">管理</div>
      <router-link
        v-for="item in manageItems"
        :key="item.path"
        :to="item.path"
        :class="['app-sidebar__item', { 'app-sidebar__item--active': isActive(item.path) }]"
      >
        <component :is="item.icon" class="app-sidebar__icon" />
        <span v-if="!collapsed" class="app-sidebar__item-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- 底部折叠按钮 -->
    <div class="app-sidebar__footer">
      <button class="app-sidebar__toggle" @click="$emit('toggle')">
        <svg v-if="!collapsed" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        <svg v-else viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
        </svg>
        <span v-if="!collapsed" class="app-sidebar__toggle-label">收起菜单</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * AppSidebar —— ChatGPT 风格深色侧边栏
 *
 * 包含功能入口（对话/图像/视频）和管理入口（提供商/模型/分组等），
 * 管理入口通过 v-role 指令控制权限可见性。
 */
import { computed, h, type Component } from 'vue';
import { useRoute } from 'vue-router';

defineProps<{
  collapsed?: boolean;
}>();

defineEmits<{
  (e: 'toggle'): void;
}>();

const route = useRoute();

/** 创建简易 SVG 图标组件 */
function svgIcon(paths: string[], viewBox = '0 0 24 24'): Component {
  return {
    render() {
      return h(
        'svg',
        {
          viewBox,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          width: '18',
          height: '18',
        },
        paths.map((d) => h('path', { d })),
      );
    },
  };
}

/* ===== SVG 图标定义 ===== */
const IconChat = svgIcon([
  'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
]);
const IconImage = svgIcon([
  'M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10',
  'M3 15l4-4a2 2 0 0 1 2.8 0L15 16',
  'M14 14l1-1a2 2 0 0 1 2.8 0L21 16',
  'M3 19h18',
]);
const IconVideo = svgIcon([
  'M23 7l-7 5 7 5V7z',
  'M1 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a0 0 0 0 1 0 0V5z',
]);
const IconCpu = svgIcon([
  'M4 4h16v16H4z',
  'M9 9h6v6H9z',
  'M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3',
]);
const IconBox = svgIcon([
  'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  'M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
]);
const IconChart = svgIcon([
  'M18 20V10M12 20V4M6 20v-6',
]);
const IconBell = svgIcon([
  'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
  'M13.73 21a2 2 0 0 1-3.46 0',
]);
const IconServer = svgIcon([
  'M2 2h20v8H2zM2 14h20v8H2z',
  'M6 6h.01M6 18h.01',
]);
const IconKey = svgIcon([
  'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
]);
const IconSettings = svgIcon([
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
]);
const IconGrid = svgIcon([
  'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
]);
const IconFactory = svgIcon([
  'M3 21h18',
  'M5 21V7a2 2 0 0 1 2-2h2V3h2v2h4a2 2 0 0 1 2 2v14',
  'M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6',
  'M7 11h2M15 11h2M7 15h2M15 15h2',
]);

/* ===== 菜单项定义 ===== */
interface NavItem {
  path: string;
  label: string;
  icon: Component;
}

const featureItems: NavItem[] = [
  { path: '/chat', label: '对话', icon: IconChat },
  { path: '/image-gen', label: '图像生成', icon: IconImage },
  { path: '/video-gen', label: '视频生成', icon: IconVideo },
];

const manageItems: NavItem[] = [
  { path: '/model/manufacturers', label: '厂商', icon: IconFactory },
  { path: '/model/providers', label: '提供商', icon: IconCpu },
  { path: '/model/models', label: '模型', icon: IconGrid },
  { path: '/model/groups', label: '分组', icon: IconBox },
  { path: '/model/app-keys', label: 'AppKey', icon: IconKey },
  { path: '/model/usage', label: '用量', icon: IconChart },
  { path: '/model/alerts', label: '告警', icon: IconBell },
  { path: '/model/services', label: '服务', icon: IconServer },
  { path: '/model/global', label: '全局配置', icon: IconSettings },
];

/** 路由高亮判断：精确匹配或前缀匹配 */
function isActive(path: string): boolean {
  const current = route.path;
  if (current === path) return true;
  // /model/providers 也高亮 /model 分组
  if (path !== '/' && current.startsWith(path + '/')) return true;
  // / 重定向到 /chat，也高亮
  if (path === '/chat' && current === '/') return true;
  return false;
}
</script>

<style scoped>
.app-sidebar {
  width: var(--ai-sidebar-width);
  height: 100vh;
  background: var(--ai-sidebar-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  transition: width var(--ai-transition-normal);
}
.app-sidebar--collapsed {
  width: var(--ai-sidebar-collapsed-width);
}

/* Logo 区域 */
.app-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 12px;
  flex-shrink: 0;
}
.app-sidebar__logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.app-sidebar__brand-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--ai-sidebar-text-active);
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* 导航分组 */
.app-sidebar__nav {
  padding: 8px 8px 4px;
  flex-shrink: 0;
}
.app-sidebar__group-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 8px 12px 6px;
  white-space: nowrap;
}

/* 导航项 */
.app-sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--ai-sidebar-text);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--ai-transition-fast);
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  margin-bottom: 2px;
}
.app-sidebar__item:hover {
  background: var(--ai-sidebar-hover);
  color: var(--ai-sidebar-text-active);
}
.app-sidebar__item--active {
  background: var(--ai-sidebar-active);
  color: var(--ai-sidebar-text-active);
}
.app-sidebar__item--active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 0 3px 3px 0;
  background: var(--el-color-primary);
}
.app-sidebar__icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}
.app-sidebar__item-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部折叠按钮 */
.app-sidebar__footer {
  margin-top: auto;
  padding: 12px 8px 16px;
  flex-shrink: 0;
}
.app-sidebar__toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ai-sidebar-text);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--ai-transition-fast);
}
.app-sidebar__toggle:hover {
  background: var(--ai-sidebar-hover);
  color: var(--ai-sidebar-text-active);
}
.app-sidebar__toggle-label {
  white-space: nowrap;
}

/* 折叠态居中图标 */
.app-sidebar--collapsed .app-sidebar__brand {
  justify-content: center;
  padding: 20px 0 12px;
}
.app-sidebar--collapsed .app-sidebar__nav {
  padding: 8px 4px 4px;
}
.app-sidebar--collapsed .app-sidebar__item {
  justify-content: center;
  padding: 10px;
}
.app-sidebar--collapsed .app-sidebar__item--active::before {
  display: none;
}
.app-sidebar--collapsed .app-sidebar__footer {
  padding: 12px 4px 16px;
}
.app-sidebar--collapsed .app-sidebar__toggle {
  justify-content: center;
  padding: 10px;
}
</style>
