/**
 * 应用入口 —— 与 vue-support-system-starter 同源
 *
 * - 通过 @repo/app 的 createApp 统一装配（vite → core 上下文 → 主题框架 → 挂载）
 * - mode: "router" — 走 AppWithRouter 根组件（<router-view/>）
 * - 业务视图为本地内置组件（不依赖 vue-advanced-chat 这类有 vite 兼容性问题的第三方）
 */
import { createApp } from "@repo/app";
import ChatView from "./views/Chat.vue";
import ImageGenView from "./views/ImageGen.vue";
import VideoGenView from "./views/VideoGen.vue";
import App from "./App.vue";

const aiRoutes = [
  { path: "/", redirect: "/chat" },
  { path: "/chat", name: "ai-chat", component: ChatView, meta: { title: "AI 对话" } },
  { path: "/image-gen", name: "ai-image-gen", component: ImageGenView, meta: { title: "文生图" } },
  { path: "/video-gen", name: "ai-video-gen", component: VideoGenView, meta: { title: "文生视频" } },
];

await createApp({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  mode: "router",
  configUrl: "/app.yaml",
  routes: aiRoutes,
});

// 注册到 layout 子路由（与 system 一致），让 router-view 在 layout 内渲染
void App;
