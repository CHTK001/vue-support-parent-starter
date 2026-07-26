import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@layout/koi").then(m => m.KoiLayout),
    redirect: "/home",
    children: [
      {
        path: "home",
        name: "Home",
        meta: { title: "首页", icon: "HomeFilled", isKeepAlive: true },
        component: () => import("@layout/koi/views/home/index.vue")
      }
    ]
  },
  {
    path: "/login",
    name: "Login",
    meta: { title: "登录" },
    component: () => import("@layout/koi/views/login/index.vue")
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;