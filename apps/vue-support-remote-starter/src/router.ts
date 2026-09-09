/**
 * 业务路由 —— /remote 远控、/agents 被控端、/access 接入码
 *
 * 单页面应用，不挂 layout，使用本地 router + App.vue 渲染。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/remote",
  },
  {
    path: "/remote",
    name: "remote",
    component: () => import("./views/RemoteView.vue"),
    meta: { title: "远控" },
  },
  {
    path: "/agents",
    name: "agents",
    component: () => import("./views/AgentsView.vue"),
    meta: { title: "被控端" },
  },
  {
    path: "/access",
    name: "access",
    component: () => import("./views/AccessView.vue"),
    meta: { title: "接入码" },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("./views/SettingsView.vue"),
    meta: { title: "设置" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/remote",
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
