import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/limit",
    name: "Limit",
    component: Layout,
    redirect: "/limit/configuration",
    meta: {
      icon: "ri:speed-up-line",
      title: "限流管理",
      rank: 7
    },
    children: [
      {
        path: "/limit/configuration",
        name: "LimitConfiguration",
        component: () => import("@pages/system/src/components/LimitConfigurationIndex.vue"),
        meta: {
          title: "限流配置",
          showParent: true
        }
      },
      {
        path: "/limit/record",
        name: "LimitRecord",
        component: () => import("@pages/system/src/components/LimitRecordIndex.vue"),
        meta: {
          title: "限流记录",
          showParent: true
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;