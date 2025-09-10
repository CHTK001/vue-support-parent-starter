import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/log",
    name: "LogManagement",
    component: async () => {
      const LayoutDefault = await import("@pages/log");
      return LayoutDefault;
    },
    meta: {
      title: "系统日志",
    },
  },
] satisfies Array<RouteConfigsTable>;
