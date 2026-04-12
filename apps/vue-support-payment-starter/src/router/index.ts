import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "HomeView",
    component: () => import("../../../../pages/pay/src/views/HomeView.vue"),
  },
  {
    path: "/merchants",
    name: "MerchantList",
    component: () => import("../../../../pages/pay/src/views/MerchantList.vue"),
  },
  {
    path: "/orders",
    name: "OrderList",
    component: () => import("../../../../pages/pay/src/views/OrderList.vue"),
  },
  {
    path: "/refunds",
    name: "RefundList",
    component: () => import("../../../../pages/pay/src/views/RefundList.vue"),
  },
  {
    path: "/transactions",
    name: "TransactionList",
    component: () => import("../../../../pages/pay/src/views/TransactionList.vue"),
  },
  {
    path: "/wallet-console",
    name: "WalletConsole",
    component: () => import("../../../../pages/pay/src/views/WalletConsole.vue"),
  },
  {
    path: "/wechat-pay-score",
    name: "WechatPayScoreList",
    component: () => import("../../../../pages/pay/src/views/WechatPayScoreList.vue"),
  },
  {
    path: "/wallet-orders",
    name: "WalletOrderList",
    component: () => import("../../../../pages/pay/src/views/WalletOrderList.vue"),
  },
  {
    path: "/operations",
    name: "OperationsCenter",
    component: () => import("../../../../pages/pay/src/views/OperationsCenter.vue"),
  },
  {
    path: "/order-config",
    name: "OrderConfigView",
    component: () => import("../../../../pages/pay/src/views/OrderConfigView.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
