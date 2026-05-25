import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/loki",
    name: "Loki",
    redirect: "/loki/log-query",
    meta: { icon: "ri:database-2-line", title: "Loki 日志", rank: 30 },
    children: [
      {
        path: "/loki/log-query",
        name: "LokiLogQuery",
        component: () => import("../views/log-query/index.vue"),
        meta: { title: "日志查询", icon: "ri:search-line" },
      },
      {
        path: "/loki/streaming",
        name: "LokiStreaming",
        component: () => import("../views/streaming/index.vue"),
        meta: { title: "实时日志", icon: "ri:live-line" },
      },
      {
        path: "/loki/labels",
        name: "LokiLabels",
        component: () => import("../views/labels/index.vue"),
        meta: { title: "标签浏览", icon: "ri:price-tag-3-line" },
      },
      {
        path: "/loki/dashboard",
        name: "LokiDashboard",
        component: () => import("../views/dashboard/index.vue"),
        meta: { title: "仪表盘", icon: "ri:dashboard-3-line" },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;

export default routes;
