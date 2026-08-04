import { createRouter, createWebHashHistory } from 'vue-router';

/**
 * 路由表：单页面 AI 工作台（vue-support-ai-starter 主页面）
 *
 * 顶层路由表：
 *   /                            → 重定向到 /chat
 *   /chat, /image-gen, /video-gen → 功能入口（位于 pages/ai/src/views/）
 *   /model/*                     → 模型管理面板（位于 pages/ai/src/components/settings/）
 *
 * 注意：本文件是单页面框架的唯一路由来源。views 与 settings/* 都来自本包。
 */
export const aiRoutes = [
  {
    path: '/',
    name: 'ai-home',
    component: () => import('../views/Chat.vue'),
    meta: { title: 'AI 对话', icon: 'ChatDotRound', category: 'feature' },
  },
  // ===== 功能入口 =====
  {
    path: '/chat',
    name: 'ai-chat',
    component: () => import('../views/Chat.vue'),
    meta: { title: 'AI 对话', icon: 'ChatDotRound', category: 'feature' },
  },
  {
    path: '/image-gen',
    name: 'ai-image-gen',
    component: () => import('../views/ImageGen.vue'),
    meta: { title: '图像生成', icon: 'Picture', category: 'feature' },
  },
  {
    path: '/video-gen',
    name: 'ai-video-gen',
    component: () => import('../views/VideoGen.vue'),
    meta: { title: '视频生成', icon: 'VideoCamera', category: 'feature' },
  },

  // ===== 模型管理（复用各 settings 面板） =====
  {
    path: '/model/providers',
    name: 'model-providers',
    component: () => import('../components/settings/ProvidersPanel.vue'),
    meta: { title: '模型供应商', icon: 'Connection', category: 'model' },
  },
  {
    path: '/model/app-keys',
    name: 'model-app-keys',
    component: () => import('../components/settings/AppKeysPanel.vue'),
    meta: { title: 'AppKey', icon: 'Key', category: 'model' },
  },
  {
    path: '/model/groups',
    name: 'model-groups',
    component: () => import('../components/settings/GroupsPanel.vue'),
    meta: { title: '分组管理', icon: 'Files', category: 'model' },
  },
  {
    path: '/model/alerts',
    name: 'model-alerts',
    component: () => import('../components/settings/AlertsPanel.vue'),
    meta: { title: '告警规则', icon: 'Bell', category: 'model' },
  },
  {
    path: '/model/usage',
    name: 'model-usage',
    component: () => import('../components/settings/UsagePanel.vue'),
    meta: { title: '用量统计', icon: 'DataAnalysis', category: 'model' },
  },
  {
    path: '/model/services',
    name: 'model-services',
    component: () => import('../components/settings/ServicesPanel.vue'),
    meta: { title: '聚合服务', icon: 'Cpu', category: 'model' },
  },
  {
    path: '/model/global',
    name: 'model-global',
    component: () => import('../components/settings/GlobalPanel.vue'),
    meta: { title: '全局配置', icon: 'Setting', category: 'model' },
  },

  // ===== 设置（独立页面，替代原 drawer） =====
  {
    path: '/settings',
    name: 'ai-settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '设置', icon: 'Setting', category: 'model' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: aiRoutes,
});

export default router;
