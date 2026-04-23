import type { RouteRecordRaw } from "vue-router";

const redirectToDocker =
  (tab?: string) =>
  (to: { query: Record<string, unknown> }) => ({
    path: "/docker",
    query: {
      ...to.query,
      ...(tab ? { tab } : {}),
    },
  });

/**
 * Docker 路由定义（ScLayout 路由模式）。
 */
const routes = [
  {
    path: "/",
    name: "DockerLayout",
    component: async () => import("@layout/default"),
    redirect: "/docker",
    meta: {
      title: "Docker 工作台",
      showLink: false,
    },
    children: [
      {
        path: "/docker",
        name: "DockerManagement",
        component: async () => {
          const { DockerManagePage } = await import("./index");
          return DockerManagePage;
        },
        meta: {
          title: "Docker 管理",
          icon: "mdi:docker",
          rank: 8,
        },
      },
      {
        path: "/docker/home",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "Docker 工作台",
          showLink: false,
        },
      },
      {
        path: "/docker/connections",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "连接配置",
          showLink: false,
        },
      },
      {
        path: "/docker/sync",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "同步中心",
          showLink: false,
        },
      },
      {
        path: "/docker/registries",
        redirect: redirectToDocker("images"),
        meta: {
          title: "仓库管理",
          showLink: false,
        },
      },
      {
        path: "/docker/mounts",
        redirect: redirectToDocker("mounts"),
        meta: {
          title: "挂载管理",
          showLink: false,
        },
      },
      {
        path: "/docker/networks",
        redirect: redirectToDocker("networks"),
        meta: {
          title: "网络管理",
          showLink: false,
        },
      },
      {
        path: "/docker/containers",
        redirect: redirectToDocker("containers"),
        meta: {
          title: "容器管理",
          showLink: false,
        },
      },
      {
        path: "/docker/images",
        redirect: redirectToDocker("images"),
        meta: {
          title: "镜像管理",
          showLink: false,
        },
      },
      {
        path: "/docker/install",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "安装向导",
          showLink: false,
        },
      },
    ],
  },
] satisfies Array<RouteRecordRaw>;

export default routes;
