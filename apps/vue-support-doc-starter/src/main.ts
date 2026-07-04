import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import App from "./App.vue";
import router from "./router";
import i18n from "./locales";
import "./styles/global.scss";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ElementPlus, { locale: zhCn });

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount("#app");

// Initialize stores after mount
import("./stores/provider").then(({ useProviderStore }) => {
  useProviderStore().init();
}).catch(() => {});

import("./stores/settings").then(({ useSettingsStore }) => {
  const s = useSettingsStore();
  if (s.initFromBackend) s.initFromBackend();
}).catch(() => {});
