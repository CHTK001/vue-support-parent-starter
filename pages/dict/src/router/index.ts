import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "DictManagement",
    component: () => import("../index.vue"),
    meta: {
      title: "字典管理",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;