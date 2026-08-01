/**
 * 应用入口 —— 全部装配逻辑由 @repo/app 的 createApp 内部自我处理
 *
 *   createApp 内部：
 *     core createApp（config 由 @repo/config 统一管理：环境变量 → app.yaml → 远程）
 *     → 创建 Vue 实例（AppWithRouter）
 *     → 注册 pinia / i18n / router
 *     → 主题安装器按 getConfig().other.themeId 自动解析（默认 koi）
 *     → mount("#app")
 *
 *   appName / title 由 vite 注入 import.meta.env，main 无需重复配置。
 */
import { createApp } from "@repo/app";

createApp({});
