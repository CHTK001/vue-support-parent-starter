import type { RouteRecordRaw } from "vue-router";
import { RouterView } from "vue-router";

const routes = [
  {
    path: "/",
    name: "ServerLayout",
    component: async () => import("@layout/default"),
    redirect: "/server/list",
    meta: {
      title: "服务器工作台",
      showLink: false,
    },
    children: [
      {
        path: "/server",
        name: "ServerManagement",
        component: RouterView,
        redirect: "/server/list",
        meta: {
          title: "服务器管理",
          icon: "mdi:server-network-outline",
          rank: 6,
        },
        children: [
          {
            path: "/server/list",
            name: "ServerHostList",
            component: async () => {
              const { ServerHostPage } = await import("./index");
              return ServerHostPage;
            },
            meta: {
              title: "服务器列表",
              icon: "mdi:view-dashboard-outline",
            },
          },
          {
            path: "/server/techui",
            name: "ServerTechDashboard",
            component: async () =>
              import("./views/ServerTechDashboardPage.vue"),
            meta: {
              title: "服务器大屏",
              showLink: false,
              activePath: "/server/list",
            },
          },
          {
            path: "/server/techui/aggregate",
            name: "ServerAggregateDashboard",
            component: async () =>
              import("./views/ServerAggregateDashboardPage.vue"),
            meta: {
              title: "聚合大屏",
              showLink: false,
              activePath: "/server/list",
            },
          },
          {
            path: "/server/projects",
            name: "ServerProjectManagement",
            component: async () =>
              import("./views/ServerProjectManagementPage.vue"),
            meta: {
              title: "项目管理",
              icon: "mdi:folder-cog-outline",
              activePath: "/server/list",
            },
          },
        ],
      },
    ],
  },
] satisfies Array<RouteRecordRaw>;

export default routes;
