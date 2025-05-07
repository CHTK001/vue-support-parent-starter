import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { ScMap, ScLayer } from "@repo/components";

import "./styles/main.css";

const app = createApp(App);

// 注册全局组件
app.component("ScMap", ScMap);
app.component("ScLayer", ScLayer);

app.use(router);
app.mount("#app");
