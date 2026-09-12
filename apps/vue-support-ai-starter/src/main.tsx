/**
 * vue-support-ai-starter 入口
 *
 * 集成方式：
 *   1. createApp() — 装配 core（http / 鉴权 / 配置 / 存储 / token），注入 http 实例
 *   2. createContextApp({ framework: "react", selfContained: true })
 *      — selfContained 模式跳过 createReactApp 内部的 BrowserRouter（避免双路由），
 *        直接挂载 AiConsoleApp（自带 HashRouter + 侧边栏 + 路由表）
 *
 * 为什么用 selfContained：
 *   - AiConsoleApp 是 pages/ai 已验证的自包含外壳（HashRouter + AiConsoleSidebar + Outlet）
 *   - createReactApp 非 selfContained 模式的根路由占位 element 不含 Outlet，
 *     业务子路由无法渲染；修改共享 createReactApp 影响面过大
 *   - selfContained + 手动 createApp 既保留了 core 装配（http / 鉴权），
 *     又复用了 pages/ai 成熟的自包含路由体系
 */
import React from "react";
import "../../../pages/ai/node_modules/@arco-design/web-react/dist/css/arco.css";
import "./i18n"; // 必须在 React 渲染前初始化 i18n（合并 pages/ai locales + console.* 文案）
import { createApp } from "@repo/core";
import { createContextApp } from "@repo/app";
import AiConsoleApp from "@pages/ai/renderer/app/AiConsoleApp";

async function bootstrap(): Promise<void> {
  // ① 装配 core：loadCrypto → loadConfig → buildStorage → createTokenManager
  //    → buildHttp + setApiHttp（http() 由此可用）→ 鉴权 / 菜单 / Socket 初始化
  await createApp({ appName: "vue-support-ai-starter" });

  // ② selfContained 模式挂载 AiConsoleApp（自带 HashRouter + 侧边栏 + 9 个控制台页面）
  await createContextApp({
    framework: "react",
    selfContained: true,
    appName: "vue-support-ai-starter",
    title: "AI 控制台",
  })
    .root(<AiConsoleApp />)
    .mount("#app");
}

bootstrap().catch((err) => {
  console.error("[ai-starter] 启动失败:", err);
});
