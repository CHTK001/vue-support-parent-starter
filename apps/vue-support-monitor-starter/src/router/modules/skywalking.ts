export default [
  {
    path: "/skywalking",
    name: "skywalking",
    meta: {
      icon: "ri:cloud-line",
      title: "SkyWalking",
      showLink: true,
      rank: 15,
    },
    children: [
      {
        path: "/skywalking/dashboard",
        name: "skywalkingDashboard",
        component: () => import("@/views/skywalking/dashboard/index.vue"),
        meta: {
          icon: "ri:dashboard-3-line",
          title: "仪表盘",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/skywalking/config",
        name: "skywalkingConfig",
        component: () => import("@/views/skywalking/config/index.vue"),
        meta: {
          icon: "ri:settings-3-line",
          title: "配置管理",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/skywalking/trace",
        name: "skywalkingTrace",
        component: () => import("@/views/skywalking/trace/index.vue"),
        meta: {
          icon: "ri:route-line",
          title: "链路追踪",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/skywalking/trace/:traceId",
        name: "skywalkingTraceDetail",
        component: () => import("@/views/skywalking/trace/detail.vue"),
        meta: {
          icon: "ri:route-line",
          title: "链路详情",
          showLink: false,
          showParent: true,
        },
      },
      {
        path: "/skywalking/topology",
        name: "skywalkingTopology",
        component: () => import("@/views/skywalking/topology/index.vue"),
        meta: {
          icon: "ri:mind-map",
          title: "服务拓扑",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/skywalking/service",
        name: "skywalkingService",
        component: () => import("@/views/skywalking/service/index.vue"),
        meta: {
          icon: "ri:server-line",
          title: "服务列表",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/skywalking/alarm",
        name: "skywalkingAlarm",
        component: () => import("@/views/skywalking/alarm/index.vue"),
        meta: {
          icon: "ri:alarm-warning-line",
          title: "告警管理",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
