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
    path: "/service/document/:id",
    name: "serviceDocument",
    component: () => import("@/views/monitor/service/app/document/index.vue"),
    meta: {
      icon: "ri:file-list-line",
      title: $t("buttons.monitor.service-document"),
      showLink: false
    }
  },
  {
    path: "/ssh-tabs",
    name: "ssh-tabs",
    component: () => import("@/views/maintenance/ssh/ssh-tabs.vue"),
    meta: {
      title: "SSH 标签",
      showLink: false
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
    path: "/ossdetail",
    name: "ossdetail",
    component: () => import("@/views/monitor/oss/detail.vue"),
    meta: {
      title: $t("buttons.oss.detail"),
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
    path: "/database/fullscreen",
    name: "fullscreenIndex",
    component: () => import("@/views/monitor/gen/fullscreen.vue"),
    meta: {
      icon: "ep:full-screen",
      title: $t("buttons.monitor.fullscreen"),
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
  },
  {
    path: "/full-terminal",
    name: "fullTerminal",
    component: () => import("@/views/maintenance/ssh/full-terminal.vue"),
    meta: {
      icon: "ep:full-screen",
      title: "SSH 全屏终端",
      showLink: false
    }
  }
] satisfies Array<RouteConfigsTable>;
