import type { RouteConfigsTable } from "@repo/core";

/**
 * 节假日管理路由配置
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */
const routes = [
  {
    path: "/holiday",
    name: "HolidayManagement",
    component: async () => {
      const LayoutDefault = await import("@pages/holiday");
      return LayoutDefault;
    },
    meta: {
      title: "节假日管理",
      icon: "ep:calendar",
      rank: 8
    },
  },
] satisfies Array<RouteConfigsTable>;

export default routes;