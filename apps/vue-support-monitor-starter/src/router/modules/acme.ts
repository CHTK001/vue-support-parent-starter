/**
 * ACME 证书管理路由
 *
 * @author CH
 * @since 2025-12-06
 */

export default [
  {
    path: "/security",
    name: "security",
    meta: {
      icon: "mdi:shield-lock",
      title: "安全管理",
      showLink: true,
      rank: 5,
    },
    children: [
      {
        path: "/acme",
        name: "acme",
        meta: {
          icon: "mdi:certificate",
          title: "证书管理",
          showLink: true,
          showParent: true,
        },
        children: [
          {
            path: "/acme-list",
            name: "acme-list",
            component: () => import("@/views/acme/index.vue"),
            meta: {
              icon: "mdi:certificate-outline",
              title: "ACME证书",
              showLink: true,
              showParent: true,
            },
          },
        ],
      },
    ],
  },
];
