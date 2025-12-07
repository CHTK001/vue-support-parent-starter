import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { ScMap, ScLayer } from "@repo/components";
import { initTechUI } from "@repo/components/TechUI";

// 导入 TechUI 科幻风格样式
import "@techui/scifi/dist/index.css";

import "./styles/main.css";
import "./styles/example-common.scss";

const app = createApp(App);

// 注册全局组件
app.component("ScMap", ScMap);
app.component("ScLayer", ScLayer);

// 初始化 TechUI 科幻风格组件
initTechUI(app, { debug: true });

app.use(router);
app.mount("#app");
