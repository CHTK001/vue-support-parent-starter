import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";

const app = createApp(App);

app.config.errorHandler = error => {
  (window as Window & { __panelPlaygroundError?: unknown }).__panelPlaygroundError = error;
  console.error("[panel-playground]", error);
};

app.use(ElementPlus).mount("#app");
