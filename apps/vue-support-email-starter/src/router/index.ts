import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/inbox",
    },
    {
      path: "/inbox",
      name: "inbox",
      component: () => import("../views/inbox/index.vue"),
    },
    {
      path: "/email/:id",
      name: "email-detail",
      component: () => import("../views/detail/index.vue"),
    },
    {
      path: "/compose",
      name: "compose",
      component: () => import("../views/compose/index.vue"),
    },
    {
      path: "/sent",
      name: "sent",
      component: () => import("../views/sent/index.vue"),
    },
    {
      path: "/drafts",
      name: "drafts",
      component: () => import("../views/drafts/index.vue"),
    },
    {
      path: "/accounts",
      name: "accounts",
      component: () => import("../views/accounts/index.vue"),
    },
  ],
});

export default router;
