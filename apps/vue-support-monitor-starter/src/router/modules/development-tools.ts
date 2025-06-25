import { $t } from "@repo/config";

export default [
  {
    path: "/development-tools",
    name: "developmentTools",
    meta: {
      icon: "ri:tools-line",
      title: "开发工具",
      showLink: true,
      rank: 3
    },
    children: [
      {
        path: "/dev-utilities",
        name: "devUtilities",
        meta: {
          icon: "ri:tools-fill",
          title: "开发工具集",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/tools/index",
            name: "toolsIndex",
            component: () => import("@/views/maintenance/tools/network.vue"),
            meta: {
              title: "开发工具箱",
              icon: "ri:tools-fill",
              category: "开发工具",
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/example/index",
            name: "exampleIndex",
            component: () => import("@/views/server/management.vue"),
            meta: {
              title: "服务器管理示例",
              icon: "ri:server-line",
              category: "开发工具",
              showLink: true,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/software-management",
        name: "softwareManagement",
        meta: {
          icon: "simple-icons:softpedia",
          title: "软件管理",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/soft/index",
            name: "softIndex",
            component: () => import("@/views/soft/index.vue"),
            meta: {
              title: "软件商城",
              icon: "ri:store-2-line",
              category: "软件管理",
              showLink: true,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/system-settings",
        name: "systemSettings",
        meta: {
          icon: "ep:setting",
          title: "系统设置",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/setting-index",
            name: "settingIndex",
            component: () => import("@/views/monitor/proxy/setting/index.vue"),
            meta: {
              icon: "ep:setting",
              rank: 10299,
              title: "系统设置",
              showLink: true,
              showParent: true
            }
          }
        ]
      }
    ]
  }
];
