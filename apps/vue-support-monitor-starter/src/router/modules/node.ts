import { $t } from "@/plugins/i18n";

export default [
  {
    path: "/node",
    redirect: "/node/list",
    meta: {
      icon: "ri:node-tree",
      title: "节点管理",
      rank: 3,
    },
    children: [
      {
        path: "/node/list",
        name: "node-list",
        component: () => import("@/views/node/list.vue"),
        meta: {
          icon: "ri:node-tree",
          title: "节点列表",
          showParent: true,
        },
      },
      {
        path: "/node/search",
        name: "node-search",
        component: () => import("@/views/node/search.vue"),
        meta: {
          icon: "ri:projector-line",
          title: "项目管理",
        },
      },
      {
        path: "/node/script-all",
        name: "node-script-list-all",
        component: () => import("@/views/node/script-list.vue"),
        meta: {
          icon: "ri:tools-line",
          title: "节点脚本列表",
        },
      },
      {
        path: "/node/script-edit",
        name: "node-script-edit",
        component: () => import("@/views/node/script-edit.vue"),
        meta: {
          icon: "ri:edit-line",
          title: "脚本编辑",
          showLink: false,
        },
      },
      {
        path: "/node/fast-install",
        name: "node-fast-install",
        component: () => import("@/views/node/fast-install.vue"),
        meta: {
          icon: "ri:download-line",
          title: "快速安装",
          showLink: false,
        },
      },
      {
        path: "/node/func",
        name: "node-func",
        component: () => import("@/views/node/node-func.vue"),
        meta: {
          icon: "ri:function-line",
          title: "节点功能",
          showLink: false,
        },
      },
    ],
  },
];
