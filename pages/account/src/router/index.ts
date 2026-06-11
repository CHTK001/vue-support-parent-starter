import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/account",
    name: "AccountConsole",
    component: () => import("../views/account/index.vue"),
    meta: {
      title: "账号管理",
      icon: "ri:user-settings-line",
      showLink: true,
    },
  },
  {
    path: "/",
    redirect: "/account",
  },
];

export default routes;
