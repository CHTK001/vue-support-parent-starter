import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/limit/record",
    name: "LimitRecord",
    component: async () => {
      const LayoutDefault = await import("@pages/system/src/components/LimitRecordIndex.vue");
      return LayoutDefault;
    },
    meta: {
      title: "限流记录",
      icon: "ri:record-circle-line",
      rank: 11
    },
  },
] satisfies Array<RouteConfigsTable>;

export default routes;