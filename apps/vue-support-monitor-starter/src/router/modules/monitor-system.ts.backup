import { $t } from "@repo/config";

export default [
  {
    path: "/server-manager",
    name: "serverManager",
    meta: {
      icon: "ri:server-line",
      title: "服务器管理",
      showLink: true,
      showParent: true,
    },
    children: [
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
      // {
      //   path: "/server-config",
      //   name: "serverConcofg",
      //   meta: {
      //     icon: "ri:server-line",
      //     title: "服务器配置",
      //     showLink: true,
      //     showParent: true,
      //   },
      //   children: [
      //     {
      //       path: "/server/alert/push-template",
      //       name: "alertPushTemplate",
      //       component: () => import("@/views/alert/push-template/index.vue"),
      //       meta: {
      //         icon: "ri:mail-settings-line",
      //         title: "告警推送模板",
      //         showLink: true,
      //         showParent: true,
      //       },
      //     },
      //     {
      //       path: "/server/alert/push-config",
      //       name: "alertPushConfig",
      //       component: () => import("@/views/alert/push-config/index.vue"),
      //       meta: {
      //         icon: "ri:notification-2-line",
      //         title: "告警推送配置",
      //         showLink: true,
      //         showParent: true,
      //       },
      //     },
      //   ],
      // },
      {
        path: "/server-soft",
        name: "serverSoft",
        meta: {
          icon: "ri:server-line",
          title: "软件管理",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/soft/index",
            name: "softIndex",
            component: () => import("@/views/soft/index.vue"),
            meta: {
              icon: "ri:apps-2-line",
              title: "软件管理",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/soft/detail/:id",
            name: "softDetail",
            component: () => import("@/views/soft/detail.vue"),
            meta: {
              icon: "ri:app-store-line",
              title: "软件详情",
              showLink: false,
              showParent: true,
            },
          },
          {
            path: "/soft/records",
            name: "softRecords",
            component: () => import("@/views/soft/records.vue"),
            meta: {
              icon: "ri:history-line",
              title: "安装记录",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/soft/containers",
            name: "softContainers",
            component: () => import("@/views/soft/containers.vue"),
            meta: {
              icon: "ri:container-line",
              title: "容器管理",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
    ],
  },
];
