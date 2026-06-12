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
      icon: "ep:key",
      title: "安全管理",
      showLink: true,
      rank: 5,
    },
    children: [
      {
        path: "/acme",
        name: "acme",
        meta: {
          icon: "ri:key-2-line",
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
              icon: "ri:key-2-line",
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
