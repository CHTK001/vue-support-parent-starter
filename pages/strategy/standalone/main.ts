import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { useElementPlus } from "@repo/plugins";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import App from "./App.vue";

// 路由配置
const routes = [
  {
    path: "/",
    redirect: "/limit",
  },
  {
    path: "/limit",
    name: "LimitConfiguration",
    component: () => import("../src/views/limit/LimitConfigurationIndex.vue"),
    meta: { title: "限流配置" },
  },
  {
    path: "/limit-record",
    name: "LimitRecord",
    component: () => import("../src/views/limit/LimitRecordIndex.vue"),
    meta: { title: "限流记录" },
  },
];

// 创建路由
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 创建应用
const app = createApp(App);

// 使用插件
app.use(useElementPlus);
app.use(router);

// 挂载应用
app.mount("#app");
