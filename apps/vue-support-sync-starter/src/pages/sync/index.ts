import type { RouteRecordRaw } from "vue-router";
import TaskList from "./TaskList.vue";
import TaskDesign from "./TaskDesign.vue";
import TaskMonitor from "./TaskMonitor.vue";
import TaskLog from "./TaskLog.vue";
import Login from "./Login.vue";
import TransformRules from "./TransformRules.vue";

export { TaskList, TaskDesign, TaskMonitor, TaskLog, Login, TransformRules };

export const syncRoutes: RouteRecordRaw[] = [
  {
    path: "/sync",
    redirect: "/sync/tasks",
  },
  {
    path: "/sync/tasks",
    name: "SyncManagement",
    component: TaskList,
    meta: { title: "同步任务", requiresAuth: true },
  },
  {
    path: "/sync/design/:taskId",
    name: "SyncTaskDesign",
    component: TaskDesign,
    meta: { title: "任务设计", requiresAuth: true },
  },
  {
    path: "/sync/monitor",
    name: "SyncTaskMonitor",
    component: TaskMonitor,
    meta: { title: "任务监控", requiresAuth: true },
  },
  {
    path: "/sync/logs/:taskId",
    name: "SyncTaskLog",
    component: TaskLog,
    meta: { title: "任务日志", requiresAuth: true },
  },
  {
    path: "/sync/transforms",
    name: "SyncTransformRules",
    component: TransformRules,
    meta: { title: "转换规则", requiresAuth: true },
  },
];
