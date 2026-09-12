/**
 * 任务管理模块路由配置（@pages/task）
 *
 * 嵌套结构：/task 父节点 + 叶子子路由。
 * 父节点无 component（仅 redirect），叶子节点挂到 koi layout 下。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const taskRoutes: RouteConfigsTable[] = [
  {
    path: "/task",
    name: "Task",
    redirect: "/task/dispatch",
    meta: {
      title: "任务管理",
      icon: "Position",
      showLink: true,
    },
    children: [
      {
        path: "/task/dispatch",
        name: "TaskDispatch",
        component: () => import("../views/DispatchManage.vue"),
        meta: {
          title: "任务派发",
          icon: "Position",
          showLink: true,
          keepAlive: true,
        },
      },
      {
        path: "/task/scheduler",
        name: "TaskScheduler",
        component: () => import("../views/SchedulerManage.vue"),
        meta: {
          title: "调度中心",
          icon: "Timer",
          showLink: true,
          keepAlive: true,
        },
      },
    ],
  },
];

/**
 * 静态菜单（用于 registerStaticMenu，驱动侧边栏）
 */
/**
 * 静态菜单（用于 registerStaticMenu，驱动侧边栏）
 * @author CH
 * @since 4.0.0
 */
export const taskMenus: StaticMenuItem[] = [
  {
    path: "/task",
    name: "Task",
    redirect: "/task/dispatch",
    meta: { title: "任务管理", icon: "Position", isVisible: "1" },
    children: [
      {
        path: "/task/dispatch",
        name: "TaskDispatch",
        meta: { title: "任务派发", icon: "Position", isVisible: "1" },
      },
      {
        path: "/task/scheduler",
        name: "TaskScheduler",
        meta: { title: "调度中心", icon: "Timer", isVisible: "1" },
      },
    ],
  },
];