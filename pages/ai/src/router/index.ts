import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/chat',
    component: () => import('../views/Chat.vue'),
  },
  {
    path: '/image-gen',
    component: () => import('../views/ImageGen.vue'),
  },
  {
    path: '/video-gen',
    component: () => import('../views/VideoGen.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
