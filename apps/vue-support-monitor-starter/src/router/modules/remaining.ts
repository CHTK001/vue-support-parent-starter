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
      rank: 101
    }
  },
  {
    path: "/AccountSettings",
    name: "AccountSettings",
    component: () => {
      return Account;
    },
    meta: {
      title: $t("buttons.accountSetting"),
      showLink: false
    }
  },
  {
    path: "/datav",
    name: "datav",
    component: () => import("@/views/monitor/service/dashboard/index.vue"),
    meta: {
      icon: "ep:setting",
      title: $t("buttons.monitor.datav"),
      showLink: false
    }
  },
  {
    path: "/database/manage",
    name: "manageIndex",
    component: () => import("@/views/monitor/gen/manage.vue"),
    meta: {
      icon: "ri:database-2-line",
      title: $t("buttons.monitor.database"),
      showLink: false
    }
  },
  {
    path: "/service/app/monitor",
    name: "serviceAppMonitor",
    component: () => import("@/views/monitor/service/app/monitor/index.vue"),
    meta: {
      icon: "ep:setting",
      title: $t("buttons.monitor.datav"),
      showLink: false
    }
  }
] satisfies Array<RouteConfigsTable>;
