import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import App from "./App.vue";

// 创建应用
const app = createApp(App);

// 使用 Element Plus
app.use(ElementPlus);

// 挂载应用
app.mount("#app");
