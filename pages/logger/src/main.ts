/**
 * 日志控制台入口：createVite 共享壳的默认约定路径 /src/main.ts。
 *
 * - UnoCSS（virtual:uno.css）由 createVite 的 unoEntryPlugin 自动注入本文件，无需手写；
 * - 模板里的 el-* 组件样式由 unplugin-vue-components + ElementPlusResolver 编译期引入；
 * - 命令式 API（ElMessage / ElMessageBox）不走模板编译，样式必须在这里手动引入。
 */
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";

import "./styles/tokens.css";
import "./styles/logger.css";

// 独立运行标记：tokens.css / logger.css 的 html/body 级规则都收在该类下，
// 被宿主应用嵌挂时不会加上，避免接管宿主全局样式（见 styles/logger.css 头注）。
document.documentElement.classList.add("logger-standalone");

createApp(App).use(router).mount("#app");

/*
 * 首屏全屏 loader（public/loader.js 注入的 #app-loader：fixed 全屏、z-index 9999）
 * 由 createVite 共享模板注入，但本应用未走 @repo/app 的 createVueApp 引导，
 * 没人替我们收遮罩；不收的话遮罩会一直盖在页面上拦截整页点击
 * （浏览器实测：所有 click 因 "sys-loader-shell ... intercepts pointer events" 超时）。
 *
 * 口径与 pages/ai/src/main.js 一致：路由 ready（首屏内容已解析）→ 双 rAF
 * （patch 后的 DOM 进入下一帧绘制）→ hideAppLoader；10s 兜底：守卫卡死时
 * 宁可露出内容也不能让遮罩永久盖住整站。
 */
void Promise.race([
  router.isReady().catch(() => undefined),
  new Promise<void>((resolve) => setTimeout(resolve, 10000)),
])
  .then(
    () =>
      new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame !== "function") {
          resolve();
          return;
        }
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  )
  .then(() => {
    (window as unknown as { hideAppLoader?: () => void }).hideAppLoader?.();
  });
