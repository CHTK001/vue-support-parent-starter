/**
 * 账号管理应用路由。
 *
 * 单页模式：hash 路由，只渲染账号管理页面。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "account",
    component: () => import("@pages/account/views/AccountManage.vue"),
    meta: { title: "账号管理" },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
