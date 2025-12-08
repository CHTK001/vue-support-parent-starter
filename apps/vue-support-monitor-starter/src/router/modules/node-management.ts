/**
 * 节点管理路由配置
 *
 * @author CH
 * @since 2025-12-08
 */

export default [
  {
    path: "/node-manager",
    name: "nodeManager",
    meta: {
      icon: "ri:node-tree",
      title: "节点管理",
      showLink: true,
      showParent: true,
      rank: 1,
    },
    children: [
      {
        path: "/node/online",
        name: "nodeOnline",
        component: () => import("@/views/node-management/index.vue"),
        meta: {
          icon: "ri:node-tree",
          title: "在线节点",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
