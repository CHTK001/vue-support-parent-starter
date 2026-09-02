/**
 * 业务路由
 *
 * 单页应用（mode=single），本地 Hash 路由：
 *   /           -> 工作台（地图 + 模式面板）
 *   /tasks      -> 任务中心
 *   /history    -> 下载历史
 *   /settings   -> 设置
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/workspace",
  },
  {
    path: "/workspace",
    name: "workspace",
    component: () => import("./views/Workspace.vue"),
    meta: { title: "工作台" },
  },
  {
    path: "/tasks",
    name: "tasks",
    component: () => import("./views/Tasks.vue"),
    meta: { title: "任务中心" },
  },
  {
    path: "/history",
    name: "history",
    component: () => import("./views/History.vue"),
    meta: { title: "下载历史" },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("./views/Settings.vue"),
    meta: { title: "设置" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/workspace",
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});