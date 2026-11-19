import { createSSRApp } from "vue";
import App from "./App.vue";
import { createContextApp } from "@repo/app";
import { BASE_URL } from "./config";

/**
 * uni-app 入口约定：导出 createApp，同步返回 { app }。
 *
 * 与 PC 端同一行入口 `createContextApp`，只是 `platform: "wechat-miniapp"`。
 * 本工程里 `@repo/app` 解析到小程序平台实现（见 vite.config.ts / tsconfig paths），
 * 装配 uni storage + uni.request + token；401 由框架按 loginPath 处理。
 * 根组件与 createSSRApp 一并传入，`mountApp()` 无参即可（库里不 import vue）。
 */
export function createApp() {
  return createContextApp({
    platform: "wechat-miniapp",
    appName: "ai-miniapp",
    baseUrl: BASE_URL,
    uni,
    loginPath: "/pages/login/index",
    // 小程序内不做续期：token 过期直接回登录页
    token: { refresh: false },
    app: App,
    createSSRApp,
  }).mountApp();
}
