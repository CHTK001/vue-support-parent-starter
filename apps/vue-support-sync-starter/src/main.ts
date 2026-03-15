import { createStandardApp } from "@repo/core";
import router from "./router";

// sync 使用暗色主题变量
import "element-plus/theme-chalk/dark/css-vars.css";

createStandardApp({
  router,
  enableTippy: false,
}).then(async (bootstrap) => bootstrap.mount("#app"));
