/**
 * 应用入口 —— 全量装配逻辑由 @repo/app 的 createContextApp 内部统一处理
 *
 * 说明：应用 route.mode=remote：
 *   - 菜单完全由后端 /v2/user/menu 提供（main.ts 不注册任何本地菜单）
 *   - 路由：登录后后端菜单动态注册；页面由 registerMenuViewModules 注册，
 *     实现异步页面模块映射，点击菜单时动态加载、无预加载
 *
 * 注意：本文件为临时调试版本，使用动态 import 逐模块定位启动挂起点，
 * 定位完成后恢复为静态 import 版本。
 */
async function boot(): Promise<void> {
  console.log("[dbg] boot start");
  const app = await import("@repo/app");
  console.log("[dbg] app loaded");
  const ReTableInstall = (await import("@repo/ui/re-table")).install;
  console.log("[dbg] re-table loaded");
  const ReTagInstall = (await import("@repo/ui/re-tag")).install;
  console.log("[dbg] re-tag loaded");
  const ReSearchInstall = (await import("@repo/ui/re-search")).install;
  console.log("[dbg] re-search loaded");
  await import("@repo/system");
  console.log("[dbg] system loaded");
  await import("@repo/message");
  console.log("[dbg] message loaded");
  const { createContextApp } = app;
  console.log("[dbg] mounting");
  await createContextApp()
    .use([ReTableInstall, ReTagInstall, ReSearchInstall])
    .mount("#app");
  console.log("[dbg] mounted ok");
}

boot().catch((e) => console.error("[dbg] boot error", e));
