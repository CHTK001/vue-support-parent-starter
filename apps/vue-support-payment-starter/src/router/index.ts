import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "HomeView",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/merchants",
    name: "MerchantList",
    component: () => import("@/views/MerchantList.vue"),
  },
  {
    path: "/orders",
    name: "OrderList",
    component: () => import("@/views/OrderList.vue"),
  },
  {
    path: "/transactions",
    name: "TransactionList",
    component: () => import("@/views/TransactionList.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
