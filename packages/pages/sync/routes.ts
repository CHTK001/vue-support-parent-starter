import type { RouteRecordRaw } from "vue-router";

/**
 * 数据同步模块路由配置
 * 可以被其他应用导入使用
 */
export const syncRoutes: RouteRecordRaw[] = [
  {
    path: "/sync",
    name: "Sync",
    redirect: "/sync/tasks",
    meta: { title: "数据同步" },
    children: [
      {
        path: "tasks",
        name: "SyncTaskList",
        component: () => import("./pages/TaskList.vue"),
        meta: { requiresAuth: true, title: "任务列表" },
      },
      {
        path: "design/:taskId?",
        name: "SyncTaskDesign",
        component: () => import("./pages/TaskDesign.vue"),
        meta: { requiresAuth: true, title: "任务设计" },
      },
      {
        path: "monitor",
        name: "SyncTaskMonitor",
        component: () => import("./pages/TaskMonitor.vue"),
        meta: { requiresAuth: true, title: "监控仪表板" },
      },
      {
        path: "logs/:taskId?",
        name: "SyncTaskLog",
        component: () => import("./pages/TaskLog.vue"),
        meta: { requiresAuth: true, title: "任务日志" },
      },
    ],
  },
];

export default syncRoutes;
