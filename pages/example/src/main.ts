import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { ScMap, ScLayer } from "@repo/components";
import TechUI from "@repo/components/TechUI";

import "./styles/main.css";
import "./styles/example-common.scss";

const app = createApp(App);

// 注册全局组件
app.component("ScMap", ScMap);
app.component("ScLayer", ScLayer);

// 注册 TechUI 科幻风格组件 (包括 @techui/scifi 原生组件和封装组件)
app.use(TechUI);

app.use(router);
app.mount("#app");
