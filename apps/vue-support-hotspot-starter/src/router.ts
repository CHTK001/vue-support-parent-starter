/**
 * Hotsport 路由 — 前后端分离独立应用（无 i18n 依赖，中文硬编码）
 *
 * @since 2.0.0
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Traces from "./views/Traces.vue";
import Dependencies from "./views/Dependencies.vue";
import Leaks from "./views/Leaks.vue";
import Logs from "./views/Logs.vue";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "HotsportDashboard",
    component: Dashboard,
    meta: { title: "总览看板" },
  },
  {
    path: "/traces",
    name: "HotsportTraces",
    component: Traces,
    meta: { title: "调用链路" },
  },
  {
    path: "/dependencies",
    name: "HotsportDependencies",
    component: Dependencies,
    meta: { title: "依赖拓扑" },
  },
  {
    path: "/leaks",
    name: "HotsportLeaks",
    component: Leaks,
    meta: { title: "资源泄漏" },
  },
  {
    path: "/logs",
    name: "HotsportLogs",
    component: Logs,
    meta: { title: "日志" },
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
