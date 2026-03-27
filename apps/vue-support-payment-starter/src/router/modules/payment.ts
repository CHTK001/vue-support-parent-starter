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
      name: "PaymentHomeView",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentHomePage;
      },
      meta: {
        title: "总览首页",
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
      path: "/wallet-console",
      name: "WalletConsole",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentWalletConsolePage;
      },
      meta: {
        title: "钱包账户",
        icon: "ep:wallet",
      },
    },
    {
      path: "/wechat-pay-score",
      name: "WechatPayScoreList",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentWechatPayScorePage;
      },
      meta: {
        title: "微信支付分",
        icon: "ep:opportunity",
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
      path: "/operations",
      name: "OperationsCenter",
      component: async () => {
        const module = await import("@pages/pay");
        return module.PaymentOperationsCenterPage;
      },
      meta: {
        title: "运营中心",
        icon: "ep:setting",
      },
    },
  ],
};

export default paymentRouter;
