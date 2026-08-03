/**
 * @repo/spider —— 爬虫中心共享包
 *
 * 提供爬虫定义、采集数据、执行记录与可视化编排（RelationGraph）页面，
 * 以及路由表、静态菜单表。业务应用通过 @repo/spider 引入。
 *
 * 用法（apps/vue-support-spider-starter/src/main.ts）：
 *   import { createApp } from "@repo/app";
 *   import { registerStaticMenu } from "@repo/pinia";
 *   import { spiderRoutes, spiderMenus } from "@repo/spider";
 *   const { context } = await createApp({});
 *   registerStaticMenu(spiderMenus);
 *   spiderRoutes.forEach(r => context.router.addRoute("layout", r));
 */
export { default as DefinitionsView } from "./views/DefinitionsView.vue";
export { default as DesignerView } from "./views/DesignerView.vue";
export { default as DataRecordsView } from "./views/DataRecordsView.vue";
export { default as ExecutionsView } from "./views/ExecutionsView.vue";
export { spiderRoutes, spiderMenus } from "./router";
export * from "./api/types";
export * from "./api/spiderApi";
