/**
 * 服务器管理路由 —— 集成 @pages/server 模块
 *
 * @author CH
 * @since 2026-07-28
 */

const loadProjectManagePage = async () =>
  (await import("@pages/project")).ProjectIndex;

export default [
  {
    path: "/server",
    name: "ServerManagement",
    meta: {
      icon: "mdi:server-network-outline",
      title: "服务器管理",
      showLink: true,
      rank: 2,
    },
    children: [
      {
        path: "/server/list",
        name: "ServerHostList",
        component: async () => {
          const { ServerHostPage } = await import("@pages/server");
          return ServerHostPage;
        },
        meta: {
          icon: "mdi:view-dashboard-outline",
          title: "服务器列表",
          showLink: true,
        },
      },
      {
        path: "/server/techui",
        name: "ServerTechDashboard",
        component: async () =>
          import("@pages/server/views/ServerTechDashboardPage.vue"),
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
          import("@pages/server/views/ServerAggregateDashboardPage.vue"),
        meta: {
          title: "聚合大屏",
          showLink: false,
          activePath: "/server/list",
        },
      },
      {
        path: "/server/projects",
        name: "ServerProjectManagement",
        component: loadProjectManagePage,
        meta: {
          title: "项目管理",
          showLink: false,
          activePath: "/server/list",
        },
      },
    ],
  },
];
