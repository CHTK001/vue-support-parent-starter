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
      },
      {
        path: "/tool-hexedit",
        name: "tool-hexedit",
        component: () => import("@repo/pages/tools/hexedit.vue"),
        meta: {
          icon: "ri:code-box-line",
          title: "十六进制编辑器",
          showLink: true,
          showParent: true
        }
      },
      {
        path: "/base64",
        name: "Base64",
        component: () => import("@repo/pages/tools/base64.vue"),
        meta: {
          title: "Base64 编解码工具",
          icon: "ri:lock-line",
          description: "编码和解码文本、图片和文件",
          category: "开发工具"
        }
      },
      {
        path: "/json",
        name: "json",
        component: () => import("@repo/pages/tools/json.vue"),
        meta: {
          title: "Json 编解码工具",
          icon: "ri:lock-line",
          description: "编码和解码文本、图片和文件",
          category: "开发工具"
        }
      },
      {
        path: "video-search",
        name: "VideoSearch",
        component: () => import("@repo/pages/tools/video-search.vue"),
        meta: {
          title: "视频搜索",
          icon: "ri:video-line"
        }
      },
      {
        path: "magnet-search",
        name: "MagnetSearch",
        component: () => import("@repo/pages/tools/magnet-search.vue"),
        meta: {
          title: "磁力搜索",
          icon: "ri:link-m"
        }
      }
    ]
  }
];
