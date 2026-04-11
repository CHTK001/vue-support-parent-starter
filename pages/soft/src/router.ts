import type { RouteRecordRaw } from "vue-router";
import { RouterView } from "vue-router";

const routes = [
  {
    path: "/",
    name: "SoftLayout",
    component: async () => import("@layout/default"),
    redirect: "/soft/catalog",
    meta: {
      title: "软件工作台",
      showLink: false,
    },
    children: [
      {
        path: "/soft",
        name: "SoftManagement",
        component: RouterView,
        redirect: "/soft/catalog",
        meta: {
          title: "软件管理",
          icon: "mdi:application-cog-outline",
          rank: 7,
        },
        children: [
          {
            path: "/soft/catalog",
            name: "SoftCatalog",
            component: async () => {
              const { SoftCatalogPage } = await import("./index");
              return SoftCatalogPage;
            },
            meta: {
              title: "软件目录",
              icon: "mdi:view-grid-outline",
            },
          },
          {
            path: "/soft/repositories",
            name: "SoftRepositories",
            component: async () => {
              const { SoftRepositoryPage } = await import("./index");
              return SoftRepositoryPage;
            },
            meta: {
              title: "仓库管理",
              icon: "mdi:database-sync-outline",
            },
          },
          {
            path: "/soft/targets",
            name: "SoftTargets",
            redirect: "/server/list",
            meta: {
              title: "服务器管理",
              icon: "mdi:server-network",
              showLink: false,
            },
          },
          {
            path: "/soft/installations",
            name: "SoftInstallations",
            component: async () => {
              const { SoftInstallationPage } = await import("./index");
              return SoftInstallationPage;
            },
            meta: {
              title: "安装实例",
              icon: "mdi:layers-triple-outline",
            },
          },
          {
            path: "/soft/records",
            name: "SoftRecords",
            component: async () => {
              const { SoftRecordPage } = await import("./index");
              return SoftRecordPage;
            },
            meta: {
              title: "操作记录",
              icon: "mdi:clipboard-text-clock-outline",
            },
          },
          {
            path: "/soft/detail/:id",
            name: "SoftDetail",
            component: async () => {
              const { SoftDetailPage } = await import("./index");
              return SoftDetailPage;
            },
            meta: {
              title: "软件详情",
              showLink: false,
            },
          },
        ],
      },
    ],
  },
] satisfies Array<RouteRecordRaw>;

export default routes;
