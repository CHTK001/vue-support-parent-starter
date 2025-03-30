export default [
  {
    path: "/tool-tool",
    name: "tool-tool",
    meta: {
      icon: "ep:service",
      title: "工具管理",
      showLink: true
    },
    children: [
      {
        path: "/tool-normal",
        name: "tool-normal",
        meta: {
          icon: "ri:tools-fill",
          title: "常用",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/json",
            name: "json",
            component: () => import("@repo/pages/tools/json.vue"),
            meta: {
              title: "Json 编解码工具",
              icon: "ri:tools-fill",
              description: "编码和解码文本、图片和文件",
              category: "开发工具"
            }
          }
        ]
      },
      {
        path: "/tool-check",
        name: "tool-check",
        meta: {
          icon: "ri:check-line",
          title: "校验",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/tool-crontab",
            name: "tool-crontab",
            component: () => import("@repo/pages/tools/crontab.vue"),
            meta: {
              icon: "ri:time-line",
              title: "crontab",
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/tool-aes",
            name: "tool-aes",
            component: () => import("@repo/pages/tools/aes.vue"),
            meta: {
              icon: "ri:lock-line",
              title: "AES加解密",
              showLink: true,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/tool-codec",
        name: "tool-codec",
        meta: {
          icon: "ri:lock-line",
          title: "编解码",
          showLink: true,
          showParent: true
        },
        children: [
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
            path: "/tools/jwt",
            name: "JWT",
            component: () => import("@repo/pages/tools/jwt.vue"),
            meta: {
              title: "JWT 工具",
              icon: "ri:key-line"
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
      },
      {
        path: "/tool-translate",
        name: "tool-translate",
        meta: {
          icon: "ri:navigation-fill",
          title: "转换",
          showLink: true,
          showParent: true
        },
        children: [
          {
            path: "/tool-unit-converter",
            name: "tool-unit-converter",
            component: () => import("@repo/pages/tools/unit-converter.vue"),
            meta: {
              icon: "ri:scales-line",
              title: "单位换算",
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/tool-qrcode",
            name: "tool-qrcode",
            component: () => import("@repo/pages/tools/qrcode.vue"),
            meta: {
              icon: "ri:qr-code-line",
              title: "二维码工具",
              showLink: true,
              showParent: true
            }
          },
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
          }
        ]
      }
    ]
  }
];
