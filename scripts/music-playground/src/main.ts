import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.config.errorHandler = error => {
  (window as Window & { __musicPlaygroundError?: unknown }).__musicPlaygroundError =
    error;
  console.error("[music-playground]", error);
};

app.use(router);
app.use(ElementPlus);
app.mount("#app");
