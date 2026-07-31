/**
 * system 应用入口 —— koi 框架接入
 *
 * 链路：
 *   1. createApp 初始化运行时基础设施（wasm 加密 / app.yaml 配置 / 主题 / storage / token / http / 路由）
 *   2. installKoi 注册 koi 框架能力（ElementPlus / pinia / i18n / 组件 / 指令）
 *
 * 用法：
 *   pnpm --filter @app/system dev
 */
import { createApp } from "vue";
import { createApp as createSupportApp } from "@repo/core";
import "virtual:uno.css";
import { installKoi, koiRouter } from "@repo/theme/koi/framework";
import "@repo/theme/koi/styles/index.scss";

async function bootstrap() {
  // ① 运行时基础设施（失败隔离：wasm 不可用时允许降级，避免阻断 UI 启动）
  let support: Awaited<ReturnType<typeof createSupportApp>> | null = null;
  try {
    support = await createSupportApp({ appName: "system" });
  } catch (error) {
    console.warn("[system] 基础设施初始化失败，降级启动 UI", error);
  }

  // ② 创建 vue 应用 + 注册 koi 框架
  const app = createApp(App);
  installKoi(app, { router: koiRouter });

  // ③ 暴露基础设施到全局，供业务模块按需使用
  if (support) {
    (window as unknown as Record<string, unknown>).__SUPPORT__ = support;
  }

  app.mount("#app");
}

import App from "./App.vue";

void bootstrap();
