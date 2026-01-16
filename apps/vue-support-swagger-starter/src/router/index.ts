import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "DocV2",
    component: () => import("@/views/doc/v2/index.vue"),
    meta: {
      title: "API 文档",
    },
  },
  {
    path: "/doc",
    name: "Doc",
    component: () => import("@/views/doc/index.vue"),
    meta: {
      title: "API 文档（Knife4j）",
    },
  },
  {
    path: "/doc-v2",
    name: "DocV2Standalone",
    component: () => import("@/views/doc/v2/index.vue"),
    meta: {
      title: "API 文档",
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH || "/"),
  routes,
});

export default router;

