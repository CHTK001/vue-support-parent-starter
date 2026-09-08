/**
 * 账号管理独立应用入口。
 *
 * 统一使用 createContextApp + mode="single"，与 geo/template 等模块一致。
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import App from "./App.vue";
import router from "./router";

async function install(app: VueApp) {
  app.use(ElementPlus, { locale: zhCn });
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }
}

await createContextApp({
  appName: "vue-support-account-starter",
  title: "账号管理",
  mode: "single",
  install,
})
  .app(App)
  .use(router)
  .mount("#app");
