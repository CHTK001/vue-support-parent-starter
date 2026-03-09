import { createRouter, createWebHistory } from 'vue-router';
import OrderList from '../views/OrderList.vue';
import MerchantList from '../views/MerchantList.vue';

const routes = [
  {
    path: '/',
    redirect: '/orders',
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: OrderList,
  },
  {
    path: '/merchants',
    name: 'MerchantList',
    component: MerchantList,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
