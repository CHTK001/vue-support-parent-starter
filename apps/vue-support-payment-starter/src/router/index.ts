import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "PaymentConsoleView",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentConsolePage;
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
    path: "/coupons",
    name: "CouponList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentCouponPage;
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
  {
    path: "/order-config",
    name: "OrderConfigView",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentOrderConfigPage;
    },
  },
  {
    path: "/global-config",
    name: "PaymentGlobalConfigView",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentGlobalConfigPage;
    },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
