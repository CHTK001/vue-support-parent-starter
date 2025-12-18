import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { ScMap, ScLayer } from "@repo/components";
import { initTechUI } from "@repo/components/TechUI";

// 显式导入 TechUI 样式 (确保样式正确加载)
import "@techui/scifi/dist/index.css";

import "./styles/main.css";
import "./styles/example-common.scss";

const app = createApp(App);

// 注册全局组件
app.component("ScMap", ScMap);
app.component("ScLayer", ScLayer);

// 异步初始化 TechUI (必须等待 WASM 初始化完成后再挂载应用)
initTechUI(app, { debug: true })
  .then(() => {
    app.use(router);
    app.mount("#app");
  })
  .catch((err) => {
    console.error("[TechUI] 初始化失败:", err);
    // 即使失败也挂载应用
    app.use(router);
    app.mount("#app");
  });
