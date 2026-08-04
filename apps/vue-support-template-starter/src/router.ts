/**
 * 业务路由 —— /home 组件列表 + /debug/:name 调试
 *
 * 单页面应用，不挂 layout，使用本地 router + App.vue 渲染。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: () => import("./views/Home.vue"),
    meta: { title: "组件模板" },
  },
  {
    path: "/debug/:name",
    name: "debug",
    component: () => import("./views/Debug.vue"),
    meta: { title: "调试组件" },
    props: true,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/home",
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});