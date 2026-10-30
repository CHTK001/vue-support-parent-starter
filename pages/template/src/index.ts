/**
 * @pages/template —— 模板库共享包
 *
 * 业务应用通过 @pages/template 引入：
 *   import { createContextApp } from "@repo/app";
 *   import { registerStaticMenu } from "@repo/pinia";
 *   import { templateRoutes, templateMenus } from "@pages/template";
 *
 *   registerStaticMenu(templateMenus);
 *   const { context } = await createContextApp({});
 *   templateRoutes.forEach(r => context.router.addRoute("layout", r));
 *
 * 提供的页面：
 *   - TemplateView：模板库（资产表格 + 右键菜单）
 *   - TemplateDesigner：模板设计器（拖拽式设计 + 打印）
 *   - TemplatePreviewView：只读预览（单模板打印）
 *   - PrinterManage：打印机管理（接入第三方打印机 + 设置默认打印机）
 */
export { default as TemplateView } from './views/TemplateView.vue'
export { default as TemplateDesigner } from './views/TemplateDesigner.vue'
export { default as TemplatePreviewView } from './views/TemplatePreviewView.vue'
export { default as PrinterManage } from './views/PrinterManage.vue'
export { templateRoutes, templateMenus } from './router'
export { templateApi } from './api/templateApi'
export * from './types/template'
