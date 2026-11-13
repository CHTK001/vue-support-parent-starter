/**
 * @repo/app —— 统一入口：createContextApp（Vue）
 *
 * <p><b>只负责 Vue</b>：React 实现已移到 {@code @repo/app/react} 子路径。
 * 原因：createReactApp 会 import react-dom / react-router-dom，之前从包根静态导出、
 * 又被本文件静态 import，导致所有 Vue 应用首屏都要下载解析 react（dev 实测约 4MB，
 * 生产也会进 vendor chunk）。现在本文件不再引用任何 React 模块。</p>
 *
 * Vue（默认）：
 *   await createContextApp({ appName: "xxx" })
 *     .routes(routeTree)
 *     .mount("#app");
 *
 * React：见 {@code @repo/app/react}：
 *   import { createReactApp } from "@repo/app/react";
 */
import { createVueApp, VueAppBuilder, type VueAppInstance } from "./createVueApp";
import type { AppInstance, CreateAppOptions, AppFramework } from "./types";

export { default as AppWithRouter } from "./AppWithRouter.vue";
export { default as SingleApp } from "./SingleApp.vue";
export { createVueApp, VueAppBuilder } from "./createVueApp";
export type { CreateAppOptions, AppInstance, AppFramework, AppMode } from "./types";
export type { AppInstaller, CreateVueAppOptions, VueAppInstance } from "./createVueApp";
export type { AppContribution } from "./contributions";

/** 向后兼容别名：旧 ContextAppBuilder === VueAppBuilder */
export const ContextAppBuilder = VueAppBuilder;
export type ContextAppBuilder = VueAppBuilder;

/**
 * 入口：返回 Vue 链式构建器。
 *
 * <p>{@code framework: "react"} 不再在本入口分发（会把 react 静态拉进 Vue 应用），
 * 请改用 {@code import { createReactApp } from "@repo/app/react"}。</p>
 */
export function createContextApp(options: CreateAppOptions = {}): VueAppBuilder {
  const framework: AppFramework = options.framework ?? "vue";
  if (framework === "react") {
    throw new Error(
      '[createContextApp] React 入口已独立：请改用 `import { createReactApp } from "@repo/app/react"`',
    );
  }
  return createVueApp(options);
}

export default createContextApp;
