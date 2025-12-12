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
      {
        path: "/node/trace-history",
        name: "nodeTraceHistory",
        component: () =>
          import("@/views/node-management/module/trace-history/index.vue"),
        meta: {
          icon: "ri:route-line",
          title: "历史链路追踪",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/node/service-topology",
        name: "nodeServiceTopology",
        component: () =>
          import("@/views/node-management/module/service-topology/index.vue"),
        meta: {
          icon: "ri:share-line",
          title: "服务关系图谱",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/node/file-handles",
        name: "nodeFileHandles",
        component: () =>
          import("@/views/node-management/module/file-handles/index.vue"),
        meta: {
          icon: "ri:file-list-line",
          title: "文件句柄监控",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
