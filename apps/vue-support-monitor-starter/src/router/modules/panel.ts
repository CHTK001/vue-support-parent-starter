import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/panel",
    name: "panelRoot",
    meta: {
      icon: "ri:layout-masonry-line",
      title: "统一面板",
      showLink: true,
      rank: 8,
    },
    children: [
      {
        path: "/panel/index",
        name: "panelIndex",
        component: () => import("@pages/panel"),
        meta: {
          icon: "ri:database-2-line",
          title: "客户端面板",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
