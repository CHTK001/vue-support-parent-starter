/**
 * 应用入口 —— 全部装配逻辑由 @repo/app 的 createContextApp 内部自我处理
 *
 * 本应用 route.mode=remote：
 *   - 菜单：完全由后端 /v2/user/menu 提供，main.ts 不注册任何本地菜单
 *   - 路由：登录后由后端菜单动态注册；页面组件经页面模块的
 *     registerMenuViewModules 懒加载（异步组件）映射，按需加载、不预载全部
 *
 * 下方 import 页面模块仅为触发其 registerMenuViewModules 副作用（视图注册），
 * 不包含任何路由/菜单数据。
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
