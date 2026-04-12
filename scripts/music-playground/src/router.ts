import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/music/index",
    },
    {
      path: "/music/index",
      name: "music-playground-index",
      component: () => import("../../../pages/music/src/index.vue"),
    },
  ],
});

export default router;
