/**
 * 应用入口 —— 单页面装配
 *
 * 思路（基于 vue-support-system-starter + theme+koi 框架的优点，更轻量化）：
 *   ① 通过 @repo/app 的 createApp 完成业务上下文装配（crypto/config/http/token/router）
 *   ② 传 mountEl: '' 阻止 @repo/app 自动挂载（避免它的 koi layout 接管 DOM）
 *   ③ 自己用 Vue 3 + Element Plus + context.router + 单页面 Layout 创建 SPA
 *   ④ Layout：左侧侧边栏菜单 / 右侧主内容（router-view）
 *   ⑤ 业务路由：Chat / ImageGen / VideoGen，全部挂到 layout 子路由
 *
 * 为什么不复用 @repo/app 的 mountEl：
 *   - koi 主题强制注册 login + layout 两层路由，业务视图只能挂到 layout 下
 *   - 单页面需求下，少一层嵌套更合适：layout + main 两栏即可
 */
import { createApp as createContextApp } from "@repo/app";
import { createApp as createVueApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import ChatView from "./views/Chat.vue";
import ImageGenView from "./views/ImageGen.vue";
import VideoGenView from "./views/VideoGen.vue";
import type { RouteRecordRaw } from "vue-router";

/** 业务路由：均为 layout 子路由 */
const aiRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "ai-root",
    redirect: "/chat",
  },
  {
    path: "/chat",
    name: "ai-chat",
    component: ChatView,
    meta: { title: "AI 对话", icon: "ChatDotRound" },
  },
  {
    path: "/image-gen",
    name: "ai-image-gen",
    component: ImageGenView,
    meta: { title: "文生图", icon: "Picture" },
  },
  {
    path: "/video-gen",
    name: "ai-video-gen",
    component: VideoGenView,
    meta: { title: "文生视频", icon: "VideoCamera" },
  },
];

const context = await createContextApp({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  mode: "router",
  configUrl: "/app.yaml",
  routes: aiRoutes,
  mountEl: "",
});

const app = createVueApp(App);
app.use(ElementPlus);
app.use(context.router);
app.mount("#app");
(window as any).hideAppLoader?.();
