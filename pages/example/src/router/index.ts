import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/airline',
    name: 'Airline',
    component: () => import('../views/AirlineDemo.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 