import { createRouter, createWebHashHistory } from 'vue-router';

/** 服务器资产模块路由（对外导出，供宿主应用嵌入布局） */
export const serverRoutes = [
  {
    path: '/',
    name: 'server-home',
    component: () => import('../App.vue'),
    meta: { title: '服务器资产', group: 'server' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: serverRoutes,
});

export default router;
