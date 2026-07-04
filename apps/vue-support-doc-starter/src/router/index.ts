import { createRouter, createWebHashHistory } from "vue-router";
import Layout from "@/views/layout/index.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: Layout,
      redirect: "/dashboard",
      children: [
        { path: "dashboard", name: "Dashboard", component: () => import("@/views/dashboard/index.vue"), meta: { title: "menu.dashboard" } },
        { path: "ai/config", name: "AIConfig", component: () => import("@/views/ai/config.vue"), meta: { title: "menu.aiConfig" } },
        { path: "ai/providers", name: "Providers", component: () => import("@/views/ai/providers.vue"), meta: { title: "menu.providers" } },
        { path: "settings/general", name: "SettingsGeneral", component: () => import("@/views/settings/general.vue"), meta: { title: "menu.settingsGeneral" } },
        { path: "settings/clients", name: "SettingsClients", component: () => import("@/views/settings/clients.vue"), meta: { title: "menu.settingsClients" } },
        { path: "system", name: "System", component: () => import("@/views/system/index.vue"), meta: { title: "menu.system" } }
      ]
    }
  ]
});

router.beforeEach((to, _from, next) => { next(); });

export default router;
