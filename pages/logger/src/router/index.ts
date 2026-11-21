/**
 * 日志控制台路由：hash 模式（/console 实时、/search 检索、/apps 应用实例、/stats 统计）。
 * 视图懒加载，首屏只带实时控制台。
 */
import { createRouter, createWebHashHistory } from "vue-router";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/console" },
    {
      path: "/console",
      name: "console",
      component: () => import("../views/ConsoleView.vue"),
      meta: { title: "实时控制台" },
    },
    {
      path: "/search",
      name: "search",
      component: () => import("../views/SearchView.vue"),
      meta: { title: "日志检索" },
    },
    {
      path: "/apps",
      name: "apps",
      component: () => import("../views/AppsView.vue"),
      meta: { title: "应用实例" },
    },
    {
      path: "/stats",
      name: "stats",
      component: () => import("../views/StatsView.vue"),
      meta: { title: "统计概览" },
    },
    { path: "/:pathMatch(.*)*", redirect: "/console" },
  ],
});

router.afterEach((to) => {
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} · 日志控制台` : "日志控制台";
});
