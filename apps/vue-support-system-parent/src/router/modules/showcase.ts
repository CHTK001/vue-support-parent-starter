import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/showcase",
    name: "Showcase",
    component: () => import("@layout/default"),
    meta: {
      title: "UI Showcase",
      icon: "ep:monitor",
      rank: 10
    },
    children: [
      {
        path: "/showcase/glass",
        name: "GlassShowcase",
        component: () => import("@repo/pages/showcase/glass/index.vue"),
        meta: {
          title: "Glass Theme Preview",
          showLink: true
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;

