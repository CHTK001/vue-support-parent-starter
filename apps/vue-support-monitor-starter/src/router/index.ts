/**
 * 监控管理平台路由树（RouteConfigsTable[]）—— **宿主装配层**。
 *
 * <p>本文件只做一件事：把各 {@code pages/xx} 包产出的路由树拼起来。
 * 视图、API、路由声明三者同出于各自的功能包，宿主不再抄第二份 ——
 * 抄两份必然漂（历史上漏过 /prometheus 管理页、「服务管理」页迁包后成死链）。</p>
 *
 * <p>各包职责边界：</p>
 * <table>
 *   <tr><th>能力</th><th>归属包</th></tr>
 *   <tr><td>数据源台账 + 各类数据源管理页</td><td>{@code @pages/datasource}</td></tr>
 *   <tr><td>主机资产 / 远控 / ACME / 主机详情 / 会话 / 批量作业 / 片段 / 维护计划</td><td>{@code @pages/server}</td></tr>
 *   <tr><td>服务管理（协议服务器节点）/ 在线节点 / 服务发现 / 抓包分析</td><td>{@code @pages/monitor}</td></tr>
 *   <tr><td>设备资产 / 组织 / 通道 / 日志 / 提供商</td><td>{@code @pages/device}</td></tr>
 *   <tr><td>文件资产</td><td>{@code @pages/filesystem}</td></tr>
 * </table>
 *
 * <p><strong>分组结构</strong>：一级为「分组父节点」（仅用于侧边栏分组标题 + 折叠/展开，
 * 无 component、无 redirect），二级为具体业务页面（叶子路由，带 component）。</p>
 *
 * <p><strong>装配说明</strong>：</p>
 * <ul>
 *   <li>菜单：buildMenuFromRoutes 递归保留 children → koi 侧边栏按 children 渲染 el-sub-menu。</li>
 *   <li>路由：registerRoutesUnderLayout 递归 visit，仅把「带 component」或「带 redirect」的节点
 *       通过 addRoute("layout", ...) 平铺到 koi 布局下；分组父节点既无 component 又无 redirect，
 *       因此不会被注册为路由，只作为菜单分组容器存在。</li>
 *   <li>隐藏路由（showLink:false）保留在顶层：菜单过滤时被剔除，但仍会被注册为可访问路由。</li>
 * </ul>
 *
 * 路由模式：hash（routerMode: "hash"）
 */
import type { RouteConfigsTable } from "@repo/core";
// 深导入 src/routes 而不是从包根导入 —— 包根 index.ts 有 registerMenuViewModules
// 顶层副作用，会把整个 api/组件桶拖进主 chunk；本文件只需要路由工厂。
import { createDatasourceManageRoutes } from "@pages/datasource/src/routes";
import { createServerManageRoutes, createServerManageReleaseRoutes } from "@pages/server/src/routes";
import { createMonitorRoutes, createMonitorManageRoutes } from "@pages/monitor/src/routes";

/** 监控管理平台路由树（分组结构） */
export const monitorRoutes: RouteConfigsTable[] = [
  // ==================== 监控管理 ====================
  {
    path: "/grp-monitor",
    name: "GroupMonitor",
    meta: { title: "监控管理", icon: "Odometer", showLink: true, rank: 1 },
    children: [
      {
        path: "/workbench",
        name: "Workbench",
        component: () => import("../views/WorkbenchView.vue"),
        meta: { title: "监控概览", icon: "DataBoard", showLink: false, rank: 1 },
      },
      {
        path: "/alarms",
        name: "Alarms",
        component: () => import("../views/AlarmsView.vue"),
        meta: { title: "告警中心", icon: "Bell", showLink: true, rank: 2 },
      },
    ],
  },

  // ==================== 分析管理 ====================
  // 这个分组的两个子页是同一套抓包分析能力的两条入口：
  //   「抓包分析」= 网卡实时抓包（起会话、管 BPF、边抓边看）
  //   「PCAP 分析」= 导入既有 pcap（上传、解析入库、原件下载）
  // 两者共用报文分页 / 协议分布 / Top 流 / 详情抽屉，所以归在一个分组下。
  //
  // 分组名从「抓包分析」改成「分析管理」：加了导入这一路之后，「抓包分析」既当分组名
  // 又当子页名（菜单上会出现两条一模一样的「抓包分析」），且盖不住「导入文件」这种
  // 不算抓包的场景。改叫「分析管理」后，子页各叫各的。
  {
    path: "/grp-capture",
    name: "GroupCapture",
    meta: { title: "分析管理", icon: "DataAnalysis", showLink: true, rank: 6 },
    children: [
      {
        path: "/tshark",
        name: "Tshark",
        component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"),
        meta: { title: "抓包分析", icon: "Search", showLink: true, rank: 1 },
      },
      {
        path: "/tshark-pcap",
        name: "TsharkPcap",
        component: () => import("@pages/monitor/src/views/tshark/ScTsharkPcapAnalysis.vue"),
        meta: { title: "PCAP 分析", icon: "Files", showLink: true, rank: 2 },
      },
    ],
  },

  // ==================== 数据中心 ====================
  // 数据源中心独立成顶层分组，不再挂在「监控管理」下。
  //
  // 「数据源中心」页本体是 @pages/datasource 的 ScDataSourceView（共享包，采集台也在用），
  // 各类数据源的管理页由 createDatasourceManageRoutes 产出（见文件末尾的顶层合并）。
  //
  // 数据同步页视图 deep-import @pages/datasource（与下方"资产管理"分组导入 ScSessionTab
  // 等同一套做法）；该包的 createSyncTaskRoutes 工厂仍可供无自带分组的轻宿主使用。
  {
    path: "/grp-data",
    name: "GroupData",
    meta: { title: "数据中心", icon: "Coin", showLink: true, rank: 5 },
    children: [
      {
        path: "/datasource",
        name: "DataSource",
        component: () => import("@pages/datasource/src/views/ScDataSourceView.vue"),
        meta: { title: "数据源中心", icon: "Coin", showLink: true, rank: 1 },
      },
      {
        path: "/sync-tasks",
        name: "SyncTasks",
        // 数据同步：源 jdbc 数据源按 SQL 读 → 字段映射 → 目标 jdbc 数据源的表，
        // 执行由后端复用 datasync 引擎完成（源读取 / 字段映射转换 / Sink 契约）。
        component: () => import("@pages/datasource/src/views/sync/SyncTaskView.vue"),
        meta: { title: "数据同步", icon: "Refresh", showLink: true, rank: 2 },
      },
    ],
  },

  // ==================== 资产管理 ====================
  // 主机资产这一族（主机台账 / 远控 / ACME / 主机详情）归 @pages/server：
  // 视图、API、路由三者同源，宿主只挂本组标题。
  // 各子页的实际路由在文件末尾由 createServerManageRoutes 展开合并。
  {
    path: "/grp-asset",
    name: "GroupAsset",
    meta: { title: "资产管理", icon: "FolderOpened", showLink: true, rank: 10 },
    children: [
      {
        path: "/sessions",
        name: "TerminalSessions",
        component: () => import("@pages/server/src/views/ScSessionTab.vue"),
        meta: { title: "会话审计", icon: "Document", showLink: true, rank: 14 },
      },
      {
        path: "/exec",
        name: "BatchExec",
        component: () => import("@pages/server/src/views/ScExecTab.vue"),
        meta: { title: "批量作业", icon: "Promotion", showLink: true, rank: 15 },
      },
      {
        path: "/snippets",
        name: "TerminalSnippets",
        component: () => import("@pages/server/src/views/ScTerminalSnippetManager.vue"),
        meta: { title: "片段管理", icon: "DocumentCopy", showLink: true, rank: 16 },
      },
      // 维护计划：按时间窗对主机做维护/升级/停机计划。
      // @pages/server 里已实现并在它自己的路由表挂过，监控台此前只漏了入口，
      // 导致「主机运维」这一块在监控台里没有落点。
      {
        path: "/maintenance",
        name: "MaintenancePlan",
        component: () => import("@pages/server/src/views/ScMaintenancePlan.vue"),
        meta: { title: "维护计划", icon: "Clock", showLink: true, rank: 17 },
      },
    ],
  },

  // ==================== 文件管理 ====================
  // 与「资产管理」平级的独立分组：文件服务器(FileStorageServerFilter)由后端
  // monitor 的 MonitorFileStorageGatewayConfig 随应用启动（plugin.filesystem.
  // storage-server，默认 18082），是应用进程内的独立 HTTP 服务，不走网关 /ms 前缀。
  // 开发环境(pnpm dev)：文件服务在 198 上，浏览器直连会跨域且本机无该进程，
  // 由 Vite 代理 /localFileStorage 等前缀转发到 198:18082（见 vite.config.ts）；
  // 生产环境走应用配置 otherConfig.filestorage.server 或用户手动选定。
  //
  // 此前「文件资产」菜单嵌在资产管理分组下，现在提升为顶层分组。
  {
    path: "/grp-file",
    name: "GroupFile",
    meta: { title: "文件管理", icon: "Folder", showLink: true, rank: 12 },
    children: [
      {
        path: "/files",
        name: "FileAssets",
        component: () => import("@pages/filesystem/src/views/FileStorageManage.vue"),
        meta: { title: "文件资产", icon: "Document", showLink: true, rank: 1 },
      },
    ],
  },

  // ==================== 设备管理 ====================
  // 从「资产管理」中独立成组：主机与设备是两类平级资产，各自的入口直接可见，
  // 不必先进资产管理再找。rank 取 11，紧邻资产管理（10）且早于服务管理（15）。
  //
  // 组名用「设备管理」而非「设备资产」：组内已不止资产台账，还含组织/通道/日志/提供商配置。
  // 五个子页都走 device-starter 原生前缀 /api/device（见 app.yaml 的 moduleBaseUrl.device），
  // 后端由 spring-support-monitor-starter 依赖 device-starter 承载。页面直接复用
  // @pages/device 的工作台 / 卡牌视图，monitor 不再维护一套表格版拷贝。
  {
    path: "/grp-device",
    name: "GroupDevice",
    meta: { title: "设备管理", icon: "VideoCamera", showLink: true, rank: 11 },
    children: [
      {
        path: "/device-assets",
        name: "DeviceAssets",
        // 与设备应用共用一套工作台：左侧组织树 + 右侧主机卡牌 / 设备总览，
        // 避免 monitor 自己再维护一份表格版设备资产页，两处 UI 越走越远。
        component: () => import("@pages/device/src/views/DeviceView.vue"),
        meta: { title: "设备资产", icon: "Monitor", showLink: true, rank: 11 },
      },
      {
        path: "/device-orgs",
        name: "DeviceOrgs",
        component: () => import("@pages/device/src/views/DeviceOrganizationView.vue"),
        meta: { title: "设备组织", icon: "FolderOpened", showLink: true, rank: 12 },
      },
      {
        path: "/device-channels",
        name: "DeviceChannels",
        component: () => import("@pages/device/src/views/DeviceChannelView.vue"),
        meta: { title: "通道管理", icon: "Connection", showLink: true, rank: 13 },
      },
      {
        path: "/device-events",
        name: "DeviceEvents",
        component: () => import("@pages/device/src/views/DeviceEventLogView.vue"),
        meta: { title: "设备日志", icon: "Tickets", showLink: true, rank: 14 },
      },
      {
        path: "/device-providers",
        name: "DeviceProviders",
        // 提供商配置同样用卡牌（每套凭据一张卡，扩展信息位预留在卡底），不再用表格。
        component: () => import("@pages/device/src/views/DeviceProviderView.vue"),
        meta: { title: "提供商配置", icon: "Setting", showLink: true, rank: 15 },
      },
    ],
  },

  // ==================== 发布管理 / 项目管理 ====================
  // 视图、API、路由三者同出 @pages/server（createServerManageReleaseRoutes），
  // 宿主不再抄第二份：/grp-release → /release 分组 + 顶层隐藏 /projects，
  // 在文件末尾由 createServerManageReleaseRoutes 展开合并。

  // ==================== 系统管理 ====================
  {
    path: "/grp-system",
    name: "GroupSystem",
    meta: { title: "系统管理", icon: "Setting", showLink: true, rank: 30 },
    children: [
      {
        path: "/config",
        name: "Config",
        component: () => import("../views/ConfigView.vue"),
        meta: { title: "监控配置", icon: "Setting", showLink: true, rank: 30 },
      },
      {
        path: "/proxy",
        name: "Proxy",
        component: () => import("../views/ProxyView.vue"),
        meta: { title: "代理管理", icon: "Connection", showLink: true, rank: 31 },
      },
      {
        path: "/groups",
        name: "Groups",
        component: () => import("@pages/server/src/views/ScGroupTree.vue"),
        meta: { title: "分组管理", icon: "FolderOpened", showLink: false, rank: 32 },
      },
      {
        path: "/account",
        name: "Account",
        component: () => import("@pages/server/src/views/identity/IdentityManageView.vue"),
        meta: { title: "账号管理", icon: "Key", showLink: true, rank: 33 },
      },
      {
        path: "/system-config",
        name: "SystemConfig",
        component: () => import("../views/SystemConfigView.vue"),
        meta: { title: "系统配置", icon: "Tools", showLink: true, rank: 34 },
      },
    ],
  },

  // ==================== 各功能包的路由合并 ====================
  // 以下几组路由的声明在各自的功能包里（视图、API、路由同源），宿主只做合并。

  // 监控侧：服务管理（协议服务器节点）+ 服务发现 + 在线节点。
  ...createMonitorRoutes({ activeMenu: "/services" }),
  ...createMonitorManageRoutes({ activeMenu: "/services" }),

  // 主机资产族：主机资产 / 远程控制 / ACME 证书 / 主机详情。
  ...createServerManageRoutes({ activeMenu: "/assets" }),

  // 发布管理 / 项目管理族：发布管理分组 + 顶层隐藏项目页。
  ...createServerManageReleaseRoutes({ activeMenu: "/release" }),

  // 数据源管理页：全部 showLink:false（不进侧边栏），由「数据中心」的「打开管理」进入，
  // 侧边栏仍停在 /datasource 上。activeMenu 指向本应用的数据源列表路径。
  ...createDatasourceManageRoutes({ activeMenu: "/datasource" }),

  // ==================== 隐藏路由（不进菜单，仍可访问） ====================
  {
    // 关系图组件能力验收台：不挂侧边栏，仅供验收脚本访问
    path: "/re-relation-graph-lab",
    name: "ReRelationGraphLab",
    component: () => import("../views/ReRelationGraphLab.vue"),
    meta: { title: "关系图验收台", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },

  // ==================== 独立全屏路由（不套 layout，不进菜单） ====================
  {
    path: "/terminal-standalone",
    name: "TerminalStandalone",
    component: () => import("@pages/server/src/views/StandaloneTerminal.vue"),
    meta: { title: "远程控制", showLink: false, standalone: true },
  },
];

export default monitorRoutes;

