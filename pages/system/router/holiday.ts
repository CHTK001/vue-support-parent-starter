import type { RouteConfigsTable } from "@repo/core";

const routes = [
  {
    path: "/holiday",
    name: "HolidayManagement",
    component: async () => {
      const LayoutDefault = await import("../src/holiday/HolidayIndex.vue");
      return LayoutDefault;
    },
    meta: {
      title: "节假日管理",
      icon: "ri:calendar-line",
      rank: 12
    },
  },
  {
    path: "/holiday/calendar",
    name: "HolidayCalendar",
    component: async () => {
      const LayoutDefault = await import("../src/holiday/HolidayCalendar.vue");
      return LayoutDefault;
    },
    meta: {
      title: "节假日日历",
      icon: "ri:calendar-2-line",
      rank: 13
    },
  },
] satisfies Array<RouteConfigsTable>;

export default routes;