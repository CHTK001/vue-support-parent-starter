/**
 * @repo/app —— 统一应用启动器（Vue）
 *
 * <p><b>本入口不含 React</b>：React 实现已移到 {@code @repo/app/react} 子路径，
 * 避免每个 Vue 应用首屏都下载 react-dom / react-router-dom（dev 实测约 4MB）。</p>
 *
 *   import { createContextApp } from "@repo/app";
 *   await createContextApp({ appName: "xxx" }).routes(routeTree).mount("#app");
 *
 *   // React 应用：
 *   import { createReactApp } from "@repo/app/react";
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
export { mountApp, type MountAppOptions } from "./mount";
