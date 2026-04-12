import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "../../../packages/assets/styles/layout/default/reset.scss";
import "../../../packages/assets/styles/layout/default/tailwind.css";
import "../../../packages/assets/styles/layout/default/index.scss";
import App from "./App.vue";

const app = createApp(App);

app.config.errorHandler = (error, _instance, info) => {
  (window as Window & { __panelPlaygroundError?: unknown }).__panelPlaygroundError = error;
  console.error("[panel-playground] vue-error", info, error);
};

if (typeof window !== "undefined") {
  window.addEventListener("error", event => {
    console.error("[panel-playground] window-error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined,
    });
  });

  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason;
    console.error("[panel-playground] unhandledrejection", {
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

app.use(ElementPlus).mount("#app");
