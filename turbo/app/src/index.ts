/**
 * @repo/app —— 统一应用启动器
 *
 * 双框架入口：
 *   import { createContextApp } from "@repo/app";
 *
 *   // Vue（默认）
 *   await createContextApp({ appName: "xxx" })
 *     .routes(routeTree)
 *     .mount("#app");
 *
 *   // React
 *   await createContextApp({ framework: "react", appName: "ai" })
 *     .routes(reactRoutes)
 *     .root(<App />)
 *     .mount("#root");
 *
 * 通用设计令牌（@repo/theme/styles/tokens.css）由本包统一注入，所有宿主 app 共享；
 * UnoCSS global 模式样式因需 per-app 配置，仍由各应用自行引入。
 */
import "virtual:uno.css";
import "@repo/theme/styles/tokens.css";

export { default as AppWithRouter } from "./AppWithRouter.vue";
export { default as SingleApp } from "./SingleApp.vue";
export {
  createContextApp,
  ContextAppBuilder,
  type CreateAppOptions,
  type AppInstance,
  type AppFramework,
  type AppMode,
  type AppContribution,
} from "./createContextApp";
export {
  createVueApp,
  VueAppBuilder,
  type AppInstaller,
  type CreateVueAppOptions,
  type VueAppInstance,
} from "./createVueApp";
export {
  createReactApp,
  ReactAppBuilder,
  type CreateReactAppOptions,
  type ReactAppInstance,
} from "./createReactApp";
export { mountApp, type MountAppOptions } from "./mount";
