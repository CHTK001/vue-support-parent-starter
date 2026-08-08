/**
 * vue-support-gateway-starter 应用入口
 *
 * createContextApp 内部：
 *   - core createApp（config 由 @repo/config 统一管理：环境变量 → app.yaml → 远程）
 *   - 创建 Vue 实例（AppWithRouter）
 *   - 注册 pinia / i18n / router
 *   - 主题安装器按 getConfig().other.themeId 自动解析
 *
 * .routes(路由树)：路由树即菜单树，自动挂到 layout 之下，并驱动侧边栏。
 * .use(installer)：按需注册 Re- 组件（每个都是独立子路径，不扫描整个 ui 包）。
 */
import { createContextApp } from "@repo/app";
import { gatewayRoutes } from "@repo/gateway";
import ReCardInstall from "@repo/ui/re-card";
import ReTagInstall from "@repo/ui/re-tag";
import ReTableInstall from "@repo/ui/re-table";
import ReTreeInstall from "@repo/ui/re-tree";
import ReTimelineInstall from "@repo/ui/re-timeline";
import ReAlbumInstall from "@repo/ui/re-album";
import { log } from "@repo/utils";

(window as any).__main = "started";
log.info("main", "createContextApp begin");

const { vueApp } = await createContextApp()
  .routes(gatewayRoutes as never)
  .use([ReCardInstall, ReTagInstall, ReTableInstall, ReTreeInstall, ReTimelineInstall, ReAlbumInstall])
  .mount("#app");

log.info("main", "mount done");
(window as any).__main = "mounted";
