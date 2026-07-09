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
        { path: "ai", name: "AIHome", component: () => import("@/views/ai/index.vue"), meta: { title: "menu.aiConfig" } },
        { path: "ai/config", name: "AIConfig", component: () => import("@/views/ai/config.vue"), meta: { title: "menu.aiConfig" } },
        { path: "ai/providers", name: "Providers", component: () => import("@/views/ai/providers.vue"), meta: { title: "menu.providers" } },
        { path: "ai/usage", name: "AIUsage", component: () => import("@/views/ai/usage.vue"), meta: { title: "menu.aiUsage" } },
        { path: "settings/general", name: "SettingsGeneral", component: () => import("@/views/settings/general.vue"), meta: { title: "menu.settingsGeneral" } },
        { path: "settings/sync", name: "SettingsSync", component: () => import("@/views/settings/sync.vue"), meta: { title: "menu.settingsSync" } },
        { path: "settings/clients", name: "SettingsClients", component: () => import("@/views/settings/clients.vue"), meta: { title: "menu.settingsClients" } },
        { path: "settings/mcpskills", name: "SettingsMcpSkills", component: () => import("@/views/settings/mcp-skills.vue"), meta: { title: "MCP / Skills 配置" } },
        { path: "mcp/manager", name: "McpManager", component: () => import("@/views/mcp/manager.vue"), meta: { title: "menu.mcpManager" } },
        { path: "skills/manager", name: "SkillsManager", component: () => import("@/views/skills/manager.vue"), meta: { title: "menu.skills" } },
        { path: "system", name: "System", component: () => import("@/views/system/index.vue"), meta: { title: "menu.system" } },
        { path: "remote", name: "Remote", component: () => import("@/views/remote/index.vue"), meta: { title: "menu.remote" } }
      ]
    }
  ]
});

router.beforeEach((to, _from, next) => { next(); });

export default router;
