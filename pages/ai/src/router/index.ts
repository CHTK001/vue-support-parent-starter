import { createRouter, createWebHashHistory } from 'vue-router';

/**
 * 路由表：AI 工作台单页面应用
 *
 * 路由结构：
 *   /                            → 重定向到 /chat
 *   /chat, /image-gen, /video-gen → 功能入口（views/）
 *   /model/*                     → 管理面板（components/settings/）
 */
export const aiRoutes = [
  {
    path: '/',
    name: 'ai-home',
    component: () => import('../views/Chat.vue'),
    meta: { title: 'AI 对话', group: 'feature' },
  },
  // ===== 功能入口 =====
  {
    path: '/chat',
    name: 'ai-chat',
    component: () => import('../views/Chat.vue'),
    meta: { title: 'AI 对话', group: 'feature' },
  },
  {
    path: '/image-gen',
    name: 'ai-image-gen',
    component: () => import('../views/ImageGen.vue'),
    meta: { title: '图像生成', group: 'feature' },
  },
  {
    path: '/video-gen',
    name: 'ai-video-gen',
    component: () => import('../views/VideoGen.vue'),
    meta: { title: '视频生成', group: 'feature' },
  },

  // ===== 管理面板（admin 可见） =====
  {
    path: '/model/manufacturers',
    name: 'model-manufacturers',
    component: () => import('../components/settings/ManufacturersPanel.vue'),
    meta: { title: '厂商', group: 'manage' },
  },
  {
    path: '/model/providers',
    name: 'model-providers',
    component: () => import('../components/settings/ProvidersPanel.vue'),
    meta: { title: '提供商', group: 'manage' },
  },
  {
    path: '/model/models',
    name: 'model-models',
    component: () => import('../components/settings/ModelsPanel.vue'),
    meta: { title: '模型', group: 'manage' },
  },
  {
    path: '/model/groups',
    name: 'model-groups',
    component: () => import('../components/settings/GroupsPanel.vue'),
    meta: { title: '分组', group: 'manage' },
  },
  {
    path: '/model/app-keys',
    name: 'model-app-keys',
    component: () => import('../components/settings/AppKeysPanel.vue'),
    meta: { title: 'AppKey', group: 'manage' },
  },
  {
    path: '/model/usage',
    name: 'model-usage',
    component: () => import('../components/settings/UsagePanel.vue'),
    meta: { title: '用量统计', group: 'manage' },
  },
  {
    path: '/model/alerts',
    name: 'model-alerts',
    component: () => import('../components/settings/AlertsPanel.vue'),
    meta: { title: '告警', group: 'manage' },
  },
  {
    path: '/model/services',
    name: 'model-services',
    component: () => import('../components/settings/ServicesPanel.vue'),
    meta: { title: '服务', group: 'manage' },
  },
  {
    path: '/model/global',
    name: 'model-global',
    component: () => import('../components/settings/GlobalPanel.vue'),
    meta: { title: '全局配置', group: 'manage' },
  },

  // ===== 兼容重定向 =====
  {
    path: '/settings',
    redirect: '/model/providers',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: aiRoutes,
});

export default router;
