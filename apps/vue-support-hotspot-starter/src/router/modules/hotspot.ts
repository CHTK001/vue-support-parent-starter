import type { RouteConfigsTable } from "@repo/core";

export default {
  path: "/hotspot",
  name: "hotspot",
  component: () => import("@layout/default"),
  redirect: "/hotspot/process",
  meta: {
    icon: "simple-icons:traccar",
    title: "hotspot",
    rank: 1
  },
  children: [
    {
      path: "/hotspot/process",
      name: "HotspotProcess",
      component: () => import("@/views/hotspot/process/index.vue"),
      meta: {
        icon: "ri:remote-control-line",
        title: "远程链接",
        showParent: true
      }
    },
    {
      path: "/hotspot/handle",
      name: "HotspotHandle",
      component: () => import("@/views/hotspot/handle/index.vue"),
      meta: {
        icon: "ep:add-location",
        title: "文件句柄",
        showParent: true
      }
    },
    {
      path: "/hotspot/thread",
      name: "HotspotThread",
      component: () => import("@/views/hotspot/thread/index.vue"),
      meta: {
        icon: "ri:threads-fill",
        title: "线程",
        showParent: true
      }
    },
    {
      path: "/hotspot/object",
      name: "HotspotObject",
      component: () => import("@/views/hotspot/object/index.vue"),
      meta: {
        icon: "ep:add-location",
        title: "对象信息",
        showParent: true
      }
    },
    {
      path: "/hotspot/springBean",
      name: "HotspotSpringBean",
      component: () => import("@/views/hotspot/springBean/index.vue"),
      meta: {
        icon: "simple-icons:spring",
        title: "spring对象",
        showParent: true
      }
    },
    {
      path: "/hotspot/springMapping",
      name: "HotspotSpringMapping",
      component: () => import("@/views/hotspot/springMapping/index.vue"),
      meta: {
        icon: "simple-icons:spring-creators",
        title: "spring映射",
        showParent: true
      }
    },
    {
      path: "/hotspot/sql",
      name: "HotspotSql",
      component: () => import("@/views/hotspot/sql/index.vue"),
      meta: {
        icon: "simple-icons:oracle",
        title: "SQL管理",
        showParent: true
      }
    },
    {
      path: "/hotspot/table",
      name: "HotspotTable",
      component: () => import("@/views/hotspot/table/index.vue"),
      meta: {
        icon: "ri:table-2",
        title: "表管理",
        showParent: true
      }
    },
    {
      path: "/hotspot/trace",
      name: "HotspotTrace",
      component: () => import("@/views/hotspot/trace/index.vue"),
      meta: {
        icon: "simple-icons:traccar",
        title: "链路管理",
        showParent: true
      }
    },
    {
      path: "/hotspot/log",
      name: "HotspotLog",
      component: () => import("@/views/hotspot/log/index.vue"),
      meta: {
        icon: "simple-icons:logitech",
        title: "日志管理",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
