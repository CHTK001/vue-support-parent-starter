/**
 * 监控单页沉浸式控制台路由
 *
 * 单页面应用：只提供一个工作台根路径，不再挂 koi layout 壳。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "workspace",
    component: () => import("./App.vue"),
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
