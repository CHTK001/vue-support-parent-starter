import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/display.css";
import App from "./Preview.vue";
import { setupStore } from "@/store";
import { useI18n } from "@/plugins/i18n";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
const app = createApp(App);
setupStore(app);
app.use(ElementPlus).use(useI18n);
app.mount("#app");
