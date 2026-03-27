import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "HomeView",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentHomePage;
    },
  },
  {
    path: "/merchants",
    name: "MerchantList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentMerchantPage;
    },
  },
  {
    path: "/orders",
    name: "OrderList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentOrderPage;
    },
  },
  {
    path: "/refunds",
    name: "RefundList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentRefundPage;
    },
  },
  {
    path: "/transactions",
    name: "TransactionList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentTransactionPage;
    },
  },
  {
    path: "/wallet-console",
    name: "WalletConsole",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentWalletConsolePage;
    },
  },
  {
    path: "/wechat-pay-score",
    name: "WechatPayScoreList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentWechatPayScorePage;
    },
  },
  {
    path: "/wallet-orders",
    name: "WalletOrderList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentWalletOrderPage;
    },
  },
  {
    path: "/operations",
    name: "OperationsCenter",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentOperationsCenterPage;
    },
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
