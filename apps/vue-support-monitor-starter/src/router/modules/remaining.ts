import { $t } from "@/plugins/i18n";
import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101
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
    component: () => import("@/views/monitor/service/app/monitor.vue"),
    meta: {
      icon: "ep:setting",
      title: $t("buttons.monitor.datav"),
      showLink: false
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: $t("status.pureLoad"),
      showLink: false,
      rank: 102
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
