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
 *
 *   本应用额外：
 *     - 注册 @repo/system（系统管理）的静态菜单（侧边栏展示）
 *     - 把 @repo/system 的业务路由挂到 koi 布局（layout）下，保留侧边栏
 *     - 顺带把 @repo/message 业务路由作为顶级路由注入（保持历史行为）
 */
import { createApp } from "@repo/app";
import { registerStaticMenu } from "@repo/pinia";
import { systemRoutes, systemMenus } from "@repo/system";
import { messageRoutes } from "@repo/message";

/** 注册静态菜单（koi 主题在 initMenusWithoutAuth 中读取） */
registerStaticMenu([...systemMenus]);

const { context } = await createApp({ routes: [...messageRoutes] });

/** 把系统管理路由挂到 koi layout 之下（与侧边栏一一对应） */
for (const route of systemRoutes) {
  context.router.addRoute("layout", route as never);
}
