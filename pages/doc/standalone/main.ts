import { createApp } from "vue";
import { useElementPlus } from "@repo/plugins";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import App from "./App.vue";

// 创建应用
const app = createApp(App);

// 使用 Element Plus 插件
app.use(useElementPlus);

// 挂载应用
app.mount("#app");
