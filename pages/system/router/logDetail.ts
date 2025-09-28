import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/log/detail",
    name: "LogDetail",
    component: async () => {
      const LayoutDefault = await import("../src/log/LogDetail.vue");
      return LayoutDefault;
    },
    meta: {
      title: "日志详情",
      icon: "ri:file-list-line",
      rank: 14
    },
  },
] satisfies Array<RouteConfigsTable>;

export default routes;