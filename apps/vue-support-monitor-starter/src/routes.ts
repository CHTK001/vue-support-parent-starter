/**
 * 监控管理平台路由树（RouteConfigsTable[]）
 *
 * 扁平结构：所有路由都是顶级路由，菜单由 meta.rank 和 meta.title 自动排序
 * 路由模式：hash（routerMode: "hash"）
 */
import type { RouteConfigsTable } from "@repo/core";

/** 监控管理平台路由树（扁平结构） */
export const monitorRoutes: RouteConfigsTable[] = [
  // ==================== 监控管理 ====================
  {
    path: "/",
    name: "Workbench",
    component: () => import("./views/WorkbenchView.vue"),
    meta: { title: "监控概览", icon: "DataBoard", showLink: true, rank: 1 },
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
    meta: { title: "Redis 监控", icon: "Coin", showLink: true, rank: 3 },
  },
  {
    path: "/tshark",
    name: "Tshark",
    component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"),
    meta: { title: "抓包分析", icon: "Search", showLink: true, rank: 4 },
  },

  // ==================== 资产管理 ====================
  {
    path: "/assets",
    name: "Assets",
    component: () => import("./views/AssetsView.vue"),
    meta: { title: "主机资产", icon: "Monitor", showLink: true, rank: 10 },
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
    meta: { title: "数据源管理", icon: "Coin", showLink: true, rank: 11 },
  },
  {
    path: "/db-manager",
    name: "DbManager",
    component: () => import("./views/DatabaseManagerView.vue"),
    meta: { title: "数据库管理", icon: "Coin", showLink: true, rank: 12 },
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
    meta: { title: "远程控制", icon: "Position", showLink: true, rank: 13 },
  },

  // ==================== 发布管理 ====================
  {
    path: "/project",
    name: "Project",
    component: () => import("@pages/project/src/views/ScProjectList.vue"),
    meta: { title: "发布项目管理", icon: "Box", showLink: true, rank: 20 },
  },

  // ==================== 系统管理 ====================
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
    path: "/system-config",
    name: "SystemConfig",
    component: () => import("./views/SystemConfigView.vue"),
    meta: { title: "系统配置", icon: "Tools", showLink: true, rank: 32 },
  },
  {
    path: "/groups",
    name: "Groups",
    component: () => import("@pages/server/src/views/ScGroupTree.vue"),
    meta: { title: "分组管理", icon: "FolderOpened", showLink: true, rank: 33 },
  },
  {
    path: "/account",
    name: "Account",
    component: () => import("./views/IdentityManageView.vue"),
    meta: { title: "账号管理", icon: "Key", showLink: true, rank: 34 },
  },
];

export default monitorRoutes;
