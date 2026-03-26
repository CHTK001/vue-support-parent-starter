export default [
  {
    path: "/proxy-management",
    name: "proxyManagement",
    meta: {
      icon: "ri:share-forward-box-line",
      title: "代理编排",
      showLink: true,
      rank: 4,
    },
    children: [
      {
        path: "/proxy/management",
        name: "proxyManagementIndex",
        component: () => import("@/views/proxy-management/index.vue"),
        meta: {
          icon: "ri:route-line",
          title: "代理编排",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
