import { $t } from "@repo/config";

export default [
  {
    path: "/server-monitor",
    name: "serverMonitor",
    meta: {
      icon: "ri:server-line",
      title: "服务器监控",
      showLink: true,
      showParent: true,
    },
    children: [
      {
        path: "/server/index",
        name: "serverIndex",
        component: () => import("@/views/server/index.vue"),
        meta: {
          icon: "ri:server-line",
          title: $t("buttons.monitor.server-management"),
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/server/file-system",
        name: "serverFileSystem",
        component: () => import("@/views/file-system/index.vue"),
        meta: {
          icon: "ri:file-list-3-line",
          title: "文件系统管理",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/server/nodes",
        name: "serverNodes",
        component: () => import("@/views/node-management/index.vue"),
        meta: {
          icon: "ri:node-tree",
          title: "在线节点管理",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/server/script-management",
        name: "serverScriptManagement",
        component: () => import("@/views/script-management/index.vue"),
        meta: {
          icon: "ri:code-s-slash-line",
          title: "脚本管理",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
