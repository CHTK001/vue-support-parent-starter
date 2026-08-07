import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";

/**
 * 路由表。
 *
 * <p>所有页面挂在 MainLayout 下，统一侧边栏 + 顶栏。</p>
 */
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", redirect: "/definitions" },
      {
        path: "definitions",
        name: "Definitions",
        component: () => import("@/views/definitions/DefinitionsView.vue"),
        meta: { title: "爬虫定义", icon: "Setting" },
      },
      {
        path: "proxy-pools",
        name: "ProxyPools",
        component: () => import("@/views/proxy-pools/ProxyPoolsView.vue"),
        meta: { title: "代理池", icon: "Connection" },
      },
      {
        path: "executions",
        name: "Executions",
        component: () => import("@/views/executions/ExecutionsView.vue"),
        meta: { title: "执行记录", icon: "List" },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
