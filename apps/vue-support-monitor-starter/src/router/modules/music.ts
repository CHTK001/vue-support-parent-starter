import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/music",
    name: "musicRoot",
    meta: {
      icon: "ri:music-2-line",
      title: "音乐播放器",
      showLink: true,
      rank: 12,
    },
    children: [
      {
        path: "/music/index",
        name: "musicIndex",
        component: () => import("@pages/music"),
        meta: {
          icon: "ri:disc-line",
          title: "音乐播放器",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
