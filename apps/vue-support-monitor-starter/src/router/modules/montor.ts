import { $t } from "@repo/config";

export default [
  {
    path: "/service",
    name: "service",
    meta: {
      icon: "ep:service",
      title: $t("buttons.monitor.service"),
      showLink: true,
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
          showParent: true,
        },
      },

      {
        path: "/online-service-list",
        name: "online-service-list",
        component: () => import("@/views/monitor/service/online/index.vue"),
        meta: {
          icon: "simple-icons:cloudflare",
          title: $t("buttons.monitor.online-service-list"),
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/online-monitor",
        name: "online-monitor",
        component: () => import("@/views/monitor/service/online/index.vue"),
        meta: {
          icon: "simple-icons:cloudflare",
          title: $t("buttons.monitor.online-service-list"),
          showLink: false,
          showParent: true,
        },
      },
    ],
  },
  {
    path: "/job",
    name: "job",
    meta: {
      icon: "line-md:bell-twotone-loop",
      title: $t("buttons.monitor.job"),
      showLink: true,
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
          showParent: true,
        },
      },
      {
        path: "/job-log",
        name: "job-log",
        component: () => import("@/views/monitor/job/log/index.vue"),
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
    path: "/proxy",
    name: "proxy",
    meta: {
      icon: "ri:product-hunt-fill",
      title: $t("buttons.monitor.proxy"),
      showLink: true,
    },
    children: [
      {
        path: "/proxy/index",
        name: "proxyIndex",
        component: () => import("@/views/monitor/proxy/index.vue"),
        meta: {
          icon: "ri:settings-6-line",
          title: $t("buttons.monitor.proxy"),
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
  {
    path: "/oss",
    name: "oss",
    meta: {
      icon: "simple-icons:observable",
      title: $t("buttons.monitor.oss"),
      showLink: true,
    },
    children: [
      {
        path: "/oss/index",
        name: "ossIndex",
        component: () => import("@/views/monitor/oss/index.vue"),
        meta: {
          icon: "simple-icons:minio",
          title: $t("buttons.monitor.oss"),
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
  {
    path: "/database",
    name: "database",
    meta: {
      icon: "simple-icons:databricks",
      title: $t("buttons.monitor.database"),
      showLink: true,
    },
    children: [
      {
        path: "/database/index",
        name: "databaseIndex",
        component: () => import("@/views/monitor/gen/index.vue"),
        meta: {
          icon: "ri:database-2-line",
          title: $t("buttons.monitor.database-tools"),
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
