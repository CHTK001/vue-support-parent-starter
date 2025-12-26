import { $t } from "@repo/config";

export default [
  {
    path: "/monitor-system",
    name: "monitorSystem",
    meta: {
      icon: "ep:monitor",
      title: "任务管理",
      showLink: true,
      rank: 2,
    },
    children: [
      {
        path: "/app",
        name: "app",
        meta: {
          icon: "line-md:bell-twotone-loop",
          title: "项目管理",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/app-list",
            name: "app-list",
            component: () => import("@/views/app/index.vue"),
            meta: {
              icon: "line-md:bell-twotone-loop",
              title: $t("buttons.monitor.app-list"),
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
      {
        path: "/job-monitor",
        name: "jobMonitor",
        meta: {
          icon: "line-md:bell-twotone-loop",
          title: "调度任务",
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
        path: "/spider-management",
        name: "spiderManagement",
        meta: {
          icon: "ri:bug-2-line",
          title: "爬虫管理",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/spider-list",
            name: "spider-list",
            component: () => import("@/views/spider/index.vue"),
            meta: {
              icon: "ri:spider-line",
              title: "爬虫任务",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
      {
        path: "/config-management",
        name: "configManagement",
        meta: {
          icon: "ri:settings-4-line",
          title: "配置管理",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/config-list",
            name: "config-list",
            component: () => import("@/views/config-management/index.vue"),
            meta: {
              icon: "ri:list-settings-line",
              title: "配置列表",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
    ],
  },
];
