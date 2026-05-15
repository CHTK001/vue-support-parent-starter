import type { RouteConfigsTable } from "@repo/types";

/**
 * 支付系统路由配置
 */
const paymentRouter: RouteConfigsTable = {
  path: "/",
  redirect: "/home",
  meta: {
    title: "支付系统",
    rank: 0,
  },
  children: [
    {
      path: "/home",
      name: "PaymentConsoleView",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentConsolePage;
      },
      meta: {
        title: "台账",
        icon: "ep:home-filled",
      },
    },
    {
      path: "/orders",
      name: "OrderList",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentOrderPage;
      },
      meta: {
        title: "订单列表",
        icon: "ep:list",
      },
    },
    {
      path: "/refunds",
      name: "RefundList",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentRefundPage;
      },
      meta: {
        title: "退款管理",
        icon: "ep:refresh-left",
      },
    },
    {
      path: "/merchants",
      name: "MerchantList",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentMerchantPage;
      },
      meta: {
        title: "商户列表",
        icon: "ep:shop",
      },
    },
    {
      path: "/transactions",
      name: "TransactionList",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentTransactionPage;
      },
      meta: {
        title: "交易流水",
        icon: "ep:credit-card",
      },
    },
    {
      path: "/coupons",
      name: "CouponList",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentCouponPage;
      },
      meta: {
        title: "优惠券管理",
        icon: "ep:present",
      },
    },
    {
      path: "/wallet-orders",
      name: "WalletOrderList",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentWalletOrderPage;
      },
      meta: {
        title: "钱包订单",
        icon: "ep:wallet-filled",
      },
    },
    {
      path: "/global-config",
      name: "PaymentGlobalConfigView",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentGlobalConfigPage;
      },
      meta: {
        title: "支付全局配置",
        icon: "ep:setting",
      },
    },
    {
      path: "/order-config",
      name: "PaymentOrderConfigView",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentOrderConfigPage;
      },
      meta: {
        title: "订单配置",
        icon: "ep:tools",
      },
    },
    {
      path: "/operations",
      name: "OperationsCenter",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentOperationsCenterPage;
      },
      meta: {
        title: "回调与调度",
        icon: "ep:setting",
      },
    },
  ],
};

export default paymentRouter;
