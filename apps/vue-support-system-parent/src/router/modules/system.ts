import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/system",
    name: "System",
    component: Layout,
    redirect: "/system/log",
    meta: {
      icon: "ri:settings-3-line",
      title: "系统管理",
      rank: 8
    },
    children: [
      {
        path: "/system/log",
        name: "LogManagement",
        component: () => import("@pages/system/src/log/LogIndex.vue"),
        meta: {
          title: "系统日志",
          showParent: true
        }
      },
      {
        path: "/system/log/detail",
        name: "LogDetail",
        component: () => import("@pages/system/src/log/LogDetail.vue"),
        meta: {
          title: "日志详情",
          showParent: true
        }
      },
      {
        path: "/system/holiday",
        name: "HolidayManagement",
        component: () => import("@pages/system/src/holiday/HolidayIndex.vue"),
        meta: {
          title: "节假日管理",
          showParent: true
        }
      },
      {
        path: "/system/holiday/calendar",
        name: "HolidayCalendar",
        component: () => import("@pages/system/src/holiday/HolidayCalendar.vue"),
        meta: {
          title: "节假日日历",
          showParent: true
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;