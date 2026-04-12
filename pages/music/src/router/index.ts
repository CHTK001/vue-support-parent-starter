import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/music",
    name: "MusicModule",
    meta: {
      title: "音乐播放器",
      icon: "ri:music-2-line",
      rank: 12,
    },
    children: [
      {
        path: "/music/index",
        name: "MusicIndex",
        component: () => import("../index.vue"),
        meta: {
          title: "音乐播放器",
          icon: "ri:disc-line",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;

export default routes;
