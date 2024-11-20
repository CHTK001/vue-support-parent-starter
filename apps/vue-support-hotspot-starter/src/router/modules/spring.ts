import type { RouteConfigsTable } from "@repo/core";

export default {
  path: "/spring",
  name: "对象",
  meta: {
    icon: "simple-icons:springboot",
    title: "Spring管理",
    rank: 3
  },
  children: [
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
        icon: "simple-icons:spring-creators",
        title: "spring映射",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
