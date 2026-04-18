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
    redirect: "/docker/home",
    meta: {
      title: "Docker 工作台",
      showLink: false,
    },
    children: [
      {
        path: "/docker",
        name: "DockerManagement",
        component: RouterView,
        redirect: "/docker/home",
        meta: {
          title: "Docker 管理",
          icon: "mdi:docker",
          rank: 8,
        },
        children: [
          {
            path: "/docker/home",
            name: "DockerHome",
            component: async () => {
              const { DockerHomePage } = await import("./index");
              return DockerHomePage;
            },
            meta: {
              title: "工作台",
              icon: "mdi:view-dashboard-outline",
            },
          },
          {
            path: "/docker/connections",
            name: "DockerConnections",
            component: async () => {
              const { DockerConnectionPage } = await import("./index");
              return DockerConnectionPage;
            },
            meta: {
              title: "连接配置",
              icon: "mdi:lan-connect",
            },
          },
          {
            path: "/docker/sync",
            name: "DockerSync",
            component: async () => {
              const { DockerSyncPage } = await import("./index");
              return DockerSyncPage;
            },
            meta: {
              title: "同步中心",
              icon: "mdi:sync",
            },
          },
          {
            path: "/docker/registries",
            name: "DockerRegistries",
            component: async () => {
              const { DockerRegistryPage } = await import("./index");
              return DockerRegistryPage;
            },
            meta: {
              title: "仓库管理",
              icon: "mdi:database-outline",
            },
          },
          {
            path: "/docker/mounts",
            name: "DockerMounts",
            component: async () => {
              const { DockerMountPage } = await import("./index");
              return DockerMountPage;
            },
            meta: {
              title: "挂载管理",
              icon: "mdi:folder-open-outline",
            },
          },
          {
            path: "/docker/networks",
            name: "DockerNetworks",
            component: async () => {
              const { DockerNetworkPage } = await import("./index");
              return DockerNetworkPage;
            },
            meta: {
              title: "网络管理",
              icon: "mdi:lan",
            },
          },
          {
            path: "/docker/containers",
            name: "DockerContainers",
            component: async () => {
              const { DockerContainerPage } = await import("./index");
              return DockerContainerPage;
            },
            meta: {
              title: "容器管理",
              icon: "mdi:package-variant-closed",
            },
          },
          {
            path: "/docker/images",
            name: "DockerImages",
            component: async () => {
              const { DockerImagePage } = await import("./index");
              return DockerImagePage;
            },
            meta: {
              title: "镜像管理",
              icon: "mdi:image-outline",
            },
          },
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
