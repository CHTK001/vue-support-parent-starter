/**
 * 任务管理模块路由配置（@pages/task）
 *
 * 一份 routes 同时承担两个角色：
 *   1) 路由表：通过 router.addRoute("layout", route) 把每个子页面挂到 koi 布局下
 *   2) 静态菜单：通过 taskMenus 导出，传入 registerStaticMenu() 驱动侧边栏
 *
 * 路由是扁平结构（直接 path=/task/xxx），适配 addRoute("layout", item)。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

/**
 * 任务管理路由（叶子路由，直接挂到 koi layout 之下）
 */
export const taskRoutes: RouteConfigsTable[] = [
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
];

/**
 * 静态菜单（用于 registerStaticMenu，驱动侧边栏）
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