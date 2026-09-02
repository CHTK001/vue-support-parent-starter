/**
 * 服务器资产模块路由配置（@pages/server）
 *
 * 扁平路由 + 绝对路径，适配 registerRoutesUnderLayout 的 addRoute("layout", route) 模式。
 * 侧边栏菜单由 buildMenuFromRoutes 从路由 meta 自动生成。
 */
import type { RouteConfigsTable } from "@repo/core";

export const serverRoutes: RouteConfigsTable[] = [
  {
    path: "/server/hosts",
    name: "ServerHosts",
    component: () => import("../views/ScHostList.vue"),
    meta: { title: "主机资产", icon: "Monitor", showLink: true, keepAlive: true },
  },
  {
    path: "/server/exec",
    name: "ServerExec",
    component: () => import("../views/ScExecTab.vue"),
    meta: { title: "批量作业", icon: "Operation", showLink: true, keepAlive: true },
  },
  {
    path: "/server/sessions",
    name: "ServerSessions",
    component: () => import("../views/ScSessionTab.vue"),
    meta: { title: "会话审计", icon: "Document", showLink: true, keepAlive: true },
  },
  {
    path: "/server/maintenance",
    name: "ServerMaintenance",
    component: () => import("../views/ScMaintenancePlan.vue"),
    meta: { title: "维护计划", icon: "Clock", showLink: true, keepAlive: true },
  },
  {
    path: "/server/groups",
    name: "ServerGroups",
    component: () => import("../views/ScGroupTree.vue"),
    meta: { title: "分组管理", icon: "FolderOpened", showLink: true, keepAlive: true },
  },
  {
    path: "/server/snippets",
    name: "ServerSnippets",
    component: () => import("../views/ScTerminalSnippetManager.vue"),
    meta: { title: "片段管理", icon: "Grid", showLink: true, keepAlive: true },
  },
];
