/**
 * @repo/app/react —— React 实现入口（独立子路径）
 *
 * <p><b>为什么单列</b>：`createReactApp` 会 import react-dom / react-router-dom。
 * 之前它从包根 `@repo/app` 静态导出，Vue 应用的 `createContextApp` 又静态 import 了它，
 * 于是每个 Vue 应用的首屏都要下载/解析 react-dom（dev 实测约 4MB，生产也会被打进
 * vendor chunk）。React 只有一个应用用得到，没必要让所有 Vue 应用付这笔钱。</p>
 *
 * 用法（仅 React 应用）：
 *   import { createReactApp } from "@repo/app/react";
 *   await createReactApp({ appName: "ai" }).routes(tree).root(<App />).mount("#root");
 */
export { createReactApp, ReactAppBuilder } from "./createReactApp";
export type { CreateReactAppOptions, ReactAppInstance } from "./createReactApp";
