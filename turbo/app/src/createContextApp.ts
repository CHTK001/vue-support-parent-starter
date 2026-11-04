/**
 * @repo/app —— 统一入口：createContextApp
 *
 * 双框架统一启动器：按 options.framework 自动分发到 Vue / React 实现。
 *
 *   // Vue（默认，向后兼容）：现有应用无需改动
 *   await createContextApp({ appName: "xxx" })
 *     .routes(routeTree)
 *     .mount("#app");
 *
 *   // React
 *   await createContextApp({ framework: "react", appName: "ai" })
 *     .routes(reactRouteTree)
 *     .root(<App />)
 *     .mount("#root");
 *
 * 内部实现：
 *   - framework === "vue"（默认）→ createVueApp（Vue 渲染层 + pinia/i18n/ElementPlus）
 *   - framework === "react" → createReactApp（React 渲染层 + react-router）
 * 两套实现共用 core 装配（crypto/config/storage/token/http）与鉴权/菜单推导逻辑。
 */
import { createVueApp, VueAppBuilder, type VueAppInstance } from "./createVueApp";
import { createReactApp, ReactAppBuilder, type ReactAppInstance } from "./createReactApp";
import type { AppInstance, CreateAppOptions, AppFramework } from "./types";

export { default as AppWithRouter } from "./AppWithRouter.vue";
export { default as SingleApp } from "./SingleApp.vue";
export { createVueApp, VueAppBuilder } from "./createVueApp";
export { createReactApp, ReactAppBuilder } from "./createReactApp";
export type { CreateAppOptions, AppInstance, AppFramework, AppMode } from "./types";
export type { AppInstaller, CreateVueAppOptions, VueAppInstance } from "./createVueApp";
export type { CreateReactAppOptions, ReactAppInstance } from "./createReactApp";
export type { AppContribution } from "./contributions";

/** 向后兼容别名：旧 ContextAppBuilder === VueAppBuilder */
export const ContextAppBuilder = VueAppBuilder;
export type ContextAppBuilder = VueAppBuilder;

/**
 * 入口：返回框架对应的链式构建器。
 * 缺省 framework = "vue"（向后兼容，现有 Vue 应用代码无需任何改动）。
 *
 * 重载：framework === "react" 时返回 ReactAppBuilder，否则 VueAppBuilder。
 */
export function createContextApp(options: CreateAppOptions & { framework: "react" }): ReactAppBuilder;
export function createContextApp(options?: CreateAppOptions): VueAppBuilder;
export function createContextApp(options: CreateAppOptions = {}): VueAppBuilder | ReactAppBuilder {
  const framework: AppFramework = options.framework ?? "vue";
  if (framework === "react") {
    return createReactApp(options);
  }
  return createVueApp(options);
}

export default createContextApp;
