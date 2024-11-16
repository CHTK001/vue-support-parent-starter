export default {
  path: "/tool",
  name: "对象",
  meta: {
    icon: "simple-icons:tomorrowland",
    title: "工具管理",
    rank: 31
  },
  children: [
    {
      path: "/tool/diff",
      name: "diff",
      component: () => import("@/views/hotspot/diff.vue"),
      meta: {
        icon: "simple-icons:1001tracklists",
        title: "文件比较",
        showParent: true
      }
    },
    {
      path: "/tool/json",
      name: "json",
      component: () => import("@/views/hotspot/json.vue"),
      meta: {
        icon: "simple-icons:traccar",
        title: "JsonView",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
