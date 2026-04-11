import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/example",
    name: "ExampleIndex",
    component: () => import("../index.vue"),
    meta: {
      title: "组件示例",
      icon: "ri:apps-2-line",
    },
  },
];

export default routes;
