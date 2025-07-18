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
    path: "/ossdetail",
    name: "ossdetail",
    component: () => import("@/views/monitor/oss/detail.vue"),
    meta: {
      title: $t("buttons.oss.detail"),
      showLink: false,
    },
  },

  {
    path: "/database/manage",
    name: "manageIndex",
    component: () => import("@/views/monitor/gen/manage.vue"),
    meta: {
      icon: "ri:database-2-line",
      title: $t("buttons.monitor.database"),
      showLink: false,
    },
  },
  {
    path: "/database/fullscreen",
    name: "fullscreenIndex",
    component: () => import("@/views/monitor/gen/fullscreen.vue"),
    meta: {
      icon: "ep:full-screen",
      title: $t("buttons.monitor.fullscreen"),
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
