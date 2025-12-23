import { $t } from "@repo/config";

export default [
  {
    path: "/data-management",
    name: "dataManagement",
    meta: {
      icon: "ri:database-2-line",
      title: "数据管理",
      showLink: true,
      rank: 8,
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
      {
        path: "/sync/management",
        name: "SyncManagement",
        component: () => import("@/views/sync-management/index.vue"),
        meta: {
          icon: "ri:arrow-left-right-line",
          title: "同步任务",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/sync/design/:taskId",
        name: "SyncTaskDesign",
        component: () => import("@/views/sync-management/design.vue"),
        meta: {
          icon: "ri:flow-chart",
          title: "任务设计",
          showLink: false,
          showParent: false,
        },
      },
    ],
  },
];
