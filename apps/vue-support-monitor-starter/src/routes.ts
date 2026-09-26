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
        path: "/redis",
        name: "Redis",
        component: () => import("./views/RedisView.vue"),
        meta: { title: "Redis 监控", icon: "Coin", showLink: false, rank: 3 },
      },
      {
        path: "/tshark",
        name: "Tshark",
        component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"),
        meta: { title: "抓包分析", icon: "Search", showLink: true, rank: 4 },
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
        path: "/datasource",
        name: "DataSource",
        // 数据源已抽为独立包 @pages/datasource（后端 spring-support-datasource-hub-starter）
        component: () => import("@pages/datasource/src/views/ScDataSourceView.vue"),
        meta: { title: "数据源中心", icon: "Coin", showLink: true, rank: 11 },
      },
      {
        path: "/db-manager",
        name: "DbManager",
        component: () => import("./views/DatabaseManagerView.vue"),
        meta: { title: "数据库管理", icon: "Coin", showLink: false, activeMenu: "/datasource", rank: 12 },
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
      {
        path: "/projects",
        name: "Projects",
        component: () => import("./views/ProjectsView.vue"),
        meta: { title: "项目管理", icon: "Folder", showLink: false, rank: 21 },
      },
    ],
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
    component: () => import("./views/InfluxDBManageView.vue"),
    meta: { title: "InfluxDB 管理", icon: "DataAnalysis", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/neo4j",
    name: "Neo4j",
    component: () => import("./views/Neo4jManageView.vue"),
    meta: { title: "Neo4j 管理", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/nacos",
    name: "Nacos",
    component: () => import("./views/NacosManageView.vue"),
    meta: { title: "Nacos 管理", icon: "Setting", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/zookeeper",
    name: "Zookeeper",
    component: () => import("./views/ZookeeperManageView.vue"),
    meta: { title: "ZooKeeper 管理", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },
  {
    path: "/nginx",
    name: "Nginx",
    component: () => import("./views/NginxManageView.vue"),
    meta: { title: "Nginx 管理", icon: "Connection", showLink: false, activeMenu: "/datasource" },
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
