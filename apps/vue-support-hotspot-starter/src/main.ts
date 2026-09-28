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
// 暗色变量表：APM 观测台是固定深色皮肤，--apm-* 语义层已改为从 --el-* 派生，
// 必须加载暗色变量才能取到深色值；否则整站会渲染成浅色。
// 与 apps/vue-support-video-starter/src/main.ts 用同一套做法。
import "element-plus/theme-chalk/dark/css-vars.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import App from "./App.vue";
import router from "./router";

/** 启用 Element Plus 暗色模式（APM 深色皮肤，配合上面的 dark/css-vars.css） */
document.documentElement.classList.add("dark");

const app = createApp(App);

app.use(createPinia());
app.use(ElementPlus, { locale: zhCn });
app.use(router);

app.mount("#app");

export default app;
