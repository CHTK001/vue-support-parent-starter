import { $t } from "@repo/config";

export default [
  {
    path: "/monitor-system",
    name: "monitorSystem",
    meta: {
      icon: "ep:monitor",
      title: "监控系统",
      showLink: true,
      rank: 1
    },
    children: [
      {
        path: "/service-monitor",
        name: "serviceMonitor",
        meta: {
          icon: "ep:service",
          title: "服务监控",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/service-list",
            name: "service-list",
            component: () => import("@/views/monitor/service/app/index.vue"),
            meta: {
              icon: "ri:navigation-fill",
              title: $t("buttons.monitor.service-list"),
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/online-service-list",
            name: "online-service-list",
            component: () => import("@/views/monitor/service/online/index.vue"),
            meta: {
              icon: "simple-icons:cloudflare",
              title: $t("buttons.monitor.online-service-list"),
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/online-monitor",
            name: "online-monitor",
            component: () => import("@/views/monitor/service/online/index.vue"),
            meta: {
              icon: "simple-icons:cloudflare",
              title: "在线监控详情",
              showLink: false,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/job-monitor",
        name: "jobMonitor",
        meta: {
          icon: "line-md:bell-twotone-loop",
          title: "任务监控",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/job-list",
            name: "job-list",
            component: () => import("@/views/monitor/job/info/index.vue"),
            meta: {
              icon: "line-md:bell-twotone-loop",
              title: $t("buttons.monitor.job-list"),
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/job-log",
            name: "job-log",
            component: () => import("@/views/monitor/job/log/index.vue"),
            meta: {
              icon: "simple-icons:logmein",
              title: $t("buttons.monitor.job-log"),
              showLink: true,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/server-monitor",
        name: "serverMonitor",
        meta: {
          icon: "ri:server-line",
          title: "服务器监控",
          showLink: true,
          showParent: true
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
              showParent: true
            }
          },

          {
            path: "/server/file-upload",
            name: "serverFileUpload",
            component: () => import("@/views/server/file-upload/index.vue"),
            meta: {
              icon: "ri:upload-cloud-line",
              title: "文件上传管理",
              showLink: true,
              showParent: true
            }
          }
        ]
      }
    ]
  }
];
