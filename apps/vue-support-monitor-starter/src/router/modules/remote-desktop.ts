import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/remote-desktop",
    name: "remoteDesktop",
    component: () => import("@layout/default"),
    meta: {
      icon: "ri:desktop-line",
      title: "远程桌面",
      showLink: true,
      rank: 5,
    },
    children: [
      {
        path: "/remote-desktop/index",
        name: "remoteDesktopIndex",
        component: () => import("@/views/remote-desktop/index.vue"),
        meta: {
          icon: "ri:desktop-line",
          title: "远程桌面",
          showLink: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;

