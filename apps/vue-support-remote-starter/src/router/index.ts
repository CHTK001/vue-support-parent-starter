import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "RemoteControl",
    component: () => import("@/views/RemoteControl.vue"),
    meta: { title: "远程控制中心" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH || "/"),
  routes,
});

export default router;
