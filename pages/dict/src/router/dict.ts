import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/dict",
    name: "DictManagement",
    component: async () => {
      const LayoutDefault = await import("@pages/dict");
      return LayoutDefault;
    },
    meta: {
      title: "字典管理",
    },
  },
] satisfies Array<RouteConfigsTable>;
