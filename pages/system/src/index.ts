/**
 * @repo/system —— 系统管理共享包
 *
 * 提供 8 个核心管理页面：用户/角色/菜单/部门/字典/在线用户/系统设置，
 * 以及后端 API 封装、路由表、静态菜单。
 *
 * 使用方式（在 apps/vue-support-system-starter 的 main.ts）：
 *   import { createApp } from "@repo/app";
 *   import { registerStaticMenu } from "@repo/pinia";
 *   import { systemRoutes, systemMenus } from "@repo/system";
 *
 *   registerStaticMenu([...systemMenus]);
 *   const { context } = await createApp({});
 *   for (const r of systemRoutes) {
 *     context.router.addRoute("layout", r as never);
 *   }
 */
export { systemRoutes, systemMenus } from "./routes";
export * from "./api/types";
export * from "./api/systemApi";
