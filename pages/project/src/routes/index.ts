/**
 * 发布项目管理模块路由配置（@pages/project）
 *
 * 嵌套结构：/project 父节点 + 叶子子路由（供未来独立部署或接入 koi layout 复用）。
 * 当前由 vue-support-monitor-starter 以组件形式直接消费（见 ScProjectList）。
 */
import type { RouteConfigsTable } from "@repo/core";

export const projectRoutes: RouteConfigsTable[] = [
  {
    path: "/project",
    name: "Project",
    redirect: "/project/list",
    meta: { title: "发布项目管理", icon: "Box", showLink: true },
    children: [
      {
        path: "/project/list",
        name: "ProjectList",
        component: () => import("../views/ScProjectList.vue"),
        meta: { title: "项目管理", icon: "Box", showLink: true, keepAlive: true },
      },
    ],
  },
];
