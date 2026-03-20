import type { RouteConfigsTable } from "@repo/types";

/**
 * 支付系统路由配置
 */
const paymentRouter: RouteConfigsTable = {
  path: "/",
  redirect: "/orders",
  meta: {
    title: "支付系统",
    rank: 0,
  },
  children: [
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
      path: "/merchants",
      name: "MerchantList",
      component: () => import("@/views/MerchantList.vue"),
      meta: {
        title: "商户列表",
        icon: "ep:shop",
      },
    },
  ],
};

export default paymentRouter;
