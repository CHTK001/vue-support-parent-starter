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
    },
    {
      path: "/object/spring_bean",
      name: "spring_bean",
      component: () => import("@/views/hotspot/springBean.vue"),
      meta: {
        icon: "simple-icons:spring",
        title: "spring对象",
        showParent: true
      }
    },
    {
      path: "/object/spring_mapping",
      name: "spring_mapping",
      component: () => import("@/views/hotspot/springMapping.vue"),
      meta: {
        icon: "simple-icons:spring",
        title: "spring映射",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
