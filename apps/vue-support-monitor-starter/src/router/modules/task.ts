import { t as $t } from "@repo/config";

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
            component: async () => {
              const module = await import("@pages/job");
              return module.JobAppIndex;
            },
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
            component: async () => {
              const module = await import("@pages/job");
              return module.JobIndex;
            },
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
            component: async () => {
              const module = await import("@pages/job");
              return module.JobLogIndex;
            },
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
        redirect: "/spider",
        meta: {
          icon: "ri:bug-2-line",
          title: "爬虫管理",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/spider",
            alias: ["/spider-list"],
            name: "spider-list",
            component: () => import("@/views/spider/index.vue"),
            meta: {
              icon: "ri:spider-line",
              title: "爬虫任务",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/spider/design/:taskId",
            name: "spider-design",
            component: () => import("@/views/spider/design/index.vue"),
            meta: {
              icon: "ri:flow-chart",
              title: "流程设计",
              showLink: false,
              showParent: false,
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
