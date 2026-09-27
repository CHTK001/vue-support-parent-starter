/**
 * 监控管理平台路由 —— 对齐 prototype.html 的页面清单：
 * 概览 · 告警 · Redis 监控 · 抓包分析 · 主机资产 · 主机详情 · 远程控制 · 监控配置
 *
 * 说明：当前主入口 main.ts 走 routes.ts + koi 布局，本文件保留为独立路由配置。
 * @author CH
 * @since 4.0.0
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/groups" },
  { path: "/alarms", name: "alarms", component: () => import("./views/AlarmsView.vue"), meta: { title: "告警中心" } },
  { path: "/redis", name: "redis", component: () => import("./views/RedisView.vue"), meta: { title: "Redis 监控" } },
  { path: "/tshark", name: "tshark", component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"), meta: { title: "抓包分析" } },
  { path: "/assets", name: "assets", component: () => import("./views/AssetsView.vue"), meta: { title: "主机资产" } },
  { path: "/host/:id", name: "host-detail", component: () => import("./views/HostDetailView.vue"), meta: { title: "主机监控详情" } },
  { path: "/terminal", name: "terminal", component: () => import("./views/TerminalView.vue"), meta: { title: "远程控制" } },
  { path: "/terminal-standalone", name: "terminal-standalone", component: () => import("./views/StandaloneTerminal.vue"), meta: { title: "远程控制", standalone: true } },
  { path: "/config", name: "config", component: () => import("./views/ConfigView.vue"), meta: { title: "监控配置" } },
  { path: "/system-config", name: "system-config", component: () => import("./views/SystemConfigView.vue"), meta: { title: "系统配置" } },
  { path: "/proxy", name: "proxy", component: () => import("./views/ProxyView.vue"), meta: { title: "代理管理" } },
  // 数据源中心走 ScDataCenterView（共享页 + 注入「数据表」页签），与 routes.ts 保持一致；
  // /db-manager 独立页保留，供书签 / 外部深链直达。
  { path: "/datasource", name: "datasource", component: () => import("./views/ScDataCenterView.vue"), meta: { title: "数据源管理" } },
  { path: "/db-manager", name: "db-manager", component: () => import("./views/DatabaseManagerView.vue"), meta: { title: "数据库管理" } },
  { path: "/account", name: "account", component: () => import("./views/IdentityManageView.vue"), meta: { title: "账号管理" } },
  { path: "/files", name: "files", component: () => import("./views/FileAssetView.vue"), meta: { title: "文件资产" } },
  { path: "/groups", name: "groups", component: () => import("@pages/server/src/views/ScGroupTree.vue"), meta: { title: "分组管理" } },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
