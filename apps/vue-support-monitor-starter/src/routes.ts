/**
 * 监控管理平台路由树（RouteConfigsTable[]）
 *
 * 一份路由树同时承担两个角色：
 *   1) 路由表：通过 createContextApp().routes(tree) 挂到 koi layout 之下
 *   2) 静态菜单：buildMenuFromRoutes 自动推导侧边栏菜单
 *
 * 注意：路由是扁平结构（直接 path=/assets），侧边栏层级由 meta + children 表达。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 监控管理平台路由树 */
export const monitorRoutes: RouteConfigsTable[] = [
  // ==================== 工作台 ====================
  {
    path: "/",
    name: "Workbench",
    component: () => import("./views/WorkbenchView.vue"),
    meta: { title: "监控概览", icon: "DataBoard", showLink: true, rank: 1 },
  },

  // ==================== 监控 ====================
  {
    path: "/alarms",
    name: "Alarms",
    component: () => import("./views/AlarmsView.vue"),
    meta: { title: "告警中心", icon: "Bell", showLink: true, rank: 10 },
  },
  {
    path: "/redis",
    name: "Redis",
    component: () => import("./views/RedisView.vue"),
    meta: { title: "Redis 监控", icon: "Coin", showLink: true, rank: 11 },
  },
  {
    path: "/tshark",
    name: "Tshark",
    component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"),
    meta: { title: "抓包分析", icon: "Search", showLink: true, rank: 12 },
  },

  // ==================== 资产 ====================
  {
    path: "/assets",
    name: "Assets",
    component: () => import("./views/AssetsView.vue"),
    meta: { title: "主机资产", icon: "Monitor", showLink: true, rank: 20 },
  },
  {
    path: "/host/:id",
    name: "HostDetail",
    component: () => import("./views/HostDetailView.vue"),
    meta: { title: "主机监控详情", icon: "Monitor", showLink: false, activeMenu: "/assets" },
  },
  {
    path: "/datasource",
    name: "DataSource",
    component: () => import("./views/DataSourceView.vue"),
    meta: { title: "数据源管理", icon: "Coin", showLink: true, rank: 21 },
  },
  {
    path: "/db-manager",
    name: "DbManager",
    component: () => import("./views/DatabaseManagerView.vue"),
    meta: { title: "数据库管理", icon: "Coin", showLink: true, rank: 22 },
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
    path: "/terminal",
    name: "Terminal",
    component: () => import("./views/TerminalView.vue"),
    meta: { title: "远程控制", icon: "Position", showLink: true, rank: 23 },
  },

  // ==================== 发布 ====================
  {
    path: "/project",
    name: "Project",
    component: () => import("@pages/project/src/views/ScProjectList.vue"),
    meta: { title: "发布项目管理", icon: "Box", showLink: true, rank: 30 },
  },

  // ==================== 系统 ====================
  {
    path: "/config",
    name: "Config",
    component: () => import("./views/ConfigView.vue"),
    meta: { title: "监控配置", icon: "Setting", showLink: true, rank: 40 },
  },
  {
    path: "/proxy",
    name: "Proxy",
    component: () => import("./views/ProxyView.vue"),
    meta: { title: "代理管理", icon: "Connection", showLink: true, rank: 41 },
  },
  {
    path: "/system-config",
    name: "SystemConfig",
    component: () => import("./views/SystemConfigView.vue"),
    meta: { title: "系统配置", icon: "Tools", showLink: true, rank: 42 },
  },
  {
    path: "/groups",
    name: "Groups",
    component: () => import("@pages/server/src/views/ScGroupTree.vue"),
    meta: { title: "分组管理", icon: "FolderOpened", showLink: true, rank: 43 },
  },
  {
    path: "/account",
    name: "Account",
    component: () => import("./views/IdentityManageView.vue"),
    meta: { title: "账号管理", icon: "Key", showLink: true, rank: 44 },
  },
];

export default monitorRoutes;
