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
      component: () => import("@/views/HomeView.vue"),
      meta: {
        title: "总览首页",
        icon: "ep:home-filled",
      },
    },
    {
      path: "/orders",
      name: "OrderList",
      component: () => import("@/views/OrderList.vue"),
      meta: {
        title: "订单列表",
        icon: "ep:list",
      },
    },
    {
      path: "/refunds",
      name: "RefundList",
      component: () => import("@/views/RefundList.vue"),
      meta: {
        title: "退款管理",
        icon: "ep:refresh-left",
      },
    },
    {
      path: "/merchants",
      name: "MerchantList",
      component: () => import("@/views/MerchantList.vue"),
      meta: {
        title: "商户列表",
        icon: "ep:shop",
      },
    },
    {
      path: "/transactions",
      name: "TransactionList",
      component: () => import("@/views/TransactionList.vue"),
      meta: {
        title: "交易流水",
        icon: "ep:credit-card",
      },
    },
    {
      path: "/wallet-console",
      name: "WalletConsole",
      component: () => import("@/views/WalletConsole.vue"),
      meta: {
        title: "钱包账户",
        icon: "ep:wallet",
      },
    },
    {
      path: "/wechat-pay-score",
      name: "WechatPayScoreList",
      component: () => import("@/views/WechatPayScoreList.vue"),
      meta: {
        title: "微信支付分",
        icon: "ep:opportunity",
      },
    },
    {
      path: "/wallet-orders",
      name: "WalletOrderList",
      component: () => import("@/views/WalletOrderList.vue"),
      meta: {
        title: "钱包订单",
        icon: "ep:wallet-filled",
      },
    },
    {
      path: "/operations",
      name: "OperationsCenter",
      component: () => import("@/views/OperationsCenter.vue"),
      meta: {
        title: "运营中心",
        icon: "ep:setting",
      },
    },
  ],
};

export default paymentRouter;
