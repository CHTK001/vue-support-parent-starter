import type { RouteConfigsTable } from "@repo/core";

export default {
  path: "/trace",
  name: "对象",
  meta: {
    icon: "simple-icons:aegisauthenticator",
    title: "信息管理",
    rank: 3
  },
  children: [
    {
      path: "/trace/log",
      name: "log",
      component: () => import("@/views/hotspot/log.vue"),
      meta: {
        icon: "simple-icons:logitech",
        title: "日志管理",
        showParent: true
      }
    },
    {
      path: "/trace/trace",
      name: "trace",
      component: () => import("@/views/hotspot/trace.vue"),
      meta: {
        icon: "simple-icons:traccar",
        title: "链路管理",
        showParent: true
      }
    },
    {
      path: "/trace/sql1",
      name: "sql1",
      component: () => import("@/views/hotspot/sql.vue"),
      meta: {
        icon: "simple-icons:oracle",
        title: "SQL管理",
        showParent: true
      }
    },
    {
      path: "/trace/table",
      name: "table",
      component: () => import("@/views/hotspot/table.vue"),
      meta: {
        icon: "ri:table-2",
        title: "表管理",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
