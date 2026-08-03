/**
 * vue-support-eduai-starter 应用入口。
 *
 * 关键时序：registerStaticMenu 必须在 await createApp({}) 之前调用。
 * 否则 createApp 内部 initMenusWithoutAuth 会先调用 authStore.listRouters()，
 * 读到的 staticMenu 是空数组，导致侧边栏菜单丢失。
 */
import { createApp } from "@repo/app";
import { registerStaticMenu } from "@repo/pinia";
import { eduaiRoutes, eduaiMenus } from "@repo/eduai";

// 先注册静态菜单（必须在 createApp 之前）
registerStaticMenu(eduaiMenus as never);

(async () => {
  const { context } = await createApp({});

  // 注册路由
  for (const route of eduaiRoutes) {
    context.router.addRoute("layout", route as never);
  }
})();
