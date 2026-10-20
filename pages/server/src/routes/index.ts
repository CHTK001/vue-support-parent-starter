/**
 * 服务器资产模块路由配置（@pages/server）
 *
 * 嵌套路由 + 子路由绝对路径，适配 registerRoutesUnderLayout 的 addRoute("layout", route) 模式：
 *   - 父路由 /server（无 component，redirect）只作为侧边栏分组
 *   - 子路由使用绝对路径（/server/xxx），避免 addRoute 相对路径被拼到 layout 根导致 404
 * 侧边栏菜单由 buildMenuFromRoutes 从路由 meta 自动生成。
 *
 * <p><strong>归属</strong>：本包负责「主机资产」这一族能力 —— 主机台账、远程控制、
 * ACME 证书、会话审计、批量作业、维护计划、分组、片段。按「app 只是壳、功能归 pages/xx」
 * 的约定，监控台宿主不再自己维护这些页面的副本，只挂本包产出的路由。</p>
 */
import type { RouteConfigsTable } from "@repo/core";

export const serverRoutes: RouteConfigsTable[] = [
  {
    path: "/server",
    name: "Server",
    redirect: "/server/hosts",
    meta: { title: "服务器资产", icon: "Monitor", showLink: true },
    children: [
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
    ],
  },
];

/** {@link createServerManageRoutes} 的可选项 */
export interface ServerManageRoutesOptions {
  /** 侧边栏高亮回指的路由路径（默认 /assets） */
  activeMenu?: string;
}

/**
 * 生成主机资产族的「管理台」路由（监控台宿主用）。
 *
 * <p>监控台原先把这几页直接放在自己的 {@code routes.ts} 里（主机资产 / 远程控制 /
 * ACME 证书 / 主机详情），视图与 API 却散在宿主与 {@code @pages/server} 两处。
 * 宿主抄一份、包里再有一份，迟早会漂。</p>
 *
 * <p>本工厂把这几页的路由声明收敛到 {@code @pages/server} 一处：视图、API、路由三者
 * 同源，宿主只做合并（{@code ...createServerManageRoutes({ activeMenu: "/assets" })}）。</p>
 *
 * @param options 可选项，主要是 activeMenu
 * @returns 可直接展开进宿主路由树的数组
 */
export function createServerManageRoutes(options: ServerManageRoutesOptions = {}): RouteConfigsTable[] {
  const activeMenu = options.activeMenu || "/assets";

  return [
    {
      // 主机资产：台账 + 主机画像（进程/服务/磁盘/网络/环境）+ Agent 部署。
      path: "/assets",
      name: "Assets",
      component: () => import("../views/AssetsView.vue"),
      meta: { title: "主机资产", icon: "Monitor", showLink: true, activeMenu },
    },
    {
      // 远程控制：Guacamole / SSH 直连 / VNC 直连 / SFTP。
      path: "/terminal",
      name: "Terminal",
      component: () => import("../views/TerminalView.vue"),
      meta: { title: "远程控制", icon: "Position", showLink: true, activeMenu },
    },
    {
      // ACME 证书：独立 ACME 后端的账户 / 申请 / 续期 / 下载。
      path: "/acme",
      name: "AcmeCert",
      component: () => import("../views/acme/index.vue"),
      meta: { title: "ACME 证书", icon: "Key", showLink: true, activeMenu },
    },
    {
      // 主机详情（深链）：从主机资产列表点进某台主机的详情抽屉页。
      path: "/host/:id",
      name: "HostDetail",
      component: () => import("../views/HostDetailView.vue"),
      meta: { title: "主机监控详情", icon: "Monitor", showLink: false, activeMenu },
    },
  ];
}