import { createRouter, createWebHashHistory } from 'vue-router';

export const monitorRoutes = [
  {
    path: '/',
    name: 'monitor-home',
    component: () => import('../App.vue'),
    meta: { title: '监控管理', group: 'monitor' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: monitorRoutes,
});

export default router;