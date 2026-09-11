/**
 * 监控管理平台路由 —�?对齐 prototype.html 7 �? * / 概览 · /alarms 告警 · /redis Redis · /tshark 抓包 · /assets 资产
 * · /host/:id 主机详情 · /terminal 远控 · /config 监控配置
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "workbench", component: () => import("./views/WorkbenchView.vue"), meta: { title: "监控概览" } },
  { path: "/alarms", name: "alarms", component: () => import("./views/AlarmsView.vue"), meta: { title: "告警中心" } },
  { path: "/redis", name: "redis", component: () => import("./views/RedisView.vue"), meta: { title: "Redis 监控" } },
  { path: "/tshark", name: "tshark", component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"), meta: { title: "抓包分析" } },
  { path: "/assets", name: "assets", component: () => import("./views/AssetsView.vue"), meta: { title: "主机资产" } },
  { path: "/host/:id", name: "host-detail", component: () => import("./views/HostDetailView.vue"), meta: { title: "主机监控详情" } },
  { path: "/terminal", name: "terminal", component: () => import("./views/TerminalView.vue"), meta: { title: "远程控制" } },
  { path: "/config", name: "config", component: () => import("./views/ConfigView.vue"), meta: { title: "监控配置" } },
  { path: "/system-config", name: "system-config", component: () => import("./views/SystemConfigView.vue"), meta: { title: "系统配置" } },
  { path: "/proxy", name: "proxy", component: () => import("./views/ProxyView.vue"), meta: { title: "代理管理" } },
  { path: "/project", name: "project", component: () => import("@pages/project/src/views/ScProjectList.vue"), meta: { title: "发布项目管理" } },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});