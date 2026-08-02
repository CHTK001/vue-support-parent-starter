/**
 * vue-support-gateway-starter 应用入口
 *
 * createApp 内部：
 *   - core createApp（config 由 @repo/config 统一管理：环境变量 → app.yaml → 远程）
 *   - 创建 Vue 实例（AppWithRouter）
 *   - 注册 pinia / i18n / router
 *   - 主题安装器按 getConfig().other.themeId 自动解析
 *
 * 应用级扩展（在 createApp 完成后）：
 *   - 按需注册 Re- 组件（直接 import 对应 install）
 *   - 把 pages/gateway 提供的 gatewayRoutes 注册到 layout 子路由
 */
import { createApp } from "@repo/app";
import { gatewayRoutes } from "@repo/gateway";
import ReCardInstall from "@repo/ui/re-card";
import ReTagInstall from "@repo/ui/re-tag";
import ReTableInstall from "@repo/ui/re-table";
import ReTreeInstall from "@repo/ui/re-tree";
import ReTimelineInstall from "@repo/ui/re-timeline";
import ReAlbumInstall from "@repo/ui/re-album";

(async () => {
  const { vueApp, context } = await createApp({});

  // 直接按需注册需要的 Re- 组件（每个都是独立子路径，不扫描整个 ui 包）
  for (const installer of [
    ReCardInstall,
    ReTagInstall,
    ReTableInstall,
    ReTreeInstall,
    ReTimelineInstall,
    ReAlbumInstall,
  ]) {
    await installer(vueApp);
  }

  // 把 gateway 共享包的路由注册到 layout 子路由
  for (const route of gatewayRoutes) {
    context.router.addRoute("layout", route as never);
  }
})();
