/**
 * 调度中心模块路由配置（@pages/job）
 *
 * 嵌套结构：/job 父节点 + 叶子子路由。
 * 父节点无 component（仅 redirect），叶子节点挂到 koi layout 下。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const jobRoutes: RouteConfigsTable[] = [
  {
    path: "/job",
    name: "Job",
    redirect: "/job/console",
    meta: {
      title: "调度管理",
      icon: "Timer",
      showLink: true,
    },
    children: [
      {
        path: "/job/console",
        name: "JobConsole",
        component: () => import("../views/JobConsoleManage.vue"),
        meta: {
          title: "调度控制台",
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
export const jobMenus: StaticMenuItem[] = [
  {
    path: "/job",
    name: "Job",
    redirect: "/job/console",
    meta: { title: "调度管理", icon: "Timer", isVisible: "1" },
    children: [
      {
        path: "/job/console",
        name: "JobConsole",
        meta: { title: "调度控制台", icon: "Timer", isVisible: "1" },
      },
    ],
  },
];
