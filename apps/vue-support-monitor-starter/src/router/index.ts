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
 *   <tr><td>主机资产 / 远控 / ACME / 会话 / 批量作业 / 片段 / 维护计划 / 发布管理</td><td>{@code @pages/server}</td></tr>
 *   <tr><td>服务管理（协议服务器节点）/ 在线节点 / 服务发现 / 抓包分析 / 告警 / 概览</td><td>{@code @pages/monitor}</td></tr>
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
 * <p><strong>page 菜单直接引用</strong>：各功能包都导出自己完整的二级菜单（分组 + 叶子），
 * 本文件用 {@code ...createXxxRoutes()} 展开引用；本文件不再手写业务叶子，只在确实需要
 * 调整菜单排版时才保留本地分组（如监控管理 / 数据中心 / 系统管理等跨包拼装）。</p>
 *
 * 路由模式：hash（routerMode: "hash"）
 */
import type { RouteConfigsTable } from "@repo/core";
// 深导入 src/routes 而不是从包根导入 —— 包根 index.ts 有 registerMenuViewModules
// 顶层副作用，会把整个 api/组件桶拖进主 chunk；本文件只需要路由工厂。
import { createDatasourceManageRoutes } from "@pages/datasource/src/routes";
import { createServerHostRoutes } from "@pages/server/src/routes";
import { createMonitorRoutes, createMonitorManageRoutes } from "@pages/monitor/src/routes";

export const monitorRoutes: RouteConfigsTable[] = [
  // ==================== 监控管理 ====================
  // 跨 @pages/monitor 多视图拼装的本地分组（监控概览隐藏，告警可见）。
  {
    path: "/grp-monitor",
    name: "GroupMonitor",
    meta: { title: "监控管理", icon: "Odometer", showLink: true, rank: 1 },
    children: [
      {
        path: "/workbench",
        name: "Workbench",
        component: () => import("@pages/monitor/src/views/WorkbenchView.vue"),
        meta: { title: "监控概览", icon: "DataBoard", showLink: false, rank: 1 },
      },
      {
        path: "/alarms",
        name: "Alarms",
        component: () => import("@pages/monitor/src/views/AlarmsView.vue"),
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
  {
    path: "/grp-data",
    name: "GroupData",
    meta: { title: "数据中心", icon: "Coin", showLink: true, rank: 5 },
    children: [
      {
        path: "/datasource",
        name: "DataSource",
        component: () => import("@pages/datasource/src/views/ScDataSourceView.vue"),
        meta: { title: "数据源中心", icon: "DataLine", showLink: true, rank: 1 },
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

  // ==================== 主机管理 ====================
  // 完整二级菜单由 @pages/server 的 createServerHostRoutes 产出
  // （主机资产 / 远程控制 / ACME / 会话审计 / 批量作业 / 片段 / 维护计划 / 发布管理），
  // 视图、API、路由三者同源，宿主只做一行展开；/projects 等隐藏路由也一并展开到顶层。
  ...createServerHostRoutes({ activeMenu: "/assets" }),

  // ==================== 文件管理 ====================
  // 与「主机管理」平级的独立分组：文件服务器(FileStorageServerFilter)由后端
  // monitor 的 MonitorFileStorageGatewayConfig 随应用启动（plugin.filesystem.
  // storage-server，默认 18082），是应用进程内的独立 HTTP 服务，不走网关 /ms 前缀。
  // 开发环境(pnpm dev)：文件服务在 198 上，浏览器直连会跨域且本机无该进程，
  // 由 Vite 代理 /localFileStorage 等前缀转发到 198:18082（见 vite.config.ts）；
  // 生产环境走应用配置 otherConfig.filestorage.server 或用户手动选定。
  {
    path: "/grp-file",
    name: "GroupFile",
    meta: { title: "文件管理", icon: "Folder", showLink: true, rank: 12 },
    children: [
      {
        path: "/files",
        name: "FileAssets",
        component: () => import("@pages/filesystem/src/views/FileStorageManage.vue"),
        meta: { title: "文件资产", icon: "FolderOpened", showLink: true, rank: 1 },
      },
      {
        // 文件记录：任务化分片上传的发起与状态展示（后台时间轮 + 虚拟线程合并）
        path: "/upload-tasks",
        name: "UploadTasks",
        component: () => import("@pages/filesystem/src/views/UploadTaskView.vue"),
        meta: { title: "文件记录", icon: "Upload", showLink: true, rank: 2 },
      },
    ],
  },

  // ==================== 设备管理 ====================
  // 从「主机管理」中独立成组：主机与设备是两类平级资产，各自的入口直接可见。
  // 组名用「设备管理」而非「设备资产」：组内已不止资产台账，还含组织/通道/日志/提供商配置。
  {
    path: "/grp-device",
    name: "GroupDevice",
    meta: { title: "设备管理", icon: "VideoCamera", showLink: true, rank: 11 },
    children: [
      {
        path: "/device-assets",
        name: "DeviceAssets",
        component: () => import("@pages/device/src/views/DeviceView.vue"),
        meta: { title: "设备资产", icon: "Histogram", showLink: true, rank: 11 },
      },
      {
        path: "/device-orgs",
        name: "DeviceOrgs",
        component: () => import("@pages/device/src/views/DeviceOrganizationView.vue"),
        meta: { title: "设备组织", icon: "OfficeBuilding", showLink: true, rank: 12 },
      },
      {
        path: "/device-channels",
        name: "DeviceChannels",
        component: () => import("@pages/device/src/views/DeviceChannelView.vue"),
        meta: { title: "通道管理", icon: "Share", showLink: true, rank: 13 },
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
        component: () => import("@pages/device/src/views/DeviceProviderView.vue"),
        meta: { title: "提供商配置", icon: "SetUp", showLink: true, rank: 15 },
      },
    ],
  },

  // ==================== 系统管理 ====================
  // 跨包拼装的本地分组（监控配置/代理/分组/账号/系统配置来自多个 pages 包），
  // 需要 stack 本地排版，故保留在壳内。
  {
    path: "/grp-system",
    name: "GroupSystem",
    meta: { title: "系统管理", icon: "Setting", showLink: true, rank: 30 },
    children: [
      {
        path: "/config",
        name: "Config",
        component: () => import("@pages/monitor/src/views/ConfigView.vue"),
        meta: { title: "监控配置", icon: "Operation", showLink: true, rank: 30 },
      },
      {
        path: "/proxy",
        name: "Proxy",
        component: () => import("@pages/monitor/src/views/ProxyView.vue"),
        meta: { title: "代理管理", icon: "Connection", showLink: true, rank: 31 },
      },
      {
        path: "/groups",
        name: "Groups",
        component: () => import("@pages/server/src/views/ScGroupTree.vue"),
        meta: { title: "分组管理", icon: "Menu", showLink: false, rank: 32 },
      },
      {
        path: "/account",
        name: "Account",
        component: () => import("@pages/server/src/views/identity/IdentityManageView.vue"),
        meta: { title: "账号管理", icon: "User", showLink: true, rank: 33 },
      },
      {
        path: "/system-config",
        name: "SystemConfig",
        component: () => import("@pages/monitor/src/views/SystemConfigView.vue"),
        meta: { title: "系统配置", icon: "Tools", showLink: true, rank: 34 },
      },
    ],
  },

  // ==================== 各功能包的隐藏路由合并 ====================
  // 以下几组路由的声明在各自的功能包里（视图、API、路由同源），宿主只做合并，
  // 全部 showLink:false（不进侧边栏），由所属列表页「打开管理」进入。

  // 监控侧：服务管理（协议服务器节点，进菜单）+ 服务发现 + 在线节点（隐藏）。
  ...createMonitorRoutes({ activeMenu: "/services" }),
  ...createMonitorManageRoutes({ activeMenu: "/services" }),

  // 数据源管理页：全部 showLink:false（不进侧边栏），由「数据中心」的「打开管理」进入，
  // 侧边栏仍停在 /datasource 上。activeMenu 指向本应用的数据源列表路径。
  ...createDatasourceManageRoutes({ activeMenu: "/datasource" }),

  // ==================== 隐藏路由（不进菜单，仍可访问） ====================
  {
    // 关系图组件能力验收台：不挂侧边栏，仅供验收脚本访问
    path: "/re-relation-graph-lab",
    name: "ReRelationGraphLab",
    component: () => import("@pages/monitor/src/views/ReRelationGraphLab.vue"),
    meta: { title: "关系图验收台", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },
  {
    // 表格组件能力验收台：验证「远程数据异步化 + 按钮动画」，不挂侧边栏
    path: "/re-table-lab",
    name: "ReTableLab",
    component: () => import("@pages/monitor/src/views/ReTableLab.vue"),
    meta: { title: "表格验收台", icon: "Grid", showLink: false, activeMenu: "/datasource" },
  },
  {
    // 远程选择类组件能力验收台：ReSelect / ReRemoteSelect / ReSearch / ReFilter / ReTree
    path: "/re-remote-select-lab",
    name: "ReRemoteSelectLab",
    component: () => import("@pages/monitor/src/views/ReRemoteSelectLab.vue"),
    meta: { title: "远程组件验收台", icon: "Select", showLink: false, activeMenu: "/datasource" },
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