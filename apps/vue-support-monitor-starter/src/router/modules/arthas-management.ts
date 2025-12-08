export default [
  {
    path: "/arthas",
    name: "arthasManagement",
    meta: {
      icon: "ri:bug-line",
      title: "Arthas 管理",
      showLink: true,
      rank: 7,
    },
    children: [
      {
        path: "/arthas/management",
        name: "arthasManagementIndex",
        component: () => import("@/views/arthas-managemenet/index.vue"),
        meta: {
          icon: "ri:bug-line",
          title: "Arthas 管理",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
