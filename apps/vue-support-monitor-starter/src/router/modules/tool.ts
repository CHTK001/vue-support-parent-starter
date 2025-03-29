export default [
  {
    path: "/tool",
    name: "tool",
    meta: {
      icon: "ep:service",
      title: "工具管理",
      showLink: true
    },
    children: [
      {
        path: "/tool-ph",
        name: "tool-ph",
        component: () => import("@/views/tool/image/phantom.vue"),
        meta: {
          icon: "ri:navigation-fill",
          title: "幻影合成",
          showLink: true,
          showParent: true
        }
      },
      {
        path: "/tool-fanqie",
        name: "tool-fanqie",
        component: () => import("@/views/tool/image/fanqie.vue"),
        meta: {
          icon: "ri:navigation-fill",
          title: "番茄混淆",
          showLink: true,
          showParent: true
        }
      },
      {
        path: "/tool-time",
        name: "tool-time",
        component: () => import("@repo/pages/tools/time.vue"),
        meta: {
          icon: "ri:time-line",
          title: "时间解析",
          showLink: true,
          showParent: true
        }
      },
      {
        path: "/tool-ip",
        name: "tool-ip",
        component: () => import("@repo/pages/tools/ip.vue"),
        meta: {
          icon: "ri:global-line",
          title: "IP解析",
          showLink: true,
          showParent: true
        }
      },
      {
        path: "/tool-vip",
        name: "tool-vip",
        component: () => import("@repo/pages/tools/vip.vue"),
        meta: {
          icon: "ri:video-line",
          title: "VIP视频解析",
          showLink: true,
          showParent: true
        }
      }
    ]
  }
];
