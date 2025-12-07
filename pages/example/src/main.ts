import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { ScMap, ScLayer } from "@repo/components";
import { initTechUI } from "@repo/components/TechUI";

// TechUI 科幻风格样式 (index.css 已在 @techui/scifi/index.js 中自动导入)
// 如需手动导入: import "@techui/scifi/dist/index.css";

import "./styles/main.css";
import "./styles/example-common.scss";

const app = createApp(App);

// 注册全局组件
app.component("ScMap", ScMap);
app.component("ScLayer", ScLayer);

// 异步初始化 TechUI 科幻风格组件 (包括 @techui/scifi 原生组件和封装组件)
initTechUI(app, {
  features: {
    echarts: false,
    advanced: false
  },
  debug: false
}).then(() => {
  app.use(router);
  app.mount("#app");
}).catch((err) => {
  console.error("TechUI 初始化失败:", err);
  // 即使 TechUI 初始化失败，也继续挂载应用
  app.use(router);
  app.mount("#app");
});
