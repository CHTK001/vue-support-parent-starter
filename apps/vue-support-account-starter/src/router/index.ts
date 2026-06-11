import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/account",
  },
  {
    path: "/account",
    name: "AccountConsole",
    component: async () => {
      const module = await import("@pages/account");
      return module.AccountConsolePage;
    },
  },
  {
    path: "/email",
    name: "EmailConsole",
    component: async () => {
      const module = await import("@pages/email");
      return module.TempEmailPage;
    },
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
