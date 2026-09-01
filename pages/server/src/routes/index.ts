/**
 * 服务器资产模块路由配置（@pages/server）
 *
 * 一份 routes 同时承担两个角色：
 *   1) 路由表：通过 router.addRoute("layout", route) 把每个子页面挂到 koi 布局下，保留侧边栏
 *   2) 静态菜单：通过 serverMenus 导出，传入 registerStaticMenu() 让侧边栏渲染
 *
 * 注意：路由是扁平结构（直接 path=/server/hosts），不是嵌套的 /server + children 形式。
 *       这是为了适配 vue-router 的 addRoute("layout", item) 用法。
 *       侧边栏的层级由 serverMenus 的 children 表达，路由层级由 addRoute 自动平铺。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

/**
 * 服务器资产路由（叶子路由，直接挂到 koi layout 之下）
 *
 * 使用方式（在应用 main.ts）：
 *   const { context } = await createContextApp({});
 *   for (const r of serverRoutes) {
 *     context.router.addRoute("layout", r as never);
 *   }
 */
export const serverRoutes: RouteConfigsTable[] = [
  {
    path: "/server/hosts",
    name: "ServerHosts",
    component: () => import("../views/ScHostList.vue"),
    meta: {
      title: "服务器资产",
      icon: "Monitor",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/server/exec",
    name: "ServerExec",
    component: () => import("../views/ScExecTab.vue"),
    meta: {
      title: "批量作业",
      icon: "Operation",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/server/sessions",
    name: "ServerSessions",
    component: () => import("../views/ScSessionTab.vue"),
    meta: {
      title: "会话审计",
      icon: "Document",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/server/maintenance",
    name: "ServerMaintenance",
    component: () => import("../views/ScMaintenancePlan.vue"),
    meta: {
      title: "维护计划",
      icon: "Clock",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/server/groups",
    name: "ServerGroups",
    component: () => import("../views/ScGroupTree.vue"),
    meta: {
      title: "分组管理",
      icon: "FolderOpened",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/server/snippets",
    name: "ServerSnippets",
    component: () => import("../views/ScTerminalSnippetManager.vue"),
    meta: {
      title: "片段管理",
      icon: "Grid",
      showLink: true,
      keepAlive: true,
    },
  },
];

/**
 * 静态菜单（用于 registerStaticMenu，驱动侧边栏）
 */
export const serverMenus: StaticMenuItem[] = [
  {
    path: "/server",
    name: "Server",
    redirect: "/server/hosts",
    meta: { title: "服务器资产", icon: "Monitor", isVisible: "1" },
    children: [
      {
        path: "/server/hosts",
        name: "ServerHosts",
        meta: { title: "主机资产", icon: "Monitor", isVisible: "1" },
      },
      {
        path: "/server/exec",
        name: "ServerExec",
        meta: { title: "批量作业", icon: "Operation", isVisible: "1" },
      },
      {
        path: "/server/sessions",
        name: "ServerSessions",
        meta: { title: "会话审计", icon: "Document", isVisible: "1" },
      },
      {
        path: "/server/maintenance",
        name: "ServerMaintenance",
        meta: { title: "维护计划", icon: "Clock", isVisible: "1" },
      },
      {
        path: "/server/groups",
        name: "ServerGroups",
        meta: { title: "分组管理", icon: "FolderOpened", isVisible: "1" },
      },
      {
        path: "/server/snippets",
        name: "ServerSnippets",
        meta: { title: "片段管理", icon: "Grid", isVisible: "1" },
      },
    ],
  },
];
