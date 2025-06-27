import { $t } from "@repo/config";

export default [
  {
    path: "/infrastructure",
    name: "infrastructure",
    meta: {
      icon: "ri:building-line",
      title: "基础设施",
      showLink: true,
      rank: 2
    },
    children: [
      {
        path: "/web-services",
        name: "webServices",
        meta: {
          icon: "simple-icons:nginx",
          title: "Web服务",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/nginx-config",
            name: "nginx-config",
            component: () => import("@/views/monitor/nginx/index.vue"),
            meta: {
              icon: "simple-icons:nginx",
              title: "Nginx配置",
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/proxy/index",
            name: "proxyIndex",
            component: () => import("@/views/monitor/proxy/index.vue"),
            meta: {
              icon: "ri:product-hunt-fill",
              title: $t("buttons.monitor.proxy"),
              showLink: true,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/storage-services",
        name: "storageServices",
        meta: {
          icon: "simple-icons:databricks",
          title: "存储服务",
          showLink: true,
          showParent: true
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
              showParent: true
            }
          },
          {
            path: "/monitor/config",
            name: "monitorConfig",
            component: () => import("@/views/monitor/config/index.vue"),
            meta: {
              icon: "ri:settings-3-line",
              title: "监控配置",
              showLink: false,
              showParent: true
            }
          },
          {
            path: "/oss/index",
            name: "ossIndex",
            component: () => import("@/views/monitor/oss/index.vue"),
            meta: {
              icon: "simple-icons:minio",
              title: $t("buttons.monitor.oss"),
              showLink: true,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/security-services",
        name: "securityServices",
        meta: {
          icon: "simple-icons:parrotsecurity",
          title: "安全服务",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/protection/manager",
            name: "protectionManager",
            component: () => import("@/views/monitor/protection/index.vue"),
            meta: {
              icon: "ri:shield-check-line",
              title: $t("buttons.monitor.protection"),
              showLink: true,
              showParent: true
            }
          }
        ]
      }
    ]
  }
];
