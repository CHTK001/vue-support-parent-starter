import type { RouteConfigsTable } from "@repo/core";

export default {
  path: "/object",
  name: "对象",
  meta: {
    icon: "ep:office-building",
    title: "对象管理",
    rank: 3
  },
  children: [
    {
      path: "/object/object_info",
      name: "object_info",
      component: () => import("@/views/hotspot/object.vue"),
      meta: {
        icon: "ep:add-location",
        title: "对象信息",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
