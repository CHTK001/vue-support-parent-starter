/**
 * 应用入口 —— vue-support-ai-starter
 *
 * 使用 createContextApp 单页面模式，加载自定义布局 App.vue，
 * App.vue 内包含 router-view 与框架提供的 router。
 */
import { createContextApp } from "@repo/app";
import App from "@pages/ai/App.vue";
import router from "@pages/ai/router";

createContextApp({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  mode: "single",
})
  .app(App)
  .use(router)
  .mount("#app");
