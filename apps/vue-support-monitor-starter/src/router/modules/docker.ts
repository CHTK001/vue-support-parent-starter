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
        alias: ["/docker/list", "/soft/containers"],
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
        alias: ["/soft", "/soft/index"],
        component: () => import("@/views/docker/soft/index.vue"),
        name: "DockerSoft",
        meta: {
          title: "软件管理",
          icon: "mdi:apps",
        },
      },
      {
        path: "/docker/monitoring",
        alias: ["/soft/monitoring"],
        component: () => import("@/views/docker/monitoring/index.vue"),
        name: "DockerMonitoring",
        meta: {
          title: "容器监控",
          icon: "mdi:chart-timeline-variant",
        },
      },
      {
        path: "/docker/records",
        alias: ["/soft/records"],
        component: () => import("@/views/docker/records/index.vue"),
        name: "DockerRecords",
        meta: {
          title: "安装记录",
          icon: "mdi:history",
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
      {
        path: "/docker/detail/:id",
        alias: ["/soft/detail/:id"],
        component: () => import("@/views/docker/detail/index.vue"),
        name: "DockerDetail",
        meta: {
          title: "软件详情",
          showLink: false,
        },
      },
    ],
  },
];

export default dockerRoutes;
