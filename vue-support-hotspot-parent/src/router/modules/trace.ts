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
    }
  ]
} satisfies RouteConfigsTable;
