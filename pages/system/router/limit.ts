import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/limit",
    name: "LimitConfiguration",
    component: async () => {
      const LayoutDefault = await import("../src/limit/LimitConfigurationIndex.vue");
      return LayoutDefault;
    },
    meta: {
      title: "限流配置",
      icon: "ri:speed-up-line",
      rank: 10
    },
  },
] satisfies Array<RouteConfigsTable>;

export default routes;