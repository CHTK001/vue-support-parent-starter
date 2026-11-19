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
import type { AppInstance, CreateAppOptions } from "./types";
import type { MpAppBuilder } from "./wechat-miniapp/createMpApp";
import { createByPlatform } from "./platform/registry";

export { default as AppWithRouter } from "./AppWithRouter.vue";
export { default as SingleApp } from "./SingleApp.vue";
export { createVueApp, VueAppBuilder } from "./createVueApp";
export type { CreateAppOptions, AppInstance, AppFramework, AppMode, AppPlatform } from "./types";
export type { AppInstaller, CreateVueAppOptions, VueAppInstance } from "./createVueApp";
export type { AppContribution } from "./contributions";

/** 向后兼容别名：旧 ContextAppBuilder === VueAppBuilder */
export const ContextAppBuilder = VueAppBuilder;
export type ContextAppBuilder = VueAppBuilder;

/**
 * 入口：小程序平台（{@code platform: "wechat-miniapp"}）。
 *
 * <p>返回 {@link MpAppBuilder}：装配 uni storage / uni.request / token / SSE，
 * 不触碰 vue-router、axios、localStorage。传 {@code uni} 即完成运行时注入。</p>
 */
export function createContextApp(options: CreateAppOptions & { platform: "wechat-miniapp" }): MpAppBuilder;
/** 入口：Web 平台（缺省）—— 返回 Vue 链式构建器。 */
export function createContextApp(options?: CreateAppOptions & { platform?: "web" }): VueAppBuilder;
/** 入口：platform 运行时决定（动态取值时使用）。 */
export function createContextApp(options?: CreateAppOptions): VueAppBuilder | MpAppBuilder;
export function createContextApp(options: CreateAppOptions = {}): VueAppBuilder | MpAppBuilder {
  // 平台差异由各自实现承担（./platform/web.adapter、./platform/wechat-miniapp.adapter），
  // 这里只查表分发，不做 if/else 平台判断。
  return createByPlatform(options);
}

export default createContextApp;
