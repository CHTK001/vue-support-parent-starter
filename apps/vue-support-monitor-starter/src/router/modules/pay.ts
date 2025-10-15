import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/pay",
    name: "PayManagement",
    meta: {
      title: "支付管理",
      icon: "ri:wallet-3-line",
      rank: 20
    },
    children: [
      {
        path: "/pay/merchant",
        name: "PayMerchant",
        component: async () => {
          const { PayMerchantPage } = await import("@pages/pay");
          return PayMerchantPage;
        },
        meta: {
          title: "商户管理",
          icon: "ri:store-2-line",
          remaining: true
        }
      },
      {
        path: "/pay/order",
        name: "PayOrder",
        component: async () => {
          const { PayOrderPage } = await import("@pages/pay");
          return PayOrderPage;
        },
        meta: {
          title: "订单管理",
          icon: "ep:document",
          remaining: true
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
