import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
<<<<<<< HEAD
import MainLayout from "@/layouts/MainLayout.vue";

/**
 * 路由表。
 *
 * <p>所有页面挂在 MainLayout 下，统一侧边栏 + 顶栏。</p>
=======

/**
 * 路由配置：使用 hash 模式，便于静态托管。
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
 */
const routes: RouteRecordRaw[] = [
  {
    path: "/",
<<<<<<< HEAD
    component: MainLayout,
    children: [
      { path: "", redirect: "/definitions" },
      {
        path: "definitions",
        name: "Definitions",
        component: () => import("@/views/definitions/DefinitionsView.vue"),
        meta: { title: "爬虫定义", icon: "Setting" },
      },
      {
        path: "proxy-pools",
        name: "ProxyPools",
        component: () => import("@/views/proxy-pools/ProxyPoolsView.vue"),
        meta: { title: "代理池", icon: "Connection" },
      },
      {
        path: "executions",
        name: "Executions",
        component: () => import("@/views/executions/ExecutionsView.vue"),
        meta: { title: "执行记录", icon: "List" },
      },
      {
        path: "schedules",
        name: "Schedules",
        component: () => import("@/views/schedules/SchedulesView.vue"),
        meta: { title: "定时调度", icon: "AlarmClock" },
      },
    ],
=======
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
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
<<<<<<< HEAD
});
=======
});
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
