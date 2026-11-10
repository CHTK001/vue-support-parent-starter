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

/**
 * {@link createServerManageRoutes} 的可选项
 */
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
 * <p><strong>分组归属</strong>：这几页属于「资产管理」分组，本工厂只产出叶子路由
 * （不含分组父节点），由宿主展开进自己的 {@code /grp-asset} children ——
 * 分组父节点由宿主持有，这里的叶子 {@code showLink:true} 才会出现在侧边栏分组内；
 * 若工厂再造一个分组父节点，宿主合并后会出现两个同 path/name 的父节点、菜单重复渲染。
 * 与该代码库「账号管理归系统管理分组」同一套做法（见 createServerManageReleaseRoutes 注释）。</p>
 *
 * @param options 可选项，主要是 activeMenu
 * @returns 可直接展开进宿主路由树的数组（全部为叶子，不含分组父节点）
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
  ];
}

/**
 * 生成「主机管理」完整二级菜单（监控台宿主用）。
 *
 * <p>把主机资产这一族能力收成<b>一个</b>完整二级分组：主机资产 / 远程控制 /
 * ACME 证书 / 会话审计 / 批量作业 / 片段管理 / 维护计划 / 发布管理，全部视图
 * 与 API 都在本包，宿主只需 {@code ...createServerHostRoutes()} 一行展开，
 * 不再在壳里手写分组与叶子（历史上散成「资产管理」「发布管理」两个分组，
 * 菜单排版不一致且视图/路由两处声明易漂）。</p>
 *
 * <p>{@code /projects}（项目管理）挂在分组 children 下且 {@code showLink:false}
 * 时菜单组件仍会渲染，故与主机详情一样放在顶层隐藏区返回。</p>
 *
 * @param options 可选项，主要是 activeMenu
 * @returns 完整二级分组 + 顶层隐藏路由，可直接展开进宿主路由树
 */
export function createServerHostRoutes(options: ServerManageRoutesOptions = {}): RouteConfigsTable[] {
  const activeMenu = options.activeMenu || "/assets";

  return [
    {
      path: "/grp-host",
      name: "GroupHost",
      meta: { title: "主机管理", icon: "Monitor", showLink: true, rank: 10 },
      children: [
        {
          // 主机资产：台账 + 主机画像（进程/服务/磁盘/网络/环境）+ Agent 部署。
          path: "/assets",
          name: "Assets",
          component: () => import("../views/AssetsView.vue"),
          meta: { title: "主机资产", icon: "Cpu", showLink: true, activeMenu },
        },
        {
          // 控制管理：与主机资产同一套左侧主机栏，点一下主机右侧直接远控，
          // 右键只保留远控相关动作。视图内部用 mode="control" 收窄功能。
          // 路径用 /host-control 而非 /control：/control 是远控后端 API 的代理前缀
          // （spring-support-control-starter），同名会让维护者误解，也挡住 hash 路由以外的场景。
          path: "/host-control",
          name: "HostControl",
          component: () => import("../views/ControlView.vue"),
          meta: { title: "控制管理", icon: "Position", showLink: true },
        },
        {
          // 远程控制：Guacamole / SSH 直连 / VNC 直连 / SFTP。
          // 已收进「主机资产」右键（右侧工作区页签），左侧不再单列；
          // 路由保留，AssetsView 的 ctxCommand("tab-remote") 与旧书签仍可直达。
          path: "/terminal",
          name: "Terminal",
          component: () => import("../views/TerminalView.vue"),
          meta: { title: "远程控制", icon: "Position", showLink: false, activeMenu },
        },
        {
          // ACME 证书：独立 ACME 后端的账户 / 申请 / 续期 / 下载。
          // 未并入主机资产右键，保留左侧独立入口。
          path: "/acme",
          name: "AcmeCert",
          component: () => import("../views/acme/index.vue"),
          meta: { title: "ACME 证书", icon: "Key", showLink: true, activeMenu },
        },
        {
          // 主机账号：主机登录凭据（口令 / 公钥 / 邮箱 / Token）+ SSH 密钥库。
          // 原挂在「系统管理 → 账号管理」下，但它维护的是「哪台主机用哪个账号登」，
          // 与系统配置无关，故归入主机管理并改名。
          // 已收进「主机资产」右键（凭据库按主机过滤），左侧不再单列。
          path: "/host-accounts",
          name: "HostAccounts",
          component: () => import("../views/hostaccount/HostAccountView.vue"),
          meta: { title: "主机账号", icon: "User", showLink: false, activeMenu },
        },
        {
          // 运维四页已收进「主机资产 → 运维台」二级菜单，左侧不再单列；
          // 路由保留，HostAccountView 的 ctxGoPage 按主机过滤跳转仍可达。
          path: "/sessions",
          name: "ServerSessions",
          component: () => import("../views/ScSessionTab.vue"),
          meta: { title: "会话审计", icon: "Document", showLink: false, activeMenu: "/assets" },
        },
        {
          path: "/exec",
          name: "ServerExec",
          component: () => import("../views/ScExecTab.vue"),
          meta: { title: "批量作业", icon: "Promotion", showLink: false, activeMenu: "/assets" },
        },
        {
          path: "/snippets",
          name: "ServerSnippets",
          component: () => import("../views/ScTerminalSnippetManager.vue"),
          meta: { title: "片段管理", icon: "DocumentCopy", showLink: false, activeMenu: "/assets" },
        },
        {
          path: "/maintenance",
          name: "ServerMaintenance",
          component: () => import("../views/ScMaintenancePlan.vue"),
          meta: { title: "维护计划", icon: "Clock", showLink: false, activeMenu: "/assets" },
        },
        {
          path: "/release",
          name: "Release",
          component: () => import("../views/release/ReleaseView.vue"),
          meta: { title: "发布管理", icon: "Box", showLink: true },
        },
      ],
    },
    {
      // 项目管理：隐藏路由，移为顶层才真正不进菜单；发布管理卡片的「进入」跳这里。
      path: "/projects",
      name: "Projects",
      component: () => import("../views/release/ProjectsView.vue"),
      meta: { title: "项目管理", icon: "Folder", showLink: false, activeMenu: "/release" },
    },
    {
      // 主机监控详情：隐藏路由，由主机资产列表（AssetsView.openDetail）跳入。
      // 与其它隐藏路由一样移为顶层 —— 挂在分组 children 下且 showLink:false 时
      // 菜单组件仍会渲染（见 createServerHostRoutes 顶部注释），故放顶层隐藏区。
      path: "/host/:id",
      name: "HostDetail",
      component: () => import("../views/HostDetailView.vue"),
      meta: { title: "主机监控详情", icon: "Monitor", showLink: false, activeMenu },
    },
    {
      // 主机资产 · 独立窗口：由资产页头部按钮 window.open 打开。
      // standalone 让 registerRoutesUnderLayout 注册为顶层路由（不套 layout），
      // 新窗口里只有主机资产，没有侧边栏 / 顶栏 / 面包屑。
      path: "/assets-standalone",
      name: "AssetsStandalone",
      component: () => import("../views/AssetsStandaloneView.vue"),
      meta: { title: "主机资产", icon: "Monitor", showLink: false, standalone: true },
    },
  ];
}

/** {@link createServerManageReleaseRoutes} 的可选项 */
export interface ServerManageReleaseRoutesOptions {
  /** 侧边栏高亮回指的路由路径（默认 /release） */
  activeMenu?: string;
}

/**
 * 生成「发布管理 / 项目」族的「管理台」路由（监控台宿主用）。
 *
 * <p>发布管理、项目管理两页的路由声明收敛到 {@code @pages/server} 一处：
 * 视图、API、路由三者同源（后端均走 {@code /ms/server/release}），宿主只做合并
 * （{@code ...createServerManageReleaseRoutes()}）。</p>
 *
 * <p>「账号管理」的路由<strong>不在这里声明</strong>：它的视图与 API 在本包
 * （{@code views/identity/IdentityManageView.vue} + {@code api} 身份接口），
 * 但菜单归属「系统管理」分组 —— 该分组的其余入口（监控配置 / 代理管理 / 分组 /
 * 系统配置）都是宿主的本地页，分组父节点 {@code /grp-system} 由宿主持有。
 * 若本工厂再造一个 {@code /grp-system}，宿主 {@code ...createServerManageReleaseRoutes()}
 * 合并后会出现<b>两个同 path/name 的分组父节点</b>，菜单重复渲染。因此账号页由宿主自行
 * 放进其 {@code /grp-system} children（view 深导入 {@code @pages/server/...} 即可，
 * 与「资产管理」分组导入 {@code ScSessionTab} 等同一套做法）。</p>
 *
 * <p>分组结构：本工厂产出「发布管理」分组父节点（无 component、无 redirect，仅作菜单分组）
 * 与 {@code /release} 叶子；{@code /projects} 因挂在分组 children 下且
 * {@code showLink:false} 时菜单组件仍会渲染，故移为顶层隐藏路由（仍可访问，
 * 发布管理卡片的「进入」跳转到这里）。</p>
 *
 * @param options 可选项，主要是 activeMenu
 * @returns 可直接展开进宿主路由树的数组
 */
export function createServerManageReleaseRoutes(options: ServerManageReleaseRoutesOptions = {}): RouteConfigsTable[] {
  const activeMenu = options.activeMenu || "/release";

  return [
    {
      // 发布管理分组：发布管理（叶子）。
      path: "/grp-release",
      name: "GroupRelease",
      meta: { title: "发布管理", icon: "Promotion", showLink: true, rank: 20 },
      children: [
        {
          path: "/release",
          name: "Release",
          component: () => import("../views/release/ReleaseView.vue"),
          meta: { title: "发布管理", icon: "Box", showLink: true, rank: 20 },
        },
      ],
    },
    {
      // 项目管理：隐藏路由，移为顶层才真正不进菜单（见上方注释）；仍可访问，
      // 发布管理卡片的「进入」按钮与列表卡片都跳这里。
      path: "/projects",
      name: "Projects",
      component: () => import("../views/release/ProjectsView.vue"),
      meta: { title: "项目管理", icon: "Folder", showLink: false, activeMenu },
    },
  ];
}