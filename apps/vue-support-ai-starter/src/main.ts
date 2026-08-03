/**
 * 应用入口 —— vue-support-ai-starter（单页面）
 *
 * 单页面 = 直接用 @repo/app.createApp 把 #app 渲染为当前路由对应的视图。
 *   - 业务路由来自 @pages/ai（包含所有功能 / 模型管理）
 *   - 不加任何 layout 父路由：路由命中的视图直接占满 #app
 *   - 所有功能实现都在 pages/ai（本包不写业务）
 */
import { createApp } from "@repo/app";
import { aiRoutes } from "@pages/ai";

await createApp({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  mode: "router",
  configUrl: "/app.yaml",
  routes: aiRoutes,
});
