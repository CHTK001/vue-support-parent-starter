import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

/**
 * 路由配置：使用 hash 模式，便于静态托管。
 */
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/definitions",
  },
  {
    path: "/definitions",
    name: "Definitions",
    component: () => import("@/views/definitions/DefinitionsView.vue"),
    meta: { title: "爬虫定义", icon: "Setting" },
  },
  {
    path: "/data-records",
    name: "DataRecords",
    component: () => import("@/views/data-records/DataRecordsView.vue"),
    meta: { title: "采集数据", icon: "Document" },
  },
  {
    path: "/execution-records",
    name: "ExecutionRecords",
    component: () => import("@/views/execution-records/ExecutionRecordsView.vue"),
    meta: { title: "执行记录", icon: "List" },
  },
  {
    path: "/orchestration",
    name: "Orchestration",
    component: () => import("@/views/orchestration/OrchestrationView.vue"),
    meta: { title: "编排测试", icon: "Share" },
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});