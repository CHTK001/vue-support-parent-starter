import { $t } from "@repo/config";

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
      }
    ]
  }
];
