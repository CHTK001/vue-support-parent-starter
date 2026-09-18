/**
 * Hotsport 路由 — 前后端分离独立应用（无 i18n 依赖，中文硬编码）
 *
 * @since 2.0.0
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Traces from "./views/Traces.vue";
import TraceWaterfall from "./views/TraceWaterfall.vue";
import Dependencies from "./views/Dependencies.vue";
import Leaks from "./views/Leaks.vue";
import Logs from "./views/Logs.vue";
import Endpoints from "./views/Endpoints.vue";
import Jvm from "./views/Jvm.vue";
import Topology from "./views/Topology.vue";
import Alerts from "./views/Alerts.vue";
import Injector from "./views/Injector.vue";
import Services from "./views/Services.vue";
import ServiceDetail from "./views/ServiceDetail.vue";
import Errors from "./views/Errors.vue";

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
    path: "/traces/detail",
    name: "HotsportTraceDetail",
    component: TraceWaterfall,
    meta: { title: "链路瀑布" },
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
    path: "/endpoints",
    name: "HotsportEndpoints",
    component: Endpoints,
    meta: { title: "端点分析" },
  },
  {
    path: "/logs",
    name: "HotsportLogs",
    component: Logs,
    meta: { title: "日志" },
  },
  {
    path: "/injector",
    name: "HotsportInjector",
    component: Injector,
    meta: { title: "数据注入器" },
  },
  {
    path: "/alerts",
    name: "HotsportAlerts",
    component: Alerts,
    meta: { title: "告警中心" },
  },
  {
    path: "/services",
    name: "HotsportServices",
    component: Services,
    meta: { title: "服务列表" },
  },
  {
    path: "/services/detail",
    name: "HotsportServiceDetail",
    component: ServiceDetail,
    meta: { title: "服务详情" },
  },
  {
    path: "/errors",
    name: "HotsportErrors",
    component: Errors,
    meta: { title: "错误排行" },
  },
  {
    path: "/jvm",
    name: "HotsportJvm",
    component: Jvm,
    meta: { title: "JVM 指标" },
  },
  {
    path: "/topology",
    name: "HotsportTopology",
    component: Topology,
    meta: { title: "系统拓扑" },
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
