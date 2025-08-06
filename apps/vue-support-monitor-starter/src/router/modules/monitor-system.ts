import { $t } from "@repo/config";

export default [
  {
    path: "/monitor-system",
    name: "monitorSystem",
    meta: {
      icon: "ep:monitor",
      title: "监控系统",
      showLink: true,
      rank: 1,
    },
    children: [
      {
        path: "/job-monitor",
        name: "jobMonitor",
        meta: {
          icon: "line-md:bell-twotone-loop",
          title: "任务监控",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/job-list",
            name: "job-list",
            component: () => import("@/views/job/info/index.vue"),
            meta: {
              icon: "line-md:bell-twotone-loop",
              title: $t("buttons.monitor.job-list"),
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/job-log",
            name: "job-log",
            component: () => import("@/views/job/log/index.vue"),
            meta: {
              icon: "simple-icons:logmein",
              title: $t("buttons.monitor.job-log"),
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
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
    ],
  },
];
