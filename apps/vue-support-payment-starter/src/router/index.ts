import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/merchants",
  },
  {
    path: "/merchants",
    name: "MerchantList",
    component: () => import("../views/MerchantList.vue"),
  },
  {
    path: "/orders",
    name: "OrderList",
    component: () => import("../views/OrderList.vue"),
  },
  {
    path: "/transactions",
    name: "TransactionList",
    component: () => import("../views/TransactionList.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
