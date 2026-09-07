import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const accountRoutes: RouteConfigsTable[] = [
  {
    path: "/account",
    name: "Account",
    component: () => import("../views/AccountManage.vue"),
    meta: {
      title: "账号管理",
      icon: "UserFilled",
      showLink: true,
      keepAlive: true,
    },
  },
];

export const accountMenus: StaticMenuItem[] = [
  {
    path: "/account",
    name: "Account",
    meta: { title: "账号管理", icon: "UserFilled", isVisible: "1" },
  },
];
