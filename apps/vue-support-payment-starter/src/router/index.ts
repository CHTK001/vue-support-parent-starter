import { createRouter, createWebHashHistory } from "vue-router";
import { setPaymentRoutePrefix, prefixRoutes, withPrefix } from "@pages/pay";

setPaymentRoutePrefix("/payment");

const appRoutes = [
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
    path: "/wallet-orders",
    name: "WalletOrderList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentWalletOrderPage;
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
  {
    path: "/withdraw-approval",
    name: "WithdrawApprovalList",
    component: async () => {
      const module = await import("@pages/pay");
      return module.PaymentWithdrawApprovalPage;
    },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    // Root redirect — NOT prefixed, so #/ still matches the router
    { path: "/", redirect: withPrefix("/home") },
    // All other routes get the /payment prefix
    ...prefixRoutes(appRoutes),
  ],
});
