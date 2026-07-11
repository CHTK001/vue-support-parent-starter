import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/CaptureHome.vue'),
    },
    {
      path: '/packets/:sessionId',
      name: 'Packets',
      component: () => import('@/views/PacketList.vue'),
    },
    {
      path: '/packet/:id',
      name: 'PacketDetail',
      component: () => import('@/views/PacketDetail.vue'),
    },
    {
      path: '/stats/:sessionId',
      name: 'Stats',
      component: () => import('@/views/CaptureStats.vue'),
    },
  ],
})

export default router
