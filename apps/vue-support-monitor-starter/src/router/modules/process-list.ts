export default [
  {
    path: "/process/index",
    name: "processIndex",
    meta: {
      icon: "ep:service",
      title: "进程监控",
      showLink: true,
    },
    children: [
      {
        path: "/process-list",
        name: "process-list",
        component: () => import("@/views/process/index.vue"),
        meta: {
          icon: "ri:navigation-fill",
          title: "进程监控",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
