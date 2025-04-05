import type { RouteRecordRaw } from "vue-router";
import Tools from "./index.vue";

// 工具箱主页路由
const toolsRoutes: RouteRecordRaw[] = [
  {
    path: "/tools",
    name: "tools",
    component: Tools,
    meta: {
      title: "在线工具箱",
      icon: "ri:tools-fill",
    },
  },
  // 工具插件路由
  {
    path: "/tools/index/:id",
    name: "tools-plugin",
    component: Tools,
    props: true,
    meta: {
      title: "工具详情",
      icon: "ri:tools-fill",
    },
  },
];

export default toolsRoutes; 