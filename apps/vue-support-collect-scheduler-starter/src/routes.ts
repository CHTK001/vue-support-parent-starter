/**
 * 采集调度系统宿主路由（跨系统的部分）。
 *
 * 这里只放两边都不专属的路由：平台总览（同时展示采集与调度指标）与 /home 重定向。
 * 采集侧路由在 @pages/collect，调度侧在 @pages/job，由 main.ts 合并。
 *
 * 之所以不把平台总览塞进任一侧：它既读采集指标（流程/任务/结果/变量/数据源）
 * 又读调度概览（/v2/scheduler/summary），放哪边都会造成两个 pages 互相依赖成环。
 * 这与后端把「调度控制台」放在系统模块而非采集/调度模块是同一个道理。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 宿主层路由树（平台总览 + 首页重定向） */
export const hostRoutes: RouteConfigsTable[] = [
  {
    // 框架登录成功跳的是常量 HOME_URL（/home），这里接回平台总览，否则登录后落 404
    path: "/home",
    name: "CollectHome",
    redirect: "/collect/dashboard",
    meta: { title: "平台首页", showLink: false },
  },
  {
    path: "/collect/dashboard",
    name: "CollectDashboard",
    component: () => import("./views/DashboardView.vue"),
    meta: { title: "平台总览", icon: "Odometer", showLink: true, keepAlive: true, rank: 0, isVisible: "1" },
  },
  // 数据源控制台（隐藏路由，由数据源列表点击进入；视图与 API 来自 @pages/datasource 共享包）
  {
    path: "/db-manager",
    name: "CollectDbManager",
    component: () => import("@pages/datasource/src/views/console/DatabaseManagerView.vue"),
    meta: { title: "数据库管理", icon: "Coin", showLink: false, activeMenu: "/collect/datasource/list" },
  },
  {
    path: "/influxdb",
    name: "CollectInfluxDB",
    component: () => import("@pages/datasource/src/views/console/InfluxDBManageView.vue"),
    meta: { title: "InfluxDB 管理", icon: "DataAnalysis", showLink: false, activeMenu: "/collect/datasource/list" },
  },
  {
    path: "/neo4j",
    name: "CollectNeo4j",
    component: () => import("@pages/datasource/src/views/console/Neo4jManageView.vue"),
    meta: { title: "Neo4j 管理", icon: "Share", showLink: false, activeMenu: "/collect/datasource/list" },
  },
  {
    path: "/nacos",
    name: "CollectNacos",
    component: () => import("@pages/datasource/src/views/console/NacosManageView.vue"),
    meta: { title: "Nacos 管理", icon: "Setting", showLink: false, activeMenu: "/collect/datasource/list" },
  },
  {
    path: "/zookeeper",
    name: "CollectZookeeper",
    component: () => import("@pages/datasource/src/views/console/ZookeeperManageView.vue"),
    meta: { title: "ZooKeeper 管理", icon: "Share", showLink: false, activeMenu: "/collect/datasource/list" },
  },
  {
    path: "/nginx",
    name: "CollectNginx",
    component: () => import("@pages/datasource/src/views/console/NginxManageView.vue"),
    meta: { title: "Nginx 管理", icon: "Connection", showLink: false, activeMenu: "/collect/datasource/list" },
  },
  {
    path: "/etcd",
    name: "CollectEtcd",
    component: () => import("@pages/datasource/src/views/console/EtcdManageView.vue"),
    meta: { title: "etcd 管理", icon: "Coin", showLink: false, activeMenu: "/collect/datasource/list" },
  },
  {
    path: "/redis-manage",
    name: "CollectRedisManage",
    component: () => import("@pages/datasource/src/views/console/RedisManageView.vue"),
    meta: { title: "Redis 管理", icon: "Coin", showLink: false, activeMenu: "/collect/datasource/list" },
  },
];

export default hostRoutes;
