/**
 * 监控管理平台路由树（RouteConfigsTable[]）
 *
 * 分组结构：一级为「分组父节点」（仅用于侧边栏分组标题 + 折叠/展开，无 component、无 redirect），
 *           二级为具体业务页面（叶子路由，带 component）。
 *
 * 装配说明：
 *   - 菜单：buildMenuFromRoutes 递归保留 children → koi 侧边栏按 children 渲染 el-sub-menu（自带折叠箭头）。
 *   - 路由：registerRoutesUnderLayout 递归 visit，仅把「带 component」或「带 redirect」的节点
 *           通过 addRoute("layout", ...) 平铺到 koi 布局下；分组父节点既无 component 又无 redirect，
 *           因此不会被注册为路由，只作为菜单分组容器存在。
 *   - 隐藏路由（showLink:false）保留在顶层：菜单过滤时被剔除，但仍会被注册为可访问路由。
 *
 * 路由模式：hash（routerMode: "hash"）
 */
import type { RouteConfigsTable } from "@repo/core";

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
        component: () => import("./views/WorkbenchView.vue"),
        meta: { title: "监控概览", icon: "DataBoard", showLink: false, rank: 1 },
      },
      {
        path: "/alarms",
        name: "Alarms",
        component: () => import("./views/AlarmsView.vue"),
        meta: { title: "告警中心", icon: "Bell", showLink: true, rank: 2 },
      },
      {
        path: "/tshark",
        name: "Tshark",
        component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"),
        meta: { title: "抓包分析", icon: "Search", showLink: true, rank: 4 },
      },
    ],
  },

  // ==================== 数据中心 ====================
  // 数据源中心独立成顶层分组，不再挂在「监控管理」下
  {
    path: "/grp-data",
    name: "GroupData",
    meta: { title: "数据中心", icon: "Coin", showLink: true, rank: 5 },
    children: [
      {
        path: "/datasource",
        name: "DataSource",
        // 数据源已抽为独立包 @pages/datasource（后端 spring-support-datasource-hub-starter）。
        // 本宿主用 ScDataCenterView 包一层：在共享页基础上注入「数据表」页签，
        // 把数据库管理器并进来；共享页本身不认识宿主组件，采集台继续直接用它。
        component: () => import("./views/ScDataCenterView.vue"),
        meta: { title: "数据源中心", icon: "Coin", showLink: true, rank: 1 },
      },
      {
        path: "/sync-tasks",
        name: "SyncTasks",
        // 数据同步：源 jdbc 数据源按 SQL 读 → 字段映射 → 目标 jdbc 数据源的表，
        // 执行由后端复用 datasync 引擎完成（源读取 / 字段映射转换 / Sink 契约）。
        component: () => import("./views/SyncTaskView.vue"),
        meta: { title: "数据同步", icon: "Refresh", showLink: true, rank: 2 },
      },
    ],
  },

  // ==================== 资产管理 ====================
  {
    path: "/grp-asset",
    name: "GroupAsset",
    meta: { title: "资产管理", icon: "FolderOpened", showLink: true, rank: 10 },
    children: [
      {
        path: "/assets",
        name: "Assets",
        component: () => import("./views/AssetsView.vue"),
        meta: { title: "主机资产", icon: "Monitor", showLink: true, rank: 10 },
      },
      {
        path: "/files",
        name: "FileAssets",
        component: () => import("@pages/filesystem/src/views/FileStorageManage.vue"),
        meta: { title: "文件资产", icon: "Document", showLink: true, rank: 11 },
      },
      {
        path: "/terminal",
        name: "Terminal",
        component: () => import("./views/TerminalView.vue"),
        meta: { title: "远程控制", icon: "Position", showLink: true, rank: 13 },
      },
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
    ],
  },

  // ==================== 设备管理 ====================
  // 从「资产管理」中独立成组：主机与设备是两类平级资产，各自的入口直接可见，
  // 不必先进资产管理再找。rank 取 11，紧邻资产管理（10）且早于服务管理（15）。
  //
  // 组名用「设备管理」而非「设备资产」：组内已不止资产台账，还含组织/通道/日志/提供商配置。
  // 四个子页都走 device-starter 原生前缀 /api/device（见 app.yaml 的 moduleBaseUrl.device），
  // 后端由 spring-support-monitor-starter 依赖 device-starter 承载。
  {
    path: "/grp-device",
    name: "GroupDevice",
    meta: { title: "设备管理", icon: "VideoCamera", showLink: true, rank: 11 },
    children: [
      {
        path: "/device-assets",
        name: "DeviceAssets",
        component: () => import("./views/DeviceAssetsView.vue"),
        meta: { title: "设备资产", icon: "Monitor", showLink: true, rank: 11 },
      },
      {
        path: "/device-orgs",
        name: "DeviceOrgs",
        component: () => import("./views/DeviceOrganizationView.vue"),
        meta: { title: "设备组织", icon: "FolderOpened", showLink: true, rank: 12 },
      },
      {
        path: "/device-channels",
        name: "DeviceChannels",
        component: () => import("./views/DeviceChannelView.vue"),
        meta: { title: "通道管理", icon: "Connection", showLink: true, rank: 13 },
      },
      {
        path: "/device-events",
        name: "DeviceEvents",
        component: () => import("./views/DeviceEventLogView.vue"),
        meta: { title: "设备日志", icon: "Tickets", showLink: true, rank: 14 },
      },
      {
        path: "/device-providers",
        name: "DeviceProviders",
        component: () => import("./views/DeviceProviderConfigView.vue"),
        meta: { title: "提供商配置", icon: "Setting", showLink: true, rank: 15 },
      },
    ],
  },

  // ==================== 服务管理 ====================
  // 与「资产管理」「发布管理」平级的独立分组，rank 取 15 落在 10 与 20 之间。
  // 子菜单指向 @pages/server 的 ScServiceManage（协议服务器节点：Server 接口 + ServerFilter 编排），
  // 该页面此前已存在但未挂任何路由，侧边栏无从进入。
  {
    path: "/grp-service",
    name: "GroupService",
    meta: { title: "服务管理", icon: "Operation", showLink: true, rank: 15 },
    children: [
      {
        path: "/services",
        name: "Services",
        component: () => import("@pages/server/src/views/ScServiceManage.vue"),
        meta: { title: "服务管理", icon: "Connection", showLink: true, rank: 15 },
      },
    ],
  },

  // ==================== 发布管理 ====================
  {
    path: "/grp-release",
    name: "GroupRelease",
    meta: { title: "发布管理", icon: "Promotion", showLink: true, rank: 20 },
    children: [
      {
        path: "/release",
        name: "Release",
        component: () => import("./views/ReleaseView.vue"),
        meta: { title: "发布管理", icon: "Box", showLink: true, rank: 20 },
      },
    ],
  },
  {
    // 项目管理：按需求从「发布管理」菜单摘除（原先 showLink:false 挂在分组 children 下，
    // 而菜单过滤不递归、菜单组件也不校验子项 showLink，实测展开「发布管理」仍会渲染出它）。
    // 移到顶层隐藏区才真正生效 —— 与下方 /db-manager 同一套做法。
    // 路由本身保留可访问：发布管理列表的卡片与「进入」按钮都跳这里（见 ReleaseView.vue），
    // 直接删掉路由会让那两个入口变成死链。
    path: "/projects",
    name: "Projects",
    component: () => import("./views/ProjectsView.vue"),
    meta: { title: "项目管理", icon: "Folder", showLink: false, activeMenu: "/release" },
  },

  // ==================== 系统管理 ====================
  {
    path: "/grp-system",
    name: "GroupSystem",
    meta: { title: "系统管理", icon: "Setting", showLink: true, rank: 30 },
    children: [
      {
        path: "/config",
        name: "Config",
        component: () => import("./views/ConfigView.vue"),
        meta: { title: "监控配置", icon: "Setting", showLink: true, rank: 30 },
      },
      {
        path: "/proxy",
        name: "Proxy",
        component: () => import("./views/ProxyView.vue"),
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
        component: () => import("./views/IdentityManageView.vue"),
        meta: { title: "账号管理", icon: "Key", showLink: true, rank: 33 },
      },
      {
        path: "/system-config",
        name: "SystemConfig",
        component: () => import("./views/SystemConfigView.vue"),
        meta: { title: "系统配置", icon: "Tools", showLink: true, rank: 34 },
      },
    ],
  },

  // ==================== 隐藏路由（不进菜单，仍可访问） ====================
  {
    path: "/host/:id",
    name: "HostDetail",
    component: () => import("./views/HostDetailView.vue"),
    meta: { title: "主机监控详情", icon: "Monitor", showLink: false, activeMenu: "/assets" },
  },
  {
    path: "/influxdb",
    name: "InfluxDB",
    component: () => import("@pages/datasource/src/views/console/InfluxDBManageView.vue"),
    meta: { title: "InfluxDB 管理", icon: "DataAnalysis", showLink: false, activeMenu: "/datasource" },
  },
  {
    // 关系图组件能力验收台：不挂侧边栏，仅供验收脚本访问
    path: "/re-relation-graph-lab",
    name: "ReRelationGraphLab",
    component: () => import("./views/ReRelationGraphLab.vue"),
    meta: { title: "关系图验收台", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/etcd",
    name: "Etcd",
    component: () => import("@pages/datasource/src/views/console/EtcdManageView.vue"),
    meta: { title: "etcd 管理", icon: "Coin", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/neo4j",
    name: "Neo4j",
    component: () => import("@pages/datasource/src/views/console/Neo4jManageView.vue"),
    meta: { title: "Neo4j 管理", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/nacos",
    name: "Nacos",
    component: () => import("@pages/datasource/src/views/console/NacosManageView.vue"),
    meta: { title: "Nacos 管理", icon: "Setting", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/zookeeper",
    name: "Zookeeper",
    component: () => import("@pages/datasource/src/views/console/ZookeeperManageView.vue"),
    meta: { title: "ZooKeeper 管理", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/nginx",
    name: "Nginx",
    component: () => import("@pages/datasource/src/views/console/NginxManageView.vue"),
    meta: { title: "Nginx 管理", icon: "Connection", showLink: false, activeMenu: "/datasource" },
  },
  {
    // 数据库管理：由「数据源中心」页面内进入，仅注册路由不进侧边栏。
    // 放在顶层隐藏区，才能被 getShowStaticAndDynamicMenuList 的顶层 isVisible=0 过滤掉；
    // 挂在分组 children 下时该过滤不递归、菜单组件也不校验子项 showLink，会被渲染出来。
    path: "/db-manager",
    name: "DbManager",
    component: () => import("@pages/datasource/src/views/console/DatabaseManagerView.vue"),
    meta: { title: "数据库管理", icon: "Coin", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/discovery",
    name: "Discovery",
    component: () => import("./views/DiscoveryView.vue"),
    meta: { title: "服务发现", icon: "Connection", showLink: false, activeMenu: "/assets" },
  },

  // ==================== 独立全屏路由（不套 layout，不进菜单） ====================
  {
    path: "/terminal-standalone",
    name: "TerminalStandalone",
    component: () => import("./views/StandaloneTerminal.vue"),
    meta: { title: "远程控制", showLink: false, standalone: true },
  },
];

export default monitorRoutes;
