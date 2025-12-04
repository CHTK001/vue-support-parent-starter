import { $t } from "@repo/config";

export default [
  {
    path: "/data-management",
    name: "dataManagement",
    meta: {
      icon: "ri:database-2-line",
      title: "数据管理",
      showLink: true,
      rank: 3,
    },
    children: [
      {
        path: "/data/management",
        name: "dataManagementIndex",
        component: () => import("@/views/data-management/index.vue"),
        meta: {
          icon: "ri:database-line",
          title: "数据管理",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
