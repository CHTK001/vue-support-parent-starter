import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/pay",
    name: "支付管理",
    meta: {
      icon: "ri:paypal-line",
      title: "支付管理",
      rank: 3
    },
    children: [
      {
        path: "/merchant",
        name: "merchant",
        component: () => import("@/views/merchant/index.vue"),
        meta: {
          icon: "ri:merge-cells-horizontal",
          title: $t("pay.merchant"),
          showParent: true
        }
      },
      {
        path: "/order",
        name: "order",
        component: () => import("@/views/order/index.vue"),
        meta: {
          icon: "ri:order-play-line",
          title: $t("pay.order"),
          showParent: true
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
