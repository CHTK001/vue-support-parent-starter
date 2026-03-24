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
    path: "/refunds",
    name: "RefundList",
    component: () => import("@/views/RefundList.vue"),
  },
  {
    path: "/transactions",
    name: "TransactionList",
    component: () => import("@/views/TransactionList.vue"),
  },
  {
    path: "/wallet-console",
    name: "WalletConsole",
    component: () => import("@/views/WalletConsole.vue"),
  },
  {
    path: "/wechat-pay-score",
    name: "WechatPayScoreList",
    component: () => import("@/views/WechatPayScoreList.vue"),
  },
  {
    path: "/wallet-orders",
    name: "WalletOrderList",
    component: () => import("@/views/WalletOrderList.vue"),
  },
  {
    path: "/operations",
    name: "OperationsCenter",
    component: () => import("@/views/OperationsCenter.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
