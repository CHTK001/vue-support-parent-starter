import { $t } from "@repo/config";

export default [
  {
    path: "/sync-management",
    name: "syncManagementParent",
    meta: {
      icon: "ri:arrow-left-right-line",
      title: "同步任务",
      showLink: true,
      rank: 9,
    },
    children: [
      {
        path: "/sync/management",
        name: "SyncManagement",
        component: () => import("@/views/sync-management/index.vue"),
        meta: {
          icon: "ri:list-check",
          title: "任务列表",
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
