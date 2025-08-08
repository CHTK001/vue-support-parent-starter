import { $t } from "@repo/config";

export default [
  {
    path: "/service-management",
    name: "serviceManagement",
    meta: {
      icon: "ri:service-line",
      title: "服务管理",
      showLink: true,
      rank: 2,
    },
    children: [
      {
        path: "/service/management",
        name: "serviceManagementIndex",
        component: () => import("@/views/service-management/index.vue"),
        meta: {
          icon: "ri:settings-3-line",
          title: "服务管理",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
