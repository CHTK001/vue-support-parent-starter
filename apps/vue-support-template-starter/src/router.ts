/**
 * 业务路由 —— /home 组件列表 + /debug/:name 调试 + 成就/签到测试
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
  // 成就模块测试页
  {
    path: "/achievement/mine",
    name: "AchievementMine",
    component: () => import("@repo/achievement/views/AchievementMine.vue"),
    meta: { title: "我的成就" },
  },
  {
    path: "/achievement/manage",
    name: "AchievementManage",
    component: () => import("@repo/achievement/views/AchievementManage.vue"),
    meta: { title: "成就管理" },
  },
  // 签到模块测试页
  {
    path: "/signin/mine",
    name: "SignInMine",
    component: () => import("@repo/signin/views/SignInMine.vue"),
    meta: { title: "每日签到" },
  },
  {
    path: "/signin/manage",
    name: "SignInManage",
    component: () => import("@repo/signin/views/SignInManage.vue"),
    meta: { title: "签到汇总" },
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