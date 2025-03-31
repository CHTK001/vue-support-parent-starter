export default [
  {
    path: "/tool-tool",
    name: "tool-tool",
    meta: {
      icon: "ep:service",
      title: "工具管理",
      showLink: true,
    },
    children: [
      {
        path: "/tool-normal",
        name: "tool-normal",
        meta: {
          icon: "ri:tools-fill",
          title: "常用",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/json",
            name: "json",
            component: () => import("@pages/tools/json.vue"),
            meta: {
              title: "Json 编解码工具",
              icon: "ri:tools-fill",
              description: "编码和解码文本、图片和文件",
              category: "开发工具",
            },
          },
          {
            path: "/xml",
            name: "xml",
            component: () => import("@pages/tools/xml.vue"),
            meta: {
              title: "XML处理工具",
              icon: "ri:code-box-line",
              description: "格式化、压缩、验证XML，支持XML与JSON互转，XPath查询等功能",
              category: "开发工具",
            },
          },
          {
            path: "/markdown",
            name: "markdown",
            component: () => import("@pages/markdown/index.vue"),
            meta: {
              title: "Markdown编辑器",
              icon: "ri:markdown-line",
              description: "实时编辑与预览Markdown文档",
              category: "文档工具",
            },
          },
          {
            path: "/tool-random-generator",
            name: "tool-random-generator",
            component: () => import("@pages/tools/random-generator.vue"),
            meta: {
              icon: "ri:shuffle-line",
              title: "随机生成器",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-ip-calculator",
            name: "tool-ip-calculator",
            component: () => import("@pages/tools/ip-calculator.vue"),
            meta: {
              icon: "ri:global-line",
              title: "IP网络计算器",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-sql-params",
            name: "tool-sql-params",
            component: () => import("@pages/tools/sql-params.vue"),
            meta: {
              icon: "ri:database-2-line",
              title: "SQL参数填充",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
      {
        path: "/tool-check",
        name: "tool-check",
        meta: {
          icon: "ri:check-line",
          title: "校验",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/text-diff",
            name: "text-diff",
            component: () => import("@pages/tools/text-diff.vue"),
            meta: {
              title: "文本对比工具",
              icon: "ri:contrast-2-line",
              description: "比较两段文本或代码，高亮显示差异",
              category: "开发工具",
            },
          },
          {
            path: "/tools/regex",
            name: "Regex",
            component: () => import("@pages/tools/regex.vue"),
            meta: {
              title: "正则表达式工具",
              icon: "ri:code-box-line",
              rank: 5,
            },
          },
          {
            path: "/tool-crontab",
            name: "tool-crontab",
            component: () => import("@pages/tools/crontab.vue"),
            meta: {
              icon: "ri:time-line",
              title: "crontab",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-aes",
            name: "tool-aes",
            component: () => import("@pages/tools/aes.vue"),
            meta: {
              icon: "ri:lock-line",
              title: "AES加解密",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
      {
        path: "/tool-codec",
        name: "tool-codec",
        meta: {
          icon: "ri:lock-line",
          title: "编解码",
          showLink: true,
          showParent: true,
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
              showParent: true,
            },
          },
          {
            path: "/tool-hexedit",
            name: "tool-hexedit",
            component: () => import("@pages/tools/hexedit.vue"),
            meta: {
              icon: "ri:code-box-line",
              title: "十六进制编辑器",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/base64",
            name: "Base64",
            component: () => import("@pages/tools/base64.vue"),
            meta: {
              title: "Base64 编解码工具",
              icon: "ri:lock-line",
              description: "编码和解码文本、图片和文件",
              category: "开发工具",
            },
          },
          {
            path: "/tools/jwt",
            name: "JWT",
            component: () => import("@pages/tools/jwt.vue"),
            meta: {
              title: "JWT 工具",
              icon: "ri:key-line",
            },
          },
          {
            path: "/tool-vip",
            name: "tool-vip",
            component: () => import("@pages/tools/vip.vue"),
            meta: {
              icon: "ri:video-line",
              title: "VIP视频解析",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
      {
        path: "/tool-translate",
        name: "tool-translate",
        meta: {
          icon: "ri:navigation-fill",
          title: "转换",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/base-converter",
            name: "base-converter",
            component: () => import("@pages/tools/base-converter.vue"),
            meta: {
              title: "进制转换工具",
              icon: "ri:exchange-line",
            },
          },
          {
            path: "/tool-unit-converter",
            name: "tool-unit-converter",
            component: () => import("@pages/tools/unit-converter.vue"),
            meta: {
              icon: "ri:scales-line",
              title: "单位换算",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-qrcode",
            name: "tool-qrcode",
            component: () => import("@pages/tools/qrcode.vue"),
            meta: {
              icon: "ri:qr-code-line",
              title: "二维码工具",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-ph",
            name: "tool-ph",
            component: () => import("@/views/tool/image/phantom.vue"),
            meta: {
              icon: "ri:navigation-fill",
              title: "幻影合成",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-time",
            name: "tool-time",
            component: () => import("@pages/tools/time.vue"),
            meta: {
              icon: "ri:time-line",
              title: "时间解析",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-ip",
            name: "tool-ip",
            component: () => import("@pages/tools/ip.vue"),
            meta: {
              icon: "ri:global-line",
              title: "IP解析",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
      {
        path: "/tool-others",
        name: "tool-others",
        meta: {
          icon: "ri:tools-line",
          title: "其它",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/tool-postman",
            name: "tool-postman",
            component: () => import("@pages/tools/postman.vue"),
            meta: {
              icon: "simple-icons:postman",
              title: "postman",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "/tool-email",
            name: "tool-email",
            component: () => import("@pages/email/index.vue"),
            meta: {
              icon: "simple-icons:postman",
              title: "邮箱管家",
              showLink: true,
              showParent: true,
            },
          },
          {
            path: "video-search",
            name: "VideoSearch",
            component: () => import("@pages/tools/video/index.vue"),
            meta: {
              title: "视频搜索",
              icon: "ri:video-line",
            },
          },
          {
            path: "music-search",
            name: "MusicSearch",
            component: () => import("@pages/tools/music/index.vue"),
            meta: {
              title: "音乐搜索",
              icon: "ri:video-line",
            },
          },
        ],
      },
    ],
  },
];
