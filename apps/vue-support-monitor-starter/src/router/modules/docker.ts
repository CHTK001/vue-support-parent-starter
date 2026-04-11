import type { RouteRecordRaw } from "vue-router";

const dockerRoutes: RouteRecordRaw[] = [
  {
    path: "/docker",
    redirect: "/docker/containers",
    name: "Docker",
    meta: {
      title: "Docker管理",
      icon: "logos:docker-icon",
      alwaysShow: true,
      rank: 6,
    },
    children: [
      {
        path: "/docker/containers",
        alias: ["/docker/list"],
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
        path: "/docker/monitoring",
        component: () => import("@/views/docker/monitoring/index.vue"),
        name: "DockerMonitoring",
        meta: {
          title: "容器监控",
          icon: "mdi:chart-timeline-variant",
        },
      },
    ],
  },
];

export default dockerRoutes;
