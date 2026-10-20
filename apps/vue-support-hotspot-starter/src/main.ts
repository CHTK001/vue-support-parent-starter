/**
 * vue-support-hotspot-starter 入口 — APM 热点观测台（前后端分离独立应用）
 *
 * 不依赖 @repo/app / koi 框架（避免拉入登录/鉴权路由），
 * 直接装配 Element Plus + 路由 + Pinia，最小化独立可构建。
 *
 * 样式加载顺序有依赖关系，不可调整：
 *   1. element-plus index.css      组件基础样式
 *   2. dark/css-vars.css           Element 暗色变量表（本应用固定深色皮肤）
 *   3. styles/tokens.css           覆盖 Element 的 --el-* 为观测台色板
 *                                  —— 必须在 dark 之后，否则会被暗色表覆盖回默认蓝
 *   4. styles/layout.css           14 个视图共用的骨架与语义类
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "./styles/tokens.css";
import "./styles/layout.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import App from "./App.vue";
import router from "./router";

/** 启用 Element Plus 暗色模式（APM 固定深色皮肤，配合上面的 dark/css-vars.css） */
document.documentElement.classList.add("dark");

/**
 * 移除全仓共用的启动遮罩 `#app-loader`。
 *
 * 遮罩由 public/loader.js 在 index.html 里同步挂载（position:fixed、
 * z-index:9999、盖满全屏），设计上要求应用挂载完成后调用
 * window.hideAppLoader() 移除。
 *
 * 其它 app 走 @repo/app 的 createContextApp，那里已在挂载后统一调用；
 * 本应用刻意不引入 @repo/app（见文件头注释），因此必须自己调，
 * 否则遮罩会永远盖住整个界面。
 */
function hideAppLoader(): void {
  const hide = (window as unknown as { hideAppLoader?: () => void }).hideAppLoader;
  if (typeof hide === "function") {
    hide();
  }
}

const app = createApp(App);

app.use(createPinia());
app.use(ElementPlus, { locale: zhCn });
app.use(router);

app.mount("#app");
hideAppLoader();

export default app;
