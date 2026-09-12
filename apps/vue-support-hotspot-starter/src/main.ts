/**
 * vue-support-hotspot-starter 入口 — APM 热点观测台（前后端分离独立应用）
 *
 * 不依赖 @repo/app / koi 框架（避免拉入登录/鉴权路由），
 * 直接装配 Element Plus + 路由 + Pinia，最小化独立可构建。
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(ElementPlus, { locale: zhCn });
app.use(router);

app.mount("#app");

export default app;
