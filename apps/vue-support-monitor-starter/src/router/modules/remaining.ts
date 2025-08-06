import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
import { Account } from "@layout/default";

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@repo/pages/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101,
    },
  },

  {
    path: "/AccountSettings",
    name: "AccountSettings",
    component: () => {
      return Account;
    },
    meta: {
      title: $t("buttons.accountSetting"),
      showLink: false,
    },
  },
  {
    path: "/node/documentation/:nodeId",
    name: "nodeDocumentation",
    component: () =>
      import("@/views/node-management/module/node-documentation/index.vue"),
    meta: {
      icon: "ri:file-text-line",
      title: "节点API文档",
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;
