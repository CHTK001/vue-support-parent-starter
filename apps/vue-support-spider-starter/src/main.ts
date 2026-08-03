/**
 * vue-support-spider-starter 应用入口。
 *
 * createApp 由 @repo/app 提供，内部已完成：
 *   - 加载 app.yaml（route/login/http/storage/...）
 *   - 注入 Vue / pinia / i18n / router（layout 子路由由 addRoute 注册）
 *   - 主题安装器（koi）
 *
 * 静态菜单来源：
 *   - @repo/spider 导出 spiderMenus（与路由同结构，meta.isVisible = "1"）
 *   - 通过 registerStaticMenu 注册，auth store 用它渲染侧边栏
 *
 * 关键时序：
 *   1. 必须在 await createApp({}) 之前调用 registerStaticMenu。
 *      因为 openAuth=false 时，createApp 内部 initMenusWithoutAuth
 *      会调用 authStore.listRouters()，读取 getStaticMenu() 填充菜单。
 *      如果顺序反了，菜单列表会丢失。
 *   2. spiderRoutes 的 addRoute 在 createApp 之后调用（router 实例需要就绪）。
 *
 * 开启动态路由（routeConfig.mode = remote/merge）后，
 * 远程菜单与本地路由叠加，本地路由不会丢失。
 */
import { createApp } from "@repo/app";
import { registerStaticMenu } from "@repo/pinia";
import { spiderRoutes, spiderMenus } from "@repo/spider";

// 1. 先注册静态菜单（必须在 createApp 之前，否则 auth store 拿不到）
registerStaticMenu(spiderMenus as never);

(async () => {
  // 2. 启动应用（内部会触发 authStore.listRouters 读取刚注册的菜单）
  const { context } = await createApp({});

  // 3. 注册路由
  for (const route of spiderRoutes) {
    context.router.addRoute("layout", route as never);
  }
})();
