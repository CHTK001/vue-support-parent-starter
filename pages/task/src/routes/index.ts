/**
 * 任务派发模块路由配置（@pages/task）
 *
 * 只保留任务派发。调度中心与调度控制台已迁至 @pages/job（路由 /job/console）。
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
      title: "任务派发",
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
    ],
  },
];

/**
 * 静态菜单（用于 registerStaticMenu，驱动侧边栏）
 */
export const taskMenus: StaticMenuItem[] = [
  {
    path: "/task",
    name: "Task",
    redirect: "/task/dispatch",
    meta: { title: "任务派发", icon: "Position", isVisible: "1" },
    children: [
      {
        path: "/task/dispatch",
        name: "TaskDispatch",
        meta: { title: "任务派发", icon: "Position", isVisible: "1" },
      },
    ],
  },
];
