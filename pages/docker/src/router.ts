import type { RouteRecordRaw } from "vue-router";
import { RouterView } from "vue-router";

/**
 * Docker 路由定义（ScLayout 路由模式）。
 */
const routes = [
  {
    path: "/",
    name: "DockerLayout",
    component: async () => import("@layout/default"),
    redirect: "/docker/install",
    meta: {
      title: "Docker 工作台",
      showLink: false,
    },
    children: [
      {
        path: "/docker",
        name: "DockerManagement",
        component: RouterView,
        redirect: "/docker/install",
        meta: {
          title: "Docker 管理",
          icon: "mdi:docker",
          rank: 8,
        },
        children: [
          {
            path: "/docker/install",
            name: "DockerInstall",
            component: async () => {
              const { DockerInstallPage } = await import("./index");
              return DockerInstallPage;
            },
            meta: {
              title: "安装向导",
              icon: "mdi:tray-arrow-down",
            },
          },
        ],
      },
    ],
  },
] satisfies Array<RouteRecordRaw>;

export default routes;

