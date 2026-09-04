/**
 * 监控管理平台路由 —— design.md §2 信息架构
 * / 工作台(概览) · /alarms 告警中心 · /assets 主机资产 · /terminal 沉浸式远控工作区
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "workbench",
    component: () => import("./views/WorkbenchView.vue"),
    meta: { title: "监控概览" },
  },
  {
    path: "/alarms",
    name: "alarms",
    component: () => import("./views/AlarmsView.vue"),
    meta: { title: "告警中心" },
  },
  {
    path: "/assets",
    name: "assets",
    component: () => import("./views/AssetsView.vue"),
    meta: { title: "主机资产" },
  },
  {
    path: "/terminal",
    name: "terminal",
    component: () => import("./views/TerminalView.vue"),
    meta: { title: "远程控制" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
