import { RouteRecordRaw } from "vue-router";

const dockerRoutes: RouteRecordRaw[] = [
  {
    path: "/docker",
    redirect: "/docker/containers",
    name: "Docker",
    meta: {
      title: "Docker管理",
      icon: "logos:docker-icon",
      alwaysShow: true,
    },
    children: [
      {
        path: "/docker/containers",
        component: () => import("@/views/docker/containers/index.vue"),
        name: "DockerContainers",
        meta: {
          title: "容器管理",
          icon: "mdi:docker",
        },
      },
      {
        path: "/docker/images",
        component: () => import("@/views/docker/images/index.vue"),
        name: "DockerImages",
        meta: {
          title: "镜像管理",
          icon: "mdi:layers-outline",
        },
      },
      {
        path: "/docker/soft",
        component: () => import("@/views/docker/soft/index.vue"),
        name: "DockerSoft",
        meta: {
          title: "软件管理",
          icon: "mdi:apps",
        },
      },
      {
        path: "/docker/registry",
        component: () => import("@/views/docker/registry/index.vue"),
        name: "DockerRegistry",
        meta: {
          title: "仓库管理",
          icon: "mdi:database-outline",
        },
      },
    ],
  },
];

export default dockerRoutes;
