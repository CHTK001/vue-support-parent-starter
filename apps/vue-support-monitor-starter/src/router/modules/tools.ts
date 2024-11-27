import { $t } from "@repo/config";

export default [
  {
    path: "/tools",
    name: "tools",
    meta: {
      icon: "ep:setting",
      title: $t("tools.name"),
      showLink: true
    },
    children: [
      {
        path: "/codec",
        name: "codec",
        meta: {
          icon: "ep:setting",
          title: $t("tools.codec.name"),
          showLink: true
        },
        children: [
          {
            path: "/tools-token",
            name: "toolsToken",
            component: () => import("@/views/tools/codec/token.vue"),
            meta: {
              icon: "ep:setting",
              title: $t("tools.codec.token"),
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/tools-uuid",
            name: "toolsUuid",
            component: () => import("@/views/tools/codec/uuid.vue"),
            meta: {
              icon: "ep:setting",
              title: $t("tools.codec.uuid"),
              showLink: true,
              showParent: true
            }
          }
        ]
      },
      {
        path: "/web",
        name: "web",
        meta: {
          icon: "simple-icons:webauthn",
          title: $t("tools.web.name"),
          showLink: true
        },

        children: [
          {
            path: "/tools-web-device",
            name: "toolsWebDevice",
            component: () => import("@/views/tools/web/device.vue"),
            meta: {
              icon: "ri:device-recover-line",
              title: $t("tools.web.device"),
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/tools-web-qr",
            name: "toolsWebQr",
            component: () => import("@/views/tools/web/qrcode.vue"),
            meta: {
              icon: "ri:qr-code-line",
              title: $t("tools.web.qrcode"),
              showLink: true,
              showParent: true
            }
          },
          {
            path: "/tools-web-crontab",
            name: "toolsWebCrontabl",
            component: () => import("@/views/tools/web/crontab.vue"),
            meta: {
              icon: "ep:clock",
              title: $t("tools.web.crontab"),
              showLink: true,
              showParent: true
            }
          }
        ]
      }
    ]
  }
];
