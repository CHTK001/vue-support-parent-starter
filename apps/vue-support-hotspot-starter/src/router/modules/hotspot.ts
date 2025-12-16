import type { RouteConfigsTable } from "@repo/core";

export default {
  path: "/hotspot",
  name: "hotspot",
  component: () => import("@layout/default"),
  redirect: "/hotspot/dashboard",
  meta: {
    icon: "simple-icons:traccar",
    title: "后台管理",
    rank: 1
  },
  children: [
    {
      path: "/hotspot/dashboard",
      name: "HotspotDashboard",
      component: () => import("@/views/hotspot/dashboard/index.vue"),
      meta: {
        icon: "ri:dashboard-line",
        title: "系统概览",
        showParent: true
      }
    },
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
      path: "/hotspot/httpPerf",
      name: "HotspotHttpPerf",
      component: () => import("@/views/hotspot/httpPerf/index.vue"),
      meta: {
        icon: "mdi:speedometer",
        title: "HTTP性能",
        showParent: true
      }
    },
    {
      path: "/hotspot/exceptions",
      name: "HotspotExceptions",
      component: () => import("@/views/hotspot/exceptions/index.vue"),
      meta: {
        icon: "mdi:alert-circle",
        title: "异常监控",
        showParent: true
      }
    },
    {
      path: "/hotspot/jfr",
      name: "HotspotJfr",
      component: () => import("@/views/hotspot/jfr/index.vue"),
      meta: {
        icon: "mdi:rocket-launch",
        title: "JFR监控",
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
    },
    {
      path: "/hotspot/jvm",
      name: "HotspotJvm",
      component: () => import("@/views/hotspot/jvm/index.vue"),
      meta: {
        icon: "ri:stack-line",
        title: "JVM监控",
        showParent: true
      }
    },
    {
      path: "/hotspot/hotswap",
      name: "HotspotHotswap",
      component: () => import("@/views/hotspot/hotswap/index.vue"),
      meta: {
        icon: "ri:refresh-line",
        title: "热重载",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
