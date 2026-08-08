/**
 * 应用入口 —— 全量装配逻辑由 @repo/app 的 createContextApp 内部统一处理
 *
 * 说明：应用 route.mode=remote：
 *   - 菜单完全由后端 /v2/user/menu 提供（main.ts 不注册任何本地菜单）
 *   - 路由：登录后后端菜单动态注册；页面由 registerMenuViewModules 注册，
 *     实现异步页面模块映射，点击菜单时动态加载、无预加载
 *
 * 注意：页面模块（业务页面）由后端菜单注册，
 * 这里是固定的应用级入口，不随菜单变更。
 */
import { createContextApp } from "@repo/app";
import { install as ReTableInstall } from "@repo/ui/re-table";
import { install as ReTagInstall } from "@repo/ui/re-tag";
import { install as ReSearchInstall } from "@repo/ui/re-search";
import "@repo/system";
import "@repo/message";

createContextApp()
  .use([ReTableInstall, ReTagInstall, ReSearchInstall])
  .mount("#app");
