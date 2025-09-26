import { RouteRecordRaw } from "vue-router";

const dockerRoutes: RouteRecordRaw[] = [
  {
    path: "/docker",
    redirect: "/docker/containers",
    name: "Docker",
    meta: {
      title: "Docker管理",
      icon: "ri:container-line",
      alwaysShow: true,
    },
    children: [
      {
        path: "containers",
        component: () => import("@/views/docker/containers/index.vue"),
        name: "DockerContainers",
        meta: {
          title: "容器管理",
          icon: "ri:container-line",
        },
      },
      {
        path: "images",
        component: () => import("@/views/docker/images/index.vue"),
        name: "DockerImages",
        meta: {
          title: "镜像管理",
          icon: "ri:image-line",
        },
      },
      {
        path: "registry",
        component: () => import("@/views/docker/registry/index.vue"),
        name: "DockerRegistry",
        meta: {
          title: "仓库管理",
          icon: "ri:database-2-line",
        },
      },
      {
        path: "monitoring",
        component: () => import("@/views/docker/ContainerMonitoringView.vue"),
        name: "DockerMonitoring",
        meta: {
          title: "容器监控",
          icon: "ri:dashboard-line",
        },
      },
      {
        path: "overview",
        component: () => import("@/views/docker/ContainerOverview.vue"),
        name: "DockerOverview",
        meta: {
          title: "监控总览",
          icon: "ri:bar-chart-line",
        },
      },
    ],
  },
];

export default dockerRoutes;
